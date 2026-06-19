import { api } from "./api";

export const startInterview = ({ role, difficulty, questions }) =>
  api.post("/interview/start", { role, difficulty, questions });

export const submitInterview = (interviewId, answers) =>
  api.post(`/interview/${interviewId}/submit`, { answers });

export const fetchHistory = () =>
  api.get("/interview/history");

export const fetchProgress = () =>
  api.get("/interview/progress");

export const fetchInterview = (interviewId) =>
  api.get(`/interview/${interviewId}`);