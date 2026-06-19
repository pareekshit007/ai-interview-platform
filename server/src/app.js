const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const aiRoutes = require("./routes/aiRoutes");
const userRoutes = require("./routes/userRoutes");
const { errorHandler } = require("./middleware/errorMiddleware");
const notificationRoutes = require("./routes/notificationRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

const allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

app.get("/", (req, res) => res.json({ status: "API running ✅" }));

app.use("/api/auth",          authRoutes);
app.use("/api/interview",     interviewRoutes);
app.use("/api/ai",            aiRoutes);
app.use("/api/user",          userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload",        uploadRoutes);

app.use(errorHandler);

module.exports = app;