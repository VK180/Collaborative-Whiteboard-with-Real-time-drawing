# Collaborative Whiteboard with Real-Time Drawing

---

## 1. Project Description

This project is a real-time collaborative whiteboard web application that allows multiple users to draw, write, and interact simultaneously—replicating the experience of a physical whiteboard online.  
It is designed for brainstorming, teaching, remote teamwork, and creative collaboration, with a modern, intuitive interface and robust real-time features.

---

## 2. Features

### Drawing & Canvas Tools
- **Pen Tool:** Freehand drawing with adjustable thickness and color.
- **Shapes:** Draw rectangles, circles, and straight lines.
- **Text Tool:** Add text anywhere on the canvas with customizable font size and color.
- **Eraser:** Erase any object (lines, shapes, text) with a simple tool.
- **Color Picker:** Choose any color for pen, shapes, or text.
- **Line Thickness:** Adjustable slider for pen and shape borders.

### Real-Time Collaboration
- **WebSocket Sync:** All drawing, erasing, and text actions are instantly synchronized for all users using Socket.io.
- **Multi-User:** Multiple users can join the same board and collaborate live.
- **Active User Indicator:** See who is currently performing actions (green dot beside username).

### Room Management & Permissions
- **Public Room:** Anyone can join and edit. All users have equal permissions.
- **Private Room:** Only users with the link can join. The room creator can set each user's permission (edit/view).
- **Usernames:** Every user must set a username before joining a board. Usernames are shown in the user list.
- **User List:** See all users in the room, their permissions, and who is currently active.

### Chat Sidebar
- **Real-Time Chat:** Send and receive messages with all users in the room.
- **Public Room Chat:** Each user sees a fresh, empty chat when they join the public board (their own session).
- **Private Room Chat:** All users see the same chat history for the session.

### Canvas Management
- **Undo/Redo:** Step backward or forward through drawing actions.
- **Clear Canvas:** Instantly clear the entire board (if you have edit permission).
- **Save & Export:** Download the whiteboard as a PNG image or PDF file.

### Modern UI/UX
- **Glassmorphism:** Toolbar and chat use modern glassmorphism effects.
- **Animated & Responsive:** Smooth transitions, card animations, and mobile-friendly layout.
- **Custom Cursor:** When using the pen tool, the cursor becomes a dot for precision drawing.
- **Sticky Toolbar:** Tools are always accessible on the left.
- **Accessibility:** Keyboard and screen reader friendly.

### Security & Best Practices
- **Sensitive Data:** All secrets (like MongoDB connection strings) are stored in `.env` and never committed to GitHub.
- **.gitignore:** Ensures `node_modules` and `.env` are never pushed.
- **No hardcoded credentials:** All sensitive info is environment-based.

---

## 3. Tech Stack Used

- **Frontend:** React.js, HTML5 Canvas, Vite
- **Backend:** Node.js, Express, Socket.io
- **Database:** MongoDB Atlas (cloud database for room/user/session data)
- **Hosting:** (To be filled after deployment, e.g., Vercel/Netlify for frontend, Render/Heroku for backend)

---

## 4. Setup Instructions to Run the Project Locally

### Prerequisites
- Node.js (v16+ recommended)
- npm 
- MongoDB Atlas account (or local MongoDB)

#### How to Create a MongoDB Atlas Account and Generate a Connection String
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up for a free account.
2. After verifying your email, log in and click **"Build a Database"**.
3. Choose the **Free** tier (Shared Clusters) and select your preferred cloud provider and region.
4. Create a username and password for your database user (save these for later).
5. Add your current IP address to the IP Access List (or allow access from anywhere for development: `0.0.0.0/0`).
6. Click **"Finish and Close"** to deploy your cluster (wait a few minutes for setup).
7. Once the cluster is ready, click **"Connect"** > **"Connect your application"**.
8. Copy the provided connection string. It will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
9. Replace `<username>` and `<password>` with the credentials you created.
10. Use this connection string as the value for `DATABASE_URL` in your `.env` file.

### 1. Clone the repository
```sh
git clone https://github.com/VK180/Collaborative-Whiteboard-with-real-time-Drawing.git
cd Collaborative-Whiteboard-with-real-time-Drawing
```

### 2. Setup the backend (server)
```sh
cd server
npm install
# Create a .env file with your MongoDB connection string:
echo "DATABASE_URL=your-mongodb-connection-string" > .env
npm start
```
- The backend will run on `http://localhost:3001` by default.

### 3. Create Your `.env` File
- In the `server` directory, create a file named `.env`.
- Add your MongoDB connection string:
  ```
  DATABASE_URL=your-mongodb-connection-string
  ```
  (Replace with your actual connection string. **Do not share this file or commit it to git!**)

**⚠️ Important Troubleshooting Note:**
If you are using VS Code (or any editor), make sure to save your `.env` file with **UTF-8 encoding** (not UTF-16 LE or Unicode). 
- In VS Code, you can check/change this by clicking the encoding label in the bottom right corner and selecting "Save with encoding > UTF-8".
- If your `.env` file is saved as UTF-16 LE, `dotenv` will not load your environment variables and your app will not connect to MongoDB.

### 4. Setup the frontend (client)
```sh
cd ../client
npm install
npm run dev
```
- The frontend will run on `http://localhost:5173` by default.

### 5. Open the app
- Visit `http://localhost:5173` in your browser.

---

## 5. Deployed Demo Link

(Replace this with your actual deployed link after deployment.)

[Live Demo](#)

---

## 6. Additional Implementation Details

- **User Experience:**
  - Username is only asked once and is required before joining any board.
  - In public rooms, each user sees a fresh chat on join; in private rooms, chat is shared.
  - The creator of a private room can set edit/view permissions for each user.
  - Active users are indicated in the user list with a green dot.
- **Export/Save:**  
  - You can export the whiteboard as a PNG image or PDF at any time.
- **Code Structure:**  
  - All React components are in `client/src/components/`.
  - Backend logic is in `server/index.js`.
  - MongoDB is used for persistent storage of rooms, users, and chat.

---

---

**Feel free to fork, star, and contribute!** 