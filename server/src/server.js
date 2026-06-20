const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initSignalingServer } = require("./sockets/signalingServer");

connectDB();

const PORT = process.env.PORT || 5000;

// Use a shared HTTP server so both Express (REST) and Socket.io (WebRTC signaling)
// can listen on the same port — required for Render's single-port free tier.
const httpServer = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

initSignalingServer(httpServer, allowedOrigins);

const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 MongoDB connecting...`);
  console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? "✅ Configured" : "❌ Missing key"}`);
  console.log(`📹 Signaling server ready for friend interviews`);
});

// Handle port in use error gracefully
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`⚠️  Port ${PORT} in use — retrying on ${PORT + 1}`);
    server.listen(PORT + 1);
  }
});