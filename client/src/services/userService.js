import { api } from "./api";

export const getProfile = () => api.get("/user/profile");

export const updateProfile = (data) => api.put("/user/profile", data);

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("resume", file);

  const token = localStorage.getItem("token");
const BASE_URL = import.meta.env.VITE_API_URL;
const res = await fetch(
  `${BASE_URL}/upload/resume`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Upload failed");
  return data;
};