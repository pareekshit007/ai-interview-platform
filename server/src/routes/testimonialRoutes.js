const express = require("express");
const { getTestimonials, getMyTestimonial, createTestimonial } = require("../controllers/testimonialController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/",     getTestimonials);
router.get("/mine", protect, getMyTestimonial);
router.post("/",    protect, createTestimonial);

module.exports = router;