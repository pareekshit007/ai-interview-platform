const express = require("express");
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", protect, getNotifications);
router.patch("/read-all", protect, markAllNotificationsRead);
router.patch("/:id/read", protect, markNotificationRead);

module.exports = router;