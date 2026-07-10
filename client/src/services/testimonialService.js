import { api } from "./api";

export const getTestimonials    = (limit = 6) => api.get(`/testimonials?limit=${limit}`);
export const getMyTestimonial   = () => api.get("/testimonials/mine");
export const submitTestimonial  = (quote, rating) => api.post("/testimonials", { quote, rating });