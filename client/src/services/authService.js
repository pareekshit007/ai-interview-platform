import { api } from "./api";

export const registerUser = async ({ name, email, password }) => {
  const data = await api.post("/auth/register", { name, email, password });
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("isAuthenticated", "true");
  return data;
};

export const loginUser = async ({ email, password }) => {
  const data = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("isAuthenticated", "true");
  return data;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("isAuthenticated");
};

export const getMe = () => api.get("/auth/me");