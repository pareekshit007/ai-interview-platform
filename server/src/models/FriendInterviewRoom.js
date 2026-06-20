const mongoose = require("mongoose");

// A friend-interview room is ephemeral — created by a logged-in user (the host,
// who plays interviewer by default), joined by a guest via a room code/link.
// No video/audio is stored — only metadata, question progress, and final scores.

const friendRoomSchema = new mongoose.Schema(
  {
    code:        { type: String, required: true, unique: true, index: true }, // short shareable code
    host:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hostName:    { type: String, required: true },
    guestName:   { type: String, default: null },
    role:        { type: String, default: "frontend" },
    difficulty:  { type: String, default: "medium" },
    company:     { type: String, default: null },
    questions:   [{ type: String }],
    status: {
      type: String,
      enum: ["waiting", "active", "completed", "expired"],
      default: "waiting",
    },
    currentQuestionIndex: { type: Number, default: 0 },
    // Who is playing which role this session — host can swap roles before starting
    hostIsInterviewer: { type: Boolean, default: true },
    candidateAnswers: [
      {
        questionIndex: Number,
        questionText: String,
        notes: String,        // interviewer's live notes/rating during the call
        rating: Number,       // 1-5 manual rating from interviewer
      },
    ],
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }, // 24h TTL
  },
  { timestamps: true }
);

friendRoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Mongo auto-deletes expired rooms

module.exports = mongoose.model("FriendInterviewRoom", friendRoomSchema);