const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getBadges,
  getLeaderboard,
  getCertificate,
  getAchievementStats,
} = require("../controllers/achievementsController");

const router = express.Router();

router.get("/badges",                    protect, getBadges);
router.get("/leaderboard",               protect, getLeaderboard);
router.get("/certificate/:interviewId",  protect, getCertificate);
router.get("/stats",                     protect, getAchievementStats);

module.exports = router;