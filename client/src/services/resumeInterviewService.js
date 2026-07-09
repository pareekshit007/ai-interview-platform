import { api } from "./api";

export const startResumeInterview = () =>
  api.post("/resume-interview/start", {});

export const submitResumeInterview = (interviewId, { answers, proctor }) =>
  api.post(`/resume-interview/${interviewId}/submit`, { answers, proctor });