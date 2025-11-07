# Task Board 
Minimalist task board with Node.js, GraphQL, SQLite, and vanilla JS.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start the server:**
```bash
npm start
```

3. **Open the frontend:**
   - Save the "Task Board (Minimalist Apple-inspired)" artifact as `index.html`
   - Open `index.html` in your browser
   - Make sure the server is running on http://localhost:4000

## Project Structure

```
task-board-poc/
├── server.js          # GraphQL server (Backend artifact)
├── index.html         # Frontend UI (Frontend artifact)
├── package.json       # Dependencies
└── README.md          # This file
```

## Features

- Add tasks
- Move tasks between columns (To Do → In Progress → Done)
- Delete tasks
- Real-time updates (GraphQL subscriptions ready)
- SQLite persistence (in-memory for POC)
- Minimalist Apple-inspired design

## API Endpoint

- HTTP: `http://localhost:4000/graphql`
- WebSocket: `ws://localhost:4000/graphql`