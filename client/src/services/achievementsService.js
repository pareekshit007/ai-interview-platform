import { api } from "./api";

export const fetchBadges           = ()     => api.get("/achievements/badges");
export const fetchLeaderboard      = ()     => api.get("/achievements/leaderboard");
export const fetchCertificate      = (ivId) => api.get(`/achievements/certificate/${ivId}`);
export const fetchAchievementStats = ()     => api.get("/achievements/stats");