const bcrypt = require("bcryptjs");
const Otp = require("../models/Otp");
const transporter = require("../config/mailer");

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;      // OTP valid for 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;    // must wait 60s between sends to same email
const MAX_ATTEMPTS = 5;                  // wrong guesses allowed before OTP is invalidated

const generateOtpCode = () => {
  // Cryptographically fine for this purpose — 6-digit numeric, zero-padded
  return String(Math.floor(100000 + Math.random() * 900000));
};

function buildOtpEmailHTML({ name, otp, purpose = "signup" }) {
  const heading = purpose === "reset" ? "Reset your password" : "Verify your email";
  const intro = purpose === "reset"
    ? `Hey ${name ? name.split(" ")[0] : "there"} 👋 — use the code below to reset your AI Interview Platform password.`
    : `Hey ${name ? name.split(" ")[0] : "there"} 👋 — use the code below to finish creating your AI Interview Platform account.`;
  const footer = purpose === "reset"
    ? "This code expires in 10 minutes. If you didn't request a password reset, you can safely ignore this email — your password won't change."
    : "This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${heading}</title></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;border:1px solid rgba(99,102,241,0.3);overflow:hidden;max-width:480px;width:100%;">

  <tr><td style="padding:32px 40px 20px;background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.1));border-bottom:1px solid rgba(99,102,241,0.2);text-align:center;">
    <div style="font-size:38px;margin-bottom:8px;">🔐</div>
    <h1 style="margin:0;color:#e2e8f0;font-size:22px;font-weight:700;">${heading}</h1>
  </td></tr>

  <tr><td style="padding:32px 40px;">
    <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
      ${intro}
    </p>

    <div style="background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.08));border:1px solid rgba(99,102,241,0.35);border-radius:12px;padding:24px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 8px;color:#a78bfa;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Your Verification Code</p>
      <p style="margin:0;color:#e2e8f0;font-size:36px;font-weight:700;letter-spacing:8px;">${otp}</p>
    </div>

    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;text-align:center;">
      ${footer}
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Generates and sends an OTP to `email`, enforcing a resend cooldown.
 * Throws an Error with a user-facing message on cooldown violation or send failure.
 */
async function sendOtp({ email, name, purpose = "signup" }) {
  const existing = await Otp.findOne({ email, purpose });

  if (existing && Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt.getTime())) / 1000
    );
    const err = new Error(`Please wait ${waitSec}s before requesting another code`);
    err.statusCode = 429;
    throw err;
  }

  const code = generateOtpCode();
  const otpHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await Otp.findOneAndUpdate(
    { email, purpose },
    { otpHash, attempts: 0, expiresAt, lastSentAt: new Date() },
    { upsert: true, new: true }
  );

  await transporter.sendMail({
    from: `"AI Interview Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: purpose === "reset" ? "🔐 Your password reset code" : "🔐 Your verification code",
    html: buildOtpEmailHTML({ name, otp: code, purpose }),
  });
}

/**
 * Verifies a submitted OTP. Returns { valid: true } on success.
 * On failure returns { valid: false, message } — never throws for a wrong/expired code,
 * so callers can respond with a normal 400 rather than a 500.
 */
async function verifyOtp({ email, purpose = "signup", code }) {
  const record = await Otp.findOne({ email, purpose });

  if (!record) {
    return { valid: false, message: "No verification code found — please request a new one" };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, message: "Code expired — please request a new one" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, message: "Too many incorrect attempts — please request a new code" };
  }

  const match = await bcrypt.compare(String(code), record.otpHash);
  if (!match) {
    record.attempts += 1;
    await record.save();
    return { valid: false, message: "Incorrect code — please try again" };
  }

  // Success — consume the OTP so it can't be replayed
  await Otp.deleteOne({ _id: record._id });
  return { valid: true };
}

module.exports = { sendOtp, verifyOtp };