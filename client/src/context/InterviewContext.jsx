import { createContext, useContext, useState } from "react";
import { fetchQuestions } from "../services/aiService";
import { startInterview, submitInterview } from "../services/interviewService";
import { analyzeAnswer } from "../utils/analyzeAnswer";

const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
  const [questions,         setQuestions]         = useState([]);
  const [currentIndex,      setCurrentIndex]      = useState(0);
  const [answers,           setAnswers]           = useState([]);
  const [scores,            setScores]            = useState([]);
  const [finished,          setFinished]          = useState(false);
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState("");
  const [interviewId,       setInterviewId]       = useState(null);
  const [sessionFeedback,   setSessionFeedback]   = useState("");
  const [currentRole,       setCurrentRole]       = useState("");
  const [currentDifficulty, setCurrentDifficulty] = useState("medium");

  const startInterviewSession = async (role, difficulty = "medium") => {
    // ✅ Reset everything immediately — before any API call
    // This prevents stale currentIndex from a previous session
    setCurrentIndex(0);
    setAnswers([]);
    setScores([]);
    setFinished(false);
    setSessionFeedback("");
    setQuestions([]);
    setInterviewId(null);
    setError("");
    setCurrentRole(role);
    setCurrentDifficulty(difficulty);
    setLoading(true);

    try {
      const { questions: qs }     = await fetchQuestions({ role, difficulty, count: 5 });
      const { interviewId: id }   = await startInterview({ role, difficulty, questions: qs });
      setQuestions(qs);
      setInterviewId(id);
    } catch (err) {
      setError(err.message || "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  const startInterview_legacy = (role) => startInterviewSession(role);

  const nextQuestion = (transcript, scoreOverride) => {
    const analysis = analyzeAnswer(transcript);
    const score    = scoreOverride ?? analysis.score;
    const answerEntry = {
      questionIndex: currentIndex,
      questionText:  questions[currentIndex],
      transcript,
      score,
      confidence: analysis.confidence,
      clarity:    analysis.clarity,
      sentiment:  analysis.sentiment,
    };
    setAnswers((prev) => [...prev, answerEntry]);
    setScores((prev)  => [...prev, score]);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const finishInterview = async (allAnswers) => {
    if (!interviewId) return null;
    try {
      const result = await submitInterview(interviewId, allAnswers || answers);
      setSessionFeedback(result.aiFeedback);
      return result;
    } catch (err) {
      console.error("Submit failed:", err.message);
      return null;
    }
  };

  const totalScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const results = {
    totalScore, interviewId,
    role: currentRole, difficulty: currentDifficulty,
    confidence:    totalScore,
    sentiment:     Math.max(totalScore - 10, 0),
    clarity:       Math.max(totalScore - 5,  0),
    communication: Math.max(totalScore - 8,  0),
    verdict:
      totalScore >= 85 ? "Excellent"
      : totalScore >= 70 ? "Good"
      : totalScore >= 50 ? "Average"
      : "Needs Work",
    questionScores: scores.map((s, i) => ({
      question:   questions[i] || `Question ${i + 1}`,
      transcript: answers[i]?.transcript || "",
      score: s,
      confidence: answers[i]?.confidence || s,
      clarity:    answers[i]?.clarity    || Math.max(s - 5, 0),
      sentiment:  answers[i]?.sentiment  || Math.max(s - 10, 0),
    })),
    sessionFeedback,
  };

  return (
    <InterviewContext.Provider value={{
      questions, currentIndex, answers, scores, finished,
      loading, error, interviewId, results,
      startInterview: startInterview_legacy,
      startInterviewSession, nextQuestion, finishInterview,
    }}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => useContext(InterviewContext);