const Notification = require("../models/Notification");
const { getAllBadgesWithStatus } = require("./badgeEngine");

/**
 * Creates a persisted notification. Never throws — a failed notification
 * should never break the request that triggered it (password reset,
 * profile save, etc. all succeed regardless of whether this write works).
 */
async function notify({ userId, type, icon = "🔔", title, text = "", link = null }) {
  try {
    return await Notification.create({ user: userId, type, icon, title, text, link });
  } catch (err) {
    console.error("[notificationService] notify() failed:", err.message);
    return null;
  }
}

/**
 * Compares the user's full earned-badge set against `user.notifiedBadgeIds`
 * (badges already notified about) and creates a notification + updates that
 * list only for badges earned for the first time. Safe to call after every
 * interview submission — already-earned badges are never re-notified.
 *
 * Returns { allEarned, newlyEarned } where `allEarned` is every badge the
 * user currently qualifies for (used by the results-page celebration UI)
 * and `newlyEarned` is the subset that just crossed the line.
 */
async function checkAndNotifyNewBadges({ user, interviews }) {
  const allBadges = getAllBadgesWithStatus(interviews, user);
  const allEarned = allBadges.filter((b) => b.earned);

  const alreadyNotified = new Set(user.notifiedBadgeIds || []);
  const newlyEarned = allEarned.filter((b) => !alreadyNotified.has(b.id));

  if (newlyEarned.length) {
    for (const badge of newlyEarned) {
      await notify({
        userId: user._id,
        type: "badge_earned",
        icon: badge.icon,
        title: `New badge unlocked: ${badge.name}`,
        text: badge.description,
        link: "/achievements",
      });
    }
    user.notifiedBadgeIds = [...alreadyNotified, ...newlyEarned.map((b) => b.id)];
    await user.save();
  }

  return { allEarned, newlyEarned };
}

module.exports = { notify, checkAndNotifyNewBadges };