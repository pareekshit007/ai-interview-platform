import { api } from "./api";

const BASE_URL = import.meta.env.VITE_API_URL || "https://ai-interview-platform-rwh2.onrender.com/api";

// createRoom requires auth (host only)
export const createFriendRoom = ({ role, difficulty, company = null, hostIsInterviewer = true }) =>
  api.post("/friend-room/create", { role, difficulty, company, hostIsInterviewer });

// getRoom is public — guests look this up before socket join
export const getFriendRoom = async (code) => {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/friend-room/${code}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Room not found");
  return data;
};

// Register logged-in guest user to the room so their userId is attached
export const joinRoomAsUser = (code) =>
  api.post(`/friend-room/${code}/join`, {});

// Finish the room — saves Interview history for both users
export const finishFriendRoom = (code, candidateAnswers, guestUserId = null) =>
  api.post(`/friend-room/${code}/finish`, { candidateAnswers, guestUserId });