const { v4: uuidv4 } = require("uuid");
const homePage = (req, res) => {
  res.render("home");
};

const createRoom = (req, res) => {
  req.session.name = req.body.name;
  res.redirect(`/${uuidv4()}`);
};

const joinRoom = (req, res) => {
  const roomId = req.body.room_id;
  req.session.name = req.body.name;
  res.redirect(`/${roomId}`);
};
const room = (req, res) => {
  res.render("room", { roomId: req.params.room, name: req.session.name });
};

module.exports = {
  homePage,
  createRoom,
  room,
  joinRoom,
};
