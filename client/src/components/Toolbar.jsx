import React from 'react';
import './Toolbar.css';

const Toolbar = ({ color, onColorChange, onClear, onUndo, onRedo, tool, onToolChange, fontSize, onFontSizeChange, lineWidth, onLineWidthChange, onExport, canEdit, room }) => {
    const isPublicRoom = room === 'public';
    const effectiveCanEdit = isPublicRoom ? true : canEdit;
    const showThicknessControl = ['pen', 'rect', 'circle', 'eraser'].includes(tool);

    return (
        <div className="toolbar">
            <div className="tool-group" style={{ opacity: effectiveCanEdit ? 1 : 0.5 }}>
                <label htmlFor="color-picker" style={{ fontSize: '0.8rem', color: '#555', cursor: effectiveCanEdit ? 'pointer' : 'default' }}>Color</label>
                <input
                    id="color-picker"
                    type="color"
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    style={{ border: 'none', background: 'none', width: '38px', height: '38px', padding: '0', cursor: 'pointer' }}
                    disabled={!effectiveCanEdit}
                />
            </div>
            <div className="tool-group" style={{ opacity: effectiveCanEdit ? 1 : 0.5 }}>
                <button onClick={() => onToolChange('select')} className={`btn btn-tool ${tool === 'select' ? 'active' : ''}`} title="Select" disabled={!effectiveCanEdit}>
                    <svg width="22" height="22" viewBox="0 0 22 22"><polygon points="5 3, 5 18, 10 14, 13 20, 16 18, 13 12, 19 12" /></svg>
                </button>
                <button onClick={() => onToolChange('pen')} className={`btn btn-tool ${tool === 'pen' ? 'active' : ''}`} title="Pencil" disabled={!effectiveCanEdit}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.657 6.343l-10.607 10.607a2 2 0 0 0-.497.878l-1.387 4.16a.5.5 0 0 0 .633.633l4.16-1.387a2 2 0 0 0 .878-.497l10.607-10.607a2 2 0 0 0 0-2.828l-1.414-1.414a2 2 0 0 0-2.828 0z"></path>
                        <path d="M15 5l4 4"></path>
                    </svg>
                </button>
                <button onClick={() => onToolChange('line')} className={`btn btn-tool ${tool === 'line' ? 'active' : ''}`} title="Straight Line" disabled={!effectiveCanEdit}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="19" x2="19" y2="5" />
                    </svg>
                </button>
                <button onClick={() => onToolChange('rect')} className={`btn btn-tool ${tool === 'rect' ? 'active' : ''}`} title="Rectangle" disabled={!effectiveCanEdit}>
                    <svg width="22" height="22" viewBox="0 0 22 22"><rect x="4" y="4" width="14" height="14" rx="2" strokeWidth="2" fill="none"/></svg>
                </button>
                <button onClick={() => onToolChange('circle')} className={`btn btn-tool ${tool === 'circle' ? 'active' : ''}`} title="Circle" disabled={!effectiveCanEdit}>
                    <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="7" strokeWidth="2" fill="none"/></svg>
                </button>
                <button onClick={() => onToolChange('eraser')} className={`btn btn-tool ${tool === 'eraser' ? 'active' : ''}`} title="Eraser" disabled={!effectiveCanEdit}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="7,19 17,19 21,15 13,7 3,17" />
                        <line x1="8" y1="18" x2="16" y2="10" />
                    </svg>
                </button>
                <button onClick={() => onToolChange('text')} className={`btn btn-tool ${tool === 'text' ? 'active' : ''}`} title="Text" disabled={!effectiveCanEdit}>
                    <svg width="22" height="22" viewBox="0 0 22 22"><text x="4" y="18" fontSize="16" fontFamily="Arial">T</text></svg>
                </button>
                <select
                    value={fontSize}
                    onChange={e => onFontSizeChange(e.target.value)}
                    style={{ marginLeft: 8, fontSize: '1rem', borderRadius: 4, border: '1px solid #ccc', height: 28 }}
                    disabled={!effectiveCanEdit}
                >
                    <option value="12">12</option>
                    <option value="16">16</option>
                    <option value="20">20</option>
                    <option value="24">24</option>
                    <option value="32">32</option>
                    <option value="40">40</option>
                </select>
            </div>
            {showThicknessControl && (
                <div className="tool-group" style={{ opacity: effectiveCanEdit ? 1 : 0.5, position: 'sticky', top: 0, zIndex: 2, background: 'inherit' }}>
                    <div className="thickness-icon-container" title="Line Thickness">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#333" strokeLinecap="round">
                            <path d="M4 6 H 18" strokeWidth="1"/>
                            <path d="M4 11 H 18" strokeWidth="2.5"/>
                            <path d="M4 16 H 18" strokeWidth="4"/>
                        </svg>
                    </div>
                    <input
                        id="line-width-slider"
                        type="range"
                        min="5"
                        max="50"
                        value={Math.max(5, Math.min(lineWidth, 50))}
                        onChange={(e) => onLineWidthChange(Math.max(5, Math.min(Number(e.target.value), 50)))}
                        className="line-width-slider"
                        style={{ width: '54px' }}
                        disabled={!effectiveCanEdit}
                    />
                    <span style={{ fontSize: '0.8rem', color: '#555' }}>{lineWidth}</span>
                </div>
            )}
            <div className="tool-group" style={{ opacity: effectiveCanEdit ? 1 : 0.5 }}>
                <button onClick={onUndo} className="btn" disabled={!effectiveCanEdit}>Undo</button>
                <button onClick={onRedo} className="btn" disabled={!effectiveCanEdit}>Redo</button>
                <button onClick={onClear} className="btn btn-clear" disabled={!effectiveCanEdit}>Clear</button>
            </div>
            <div className="tool-group">
                <select onChange={(e) => onExport(e.target.value)} className="btn btn-export" defaultValue="">
                    <option value="" disabled>Save</option>
                    <option value="png">Save as PNG</option>
                    <option value="pdf">Save as PDF</option>
                </select>
            </div>
        </div>
    );
};

export default Toolbar; 