const express = require("express");
const { startResumeInterview, submitResumeInterview } = require("../controllers/resumeInterviewController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/start",      protect, startResumeInterview);
router.post("/:id/submit", protect, submitResumeInterview);

module.exports = router;