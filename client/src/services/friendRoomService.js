import { api } from "./api";

const BASE_URL = import.meta.env.VITE_API_URL || "https://ai-interview-platform-rwh2.onrender.com/api";

// createRoom requires auth (host only)
export const createFriendRoom = ({ role, difficulty, company = null, hostIsInterviewer = true }) =>
  api.post("/friend-room/create", { role, difficulty, company, hostIsInterviewer });

// getRoom is public — guests look this up before they've logged in
export const getFriendRoom = async (code) => {
  const res = await fetch(`${BASE_URL}/friend-room/${code}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Room not found");
  return data;
};

export const finishFriendRoom = (code, candidateAnswers) =>
  api.post(`/friend-room/${code}/finish`, { candidateAnswers });