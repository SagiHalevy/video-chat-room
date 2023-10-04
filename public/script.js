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
const videoContainer = document.getElementById("video-container");
myVideo.muted = true;
const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    //audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream, USER_NAME); //show my video
    //send my video and show remote's video when they call

    myPeer = setPeer();

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, call.metadata.username);
      });
      call.on("close", () => {
        console.log("PEER CLOSED");
        video.remove();
      });
      peers[call.peer] = call;
    });

    //connect to the user when they join the room
    socket.on("user-connected", (userName, peerId) => {
      console.log(userName, "joined the room.");
      connectToNewUser(peerId, userName, stream);
    });
  });

socket.on("user-disconnected", (peerId, userName) => {
  if (peers[peerId]) peers[peerId].close();
  console.log(userId + " disconnected.");
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
  call.on("close", () => {
    console.log("PEER CLOSED");
    video.remove();
  });
  peers[peerId] = call;
}
const addVideoStream = (video, stream, userName) => {
  const videoWindow = document.createElement("div");
  const videoTitle = document.createElement("h2");
  videoTitle.textContent = userName;
  videoWindow.append(videoTitle);
  videoWindow.append(video);
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoContainer.append(videoWindow);
};
