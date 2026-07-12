import { api } from "./api";

export const getNotifications = () => api.get("/notifications");

// Fetches the full notification history (not just the top 5 preview) for
// the "View all" modal.
export const getAllNotifications = () => api.get("/notifications?all=true");

export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);

export const markAllNotificationsRead = () => api.patch("/notifications/read-all");