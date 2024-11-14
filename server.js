const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static('./'));

const users = new Set();

io.on('connection', (socket) => {
    let currentUser = '';
    
    socket.on('user-joined', (username) => {
        currentUser = username;
        users.add(username);
        io.emit('update-users', Array.from(users));
        socket.broadcast.emit('system-message', `${username} เข้าร่วมแชท`);
    });
    
    socket.on('chat-message', (data) => {
        io.emit('chat-message', data);
    });
    
    socket.on('disconnect', () => {
        if (currentUser) {
            users.delete(currentUser);
            io.emit('update-users', Array.from(users));
            socket.broadcast.emit('system-message', `${currentUser} ออกจากแชท`);
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});