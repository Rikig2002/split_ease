import axios from "axios";

const isLocalDevelopment = typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

const baseURL = import.meta.env.VITE_API_BASE_URL || (isLocalDevelopment ? "http://localhost:5000/api" : `${window.location.origin}/api`);

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
