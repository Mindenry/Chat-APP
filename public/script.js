// Initialize socket connection
const socket = io();

// App state
let currentUser = {
    username: '',
    avatar: '',
    theme: localStorage.getItem('theme') || 'light'
};

let currentRoom = 'general';
let rooms = ['general', 'random', 'help'];
let notifications = true;

// DOM Elements
const messageSound = document.getElementById('message-sound');
const notificationSound = document.getElementById('notification-sound');

// Apply saved theme
document.body.classList.toggle('dark-theme', currentUser.theme === 'dark');

// Utility Functions
function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function playNotification() {
    if (notifications && document.hidden) {
        notificationSound.play();
    }
}

// UI Functions
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    document.getElementById(`${tab}-tab`).classList.remove('hidden');
}

function toggleSettings() {
    document.getElementById('settings-modal').classList.toggle('hidden');
}

function toggleEmoji() {
    document.getElementById('emoji-picker').classList.toggle('hidden');
}

function toggleAttachment() {
    // Implement file attachment functionality
    console.log('Attachment feature coming soon');
}

// Chat Functions
function login() {
    const username = document.getElementById('username').value.trim();
    const avatarUrl = document.getElementById('avatar-url').value.trim() || '/public/default-avatar.png';
    
    if (username) {
        currentUser.username = username;
        currentUser.avatar = avatarUrl;
        
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('chat-room').classList.remove('hidden');
        document.getElementById('current-user-name').textContent = username;
        document.getElementById('current-user-avatar').src = avatarUrl;
        
        socket.emit('user-joined', { username, avatar: avatarUrl });
        
        // Setup message input events
        const messageInput = document.getElementById('message-input');
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (message) {
        const messageData = {
            username: currentUser.username,
            avatar: currentUser.avatar,
            message: message,
            room: currentRoom,
            timestamp: new Date()
        };
        
        socket.emit('chat-message', messageData);
        messageInput.value = '';
    }
}

function addMessage(data, isSent = false) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    
    messageElement.innerHTML = `
        <div class="message-content">
            <img src="${data.avatar}" alt="avatar" class="message-avatar">
            <div class="message-text">
                <strong>${data.username}</strong>
                <p>${data.message}</p>
                <span class="time">${formatTime(new Date(data.timestamp))}</span>
            </div>
        </div>
    `;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    if (!isSent) {
        playNotification();
    }
}

function addSystemMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'system-message';
    messageElement.innerHTML = `
        <span class="time">${formatTime(new Date())}</span>
        <p>${message}</p>
    `;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateOnlineUsers(users) {
    const onlineUsersDiv = document.getElementById('online-users');
    onlineUsersDiv.innerHTML = '';
    
    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.innerHTML = `
            <img src="${user.avatar}" alt="avatar">
            <span>${user.username}</span>
            <span class="status-dot"></span>
        `;
        onlineUsersDiv.appendChild(userElement);
    });
}

function updateRooms() {
    const roomListDiv = document.getElementById('room-list');
    roomListDiv.innerHTML = '';
    
    rooms.forEach(room => {
        const roomElement = document.createElement('div');
        roomElement.className = `room-item ${room === currentRoom ? 'active' : ''}`;
        roomElement.innerHTML = `
            <i class="fas fa-hashtag"></i>
            <span>${room}</span>
        `;
        roomElement.onclick = () => joinRoom(room);
        roomListDiv.appendChild(roomElement);
    });
}

function joinRoom(room) {
    socket.emit('leave-room', currentRoom);
    currentRoom = room;
    socket.emit('join-room', room);
    document.getElementById('current-room').textContent = `#${room}`;
    updateRooms();
    
    // Clear messages when switching rooms
    document.getElementById('messages').innerHTML = '';
    addSystemMessage(`Joined #${room}`);
}

function createRoom() {
    const roomName = prompt('Enter room name:');
    if (roomName && !rooms.includes(roomName)) {
        rooms.push(roomName);
        updateRooms();
        joinRoom(roomName);
    }
}

// Settings Functions
function changeTheme() {
    const theme = document.getElementById('theme-selector').value;
    currentUser.theme = theme;
    localStorage.setItem('theme', theme);
    document.body.classList.toggle('dark-theme', theme === 'dark');
}

function saveSettings() {
    notifications = document.getElementById('notification-sound').checked;
    toggleSettings();
}

// Socket Events
socket.on('chat-message', (data) => {
    addMessage(data, data.username === currentUser.username);
});

socket.on('system-message', (message) => {
    addSystemMessage(message);
});

socket.on('update-users', (users) => {
    updateOnlineUsers(users);
});

socket.on('update-rooms', (serverRooms) => {
    rooms = serverRooms;
    updateRooms();
});

// Initialize emoji picker
document.addEventListener('DOMContentLoaded', () => {
    const emojiPicker = document.getElementById('emoji-picker');
    const emojis = ['😀', '😂', '😊', '😍', '🤔', '😎', '👍', '❤️', '🎉', '🔥'];
    
    emojis.forEach(emoji => {
        const button = document.createElement('button');
        button.textContent = emoji;
        button.onclick = () => {
            document.getElementById('message-input').value += emoji;
            toggleEmoji();
        };
        emojiPicker.appendChild(button);
    });
});