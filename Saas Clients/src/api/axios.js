// =======================================================
// src/api/axios.js
// ENTERPRISE SAAS AXIOS CLIENT
// FULLY OPTIMIZED + CORS SAFE
// =======================================================

import axios from "axios";

// =======================================================
// ENV
// =======================================================
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://rts-saas-growth-suit-1.onrender.com";

// =======================================================
// AXIOS INSTANCE
// =======================================================
const API = axios.create({
  baseURL: `${BASE_URL}/api/v1`,

  // JWT auth only
  withCredentials: false,

  // safer timeout
  timeout: 30000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// =======================================================
// TOKEN HELPERS
// =======================================================
const getAccessToken = () => {
  try {
    return localStorage.getItem("accessToken");
  } catch (error) {
    console.error("❌ Access token read failed:", error);
    return null;
  }
};

const clearAuthData = () => {
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  } catch (error) {
    console.error("❌ Auth cleanup failed:", error);
  }
};

// =======================================================
// REQUEST INTERCEPTOR
// =======================================================
API.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    // ensure headers exists
    config.headers = config.headers || {};

    // ===================================================
    // AUTHORIZATION
    // ===================================================
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ===================================================
    // REMOVE PROBLEMATIC HEADERS
    // ===================================================
    delete config.headers["x-request-time"];

    return config;
  },

  (error) => {
    console.error("❌ Request Error:", error);

    return Promise.reject({
      success: false,
      message: "Request failed before reaching server.",
    });
  }
);

// =======================================================
// RESPONSE INTERCEPTOR
// =======================================================
API.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    // ===================================================
    // NETWORK / CORS / BACKEND DOWN
    // ===================================================
    if (!error.response) {
      console.error("🌐 Network / CORS Error:", error);

      return Promise.reject({
        success: false,
        message:
          "Unable to connect to server. Backend may be down or blocked by CORS.",
      });
    }

    const status = error.response.status;

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Something went wrong";

    console.error(`❌ API ERROR [${status}] →`, message);

    // ===================================================
    // UNAUTHORIZED
    // ===================================================
    if (status === 401) {
      clearAuthData();

      const currentPath = window.location.pathname;

      // avoid redirect loop
      if (currentPath !== "/login" && currentPath !== "/") {
        window.location.href = "/login";
      }
    }

    // ===================================================
    // FORBIDDEN
    // ===================================================
    if (status === 403) {
      console.error("⛔ Access Denied");
    }

    // ===================================================
    // VALIDATION ERROR
    // ===================================================
    if (status === 422) {
      console.error("⚠️ Validation Error");
    }

    // ===================================================
    // SERVER ERROR
    // ===================================================
    if (status >= 500) {
      console.error("🔥 Internal Server Error");
    }

    return Promise.reject({
      success: false,
      status,
      message,
      data: error.response?.data || null,
    });
  }
);

// =======================================================
// API HELPERS
// =======================================================

export const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem("accessToken", token);
    }
  } catch (error) {
    console.error("❌ Failed to save token:", error);
  }
};

export const logoutUser = () => {
  clearAuthData();
  window.location.href = "/login";
};

// =======================================================
// HEALTH CHECK
// =======================================================
export const checkBackendHealth = async () => {
  try {
    const response = await API.get("/health");

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: "Backend unreachable",
    };
  }
};

// =======================================================
// EXPORT
// =======================================================
export default API;