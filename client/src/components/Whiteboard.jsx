import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import jsPDF from 'jspdf';
import { throttle } from 'lodash';
import './Whiteboard.css';

// --- Helper functions moved from server ---

function pointToSegmentDistance(px, py, x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    if (dx === 0 && dy === 0) {
        return Math.hypot(px - x0, py - y0);
    }
    const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / (dx * dx + dy * dy)));
    const projX = x0 + t * dx;
    const projY = y0 + t * dy;
    return Math.hypot(px - projX, py - projY);
}

function splitStrokeByEraser(stroke, eraserX, eraserY, radius, originalProps) {
    let newStrokes = [];
    let currentStroke = [];
    if (!stroke || stroke.length === 0) return [];

    for (let i = 0; i < stroke.length; i++) {
        const seg = stroke[i];
        const dist = pointToSegmentDistance(eraserX, eraserY, seg.x0, seg.y0, seg.x1, seg.y1);
        if (dist < radius) {
            if (currentStroke.length > 0) {
                newStrokes.push(currentStroke);
                currentStroke = [];
            }
        } else {
            currentStroke.push(seg);
        }
    }
    if (currentStroke.length > 0) {
        newStrokes.push(currentStroke);
    }
    // Attach original thickness and color to each segment
    return newStrokes.filter(s => s.length > 0).map(s => {
        const newStroke = s.map(seg => ({ ...seg, color: originalProps.color, lineWidth: originalProps.lineWidth }));
        if (newStroke.length > 0) {
            newStroke[0].lineCap = 'round'; // Ensure rounded caps
        }
        return newStroke;
    });
}

function rectToSegments(rect, steps = 20) {
    const { x, y, width, height, color, lineWidth } = rect;
    const segs = [];
    for (let i = 0; i < steps; i++) {
        const x0 = x + (i / steps) * width;
        const x1 = x + ((i + 1) / steps) * width;
        segs.push({ x0, y0: y, x1, y1: y, color, lineWidth });
    }
    for (let i = 0; i < steps; i++) {
        const y0 = y + (i / steps) * height;
        const y1 = y + ((i + 1) / steps) * height;
        segs.push({ x0: x + width, y0, x1: x + width, y1, color, lineWidth });
    }
    for (let i = 0; i < steps; i++) {
        const x0 = x + width - (i / steps) * width;
        const x1 = x + width - ((i + 1) / steps) * width;
        segs.push({ x0, y0: y + height, x1, y1: y + height, color, lineWidth });
    }
    for (let i = 0; i < steps; i++) {
        const y0 = y + height - (i / steps) * height;
        const y1 = y + height - ((i + 1) / steps) * height;
        segs.push({ x0: x, y0, x1: x, y1, color, lineWidth });
    }
    return segs;
}

function circleToSegments(circle, steps = 60) {
    const { cx, cy, rx, ry, color, lineWidth } = circle;
    const segs = [];
    let prev = null;
    for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * 2 * Math.PI;
        const x = cx + rx * Math.cos(theta);
        const y = cy + ry * Math.sin(theta);
        if (prev) {
            segs.push({ x0: prev.x, y0: prev.y, x1: x, y1: y, color, lineWidth });
        }
        prev = { x, y };
    }
    return segs;
}

const Whiteboard = forwardRef(({ socket, color, tool, fontSize, room, canEdit, lineWidth, setActiveUserId }, ref) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState([]);
    const [startPos, setStartPos] = useState(null); // For shapes
    const [previewShape, setPreviewShape] = useState(null); // For previewing shapes
    const strokesRef = useRef([]); // Store strokes from server
    const strokesBeforeEraseRef = useRef(null);
    const [textInput, setTextInput] = useState(null); // {x, y, value}
    const [selectedText, setSelectedText] = useState(null);
    const [draggingText, setDraggingText] = useState(null); // {id, offsetX, offsetY}
    const isPublicRoom = room === 'public';
    const effectiveCanEdit = isPublicRoom ? true : canEdit;
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const activeTimeout = useRef();

    useImperativeHandle(ref, () => ({
        undo,
        redo,
        exportCanvas,
        setStrokes: (strokes) => {
            strokesRef.current = strokes;
            redrawCanvas(strokes);
        }
    }));

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const resizeCanvas = () => {
            if (container && canvas) {
                // Set the canvas size to the actual scrollable area size
                const width = Math.max(container.clientWidth, canvas.scrollWidth, 1400);
                const height = Math.max(container.clientHeight, canvas.scrollHeight, 2000);
                canvas.width = width;
                canvas.height = height;
                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
                redrawCanvas(strokesRef.current);
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    useEffect(() => {
        const handleStrokes = (strokes) => {
            console.log('CLIENT received strokes:', strokes.length);
            strokesRef.current = strokes;
            redrawCanvas(strokes);
        };
        
        const handleLiveErase = (data) => {
            handleErase(data.x, data.y, data.radius, false);
        };
        
        socket.on('strokes', handleStrokes);
        socket.on('live-erase', handleLiveErase);

        return () => {
            socket.off('strokes', handleStrokes);
            socket.off('live-erase', handleLiveErase);
        };
    }, [socket]);

    const markActive = () => {
        if (setActiveUserId) {
            setActiveUserId(socket.id);
            if (activeTimeout.current) clearTimeout(activeTimeout.current);
            activeTimeout.current = setTimeout(() => setActiveUserId(null), 1000);
        }
    };

    const handleErase = (x, y, radius, isLocal) => {
        markActive();
        const newStrokes = [];
        let somethingErased = false;

        strokesRef.current.forEach(stroke => {
            let wasErased = false;
            let strokeAsSegments = [];

            if (Array.isArray(stroke)) {
                strokeAsSegments = stroke;
            } else if (stroke.type === 'rect') {
                strokeAsSegments = rectToSegments(stroke);
            } else if (stroke.type === 'circle') {
                strokeAsSegments = circleToSegments(stroke);
            } else if (stroke.type === 'line') {
                // Treat the line as a single segment
                const seg = {
                    x0: stroke.x0,
                    y0: stroke.y0,
                    x1: stroke.x1,
                    y1: stroke.y1,
                    color: stroke.color,
                    lineWidth: stroke.lineWidth
                };
                const dist = pointToSegmentDistance(x, y, seg.x0, seg.y0, seg.x1, seg.y1);
                if (dist < radius) {
                    wasErased = true;
                    somethingErased = true;
                    // Do not add this line to newStrokes (i.e., erase it)
                } else {
                    newStrokes.push(stroke);
                }
                return;
            } else {
                newStrokes.push(stroke);
                return;
            }

            // Pass original thickness and color
            const splitStrokes = splitStrokeByEraser(strokeAsSegments, x, y, radius, { color: stroke.color, lineWidth: stroke.lineWidth });

            if (splitStrokes.length !== 1 || splitStrokes[0].length !== strokeAsSegments.length) {
                // When a shape is broken, we create new freehand strokes.
                // We must ensure these new strokes inherit the color of the original shape.
                newStrokes.push(...splitStrokes);
                wasErased = true;
                somethingErased = true;
            }

            if (!wasErased) {
                newStrokes.push(stroke);
            }
        });

        if (somethingErased || isLocal) {
            strokesRef.current = newStrokes;
            redrawCanvas(newStrokes);
        }
        return somethingErased;
    };
    
    const throttledLiveErase = useRef(throttle((data) => {
        socket.emit('live-erase', data);
    }, 50)).current;

    const redrawCanvas = (strokesArr) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#f9f9f9';
        context.fillRect(0, 0, canvas.width, canvas.height);

        strokesArr.forEach(stroke => {
            if (stroke.type === 'rect') {
                drawRect(context, stroke, false);
            } else if (stroke.type === 'circle') {
                drawCircle(context, stroke, false);
            } else if (stroke.type === 'line') {
                drawLine(context, stroke, false);
            } else if (stroke.type === 'text') {
                if (selectedText && stroke.id === selectedText.id) {
                    // Don't draw text being edited
                } else {
                    context.save();
                    context.font = `${stroke.fontSize || 20}px Arial`;
                    context.fillStyle = stroke.color || '#222';
                    context.fillText(stroke.value, stroke.x, stroke.y);
                    context.restore();
                }
            } else if (Array.isArray(stroke)) {
                context.save();
                context.strokeStyle = stroke[0].color;
                context.lineWidth = stroke[0].lineWidth || 5;
                context.lineCap = 'round';
                context.lineJoin = 'round';
                context.beginPath();
                context.moveTo(stroke[0].x0, stroke[0].y0);
                for (const seg of stroke) {
                    context.lineTo(seg.x1, seg.y1);
                }
                context.stroke();
                context.restore();
            }
        });

        if (previewShape) {
            if (previewShape.type === 'rect') {
                drawRect(context, previewShape, true);
            } else if (previewShape.type === 'circle') {
                drawCircle(context, previewShape, true);
            } else if (previewShape.type === 'line') {
                drawLine(context, previewShape, true);
            }
        }
    };

    // Draw rectangle
    const drawRect = (ctx, shape, isPreview) => {
        ctx.save();
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.lineWidth || 5;
        if (isPreview) ctx.setLineDash([6, 4]);
        ctx.strokeRect(
            shape.x,
            shape.y,
            shape.width,
            shape.height
        );
        ctx.restore();
    };

    // Draw circle
    const drawCircle = (ctx, shape, isPreview) => {
        ctx.save();
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.lineWidth || 5;
        if (isPreview) ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.ellipse(
            shape.cx,
            shape.cy,
            Math.abs(shape.rx),
            Math.abs(shape.ry),
            0,
            0,
            2 * Math.PI
        );
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    };

    const drawLine = (ctx, shape, isPreview) => {
        ctx.save();
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.lineWidth || 5;
        if (isPreview) ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(shape.x0, shape.y0);
        ctx.lineTo(shape.x1, shape.y1);
        ctx.stroke();
        ctx.restore();
    };

    const exportCanvas = (format = 'png') => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (format === 'png') {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'whiteboard.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (format === 'pdf') {
            const dataUrl = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(dataUrl, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save('whiteboard.pdf');
        }
    };

    const undo = () => {
        socket.emit('undo', room);
    };

    const redo = () => {
        socket.emit('redo', room);
    };

    const clearCanvas = () => {
        socket.emit('clear', room);
    };

    // Drawing logic
    const ERASER_COLOR = '#f9f9f9';
    const ERASER_SIZE = 22;
    const PEN_SIZE = 5;

    const startDrawing = ({ nativeEvent }) => {
        if (!effectiveCanEdit) return;
        if (tool === 'text' || tool === 'select') {
            setIsDrawing(false);
            return;
        }
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = nativeEvent.clientX - rect.left;
        const y = nativeEvent.clientY - rect.top;
        setIsDrawing(true);
        if (tool === 'pen') {
            setCurrentStroke([{ x0: x, y0: y, x1: x, y1: y, color: color, lineWidth: lineWidth }]);
        } else if (tool === 'eraser') {
            strokesBeforeEraseRef.current = JSON.parse(JSON.stringify(strokesRef.current));
        } else if (tool === 'rect' || tool === 'circle' || tool === 'line') {
            setStartPos({ x, y });
            setPreviewShape(null);
        }
        setCurrentStroke([]);
    };

    const stopDrawing = (event) => {
        if (!isDrawing) return;
        setIsDrawing(false);

        let finalStroke = null;
        if (tool === 'pen' && currentStroke.length > 0) {
            finalStroke = currentStroke;
        } else if ((tool === 'rect' || tool === 'circle') && previewShape) {
            finalStroke = previewShape;
        } else if (tool === 'line' && previewShape) {
            finalStroke = {
                type: 'line',
                id: `${socket.id}-${Date.now()}`,
                x0: previewShape.x0,
                y0: previewShape.y0,
                x1: previewShape.x1,
                y1: previewShape.y1,
                color: previewShape.color,
                lineWidth: previewShape.lineWidth
            };
        }

        if (finalStroke) {
            socket.emit('drawing', { room, data: finalStroke });
        }

        if (tool === 'eraser') {
            socket.emit('erase-commit', { 
                room,
                originalStrokes: strokesBeforeEraseRef.current,
                finalStrokes: strokesRef.current
            });
            strokesBeforeEraseRef.current = null;
        }
        
        setPreviewShape(null);
        if (event.type !== 'mouseleave') {
            setStartPos(null);
        }
        setCurrentStroke([]);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing || !effectiveCanEdit) return;
        markActive();
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = nativeEvent.clientX - rect.left;
        const y = nativeEvent.clientY - rect.top;
        const movementX = nativeEvent.movementX;
        const movementY = nativeEvent.movementY;
        if (tool === 'pen') {
            setCurrentStroke(prevStroke => {
                const last = prevStroke.length > 0 ? prevStroke[prevStroke.length - 1] : null;
                const x0 = last ? last.x1 : x - movementX;
                const y0 = last ? last.y1 : y - movementY;
                const segment = {
                    x0,
                    y0,
                    x1: x,
                    y1: y,
                    color,
                    lineWidth
                };
                
                const newCurrentStroke = [...prevStroke, segment];

                redrawCanvas(strokesRef.current);

                if (canvas) {
                    const context = canvas.getContext('2d');
                    context.save();
                    context.strokeStyle = newCurrentStroke[0].color;
                    context.lineWidth = newCurrentStroke[0].lineWidth || 5;
                    context.lineCap = 'round';
                    context.lineJoin = 'round';

                    context.beginPath();
                    context.moveTo(newCurrentStroke[0].x0, newCurrentStroke[0].y0);
                    for (const seg of newCurrentStroke) {
                        context.lineTo(seg.x1, seg.y1);
                    }
                    context.stroke();
                    context.restore();
                }

                return newCurrentStroke;
            });
        } else if (tool === 'eraser') {
            const somethingErased = handleErase(x, y, lineWidth / 2, true);
            
            if (somethingErased) {
                throttledLiveErase({ room, data: { x: x, y: y, radius: lineWidth / 2 } });
            }

            // Draw eraser preview circle (always gray, does not affect color)
            const context = canvas.getContext('2d');
            context.save();
            context.beginPath();
            context.arc(x, y, lineWidth / 2, 0, 2 * Math.PI);
            context.strokeStyle = '#888'; // Always gray
            context.lineWidth = 1.5;
            context.setLineDash([2, 2]);
            context.stroke();
            context.setLineDash([]);
            context.restore();
            // Do not change the drawing color or leave any mark
        } else if ((tool === 'rect' || tool === 'circle') && startPos) {
            if (tool === 'rect') {
                setPreviewShape({
                    type: 'rect',
                    x: Math.min(startPos.x, x),
                    y: Math.min(startPos.y, y),
                    width: Math.abs(x - startPos.x),
                    height: Math.abs(y - startPos.y),
                    color,
                    lineWidth
                });
            } else if (tool === 'circle') {
                const cx = (startPos.x + x) / 2;
                const cy = (startPos.y + y) / 2;
                const rx = (x - startPos.x) / 2;
                const ry = (y - startPos.y) / 2;
                setPreviewShape({
                    type: 'circle',
                    cx,
                    cy,
                    rx,
                    ry,
                    color,
                    lineWidth
                });
            }
            // Redraw to show preview
            redrawCanvas(strokesRef.current);
        } else if (tool === 'line' && startPos) {
            setPreviewShape({
                type: 'line',
                x0: startPos.x,
                y0: startPos.y,
                x1: x,
                y1: y,
                color,
                lineWidth
            });
            redrawCanvas(strokesRef.current);
        }
    };

    const handleCanvasClick = (e) => {
        if (!effectiveCanEdit) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (tool === 'text') {
            setSelectedText(null); // Deselect previous text
            setTextInput({ x, y, value: '' });
        } else if (tool === 'select') {
            // Find clicked text with accurate bounding box
            const context = canvasRef.current.getContext('2d');
            const clickedText = strokesRef.current.find(s => {
                if (s.type !== 'text') return false;
                const size = parseInt(s.fontSize || '20', 10); // Ensure number
                context.font = `${size}px Arial`;
                const metrics = context.measureText(s.value);
                const width = metrics.width;
                const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
                
                // A more robust bounding box check, with a small tolerance
                return x >= s.x - 2 && x <= s.x + width + 2 && y >= s.y - height - 2 && y <= s.y + 2;
            });
            if (clickedText) {
                setSelectedText(clickedText);
                setTextInput({ ...clickedText, fontSize: parseInt(clickedText.fontSize || '20', 10) });
            } else {
                setSelectedText(null);
                setTextInput(null);
            }
        }
    };

    const handleTextInputChange = (e) => {
        const newValue = e.target.value;
        setTextInput(prev => ({ ...prev, value: newValue }));
        if (selectedText) {
            setSelectedText(prev => ({ ...prev, value: newValue }));
        }
    };

    const handleTextInputBlur = () => {
        if (!textInput || !textInput.value.trim()) {
            setTextInput(null);
            setSelectedText(null);
            return;
        }

        if (selectedText) {
            socket.emit('updateText', { room, data: selectedText });
            const finalStrokes = strokesRef.current.map(s => s.id === selectedText.id ? selectedText : s);
            strokesRef.current = finalStrokes;
            redrawCanvas(finalStrokes);
        } else {
            const newTextData = {
                type: 'text',
                id: `${socket.id}-${Date.now()}`,
                x: textInput.x,
                y: textInput.y,
                value: textInput.value,
                color: color,
                fontSize: fontSize
            };
            socket.emit('text', { room, data: newTextData });
            const finalStrokes = [...strokesRef.current, newTextData];
            strokesRef.current = finalStrokes;
            redrawCanvas(finalStrokes);
        }

        setTextInput(null);
        setSelectedText(null);
    };

    // Update mouse position for custom cursor
    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    // Set cursor style based on tool
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (tool === 'pen') {
            canvas.style.cursor = 'none';
        } else if (tool === 'eraser') {
            canvas.style.cursor = 'crosshair';
        } else {
            canvas.style.cursor = 'default';
        }
    }, [tool]);

    // Detect double-click on text
    const handleCanvasDoubleClick = (e) => {
        if (!effectiveCanEdit) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Find clicked text
        const context = canvasRef.current.getContext('2d');
        const clickedText = strokesRef.current.find(s => {
            if (s.type !== 'text') return false;
            const size = parseInt(s.fontSize || '20', 10);
            context.font = `${size}px Arial`;
            const metrics = context.measureText(s.value);
            const width = metrics.width;
            const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            return x >= s.x - 2 && x <= s.x + width + 2 && y >= s.y - height - 2 && y <= s.y + 2;
        });
        if (clickedText) {
            setDraggingText({
                id: clickedText.id,
                offsetX: x - clickedText.x,
                offsetY: y - clickedText.y,
            });
            setSelectedText(clickedText);
        }
    };

    // Drag logic
    const handleCanvasMouseMove = (e) => {
        if (!draggingText) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setSelectedText(prev => {
            if (!prev) return null;
            const updated = { ...prev, x: x - draggingText.offsetX, y: y - draggingText.offsetY };
            // Update the strokes array in real time
            const idx = strokesRef.current.findIndex(s => s.id === updated.id);
            if (idx !== -1) {
                strokesRef.current[idx] = updated;
                redrawCanvas(strokesRef.current);
            }
            return updated;
        });
    };

    const handleCanvasMouseUp = () => {
        if (draggingText && selectedText) {
            // Already updated strokesRef.current, just emit
            socket.emit('updateText', { room, data: selectedText });
        }
        setDraggingText(null);
    };

    return (
        <div ref={containerRef} className="whiteboard-container" style={{ position: 'relative' }}>
            <canvas
                ref={canvasRef}
                className={`whiteboard-canvas${tool === 'pen' ? ' pen-cursor' : ''}`}
                onMouseDown={startDrawing}
                onMouseUp={e => { stopDrawing(e); handleCanvasMouseUp(e); }}
                onMouseMove={e => { draw(e); handleCanvasMouseMove(e); handleMouseMove(e); }}
                onMouseLeave={stopDrawing}
                onClick={handleCanvasClick}
                onDoubleClick={handleCanvasDoubleClick}
            />
            {tool === 'pen' && (
                <div
                    style={{
                        position: 'absolute',
                        left: mousePos.x - 5,
                        top: mousePos.y - 5,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#222',
                        pointerEvents: 'none',
                        zIndex: 100,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                        transition: 'left 0.03s, top 0.03s',
                    }}
                />
            )}
            {textInput && (tool === 'text' || selectedText) && (
                <div style={{ position: 'absolute', left: textInput.x, top: textInput.y - (parseInt(textInput.fontSize || '20', 10)) - 40, zIndex: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                        type="text"
                        autoFocus
                        style={{
                            position: 'relative',
                            font: `${parseInt(textInput.fontSize || '20', 10)}px Arial`,
                            color: textInput.color || color,
                            border: 'none',
                            background: 'transparent',
                            outline: '1px dashed #555',
                            padding: '0',
                            margin: '0',
                            zIndex: 10,
                            lineHeight: 1,
                        }}
                        value={textInput.value}
                        onChange={handleTextInputChange}
                        onBlur={handleTextInputBlur}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleTextInputBlur();
                        }}
                    />
                    <select
                        value={textInput.fontSize || fontSize}
                        onChange={e => setTextInput({ ...textInput, fontSize: e.target.value })}
                        style={{ fontSize: '1rem', borderRadius: 4, border: '1px solid #ccc', height: 28 }}
                    >
                        <option value="12">12</option>
                        <option value="16">16</option>
                        <option value="20">20</option>
                        <option value="24">24</option>
                        <option value="32">32</option>
                        <option value="40">40</option>
                    </select>
                </div>
            )}
        </div>
    );
});

export default Whiteboard; 