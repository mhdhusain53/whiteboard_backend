const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/whiteboard', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const boardSchema = new mongoose.Schema({
    boardId: String,
    content: Object,
});

const Board = mongoose.model('Board', boardSchema);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-board', (boardId) => {
        socket.join(boardId);
    });

    socket.on('draw', (data) => {
        socket.to(data.boardId).emit('draw', data);
    });

    socket.on('add-note', (data) => {
        socket.to(data.boardId).emit('add-note', data);
    });

    socket.on('save-board', async (data) => {
        await Board.findOneAndUpdate(
            { boardId: data.boardId },
            { content: data.content },
            { upsert: true }
        );
    });
});

app.get('/board/:boardId', async (req, res) => {
    const board = await Board.findOne({ boardId: req.params.boardId });
    res.json(board ? board.content : null);
});

server.listen(5000, () => console.log('Server running on http://localhost:5000'));
