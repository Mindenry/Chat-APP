// Get server URL from current window location
const serverUrl = window.location.hostname;
const socket = io();

let currentUser = '';

// Login function
function login() {
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();
    
    if (username) {
        currentUser = username;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('chat-room').classList.remove('hidden');
        
        // Announce new user
        socket.emit('user-joined', username);
        
        // Setup message input event
        const messageInput = document.getElementById('message-input');
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

// Send message
function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (message) {
        socket.emit('chat-message', {
            username: currentUser,
            message: message
        });
        
        messageInput.value = '';
    }
}

// Add message to chat
function addMessage(username, message, isSent) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    messageElement.innerHTML = `
        <strong>${username}:</strong><br>
        ${message}
    `;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Add system message
function addSystemMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'system-message';
    messageElement.textContent = message;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Update online users list
function updateOnlineUsers(users) {
    const onlineUsersDiv = document.getElementById('online-users');
    onlineUsersDiv.innerHTML = '';
    
    users.forEach(username => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.textContent = username;
        onlineUsersDiv.appendChild(userElement);
    });
}

// Socket event listeners
socket.on('chat-message', (data) => {
    addMessage(data.username, data.message, data.username === currentUser);
});

socket.on('system-message', (message) => {
    addSystemMessage(message);
});

socket.on('update-users', (users) => {
    updateOnlineUsers(users);
});