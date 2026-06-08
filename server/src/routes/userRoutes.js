const express = require("express");
const { getProfile, updateProfile } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { validateUpdateProfile } = require("../middleware/validate");
const router = express.Router();

router.get("/profile", protect,                           getProfile);
router.put("/profile", protect, validateUpdateProfile,    updateProfile);

module.exports = router;