const express = require("express");
const { getQuestions, getAnswerFeedback, getSessionFeedback } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/questions",        protect, getQuestions);
router.post("/feedback/answer",  protect, getAnswerFeedback);
router.post("/feedback/session", protect, getSessionFeedback);

module.exports = router;