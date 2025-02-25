const socket = io("https://your-app.up.railway.app"); // Replace with your Railway URL

let localStream;
let peerConnection;
const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startCall = document.getElementById("startCall");
const endCall = document.getElementById("endCall");

startCall.addEventListener("click", startVideoCall);
endCall.addEventListener("click", endCallSession);

async function startVideoCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    socket.emit("joinRoom", "default-room");
}

socket.on("userJoined", async () => {
    console.log("Second user detected, creating offer...");
    await createOffer();
});

// **Force Send an Offer**
async function createOffer() {
    console.log("Creating WebRTC Offer...");
    peerConnection = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
        console.log("Receiving remote video stream...");
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) socket.emit("candidate", event.candidate);
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log("Sending offer to signaling server...");
    socket.emit("offer", offer);
}

// **Listen for an Offer**
socket.on("offer", async (offer) => {
    console.log("Offer received from another user.");

    peerConnection = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
        console.log("Receiving remote video stream...");
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

// **Receive Answer**
socket.on("answer", async (answer) => {
    console.log("Answer received, completing WebRTC connection...");
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// **Handle ICE Candidates**
socket.on("candidate", async (candidate) => {
    console.log("Adding ICE Candidate...");
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// **End Call**
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
