const express = require("express");
const session = require("express-session");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

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

// app.get("/", (req, res) => {
//   res.redirect(`/${uuidv4()}`);
// });

// app.get("/:room", (req, res) => {
//   res.render("room", { roomId: req.params.room });
// });

io.on("connection", (socket) => {
  console.log("made socket connection", socket.id);
  socket.on("join-room", (roomId, peerId, userName) => {
    console.log("joined room");
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userName, peerId);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", peerId, userName);
    });

    socket.on("send-chat-message", (message) => {
      // Emit the message to the sender
      socket.emit("chat-message", message, userName);
      // Emit the message to all clients in the room except the sender
      socket.to(roomId).emit("chat-message", message, userName);
    });
  });
});

server.listen(8080);
