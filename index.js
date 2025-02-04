const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

let boards = {}; // Store board data by boardId

// Create new board
app.post('/create-board', (req, res) => {
    const boardId = Math.floor(100000 + Math.random() * 900000).toString();
    boards[boardId] = [];
    res.json({ boardId });
});

// Check if board exists
app.get('/board/:boardId', (req, res) => {
    const { boardId } = req.params;
    res.json({ exists: !!boards[boardId] });
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-board', (boardId) => {
        socket.join(boardId);
        if (boards[boardId]) {
            socket.emit('load-board', boards[boardId]);
        }
    });

    socket.on('draw', ({ boardId, data }) => {
        if (!boards[boardId]) boards[boardId] = [];
        boards[boardId].push(data); // Save drawing data
        socket.to(boardId).emit('draw', data); // Send to others
    });

    socket.on('save-board', (boardId) => {
        console.log(`Board ${boardId} saved.`);
    });

    socket.on('clear-board', (boardId) => {
        boards[boardId] = []; // Clear the drawing data for the board
        io.to(boardId).emit('clear-board'); // Notify all users in the board
        console.log(`Board ${boardId} cleared.`);
    });
    

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(4000, () => {
    console.log('Server is running on http://localhost:4000');
});
