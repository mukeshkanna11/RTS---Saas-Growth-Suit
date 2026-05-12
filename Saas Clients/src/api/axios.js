// =======================================================
// src/api/axios.js
// PRODUCTION SAFE + DEBUG IMPROVED AXIOS
// =======================================================

import axios from "axios";

// =======================================================
// BASE URL
// =======================================================

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://rts-saas-growth-suit-1.onrender.com";

const API = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// =======================================================
// TOKEN HANDLER
// =======================================================

const getToken = () => {
  try {
    return localStorage.getItem("accessToken");
  } catch (err) {
    return null;
  }
};

// =======================================================
// REQUEST INTERCEPTOR
// =======================================================

API.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("❌ REQUEST ERROR:", error);
    return Promise.reject(error);
  }
);

// =======================================================
// RESPONSE INTERCEPTOR (IMPROVED)
// =======================================================

API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // ===============================
    // CASE 1: NO RESPONSE FROM SERVER
    // ===============================
    if (!error.response) {
      console.error("🔥 NETWORK ERROR (No Response from Server)");
      console.error("Check backend URL / internet / CORS");

      return Promise.reject({
        success: false,
        status: 0,
        message: "Network Error: Server not reachable",
        data: null,
      });
    }

    // ===============================
    // CASE 2: SERVER RESPONDED
    // ===============================
    const status = error.response.status;
    const message =
      error.response.data?.message ||
      error.message ||
      "API Error";

    console.error(`❌ API ERROR [${status}]`, message);

    // ===============================
    // AUTO LOGOUT (ONLY IF TOKEN INVALID)
    // ===============================
    if (status === 401) {
      const token = localStorage.getItem("accessToken");

      if (token) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject({
      success: false,
      status,
      message,
      data: error.response.data || null,
    });
  }
);

export default API;