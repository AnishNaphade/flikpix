# Flikpix 🎬

Welcome to Flikpix, your premium movie and TV show universe! This is a full-stack application with a React + Vite frontend and a Node.js + Express + SQLite backend.

## 🚀 Getting Started

To run this project locally, you need to start both the backend API server and the frontend development server.

### Prerequisites
Make sure you have Node.js and npm installed on your machine.

### 1. Start the Backend Server
The backend handles the SQLite database (user accounts, saved lists) and securely proxies requests to the TMDB API.

Open a terminal and run:
```bash
cd server
npm start
# OR
node server.js
```
*The backend will run on `http://localhost:5000`*

### 2. Start the Frontend Server
The frontend is built with React and Vite. It proxies API requests to the backend.

Open a **new, separate terminal** and run:
```bash
cd client
npm run dev
```
*The frontend will run on `http://localhost:5173`*

---

## 🛠️ Project Structure
- **/client**: The React frontend (UI components, pages, hooks, context).
- **/server**: The Node.js backend (Express routes, authentication, database setup).

## 🔑 Environment Variables
The backend requires a TMDB API key to fetch movie and TV data. This has already been configured in `server/.env`.
- `TMDB_API_KEY`: The API key for TMDB.
- `JWT_SECRET`: Secret used for signing user authentication tokens.

---
*Built with ❤️ for movie lovers.*
