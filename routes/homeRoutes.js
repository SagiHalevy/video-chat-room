const express = require("express");
const router = express.Router();
const {
  homePage,
  createRoom,
  joinRoom,
  room,
} = require("../controllers/homeController");

router.route("/").get(homePage);
router.route("/create-room").post(createRoom);
router.route("/join-room").post(joinRoom);
router.route("/:room").get(room);

module.exports = router;
