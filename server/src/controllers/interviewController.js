const Interview = require("../models/Interview");
const { generateSessionFeedback } = require("../services/feedbackGenerator");

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
    interview.answers = answers;
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

module.exports = { startInterview, submitInterview, getHistory, getInterview };