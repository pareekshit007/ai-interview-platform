const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const aiRoutes = require("./routes/aiRoutes");
const userRoutes = require("./routes/userRoutes");
const { errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(cors({
  origin: [
    "https://ai-interview-platform-eta-green.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true,
}));
app.use(express.json());

app.get("/", (req, res) => res.json({ status: "API running ✅" }));

app.use("/api/auth",      authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/ai",        aiRoutes);
app.use("/api/user",      userRoutes);

app.use(errorHandler);

module.exports = app;