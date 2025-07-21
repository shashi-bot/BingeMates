const socket = io();
const roomCode = document.getElementById("room-code").innerText;
const videoPlayer = document.getElementById("video-player");

socket.emit("join", { room_code: roomCode });

videoPlayer.addEventListener("play", () => {
    socket.emit("video_update", { room_code: roomCode, action: "play", time: videoPlayer.currentTime });
});

videoPlayer.addEventListener("pause", () => {
    socket.emit("video_update", { room_code: roomCode, action: "pause", time: videoPlayer.currentTime });
});

socket.on("sync_video", (data) => {
    if (data.action === "play") {
        videoPlayer.currentTime = data.time;
        videoPlayer.play();
    } else if (data.action === "pause") {
        videoPlayer.currentTime = data.time;
        videoPlayer.pause();
    }
});
