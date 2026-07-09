const mongoose = require("mongoose");

// Real, persisted notification events — badges unlocked, password changes,
// profile updates, certificates earned, etc. (Interview-score notifications
// stay computed on-the-fly in notificationController for backward compat.)
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "badge_earned",
        "certificate_earned",
        "password_reset",
        "password_changed",
        "profile_updated",
        "account_created",
      ],
      required: true,
    },
    icon:  { type: String, default: "🔔" },
    title: { type: String, required: true },
    text:  { type: String, default: "" },
    link:  { type: String, default: null }, // client-side route to open on click
    read:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);