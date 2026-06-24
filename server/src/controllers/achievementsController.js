/**
 * achievementsController.js
 * Handles:
 *   GET /api/achievements/badges         — current user's badges
 *   GET /api/achievements/leaderboard    — top 20 users globally
 *   GET /api/achievements/certificate/:interviewId — certificate data for one session
 *   GET /api/achievements/stats          — summary stats for current user
 */

const Interview = require("../models/Interview");
const User = require("../models/User");
const { getAllBadgesWithStatus } = require("../services/badgeEngine");

// ── GET /api/achievements/badges ─────────────────────────────────────────────
const getBadges = async (req, res) => {
  try {
    const [interviews, user] = await Promise.all([
      Interview.find({ user: req.user._id, completed: true }).sort({ createdAt: 1 }),
      User.findById(req.user._id),
    ]);

    const badges = getAllBadgesWithStatus(interviews, user);
    const earned = badges.filter(b => b.earned).length;

    res.json({ badges, earned, total: badges.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/achievements/leaderboard ────────────────────────────────────────
const getLeaderboard = async (req, res) => {
  try {
    // Aggregate top users by avg score (min 3 completed interviews to qualify)
    const leaders = await Interview.aggregate([
      { $match: { completed: true } },
      {
        $group: {
          _id: "$user",
          totalSessions: { $sum: 1 },
          avgScore:      { $avg: "$totalScore" },
          bestScore:     { $max: "$totalScore" },
          lastSession:   { $max: "$createdAt" },
          roles:         { $addToSet: "$role" },
        },
      },
      { $match: { totalSessions: { $gte: 1 } } },
      { $sort: { avgScore: -1, totalSessions: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      { $unwind: "$userDoc" },
      {
        $project: {
          _id: 1,
          name:          "$userDoc.name",
          profilePic:    "$userDoc.profilePic",
          college:       "$userDoc.college",
          degree:        "$userDoc.degree",
          longestStreak: "$userDoc.longestStreak",
          totalSessions: 1,
          avgScore:      { $round: ["$avgScore", 0] },
          bestScore:     1,
          lastSession:   1,
          uniqueRoles:   { $size: "$roles" },
        },
      },
    ]);

    // Add rank and isCurrentUser flag
    const currentUserId = req.user._id.toString();
    const ranked = leaders.map((l, i) => ({
      ...l,
      rank: i + 1,
      isCurrentUser: l._id.toString() === currentUserId,
    }));

    // If current user isn't in top 20, fetch their rank separately
    let currentUserEntry = ranked.find(l => l.isCurrentUser) || null;

    if (!currentUserEntry) {
      const allLeaders = await Interview.aggregate([
        { $match: { completed: true } },
        { $group: { _id: "$user", avgScore: { $avg: "$totalScore" }, totalSessions: { $sum: 1 } } },
        { $match: { totalSessions: { $gte: 1 } } },
        { $sort: { avgScore: -1, totalSessions: -1 } },
      ]);
      const myRankIdx = allLeaders.findIndex(l => l._id.toString() === currentUserId);

      if (myRankIdx !== -1) {
        const me = await User.findById(req.user._id).select("name profilePic college degree longestStreak");
        const myData = allLeaders[myRankIdx];
        currentUserEntry = {
          _id: currentUserId,
          rank: myRankIdx + 1,
          name: me.name,
          profilePic: me.profilePic,
          college: me.college,
          degree: me.degree,
          longestStreak: me.longestStreak,
          avgScore: Math.round(myData.avgScore),
          totalSessions: myData.totalSessions,
          isCurrentUser: true,
          outsideTop20: true,
        };
      }
    }

    res.json({ leaderboard: ranked, currentUserEntry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/achievements/certificate/:interviewId ───────────────────────────
const getCertificate = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.interviewId,
      user: req.user._id,
      completed: true,
    });
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (interview.totalScore < 70)
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
        score:          interview.totalScore,
        verdict:        interview.verdict,
        completedAt:    interview.updatedAt,
        interviewId:    interview._id,
        certificateId:  `ACEPREP-${interview._id.toString().slice(-8).toUpperCase()}`,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/achievements/stats ───────────────────────────────────────────────
const getAchievementStats = async (req, res) => {
  try {
    const [interviews, user] = await Promise.all([
      Interview.find({ user: req.user._id, completed: true }).sort({ createdAt: 1 }),
      User.findById(req.user._id).select("longestStreak currentStreak name"),
    ]);

    const totalSessions = interviews.length;
    const avgScore = totalSessions
      ? Math.round(interviews.reduce((s, i) => s + i.totalScore, 0) / totalSessions)
      : 0;
    const bestScore = totalSessions ? Math.max(...interviews.map(i => i.totalScore)) : 0;
    const uniqueRoles = new Set(interviews.map(i => i.role)).size;
    const certificatesEarned = interviews.filter(i => i.totalScore >= 70).length;

    const { getAllBadgesWithStatus } = require("../services/badgeEngine");
    const badges = getAllBadgesWithStatus(interviews, user);
    const badgesEarned = badges.filter(b => b.earned).length;

    res.json({
      totalSessions, avgScore, bestScore, uniqueRoles,
      certificatesEarned, badgesEarned,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getBadges, getLeaderboard, getCertificate, getAchievementStats };