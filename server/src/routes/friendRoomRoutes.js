const express = require("express");
const { createRoom, getRoomByCode, finishRoom, joinRoomAsUser } = require("../controllers/friendRoomController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/create",         protect,      createRoom);      // host must be logged in
router.get("/:code",                         getRoomByCode);   // public — pre-auth lookup
router.post("/:code/join",     protect,      joinRoomAsUser);  // registers logged-in guest to room
router.post("/:code/finish",   optionalAuth, finishRoom);      // either user can call this

module.exports = router;