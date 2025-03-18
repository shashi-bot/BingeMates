const socket = io();
const video = document.getElementById('videoPlayer');
let lastSync = 0;

if (typeof room !== 'undefined') {
    socket.emit('join', { room: room });

    socket.on('user_joined', (data) => {
        addMessage(`${data.username} joined the room`, 'system');
    });

    socket.on('sync_video', (data) => {
        if (video.src !== data.url) {
            video.src = data.url;
        }
        if (Math.abs(video.currentTime - data.time) > 0.5) {
            video.currentTime = data.time;
        }
        data.state === 'play' ? video.play() : video.pause();
    });

    socket.on('update_time', (data) => {
        if (Math.abs(video.currentTime - data.time) > 1) {
            video.currentTime = data.time;
        }
    });

    socket.on('new_message', (data) => {
        addMessage(data.message, data.username, data.timestamp);
    });
}

function playVideo() {
    const url = document.getElementById('videoUrl').value;
    video.src = url;
    video.play();
    syncVideo('play');
}

function uploadAndPlay() {
    const fileInput = document.getElementById('videoFile');
    const file = fileInput.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(url => {
            video.src = url;
            video.play();
            syncVideo('play');
        })
        .catch(error => console.error('Error:', error));
    }
}

function syncVideo(state) {
    socket.emit('play_video', {
        room: room,
        url: video.src,
        time: video.currentTime,
        state: state
    });
}

function syncTime() {
    const now = Date.now();
    if (now - lastSync > 5000) {  // Sync every 5 seconds
        socket.emit('sync_time', {
            room: room,
            time: video.currentTime
        });
        lastSync = now;
    }
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value;
    if (message) {
        socket.emit('chat_message', {
            room: room,
            message: message,
            timestamp: new Date().toISOString()
        });
        input.value = '';
    }
}

function addMessage(message, username, timestamp) {
    const messages = document.getElementById('messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    const time = timestamp ? new Date(timestamp).toLocaleTimeString() : '';
    msgDiv.innerHTML = `<span class="time">[${time}]</span> <strong>${username}:</strong> ${message}`;
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
}

video.addEventListener('play', () => syncVideo('play'));
video.addEventListener('pause', () => syncVideo('pause'));