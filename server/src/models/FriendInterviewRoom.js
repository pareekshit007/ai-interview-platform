const mongoose = require("mongoose");

const friendRoomSchema = new mongoose.Schema(
  {
    code:        { type: String, required: true, unique: true, index: true },
    host:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    guest:       { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    hostName:    { type: String, required: true },
    guestName:   { type: String, default: null },
    role:        { type: String, default: "frontend" },
    difficulty:  { type: String, default: "medium" },
    company:     { type: String, default: null },
    questions:   [{ type: String }],
    hostIsInterviewer: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["waiting", "active", "completed", "expired"],
      default: "waiting",
    },
    currentQuestionIndex: { type: Number, default: 0 },
    candidateAnswers: [
      {
        questionIndex: Number,
        questionText:  String,
        notes:         String,
        rating:        Number,
      },
    ],
    // Derived scores saved on finish so scorecard can be shown later
    candidateScore:   { type: Number, default: null },
    candidateVerdict: { type: String, default: null },
    // Links to Interview documents created for each user on finish
    hostInterviewId:  { type: mongoose.Schema.Types.ObjectId, ref: "Interview", default: null },
    guestInterviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Interview", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FriendInterviewRoom", friendRoomSchema);