const Interview = require("../models/Interview");
const User = require("../models/User");
const { generateSessionFeedback } = require("../services/feedbackGenerator");
const { tagTopic } = require("../utils/topicTagger");

const startInterview = async (req, res) => {
  try {
    const { role, difficulty = "medium", questions } = req.body;
    if (!role || !questions || !questions.length)
      return res.status(400).json({ message: "role and questions are required" });

    const interview = await Interview.create({
      user: req.user._id, role, difficulty, questions, answers: [], completed: false,
    });
    res.status(201).json({ interviewId: interview._id, message: "Interview started" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (interview.completed) return res.status(400).json({ message: "Already submitted" });

    const { answers } = req.body;
    interview.answers = answers.map((a) => ({
      ...a,
      topic: tagTopic(a.questionText),
    }));
    interview.completed = true;

    const totalScore = Math.round(
      answers.reduce((sum, a) => sum + (a.score || 0), 0) / answers.length
    );
    interview.totalScore = totalScore; // ← was missing, so totalScore was always undefined in response

    const verdict =
      totalScore >= 85 ? "Excellent" :
      totalScore >= 70 ? "Good" :
      totalScore >= 50 ? "Average" : "Needs Work";
    interview.verdict = verdict; // ← was missing too

    interview.aiFeedback = await generateSessionFeedback(interview.role, answers, totalScore);
    await interview.save();

    // ── Update streak ──
    const user = await User.findById(req.user._id);
    if (user) {
      const today = new Date();
      const todayKey = today.toDateString();
      const lastKey = user.lastInterviewDate ? new Date(user.lastInterviewDate).toDateString() : null;

      if (lastKey !== todayKey) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = lastKey === yesterday.toDateString();

        user.currentStreak = wasYesterday ? user.currentStreak + 1 : 1;
        user.longestStreak = Math.max(user.longestStreak || 0, user.currentStreak);
        user.lastInterviewDate = today;
        await user.save();
      }
    }

    res.json({
      message:    "Interview submitted",
      totalScore: interview.totalScore,
      verdict:    interview.verdict,
      aiFeedback: interview.aiFeedback,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select("role difficulty totalScore verdict completed createdAt");
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProgress = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id, completed: true })
      .sort({ createdAt: 1 }); // oldest → newest, good for trend charts

    const user = await User.findById(req.user._id).select("currentStreak longestStreak lastInterviewDate");

    if (!interviews.length) {
      return res.json({
        scoreTrend: [],
        roleBreakdown: [],
        weakTopics: [],
        avgResponseTime: 0,
        totalSessions: 0,
        avgScore: 0,
        bestScore: 0,
        currentStreak: user?.currentStreak || 0,
        longestStreak: user?.longestStreak || 0,
      });
    }

    // ── Score trend (last 20 sessions) ──
    const scoreTrend = interviews.slice(-20).map((iv) => ({
      date: iv.createdAt,
      score: iv.totalScore,
      role: iv.role,
    }));

    // ── Role breakdown ──
    const roleMap = {};
    interviews.forEach((iv) => {
      if (!roleMap[iv.role]) roleMap[iv.role] = { role: iv.role, count: 0, totalScore: 0 };
      roleMap[iv.role].count += 1;
      roleMap[iv.role].totalScore += iv.totalScore;
    });
    const roleBreakdown = Object.values(roleMap).map((r) => ({
      role: r.role,
      count: r.count,
      avgScore: Math.round(r.totalScore / r.count),
    }));

    // ── Weak topic analysis ──
    const topicMap = {};
    interviews.forEach((iv) => {
      (iv.answers || []).forEach((a) => {
        const topic = a.topic || "General";
        if (!topicMap[topic]) topicMap[topic] = { topic, count: 0, totalScore: 0 };
        topicMap[topic].count += 1;
        topicMap[topic].totalScore += a.score || 0;
      });
    });
    const weakTopics = Object.values(topicMap)
      .map((t) => ({ topic: t.topic, avgScore: Math.round(t.totalScore / t.count), count: t.count }))
      .filter((t) => t.count >= 2) // need at least 2 data points to call it a pattern
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 5);

    // ── Average response confidence as a proxy for "response time / readiness" ──
    let confidenceSum = 0, confidenceCount = 0;
    interviews.forEach((iv) => {
      (iv.answers || []).forEach((a) => {
        if (typeof a.confidence === "number") { confidenceSum += a.confidence; confidenceCount += 1; }
      });
    });
    const avgConfidence = confidenceCount ? Math.round(confidenceSum / confidenceCount) : 0;

    const avgScore = Math.round(interviews.reduce((s, iv) => s + iv.totalScore, 0) / interviews.length);
    const bestScore = Math.max(...interviews.map((iv) => iv.totalScore));

    res.json({
      scoreTrend,
      roleBreakdown,
      weakTopics,
      avgConfidence,
      totalSessions: interviews.length,
      avgScore,
      bestScore,
      currentStreak: user?.currentStreak || 0,
      longestStreak: user?.longestStreak || 0,
      lastInterviewDate: user?.lastInterviewDate || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { startInterview, submitInterview, getHistory, getInterview, getProgress };