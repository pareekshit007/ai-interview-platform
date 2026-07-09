const Interview = require("../models/Interview");
const User = require("../models/User");
const { buildResumeContext, generateResumeInterview } = require("../services/resumeInterviewGenerator");
const { generateSessionFeedback } = require("../services/feedbackGenerator");
const { scoreAllAnswers } = require("../services/scoreAnswers");
const { tagTopic } = require("../utils/topicTagger");
const { notify, checkAndNotifyNewBadges } = require("../services/notificationService");

// ── Start a resume-based interview (Technical → HR, no timer) ──
const startResumeInterview = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const hasProfileContext = !!(
      user.summary?.trim() || user.skills?.length || user.experience?.trim() || user.projectsText?.trim()
    );
    if (!user.resumeUrl && !hasProfileContext) {
      return res.status(400).json({
        message: "Please upload your resume or fill in your profile (summary, skills, experience, projects) before starting a resume-based interview.",
      });
    }

    const resumeContext = await buildResumeContext(user);
    const { technical, hr, source } = await generateResumeInterview(resumeContext);

    const questions = [...technical, ...hr];
    const phases = [
      ...technical.map(() => "technical"),
      ...hr.map(() => "hr"),
    ];

    const interview = await Interview.create({
      user: req.user._id,
      role: "resume-based",
      difficulty: "strict",
      interviewType: "resume",
      questions,
      answers: [],
      completed: false,
    });

    res.status(201).json({
      interviewId: interview._id,
      technicalQuestions: technical,
      hrQuestions: hr,
      phases,
      source,
      message: "Resume-based interview generated",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Submit resume-based interview — includes proctoring summary ──
const submitResumeInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (interview.completed) return res.status(400).json({ message: "Already submitted" });

    const { answers, proctor } = req.body;
    if (!answers || !Array.isArray(answers) || !answers.length)
      return res.status(400).json({ message: "answers array is required" });

    const aiScores = await scoreAllAnswers(answers);

    interview.answers = answers.map((a, i) => ({
      ...a,
      score: aiScores[i],
      topic: tagTopic(a.questionText),
      phase: a.phase || null,
    }));
    interview.completed = true;

    const totalScore = Math.round(aiScores.reduce((sum, s) => sum + s, 0) / aiScores.length);
    interview.totalScore = totalScore;
    interview.verdict =
      totalScore >= 85 ? "Excellent" :
      totalScore >= 70 ? "Good" :
      totalScore >= 50 ? "Average" : "Needs Work";

    interview.aiFeedback = await generateSessionFeedback("resume-based", answers, totalScore);

    // ── Proctoring summary — strict: any violation gets flagged for review ──
    const violations = Math.max(0, Number(proctor?.violations) || 0);
    interview.proctor = {
      violations,
      flagged: !!proctor?.flagged || violations >= 3,
      log: Array.isArray(proctor?.log) ? proctor.log.slice(0, 50) : [],
    };

    await interview.save();

    // ── Streak update (same logic as standard interviews) ──
    const user = await User.findById(req.user._id);
    if (user) {
      const today    = new Date();
      const todayKey = today.toDateString();
      const lastKey  = user.lastInterviewDate ? new Date(user.lastInterviewDate).toDateString() : null;
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

    // ── Badge check — only truly NEW badges get a notification ─────────────
    let newlyEarnedBadges = [];
    try {
      const allInterviews = await Interview.find({ user: req.user._id, completed: true }).sort({ createdAt: 1 });
      const freshUser = await User.findById(req.user._id);
      const { newlyEarned } = await checkAndNotifyNewBadges({ user: freshUser, interviews: allInterviews });
      newlyEarnedBadges = newlyEarned.map(b => ({
        id: b.id, name: b.name, icon: b.icon, tier: b.tier, color: b.color,
      }));
    } catch (badgeErr) {
      console.error("Badge check failed:", badgeErr.message);
    }

    // ── Certificate-earned notification (score threshold met) ──────────────
    if (totalScore >= 70) {
      notify({
        userId: req.user._id,
        type: "certificate_earned",
        icon: "🎓",
        title: "Certificate unlocked",
        text: `You scored ${totalScore}% on your resume-based interview — your certificate is ready to download.`,
        link: `/achievements`,
      });
    }

    res.json({
      message: "Resume-based interview submitted",
      interviewId: interview._id,
      totalScore: interview.totalScore,
      verdict: interview.verdict,
      aiFeedback: interview.aiFeedback,
      proctor: interview.proctor,
      newlyEarnedBadges,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { startResumeInterview, submitResumeInterview };