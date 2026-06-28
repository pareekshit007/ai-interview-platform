const Interview = require("../models/Interview");
const User = require("../models/User");
const mongoose = require("mongoose");
const { getAllBadgesWithStatus } = require("../services/badgeEngine");

/* ─────────────────────────────────────────────────────────────────────────────
   CRITICAL FIX: The original controller queried { completed: true } (boolean).
   Many interview flows store completion as { status: "completed" } (string).
   This helper builds a query that matches BOTH so no interviews are missed.
   ───────────────────────────────────────────────────────────────────────────── */
function completedQuery(extra = {}) {
  return {
    $or: [
      { completed: true },
      { status: "completed" },
    ],
    ...extra,
  };
}

// ── GET /api/achievements/badges ──────────────────────────────────────────────
const getBadges = async (req, res) => {
  try {
    const [interviews, user] = await Promise.all([
      Interview.find(completedQuery({ user: req.user._id })).sort({ createdAt: 1 }),
      User.findById(req.user._id),
    ]);

    console.log(`[getBadges] user=${req.user._id} found ${interviews.length} completed interviews`);

    const badges  = getAllBadgesWithStatus(interviews, user);
    const earned  = badges.filter(b => b.earned).length;
    res.json({ badges, earned, total: badges.length });
  } catch (err) {
    console.error("[getBadges] error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/achievements/leaderboard ─────────────────────────────────────────
const getLeaderboard = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    const interviews = await Interview.find(completedQuery())
      .select("user totalScore overallScore score verdict role createdAt")
      .lean();

    console.log(`[getLeaderboard] total completed interviews: ${interviews.length}`);

    if (interviews.length === 0) {
      return res.json({ leaderboard: [], currentUserEntry: null, total: 0 });
    }

    // resolve whichever field holds the numeric score
    const getScore = (iv) =>
      typeof iv.totalScore   === "number" ? iv.totalScore   :
      typeof iv.overallScore === "number" ? iv.overallScore :
      typeof iv.score        === "number" ? iv.score        : 0;

    // group by user in JS to avoid any ObjectId/string mismatch
    const grouped = {};
    for (const iv of interviews) {
      const uid = iv.user?.toString();
      if (!uid) continue;
      if (!grouped[uid]) {
        grouped[uid] = {
          uid,
          scores:      [],
          sessions:    0,
          roles:       new Set(),
          excellent:   0,
          good:        0,
          lastSession: null,
        };
      }
      const g = grouped[uid];
      const s = getScore(iv);
      g.scores.push(s);
      g.sessions++;
      g.roles.add(iv.role);
      if (iv.verdict === "Excellent") g.excellent++;
      if (iv.verdict === "Good")      g.good++;
      if (!g.lastSession || new Date(iv.createdAt) > new Date(g.lastSession))
        g.lastSession = iv.createdAt;
    }

    const userIds = Object.keys(grouped);
    const users   = await User.find({ _id: { $in: userIds } })
      .select("name profilePic college degree longestStreak currentStreak")
      .lean();

    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const merged = userIds.map(uid => {
      const g = grouped[uid];
      const u = userMap[uid];
      if (!u) return null;

      const avgScore      = g.scores.length ? Math.round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length) : 0;
      const bestScore     = g.scores.length ? Math.max(...g.scores) : 0;
      const totalSessions = g.sessions;
      const currentStreak = u.currentStreak || 0;
      const longestStreak = u.longestStreak || 0;

      const rankScore =
        avgScore      * 0.5  +
        bestScore     * 0.2  +
        totalSessions * 2.0  +
        currentStreak * 0.3  +
        g.excellent   * 3.0  +
        g.good        * 1.5;

      return {
        _id: uid,
        name:          u.name,
        profilePic:    u.profilePic  || "",
        college:       u.college     || "",
        degree:        u.degree      || "",
        longestStreak,
        currentStreak,
        totalSessions,
        avgScore,
        bestScore,
        lastSession:   g.lastSession,
        uniqueRoles:   g.roles.size,
        rankScore,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.rankScore - a.rankScore);

    const ranked = merged.map((u, i) => ({
      ...u,
      rank:          i + 1,
      isCurrentUser: u._id.toString() === currentUserId,
      badge:         getBadge(i + 1),
    }));

    const top50            = ranked.slice(0, 50);
    const totalUsers       = ranked.length;
    let   currentUserEntry = ranked.find(u => u._id.toString() === currentUserId) || null;

    if (currentUserEntry && currentUserEntry.rank > 50) {
      currentUserEntry = { ...currentUserEntry, outsideTop50: true };
    }

    res.json({ leaderboard: top50, currentUserEntry, total: totalUsers });
  } catch (err) {
    console.error("[getLeaderboard] error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/achievements/certificate/:interviewId ────────────────────────────
const getCertificate = async (req, res) => {
  try {
    // find the interview — accept either completion flag
    const interview = await Interview.findOne({
      _id:  req.params.interviewId,
      user: req.user._id,
      $or:  [{ completed: true }, { status: "completed" }],
    });

    if (!interview)
      return res.status(404).json({ message: "Interview not found" });

    // resolve score field
    const score =
      typeof interview.totalScore   === "number" ? interview.totalScore   :
      typeof interview.overallScore === "number" ? interview.overallScore :
      typeof interview.score        === "number" ? interview.score        : 0;

    if (score < 70)
      return res.status(403).json({ message: "Score must be 70%+ to earn a certificate" });

    const user = await User.findById(req.user._id).select("name email college degree");

    res.json({
      certificate: {
        recipientName:  user.name,
        recipientEmail: user.email,
        college:        user.college || "",
        degree:         user.degree  || "",
        role:           interview.role,
        difficulty:     interview.difficulty,
        score,
        verdict:        interview.verdict,
        completedAt:    interview.updatedAt,
        interviewId:    interview._id,
        certificateId:  `ACEPREP-${interview._id.toString().slice(-8).toUpperCase()}`,
      },
    });
  } catch (err) {
    console.error("[getCertificate] error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/achievements/stats ───────────────────────────────────────────────
const getAchievementStats = async (req, res) => {
  try {
    const [interviews, user] = await Promise.all([
      Interview.find(completedQuery({ user: req.user._id })).sort({ createdAt: 1 }),
      User.findById(req.user._id).select("longestStreak currentStreak name"),
    ]);

    console.log(`[getAchievementStats] user=${req.user._id} found ${interviews.length} completed interviews`);

    const getScore = (iv) =>
      typeof iv.totalScore   === "number" ? iv.totalScore   :
      typeof iv.overallScore === "number" ? iv.overallScore :
      typeof iv.score        === "number" ? iv.score        : 0;

    const totalSessions      = interviews.length;
    const scores             = interviews.map(getScore);
    const avgScore           = totalSessions ? Math.round(scores.reduce((a, b) => a + b, 0) / totalSessions) : 0;
    const bestScore          = totalSessions ? Math.max(...scores) : 0;
    const uniqueRoles        = new Set(interviews.map(i => i.role)).size;
    const certificatesEarned = interviews.filter(i => getScore(i) >= 70).length;

    const badges       = getAllBadgesWithStatus(interviews, user);
    const badgesEarned = badges.filter(b => b.earned).length;

    res.json({
      totalSessions,
      avgScore,
      bestScore,
      uniqueRoles,
      certificatesEarned,
      badgesEarned,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
    });
  } catch (err) {
    console.error("[getAchievementStats] error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── rank badge helper ─────────────────────────────────────────────────────────
const getBadge = (rank) => {
  if (rank === 1) return { label: "🥇 Champion",    color: "#FFD700" };
  if (rank === 2) return { label: "🥈 Runner Up",   color: "#C0C0C0" };
  if (rank === 3) return { label: "🥉 Third Place", color: "#CD7F32" };
  if (rank <= 10) return { label: "🏆 Top 10",      color: "#00e5ff" };
  if (rank <= 25) return { label: "⭐ Top 25",      color: "#a78bfa" };
  if (rank <= 50) return { label: "🔥 Top 50",      color: "#f59e0b" };
  return null;
};

module.exports = { getBadges, getLeaderboard, getCertificate, getAchievementStats };