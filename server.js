const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Serve static files from public directory
app.use(express.static('public'));
app.use(express.json());

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Store users and rooms
const users = new Map();
const rooms = new Set(['general', 'random', 'help']);

io.on('connection', (socket) => {
    console.log('A user connected');
    let currentUser = null;
    
    socket.on('user-joined', (userData) => {
        currentUser = userData;
        users.set(socket.id, userData);
        socket.join('general'); // Join default room
        
        io.emit('update-users', Array.from(users.values()));
        io.emit('update-rooms', Array.from(rooms));
        socket.broadcast.emit('system-message', `${userData.username} joined the chat`);
    });
    
    socket.on('chat-message', (data) => {
        io.to(data.room).emit('chat-message', {
            ...data,
            timestamp: new Date()
        });
    });
    
    socket.on('join-room', (room) => {
        socket.join(room);
        socket.to(room).emit('system-message', `${currentUser.username} joined #${room}`);
    });
    
    socket.on('leave-room', (room) => {
        socket.leave(room);
        socket.to(room).emit('system-message', `${currentUser.username} left #${room}`);
    });
    
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        if (currentUser) {
            users.delete(socket.id);
            io.emit('update-users', Array.from(users.values()));
            io.emit('system-message', `${currentUser.username} left the chat`);
        }
    });
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});