const express = require("express");
const session = require("express-session");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

// Set the maximum number of messages to retain
const MAX_MESSAGES_COUNT = 100;

const roomMessages = {};

// Set up express-session middleware
app.use(
  session({
    secret: "your-secret-key", //should be changed
    resave: false, // Prevents session from being saved on every request
    saveUninitialized: true, // Forces a session to be created for new users
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use("/", require("./routes/homeRoutes"));

io.on("connection", (socket) => {
  console.log("made socket connection", socket.id);
  socket.on("join-room", (roomId, peerId, userName) => {
    console.log("joined room");
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userName, peerId);

    // Send the chat history to the user who just joined
    if (roomMessages[roomId]) {
      roomMessages[roomId].forEach((message) => {
        socket.emit("chat-message", message.message, message.userName);
      });
    }

    socket.on("send-chat-message", (message) => {
      // Save the message to the room's chat history
      if (!roomMessages[roomId]) {
        roomMessages[roomId] = [];
      }
      roomMessages[roomId].push({ message, userName });

      // Limit the number of messages to the specified maximum
      if (roomMessages[roomId].length > MAX_MESSAGES_COUNT) {
        roomMessages[roomId].shift(); // Remove the oldest message
      }

      // Emit the message to the sender
      socket.emit("chat-message", message, userName);
      // Emit the message to all clients in the room except the sender
      socket.to(roomId).emit("chat-message", message, userName);
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", peerId, userName);
      // Remove the user from the room
      socket.leave(roomId);

      // Check if the room is now empty
      const room = io.sockets.adapter.rooms.get(roomId);
      if (!room || room.size === 0) {
        // Room is empty, delete its messages
        delete roomMessages[roomId];
      }
    });
  });
});

server.listen(8080);
