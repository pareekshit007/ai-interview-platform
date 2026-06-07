const { generateQuestions } = require("../services/questionGenerator");
const { generateAnswerFeedback, generateSessionFeedback } = require("../services/feedbackGenerator");

const getQuestions = async (req, res) => {
  try {
    const { role = "frontend", difficulty = "medium", count = 5 } = req.body;
    const questions = await generateQuestions(role, difficulty, Number(count));
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAnswerFeedback = async (req, res) => {
  try {
    const { question, transcript, scores } = req.body;
    if (!question || !transcript)
      return res.status(400).json({ message: "question and transcript are required" });
    const feedback = await generateAnswerFeedback(question, transcript, scores || {});
    res.json({ feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSessionFeedback = async (req, res) => {
  try {
    const { role, answers, totalScore } = req.body;
    if (!role || !answers || !Array.isArray(answers))
      return res.status(400).json({ message: "role and answers array are required" });
    const feedback = await generateSessionFeedback(role, answers, totalScore || 0);
    res.json({ feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getQuestions, getAnswerFeedback, getSessionFeedback };