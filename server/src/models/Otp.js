const mongoose = require("mongoose");

// Stores a hashed, short-lived OTP per (email, purpose).
// The TTL index automatically deletes the document once expiresAt passes —
// no cron job needed, and expired OTPs can never be replayed.
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  purpose: { type: String, enum: ["signup", "reset"], default: "signup" },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 }, // wrong-guess counter, capped in otpService
  lastSentAt: { type: Date, default: Date.now }, // used to enforce resend cooldown
  expiresAt: { type: Date, required: true },
});

// One active OTP per email+purpose at a time
otpSchema.index({ email: 1, purpose: 1 }, { unique: true });
// MongoDB TTL monitor sweeps documents once expiresAt is in the past
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);