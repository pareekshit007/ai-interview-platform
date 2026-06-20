const express = require("express");
const { createRoom, getRoomByCode, finishRoom } = require("../controllers/friendRoomController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/create",        protect, createRoom);   // host must be logged in
router.get("/:code",                   getRoomByCode); // public — guest needs this pre-auth
router.post("/:code/finish",  protect, finishRoom);

module.exports = router;