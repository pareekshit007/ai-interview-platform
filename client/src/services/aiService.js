import { api } from "./api";

export const fetchQuestions = ({ role, difficulty = "medium", count = 5, resumeContext = null }) =>
  api.post("/ai/questions", { role, difficulty, count, resumeContext });

export const fetchAnswerFeedback = ({ question, transcript, scores }) =>
  api.post("/ai/feedback/answer", { question, transcript, scores });

export const fetchSessionFeedback = ({ role, answers, totalScore }) =>
  api.post("/ai/feedback/session", { role, answers, totalScore });