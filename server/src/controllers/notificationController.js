const Interview = require("../models/Interview");
const Notification = require("../models/Notification");

const ROLE_LABELS = {
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  fullstack: "Full Stack Developer",
  devops: "DevOps Engineer",
  datascience: "Data Scientist",
  hr: "HR Interview",
  dsa: "DSA / Coding",
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

/**
 * Builds the "derived" notifications computed on-the-fly from completed
 * interviews (score results + tips + welcome). These have synthetic ids
 * (e.g. "score-<id>") and are never persisted/marked read individually.
 */
const buildDerivedNotifications = async (userId, limit) => {
  const interviews = await Interview.find({ user: userId, completed: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("role difficulty totalScore verdict createdAt");

  const notifications = [];

  interviews.forEach((iv, index) => {
    const roleLabel = ROLE_LABELS[iv.role] || iv.role;
    const time = timeAgo(iv.createdAt);
    const score = iv.totalScore;
    const verdict = iv.verdict;

    const scoreEmoji =
      score >= 85 ? "🏆" :
        score >= 70 ? "✅" :
          score >= 50 ? "📈" : "💪";

    notifications.push({
      id: `score-${iv._id}`,
      icon: scoreEmoji,
      text: `Your ${roleLabel} interview scored ${score}% — ${verdict}`,
      time,
      unread: index < 2,  // latest 2 are unread
      interviewId: iv._id,
      type: "score",
      _ts: new Date(iv.createdAt).getTime(),
    });

    if (index < 3) {
      if (score < 50) {
        notifications.push({
          id: `tip-${iv._id}`,
          icon: "📚",
          text: `Tip: Review ${roleLabel} fundamentals before your next interview`,
          time,
          unread: false,
          type: "tip",
          _ts: new Date(iv.createdAt).getTime() - 1, // keep just after the score notif
        });
      } else if (score >= 85) {
        notifications.push({
          id: `tip-${iv._id}`,
          icon: "🎯",
          text: `Great job on ${roleLabel}! Try a harder difficulty next`,
          time,
          unread: false,
          type: "tip",
          _ts: new Date(iv.createdAt).getTime() - 1,
        });
      }
    }
  });

  if (!interviews.length) {
    notifications.push({
      id: "welcome",
      icon: "👋",
      text: "Welcome! Start your first AI mock interview from the Roles page",
      time: "just now",
      unread: true,
      type: "info",
      _ts: Date.now(),
    });
  }

  return notifications;
};

/**
 * Builds the "persisted" notifications from the Notification collection —
 * real events like password changes, badges, certificates, profile updates.
 * These carry a real Mongo id so they can be individually marked read.
 */
const buildPersistedNotifications = async (userId, limit) => {
  const docs = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);

  return docs.map((doc) => ({
    id: doc._id.toString(),
    icon: doc.icon,
    text: doc.text ? `${doc.title} — ${doc.text}` : doc.title,
    time: timeAgo(doc.createdAt),
    unread: !doc.read,
    link: doc.link || null,
    type: doc.type,
    _ts: new Date(doc.createdAt).getTime(),
  }));
};

const getNotifications = async (req, res) => {
  try {
    const showAll = req.query.all === "true" || req.query.all === "1";
    const derivedLimit = showAll ? 50 : 10;
    const persistedLimit = showAll ? 50 : 10;

    const [derived, persisted] = await Promise.all([
      buildDerivedNotifications(req.user._id, derivedLimit),
      buildPersistedNotifications(req.user._id, persistedLimit),
    ]);

    const merged = [...derived, ...persisted]
      .sort((a, b) => b._ts - a._ts)
      .map(({ _ts, ...rest }) => rest);

    res.json(showAll ? merged : merged.slice(0, 5));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotifications, markNotificationRead, markAllNotificationsRead };