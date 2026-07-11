const transporter = require("../config/mailer");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple, readable email templates — no external template engine needed.
const buildInboxHTML = ({ name, email, subject, message }) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
    <h2 style="color:#0d7a5f;">📬 New contact form message</h2>
    <p><strong>From:</strong> ${name} (${email})</p>
    <p><strong>Subject:</strong> ${subject || "(no subject)"}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
    <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
    <p style="color:#94a3b8; font-size: 13px;">Reply directly to this email to respond to ${name}.</p>
  </div>
`;

const buildConfirmationHTML = ({ name }) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
    <h2 style="color:#0d7a5f;">Thanks for reaching out, ${name}! 👋</h2>
    <p style="line-height: 1.6;">
      We've received your message and our team will get back to you within 24 hours.
    </p>
    <p style="color:#94a3b8; font-size: 13px;">— The AI Interview Platform team</p>
  </div>
`;

// Public — anyone can submit the contact form. Sends the message to our
// inbox (EMAIL_USER) with reply-to set to the sender, and fires an
// auto-confirmation back to the sender.
const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !name.trim())       return res.status(400).json({ message: "Please enter your name." });
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ message: "Please enter a valid email address." });
    if (!message || !message.trim()) return res.status(400).json({ message: "Please enter a message." });
    if (message.length > 5000)       return res.status(400).json({ message: "Message is too long." });

    const cleanName    = name.trim().slice(0, 100);
    const cleanSubject = (subject || "").trim().slice(0, 150);
    const cleanMessage = message.trim().slice(0, 5000);

    const info = await transporter.sendMail({
      from: `"AI Interview Platform Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `📬 Contact form: ${cleanSubject || "New message from " + cleanName}`,
      html: buildInboxHTML({ name: cleanName, email, subject: cleanSubject, message: cleanMessage }),
    });

    // 2) Auto-confirmation back to the sender (best-effort — don't fail the
    // request if this one bounces, the important email above already sent)
    try {
      await transporter.sendMail({
        from: `"AI Interview Platform" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "We've received your message ✅",
        html: buildConfirmationHTML({ name: cleanName }),
      });
    } catch (confirmErr) {
      console.error("Contact confirmation email failed (non-fatal):", confirmErr.message);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Contact form submission failed:", error.message);
    res.status(500).json({ message: "Something went wrong sending your message — please try again shortly." });
  }
};

module.exports = { submitContactForm };