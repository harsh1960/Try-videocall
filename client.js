const socket = io("https://serverjs-production-35cd.up.railway.app/"); // Replace with your Railway URL

let localStream;
let peerConnection;
const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

async function startVideoCall() {
    console.log("Starting video call...");
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(servers);
    window.peerConnection = peerConnection;  // ✅ Make it globally accessible
    console.log("WebRTC initialized:", peerConnection);

    socket.emit("joinRoom", "default-room");
}

// Debugging logs
console.log("Script loaded successfully!");
