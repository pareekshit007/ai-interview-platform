const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getGlobalLeaderboard,
  getTopicLeaderboard,
  getMyRank,
} = require("../controllers/leaderboardController");

// GET /api/leaderboard               → global top-50
// GET /api/leaderboard/topic/:topic  → filtered by role/topic
// GET /api/leaderboard/my-rank       → logged-in user's rank + nearby

router.get("/",              protect, getGlobalLeaderboard);
router.get("/my-rank",       protect, getMyRank);          // must be before /:topic
router.get("/topic/:topic",  protect, getTopicLeaderboard);

module.exports = router;