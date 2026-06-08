const express = require("express");
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { validateRegister, validateLogin } = require("../middleware/validate");
const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login",    validateLogin,    login);
router.get("/me",        protect,          getMe);

module.exports = router;