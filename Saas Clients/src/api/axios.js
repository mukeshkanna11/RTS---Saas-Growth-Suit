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
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* =========================
   RESPONSE INTERCEPTOR (SAAS SAFE)
========================= */
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // 🔥 ONLY HANDLE TOKEN EXPIRY
    if (status === 401 && !original._retry) {
      original._retry = true;

      try {
        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data?.data?.accessToken;

        if (!newToken) throw new Error("No token received");

        localStorage.setItem("accessToken", newToken);

        API.defaults.headers.Authorization = `Bearer ${newToken}`;
        original.headers.Authorization = `Bearer ${newToken}`;

        return API(original);
      } catch (err) {
        // 🔥 SAFE LOGOUT (NO CRASH)
        localStorage.removeItem("accessToken");

        const auth = useAuthStore.getState();
        auth.logout();

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default API;