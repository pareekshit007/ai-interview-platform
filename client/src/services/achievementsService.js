import { api } from "./api";

export const fetchBadges           = ()      => api.get("/achievements/badges").then(r => r.data);
export const fetchLeaderboard      = ()      => api.get("/achievements/leaderboard").then(r => r.data);
export const fetchCertificate      = (ivId)  => api.get(`/achievements/certificate/${ivId}`).then(r => r.data);
export const fetchAchievementStats = ()      => api.get("/achievements/stats").then(r => r.data);