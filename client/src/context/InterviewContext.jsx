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
  const [currentCompany,    setCurrentCompany]    = useState(null);
  const [questionsSource,   setQuestionsSource]   = useState(null); // "ai" | "fallback" | null

  const startInterviewSession = async (role, difficulty = "medium", company = null) => {
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
    setCurrentCompany(company);
    setQuestionsSource(null);
    setLoading(true);

    try {
      const { questions: qs, source } = await fetchQuestions({ role, difficulty, count: 5, company });
      const { interviewId: id }       = await startInterview({ role, difficulty, questions: qs, company });
      setQuestions(qs);
      setQuestionsSource(source || "ai");
      setInterviewId(id);
      return true; // ✅ FIX: signal success so InterviewSetup can navigate
    } catch (err) {
      setError(err.message || "Failed to start interview");
      return false; // ✅ FIX: signal failure so InterviewSetup does NOT navigate
    } finally {
      setLoading(false);
    }
  };

  const startInterview_legacy = (role) => startInterviewSession(role);

  // Retake — reuse the same questions, just reset progress
  const retakeSession = async () => {
    if (!questions.length) return;
    const prevQuestions   = [...questions];
    const prevRole        = currentRole;
    const prevDifficulty  = currentDifficulty;
    const prevCompany     = currentCompany;

    // Reset progress only, keep questions
    setCurrentIndex(0);
    setAnswers([]);
    setScores([]);
    setFinished(false);
    setSessionFeedback("");
    setInterviewId(null);
    setError("");
    setLoading(true);

    try {
      const { interviewId: id } = await startInterview({
        role: prevRole, difficulty: prevDifficulty, questions: prevQuestions, company: prevCompany,
      });
      setQuestions(prevQuestions);
      setInterviewId(id);
    } catch (err) {
      setError(err.message || "Failed to retake interview");
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = (transcript, scoreOverride, analysisOverride) => {
    // Use the already-computed analysis from the caller if provided,
    // otherwise analyze here. This prevents double-analysis and stale-transcript bugs.
    const analysis = analysisOverride || analyzeAnswer(transcript);
    const score    = (scoreOverride != null) ? scoreOverride : analysis.score;
    const answerEntry = {
      questionIndex: currentIndex,
      questionText:  questions[currentIndex],
      transcript,
      score,
      confidence: analysisOverride?.confidence ?? analysis.confidence,
      clarity:    analysisOverride?.clarity    ?? analysis.clarity,
      sentiment:  analysisOverride?.sentiment  ?? analysis.sentiment,
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

  // ✅ FIX: compute real avg metrics from the actual per-answer numeric values
  const avgMetric = (key) => answers.length
    ? Math.round(answers.reduce((s, a) => s + (Number(a[key]) || 0), 0) / answers.length)
    : 0;

  const results = {
    totalScore, interviewId,
    role: currentRole, difficulty: currentDifficulty, company: currentCompany,
    confidence:    avgMetric("confidence"),
    sentiment:     avgMetric("sentiment"),
    clarity:       avgMetric("clarity"),
    communication: avgMetric("confidence"), // same source as confidence
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
      loading, error, interviewId, results, questionsSource,
      startInterview: startInterview_legacy,
      startInterviewSession, retakeSession, nextQuestion, finishInterview,
    }}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => useContext(InterviewContext);