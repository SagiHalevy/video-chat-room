const socket = io("/");

function setPeer() {
  const myPeer = new Peer(undefined, {
    host: "/",
    port: "3030",
  });
  myPeer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id);
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
    addVideoStream(myVideo, stream); //show my video
    //send my video and show remote's video when they call

    myPeer = setPeer();

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
      call.on("close", () => {
        console.log("PEER CLOSED");
        video.remove();
      });
      peers[call.peer] = call;
    });

    //connect to the user when they join the room
    socket.on("user-connected", (userId) => {
      console.log("user joined the room", userId);
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
  console.log(userId + " dced");
});
function connectToNewUser(userId, stream) {
  //connect to the user, and show their video
  const call = myPeer.call(userId, stream);

  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    console.log("PEER CLOSED");
    video.remove();
  });
  peers[userId] = call;
}
const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoContainer.append(video);
};
