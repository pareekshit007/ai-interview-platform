/**
 * badgeEngine.js
 * Defines all badges and checks which ones a user has earned.
 * Called after every interview submission.
 */

const BADGES = [
  // ── Milestone badges ──────────────────────────────────────────────────
  {
    id: "first_step",
    name: "First Step",
    description: "Complete your very first interview",
    icon: "🎯",
    color: "#00f5a0",
    tier: "bronze",
    check: ({ totalSessions }) => totalSessions >= 1,
  },
  {
    id: "getting_started",
    name: "Getting Started",
    description: "Complete 5 interviews",
    icon: "🚀",
    color: "#3b82f6",
    tier: "bronze",
    check: ({ totalSessions }) => totalSessions >= 5,
  },
  {
    id: "dedicated",
    name: "Dedicated",
    description: "Complete 10 interviews",
    icon: "💪",
    color: "#a78bfa",
    tier: "silver",
    check: ({ totalSessions }) => totalSessions >= 10,
  },
  {
    id: "interview_veteran",
    name: "Interview Veteran",
    description: "Complete 25 interviews",
    icon: "⚔️",
    color: "#f59e0b",
    tier: "gold",
    check: ({ totalSessions }) => totalSessions >= 25,
  },
  {
    id: "interview_legend",
    name: "Interview Legend",
    description: "Complete 50 interviews",
    icon: "👑",
    color: "#ec4899",
    tier: "platinum",
    check: ({ totalSessions }) => totalSessions >= 50,
  },

  // ── Score badges ──────────────────────────────────────────────────────
  {
    id: "passing_grade",
    name: "Passing Grade",
    description: "Score 70% or above in any interview",
    icon: "✅",
    color: "#00f5a0",
    tier: "bronze",
    check: ({ bestScore }) => bestScore >= 70,
  },
  {
    id: "high_achiever",
    name: "High Achiever",
    description: "Score 85% or above in any interview",
    icon: "⭐",
    color: "#f59e0b",
    tier: "silver",
    check: ({ bestScore }) => bestScore >= 85,
  },
  {
    id: "perfect_score",
    name: "Perfect Score",
    description: "Score 95% or above in any interview",
    icon: "💎",
    color: "#ec4899",
    tier: "gold",
    check: ({ bestScore }) => bestScore >= 95,
  },
  {
    id: "consistent",
    name: "Consistently Good",
    description: "Maintain an average score of 75%+ across all sessions",
    icon: "📈",
    color: "#3b82f6",
    tier: "silver",
    check: ({ avgScore, totalSessions }) => avgScore >= 75 && totalSessions >= 3,
  },
  {
    id: "top_performer",
    name: "Top Performer",
    description: "Maintain an average score of 85%+ across 5+ sessions",
    icon: "🏆",
    color: "#f59e0b",
    tier: "gold",
    check: ({ avgScore, totalSessions }) => avgScore >= 85 && totalSessions >= 5,
  },

  // ── Streak badges ─────────────────────────────────────────────────────
  {
    id: "on_a_roll",
    name: "On a Roll",
    description: "Maintain a 3-day practice streak",
    icon: "🔥",
    color: "#f97316",
    tier: "bronze",
    check: ({ longestStreak }) => longestStreak >= 3,
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Maintain a 7-day practice streak",
    icon: "⚡",
    color: "#f59e0b",
    tier: "silver",
    check: ({ longestStreak }) => longestStreak >= 7,
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Maintain a 14-day practice streak",
    icon: "🌟",
    color: "#ec4899",
    tier: "gold",
    check: ({ longestStreak }) => longestStreak >= 14,
  },

  // ── Role diversity badges ─────────────────────────────────────────────
  {
    id: "explorer",
    name: "Explorer",
    description: "Practice interviews in 3 different roles",
    icon: "🗺️",
    color: "#00f5a0",
    tier: "silver",
    check: ({ uniqueRoles }) => uniqueRoles >= 3,
  },
  {
    id: "versatile",
    name: "Versatile",
    description: "Practice interviews in 5 different roles",
    icon: "🎭",
    color: "#a78bfa",
    tier: "gold",
    check: ({ uniqueRoles }) => uniqueRoles >= 5,
  },

  // ── Special badges ────────────────────────────────────────────────────
  {
    id: "comeback_kid",
    name: "Comeback Kid",
    description: "Improve your score by 20+ points between two consecutive sessions",
    icon: "📈",
    color: "#00f5a0",
    tier: "silver",
    check: ({ maxImprovement }) => maxImprovement >= 20,
  },
  {
    id: "profile_complete",
    name: "Profile Pro",
    description: "Fill in all profile sections including resume and skills",
    icon: "🪪",
    color: "#3b82f6",
    tier: "bronze",
    check: ({ profileComplete }) => profileComplete,
  },
];

/**
 * Compute user stats from their interview history + user doc
 * Returns the stats object used to evaluate badge criteria
 */
function computeStats(interviews, user) {
  if (!interviews.length) {
    return {
      totalSessions: 0, avgScore: 0, bestScore: 0,
      longestStreak: user.longestStreak || 0,
      uniqueRoles: 0, maxImprovement: 0,
      profileComplete: false,
    };
  }

  const totalSessions = interviews.length;
  const avgScore = Math.round(interviews.reduce((s, i) => s + i.totalScore, 0) / totalSessions);
  const bestScore = Math.max(...interviews.map(i => i.totalScore));

  const uniqueRoles = new Set(interviews.map(i => i.role)).size;

  // Max score improvement between consecutive sessions
  let maxImprovement = 0;
  for (let i = 1; i < interviews.length; i++) {
    const diff = interviews[i].totalScore - interviews[i - 1].totalScore;
    if (diff > maxImprovement) maxImprovement = diff;
  }

  const profileComplete = !!(
    user.name && user.summary?.trim() && user.skills?.length > 0 &&
    user.experience?.trim() && user.resumeUrl
  );

  return {
    totalSessions, avgScore, bestScore,
    longestStreak: user.longestStreak || 0,
    uniqueRoles, maxImprovement, profileComplete,
  };
}

/**
 * Returns array of earned badge IDs for this user
 */
function getEarnedBadgeIds(interviews, user) {
  const stats = computeStats(interviews, user);
  return BADGES.filter(b => b.check(stats)).map(b => b.id);
}

/**
 * Returns full badge objects (earned + locked) with earned flag
 */
function getAllBadgesWithStatus(interviews, user) {
  const stats = computeStats(interviews, user);
  return BADGES.map(b => ({
    ...b,
    check: undefined,           // don't expose fn to client
    earned: b.check(stats),
  }));
}

module.exports = { BADGES, computeStats, getEarnedBadgeIds, getAllBadgesWithStatus };