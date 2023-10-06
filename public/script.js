const socket = io("/");

function setPeer() {
  const myPeer = new Peer(undefined, {
    host: "/",
    port: "3030",
  });
  myPeer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id, USER_NAME);
  });
  return myPeer;
}

const myVideo = document.createElement("video");
myVideo.muted = true;
myVideo.classList.add("self-video");

const videoContainer = document.getElementById("video-container");
const allMessageContainer = document.getElementById("all-messages");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");

const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: false,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream, USER_NAME); //show my video

    //send user video and show remote's video when they call
    myPeer = setPeer();

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, call.metadata.username);
      });
      call.on("close", () => peerClosed(video));
      addPeer(call.peer, call);
    });

    //connect to the user when they join the room
    socket.on("user-connected", (userName, peerId) => {
      console.log(userName, "joined the room.");
      connectToNewUser(peerId, userName, stream);
    });
    //show chat messages
    socket.on("chat-message", (message, userName) => {
      displayChatMessage(userName, message);
    });
  });
socket.on("user-disconnected", (peerId, userName) => {
  if (peers[peerId]) peers[peerId].close();
  console.log(userName + " disconnected.");
});
function connectToNewUser(peerId, userName, stream) {
  //connect to the user, and show their video
  const call = myPeer.call(peerId, stream, {
    metadata: { username: USER_NAME },
  });

  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream, userName);
  });
  call.on("close", () => peerClosed(video));
  addPeer(peerId, call);
}

// Function to display chat messages
function displayChatMessage(userName, message) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.innerText = `${userName}: ${message}`;
  if (userName === USER_NAME) {
    messageElement.classList.add("self-message");
  }
  allMessageContainer.append(messageElement);
  allMessageContainer.scrollTop = allMessageContainer.scrollHeight; // Scroll down when new message arrives
}

const addVideoStream = (video, stream, userName) => {
  const videoWindow = document.createElement("div");
  const videoTitle = document.createElement("h2");
  videoTitle.classList.add("video-title");
  videoWindow.classList.add("video-window");
  videoTitle.textContent = userName;
  videoWindow.append(videoTitle);
  videoWindow.append(video);
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoContainer.append(videoWindow);
};

const peerClosed = (video) => {
  video.parentNode.remove();
};

const addPeer = (peerId, call) => {
  peers[peerId] = call;
};

messageForm.addEventListener("submit", (e) => {
  e.preventDefault(); //stop from sending a post request to server
  const message = messageInput.value;
  //send only if message is not empty
  if (message) {
    socket.emit("send-chat-message", message);
    messageInput.value = "";
    messageInput.focus();
  }
});
