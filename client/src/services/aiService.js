import { api } from "./api";

export const fetchQuestions = ({ role, difficulty = "medium", count = 5, resumeContext = null, company = null }) =>
  api.post("/ai/questions", { role, difficulty, count, resumeContext, company });

export const fetchAnswerFeedback = ({ question, transcript, scores }) =>
  api.post("/ai/feedback/answer", { question, transcript, scores });

export const fetchSessionFeedback = ({ role, answers, totalScore }) =>
  api.post("/ai/feedback/session", { role, answers, totalScore });

export const fetchCompanies = () =>
  api.get("/ai/companies");