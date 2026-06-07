const express = require("express");
const { startInterview, submitInterview, getHistory, getInterview } = require("../controllers/interviewController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/start",       protect, startInterview);
router.post("/:id/submit",  protect, submitInterview);
router.get("/history",      protect, getHistory);
router.get("/:id",          protect, getInterview);

module.exports = router;