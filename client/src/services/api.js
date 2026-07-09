const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  console.error(
    "❌ VITE_API_URL is not set. Create client/.env (local) or set the env var in your hosting dashboard (Vercel)."
  );
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (res.status === 401) {
    // Session dead — clean up and redirect
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error(data.message || "Session expired");
  }
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

export const api = {
  get: (path) =>
    fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    }).then(handleResponse),

  post: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(body),
    }).then(handleResponse),

  put: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(body),
    }).then(handleResponse),

  patch: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse),
};