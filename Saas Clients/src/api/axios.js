import axios from "axios";
import { useAuthStore } from "../store/authStore";

/* ================= ENV ================= */
const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  throw new Error("❌ VITE_API_URL is not defined");
}

/* ================= AXIOS INSTANCE ================= */
const API = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  withCredentials: true,
  timeout: 20000,
});

/* ================= TOKEN HELPER ================= */
const getToken = () => {
  try {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("readytech_token");

    return token ? token.replace(/"/g, "") : null;
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

    /* 🌐 NETWORK ERROR */
    if (!error.response) {
      console.error("🌐 Network Error - Backend not reachable");
      return Promise.reject(
        new Error("Server is not reachable. Check backend or URL.")
      );
    }

    const status = error.response.status;

    /* 🔐 TOKEN EXPIRED → REFRESH */
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data?.data?.accessToken;

        if (!newToken) {
          throw new Error("Refresh token failed");
        }

        localStorage.setItem("accessToken", newToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return API(originalRequest);
      } catch (refreshError) {
        console.error("🔐 Refresh token failed");

        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem("readytech_token");

        const auth = useAuthStore.getState();
        auth?.logout?.();

        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;