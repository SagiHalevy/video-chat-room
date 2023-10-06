const express = require("express");
const session = require("express-session");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

// Constants
const MAX_MESSAGES_COUNT = 100;
const SESSION_SECRET = "your-secret-key";
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours

// Room messages storage
const roomMessages = {};

// Express middleware setup
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: COOKIE_MAX_AGE,
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
      roomMessages[roomId] = roomMessages[roomId] || [];
      roomMessages[roomId].push({ message, userName });

      // Limit the number of messages to the specified maximum
      if (roomMessages[roomId].length > MAX_MESSAGES_COUNT) {
        roomMessages[roomId].shift(); // Remove the oldest message
      }

      // Emit the message to the sender and all clients in the room
      io.to(roomId).emit("chat-message", message, userName);
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

// Server listen
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
