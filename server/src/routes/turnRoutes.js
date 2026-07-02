const express = require("express");
const { getIceServers } = require("../services/turnService");
const router = express.Router();

/**
 * GET /api/turn/credentials
 * Returns fresh ICE server config for WebRTC clients.
 * Called once when the call room mounts — credentials cached server-side 10h.
 * No auth required (credentials are short-lived and room-scoped).
 */
router.get("/credentials", async (req, res) => {
  try {
    const config = await getIceServers();
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: "Failed to get TURN credentials" });
  }
});

module.exports = router;