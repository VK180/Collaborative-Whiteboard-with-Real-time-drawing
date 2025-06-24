# Collaborative Real-time Whiteboard

A full-stack web application that provides a real-time, multi-user collaborative whiteboard experience. Users can create public or private rooms, draw together, and communicate via chat. The application is built with MongoDB, React, fabric.js ,Node.js and utilizes WebSockets for instantaneous communication.

##  Features

*   **Instant Collaboration:** Draw, erase, and interact with others on a shared canvas in real time.
*   **Flexible Room System:** Host open public boards (public rooms) where anyone can join with a username, or generate private rooms with unique links for secure collaboration.
*   **Private Room Sharing:** When you create a private room, you can copy and share the room link with anyone. Anyone with the link can join the room by entering their username.
*   **Interactive Drawing Tools:** Access a suite of tools including pencil/pen, eraser, color picker, and adjustable line thickness for creative freedom.
*   **Undo & Redo Support:** Effortlessly revert or reapply changes to your drawings, ensuring a smooth creative process.
*   **Live User List:** Instantly see who is present in your room and track collaborators as they join or leave.
*   **Active User Indicator:** In the user list, a green symbol appears beside the user who is currently drawing, writing, or performing an action on the whiteboard. This helps everyone see who is actively interacting with the board in real time.
*   **Permission Management:** Room creators can assign or revoke editing rights, maintaining control over who can edit or view.
*   **Integrated Chat:** Communicate with collaborators through a built-in chat panel for seamless teamwork.
*   **Persistent Sessions:** All board content, chat history, and user roles are saved in the database, so nothing is lost when you refresh or rejoin.
*   **Save as PNG or PDF:** You can download your whiteboard as a PNG image or PDF file for easy sharing and record-keeping.


##  Live Demo

**The application is live! Try it out here:**

[**https://collaborative-whiteboard-with-real-sable.vercel.app/**](https://collaborative-whiteboard-with-real-sable.vercel.app/)

##  Tech Stack

*   **Frontend:** React, Vite, Fabric.js
*   **Backend:** Node.js, Socket.IO
*   **Database:** MongoDB Atlas
*   **Deployment:** Vercel (Frontend), Render (Backend)

---

##  Local Development Setup

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later recommended)
*   [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/VK180/Collaborative-Whiteboard-with-Real-time-drawing.git
cd Collaborative-Whiteboard-with-Real-time-drawing
```

### 2. Backend Setup

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install
```

### 3. Frontend Setup

```bash
# Navigate to the client directory from the root
cd client

# Install dependencies
npm install
```

### 4. Environment Variables (Crucial!)

The backend server requires a MongoDB connection string to function. This is provided via an environment variable in a `.env` file located in the `server` directory.

#### How to Set Up Your Environment Variables

1.  **Create a MongoDB Atlas Account:**
    - Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up for a free account.
    - Follow the prompts to create a new project and a free cluster.

2.  **Configure Database Access:**
    - In your MongoDB Atlas dashboard, go to **Database Access** and add a new database user.
    - Set a username and password (save these for the next step).

3.  **Get Your Connection String:**
    - In your cluster's "Overview" tab, click **Connect** > **Drivers**.
    - Copy the connection string provided (it will look like `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`).
    - Replace `<username>` and `<password>` with the credentials you set up in the previous step.

4.  **Allow Network Access:**
    - Go to **Network Access** in Atlas and click **Add IP Address**.
    - **For development and deployment to services like Render or Vercel, you must add `0.0.0.0/0` to the IP Access List.**
    - This allows connections from any IP address, which is necessary because cloud platforms use dynamic IPs that cannot be predicted in advance.
    - **If you do not add `0.0.0.0/0`, your app may fail to connect to MongoDB Atlas, resulting in connection errors.**

5.  **Create the `.env` File:**
    - Navigate to the `server` directory in your project.
    - Create a file named `.env` and add your connection string as follows:

    ```bash
    echo "DATABASE_URL=your_mongodb_connection_string_here" > .env
    ```

    - Replace `your_mongodb_connection_string_here` with your actual connection string from step 3.

> ** IMPORTANT:**
> - Ensure the `.env` file is saved with **UTF-8 encoding** (not UTF-16 or any other format).
> - If you see `DATABASE_URL: undefined` errors, double-check your file encoding and the variable name.

### 5. Run the Application

You need to run both the backend server and the frontend client simultaneously in two separate terminals.

*   **Terminal 1: Start the Backend Server**
    ```bash
    # In the /server directory
    npm start
    ```
    *The backend server will be running on `http://localhost:3001`.*

*   **Terminal 2: Start the Frontend Client**
    ```bash
    # In the /client directory
    npm run dev
    ```
    *The frontend will be running on `http://localhost:5173`.*

## Usage Notes

- **Private Room Sharing:** When you create a private room, you can copy and share the room link with anyone. Anyone with the link can join the room by entering their username.
- **Active User Indicator:** In the user list, a green symbol appears beside the user who is currently drawing, writing, or performing an action on the whiteboard. This helps everyone see who is actively interacting with the board in real time. 
