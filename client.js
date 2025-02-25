const socket = io("https://serverjs-production-35cd.up.railway.app/"); // Use your Railway URL

let localStream;
let peerConnection;
const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startCall = document.getElementById("startCall");
const endCall = document.getElementById("endCall");

startCall.addEventListener("click", startVideoCall);
endCall.addEventListener("click", endCallSession);

// Capture User Video & Audio
async function startVideoCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    socket.emit("joinRoom", "default-room"); // Notify the server that we joined
}

socket.on("userJoined", async () => {
    console.log("A second user joined. Sending offer...");
    createOffer();
});

// Create and send WebRTC offer
async function createOffer() {
    peerConnection = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) socket.emit("candidate", event.candidate);
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", offer);
}

// Receive Offer and Send Answer
socket.on("offer", async (offer) => {
    peerConnection = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) socket.emit("candidate", event.candidate);
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
});

// Receive Answer
socket.on("answer", async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle ICE Candidates
socket.on("candidate", async (candidate) => {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// End Call
function endCallSession() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    socket.emit("endCall");
}

socket.on("endCall", () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    remoteVideo.srcObject = null;
});