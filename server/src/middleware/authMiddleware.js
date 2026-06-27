const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized — please log in" });
  }

  try {
    const decoded = verifyToken(token);

    // Token valid but user deleted from DB
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Account not found — please sign up" });
    }

    req.user = user;
    next();
  } catch (error) {
    // Distinguish between expired vs truly invalid
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired — please log in again" });
    }
    return res.status(401).json({ message: "Invalid token — please log in again" });
  }
};

// Attaches user to req if token is valid — never blocks the request
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select("-password");
      if (user) req.user = user;
    }
  } catch { /* ignore — just proceed without user */ }
  next();
};

module.exports = { protect, optionalAuth };