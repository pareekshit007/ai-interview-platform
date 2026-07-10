import { api } from "./api";

// Real platform counts — user count, completed interviews, questions answered.
export const getPublicStats = () => api.get("/stats");