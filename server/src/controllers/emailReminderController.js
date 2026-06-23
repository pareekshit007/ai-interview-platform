const User = require("../models/User");
const { sendWeeklyReminders, sendReminderToUser } = require("../services/emailReminderService");

// GET /api/reminders/preference
const getReminderPreference = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("emailReminders");
    res.json({ emailReminders: user?.emailReminders ?? false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/reminders/preference   body: { enabled: true|false }
const setReminderPreference = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean")
      return res.status(400).json({ message: '"enabled" must be a boolean' });

    await User.findByIdAndUpdate(req.user._id, { emailReminders: enabled });

    res.json({
      message: enabled
        ? "Weekly practice reminders enabled! You'll hear from us every Monday. 🎯"
        : "Email reminders disabled. You can re-enable them any time.",
      emailReminders: enabled,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/reminders/test-me  — send yourself a preview email right now
const sendTestReminder = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("name email");
    if (!user) return res.status(404).json({ message: "User not found" });
    await sendReminderToUser(user);
    res.json({ message: `Test reminder sent to ${user.email} ✅` });
  } catch (err) {
    console.error("Test reminder failed:", err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/reminders/trigger  — admin: fire whole batch immediately
const triggerBatch = async (req, res) => {
  try {
    if (req.user?.email !== process.env.ADMIN_EMAIL)
      return res.status(403).json({ message: "Admin only" });

    res.json({ message: "Batch started — check server logs for progress." });
    sendWeeklyReminders().catch(console.error);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getReminderPreference, setReminderPreference, sendTestReminder, triggerBatch };