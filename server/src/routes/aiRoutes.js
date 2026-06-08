const express = require("express");
const { getQuestions, getAnswerFeedback, getSessionFeedback } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");
const { validateGetQuestions, validateAnswerFeedback, validateSessionFeedback } = require("../middleware/validate");
const router = express.Router();

router.post("/questions",        protect, validateGetQuestions,    getQuestions);
router.post("/feedback/answer",  protect, validateAnswerFeedback,  getAnswerFeedback);
router.post("/feedback/session", protect, validateSessionFeedback, getSessionFeedback);

module.exports = router;