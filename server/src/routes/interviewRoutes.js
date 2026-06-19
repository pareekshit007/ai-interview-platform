const express = require("express");
const { startInterview, submitInterview, getHistory, getInterview, getProgress } = require("../controllers/interviewController");
const { protect } = require("../middleware/authMiddleware");
const { validateStartInterview, validateSubmitInterview } = require("../middleware/validate");
const router = express.Router();

router.post("/start",       protect, validateStartInterview,  startInterview);
router.post("/:id/submit",  protect, validateSubmitInterview, submitInterview);
router.get("/history",      protect,                          getHistory);
router.get("/progress",     protect,                          getProgress);
router.get("/:id",          protect,                          getInterview);

module.exports = router;