import { api } from "./api.js";

/**
 * GET /api/leaderboard  →  { success, count, data: [...] }
 */
export const getGlobalLeaderboard = async () => {
  const res = await api.get("/leaderboard");
  return res.data ?? res;          // handle both axios and custom wrappers
};

/**
 * GET /api/leaderboard/topic/:topic
 */
export const getTopicLeaderboard = async (topic) => {
  const res = await api.get(`/leaderboard/topic/${encodeURIComponent(topic)}`);
  return res.data ?? res;
};

/**
 * GET /api/leaderboard/my-rank  →  { myRank, totalParticipants, me, nearby }
 */
export const getMyRank = async () => {
  const res = await api.get("/leaderboard/my-rank");
  return res.data ?? res;
};