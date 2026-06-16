const Interview = require("../models/Interview");

const ROLE_LABELS = {
  frontend:    "Frontend Developer",
  backend:     "Backend Developer",
  fullstack:   "Full Stack Developer",
  devops:      "DevOps Engineer",
  datascience: "Data Scientist",
  hr:          "HR Interview",
  dsa:         "DSA / Coding",
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const getNotifications = async (req, res) => {
  try {
    // Fetch last 10 completed interviews
    const interviews = await Interview.find({ user: req.user._id, completed: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("role difficulty totalScore verdict createdAt");

    const notifications = [];

    interviews.forEach((iv, index) => {
      const roleLabel = ROLE_LABELS[iv.role] || iv.role;
      const time      = timeAgo(iv.createdAt);
      const score     = iv.totalScore;
      const verdict   = iv.verdict;

      // Notification 1 — score result
      const scoreEmoji =
        score >= 85 ? "🏆" :
        score >= 70 ? "✅" :
        score >= 50 ? "📈" : "💪";

      notifications.push({
        id:     `score-${iv._id}`,
        icon:   scoreEmoji,
        text:   `Your ${roleLabel} interview scored ${score}% — ${verdict}`,
        time,
        unread: index < 2,  // latest 2 are unread
        interviewId: iv._id,
        type: "score",
      });

      // Notification 2 — tip based on score (only for recent ones)
      if (index < 3) {
        if (score < 50) {
          notifications.push({
            id:     `tip-${iv._id}`,
            icon:   "📚",
            text:   `Tip: Review ${roleLabel} fundamentals before your next interview`,
            time,
            unread: false,
            type:   "tip",
          });
        } else if (score >= 85) {
          notifications.push({
            id:     `tip-${iv._id}`,
            icon:   "🎯",
            text:   `Great job on ${roleLabel}! Try a harder difficulty next`,
            time,
            unread: false,
            type:   "tip",
          });
        }
      }
    });

    // If no interviews yet, return onboarding notification
    if (!interviews.length) {
      notifications.push({
        id:     "welcome",
        icon:   "👋",
        text:   "Welcome! Start your first AI mock interview from the Roles page",
        time:   "just now",
        unread: true,
        type:   "info",
      });
    }

    res.json(notifications.slice(0, 5));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotifications };