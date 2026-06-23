/**
 * emailReminderService.js
 * Uses your existing: Interview model, User model, gemini config
 */

const nodemailer = require("nodemailer");
const model      = require("../config/gemini");
const User       = require("../models/User");
const Interview  = require("../models/Interview");

// ── Nodemailer transporter ─────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // Gmail: use an App Password
  },
});

// ── Find user's weakest topic from their interview history ─────────────────
// Reads Interview.answers[].topic and .score — both exist in your schema
async function getUserWeakArea(userId) {
  const interviews = await Interview.find({ user: userId, completed: true })
    .sort({ createdAt: -1 })
    .limit(20);

  if (!interviews.length) {
    return { topic: "General", avgScore: null, role: "fullstack" };
  }

  // Aggregate topic scores across all answers
  const topicMap = {};
  interviews.forEach((iv) => {
    (iv.answers || []).forEach((a) => {
      const t = a.topic || "General";
      if (!topicMap[t]) topicMap[t] = { count: 0, total: 0 };
      topicMap[t].count += 1;
      topicMap[t].total += a.score || 0;
    });
  });

  // Weakest = lowest average, minimum 2 answers in that topic
  const sorted = Object.entries(topicMap)
    .filter(([, v]) => v.count >= 2)
    .map(([topic, v]) => ({ topic, avgScore: Math.round(v.total / v.count) }))
    .sort((a, b) => a.avgScore - b.avgScore);

  const weakest = sorted[0] || { topic: "General", avgScore: null };

  // Most-practised role
  const roleCount = {};
  interviews.forEach((iv) => { roleCount[iv.role] = (roleCount[iv.role] || 0) + 1; });
  const role = Object.entries(roleCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "fullstack";

  return { ...weakest, role };
}

// ── Generate a practice question via Gemini (same model as the rest of app) ─
async function generatePracticeQuestion(topic, role) {
  try {
    const prompt = `You are a senior technical interviewer.
Generate ONE challenging but fair interview question for a ${role} developer candidate.
The question must specifically target the topic: "${topic}".
Return ONLY the question text — no preamble, no numbering, no explanation.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim().replace(/^["']|["']$/g, "");
  } catch (err) {
    console.error("⚠️  Question generation failed:", err.message);
    return `Can you explain a key concept in ${topic} and walk me through a real situation where you applied it?`;
  }
}

// ── HTML email template (dark purple theme matching your app) ──────────────
function buildEmailHTML({ name, topic, avgScore, role, question, appUrl }) {
  const scoreNote = avgScore !== null
    ? `Your recent average on <strong>${topic}</strong> questions was <strong>${avgScore}%</strong> — let's push that higher! 💪`
    : `Here's a great starter question to kick off your practice!`;

  const rolePretty = role.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Time to Practice!</title></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;border:1px solid rgba(99,102,241,0.3);overflow:hidden;max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="padding:36px 40px 28px;background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.1));border-bottom:1px solid rgba(99,102,241,0.2);text-align:center;">
    <div style="font-size:42px;margin-bottom:8px;">🎯</div>
    <h1 style="margin:0;color:#e2e8f0;font-size:26px;font-weight:700;">Time to Practice, ${name}!</h1>
    <p style="margin:10px 0 0;color:#a78bfa;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Your Weekly AI Interview Challenge</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 40px;">

    <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
      Hey <strong style="color:#e2e8f0;">${name}</strong> 👋 — consistency beats talent every time. Here's your personalised question for this week.
    </p>

    <!-- Score note -->
    <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.6;">${scoreNote}</p>
    </div>

    <!-- Badges -->
    <div style="margin-bottom:18px;">
      <span style="background:rgba(168,85,247,0.15);color:#c084fc;border:1px solid rgba(168,85,247,0.3);border-radius:20px;padding:5px 14px;font-size:12px;font-weight:600;text-transform:uppercase;">📚 ${topic}</span>
      <span style="background:rgba(99,102,241,0.1);color:#818cf8;border:1px solid rgba(99,102,241,0.25);border-radius:20px;padding:5px 14px;font-size:12px;font-weight:600;text-transform:uppercase;margin-left:8px;">🧑‍💻 ${rolePretty}</span>
    </div>

    <!-- Question box -->
    <div style="background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.08));border:1px solid rgba(99,102,241,0.35);border-radius:12px;padding:28px;margin-bottom:28px;">
      <p style="margin:0 0 8px;color:#a78bfa;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">This Week's Question</p>
      <p style="margin:0;color:#e2e8f0;font-size:17px;line-height:1.65;font-weight:500;">"${question}"</p>
    </div>

    <!-- Tips -->
    <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 10px;color:#34d399;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">💡 Tips Before You Answer</p>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:1.8;">
        <li>Take 30 seconds to structure your thoughts first</li>
        <li>Use the STAR method for behavioural questions</li>
        <li>Back every claim with a concrete example</li>
        <li>Aim for a 2–3 minute answer — concise beats rambling</li>
      </ul>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${appUrl}/roles" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;box-shadow:0 4px 20px rgba(99,102,241,0.35);">
        🚀 Start a Full Mock Interview
      </a>
    </div>

    <p style="margin:0;color:#64748b;font-size:13px;text-align:center;">Keep showing up. Every rep makes you sharper. 🔥</p>

  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 40px;border-top:1px solid rgba(99,102,241,0.15);text-align:center;">
    <p style="margin:0;color:#475569;font-size:12px;line-height:1.7;">
      You're receiving this because you enabled weekly reminders in your
      <a href="${appUrl}/profile" style="color:#6366f1;text-decoration:none;">Profile settings</a>.<br/>
      <a href="${appUrl}/profile" style="color:#475569;text-decoration:none;">Unsubscribe</a>
      &nbsp;·&nbsp;
      <a href="${appUrl}" style="color:#475569;text-decoration:none;">AI Interview Platform</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Send one reminder email to one user ────────────────────────────────────
async function sendReminderToUser(user) {
  const { topic, avgScore, role } = await getUserWeakArea(user._id);
  const question = await generatePracticeQuestion(topic, role);
  const appUrl   = process.env.CLIENT_URL?.split(",")[0] || "http://localhost:5173";

  const html = buildEmailHTML({
    name: user.name.split(" ")[0],
    topic, avgScore, role, question, appUrl,
  });

  await transporter.sendMail({
    from: `"AI Interview Platform" <${process.env.EMAIL_USER}>`,
    to:   user.email,
    subject: `⏰ Time to practice, ${user.name.split(" ")[0]}! Your ${topic} question is waiting`,
    html,
  });

  console.log(`📧 Reminder sent → ${user.email}  (weak area: ${topic}, score: ${avgScore ?? "N/A"}%)`);
}

// ── Batch job: send to all opted-in users ─────────────────────────────────
async function sendWeeklyReminders() {
  console.log("📬 Starting weekly email reminder job…");

  const users = await User.find({ emailReminders: true }).select("name email");

  if (!users.length) {
    console.log("ℹ️  No users have email reminders enabled.");
    return { sent: 0, failed: 0 };
  }

  let sent = 0, failed = 0;

  for (const user of users) {
    try {
      await sendReminderToUser(user);
      sent++;
      await new Promise((r) => setTimeout(r, 500)); // pace to avoid ESP rate limits
    } catch (err) {
      console.error(`❌ Failed → ${user.email}: ${err.message}`);
      failed++;
    }
  }

  console.log(`✅ Weekly reminders complete — sent: ${sent}, failed: ${failed}`);
  return { sent, failed };
}

module.exports = { sendWeeklyReminders, sendReminderToUser, getUserWeakArea };