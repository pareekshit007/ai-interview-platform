const nodemailer = require("nodemailer");

// ── Shared Nodemailer transporter ──────────────────────────────────────────
// Reused by OTP emails, reminder emails, and any other outbound mail.
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail: use an App Password, never the real password
  },
});

module.exports = transporter;