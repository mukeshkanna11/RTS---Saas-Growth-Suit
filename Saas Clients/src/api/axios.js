import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

/* ================= AXIOS INSTANCE ================= */
const API = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  withCredentials: true,
  timeout: 20000,
});

/* ================= TOKEN (SINGLE SOURCE OF TRUTH) ================= */
const getToken = () => {
  try {
    return localStorage.getItem("accessToken");
  } catch (err) {
    return null;
  }
};

/* ================= REQUEST INTERCEPTOR ================= */
API.interceptors.request.use(
  (config) => {
    const token = getToken();

    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["Content-Type"] =
      config.headers["Content-Type"] || "application/json";

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // 🌐 Network error
    if (!error.response) {
      console.error("Network error");
      return Promise.reject(new Error("Server not reachable"));
    }

    const status = error.response.status;

    /* ================= 401 HANDLING ================= */
    if (status === 401) {
      try {
        // clear auth safely
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // optional: try refresh token (future upgrade)
        // const refreshToken = localStorage.getItem("refreshToken");

        // redirect safely (SPA friendly)
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      } catch (err) {
        console.error("Auth cleanup failed", err);
      }
    }

    return Promise.reject(error);
  }
);

export default API;