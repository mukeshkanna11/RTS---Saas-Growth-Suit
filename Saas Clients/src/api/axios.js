// ===============================
// src/api/axios.js
// FULL UPDATED / PERMANENT FIX
// ===============================

import axios from "axios";
import { useAuthStore } from "../store/authStore";

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

/* =========================
   REQUEST INTERCEPTOR
========================= */
API.interceptors.request.use(
  (config) => {
    const rawToken =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("readytech_token");

    const token = rawToken?.replace(/\"/g, "");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   RESPONSE INTERCEPTOR
========================= */
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshRes = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshRes.data?.data?.accessToken;

        if (!newToken) throw new Error("Refresh token failed");

        localStorage.setItem("accessToken", newToken);

        original.headers.Authorization = `Bearer ${newToken}`;

        return API(original);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");

        const auth = useAuthStore.getState();
        auth.logout();

        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;