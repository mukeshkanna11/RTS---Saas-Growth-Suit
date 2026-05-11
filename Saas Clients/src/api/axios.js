// =======================================================
// src/api/axios.js
// ENTERPRISE SAAS AXIOS CLIENT
// FINAL PRODUCTION VERSION
// =======================================================

import axios from "axios";

// =======================================================
// BASE URL
// =======================================================

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://rts-saas-growth-suit-1.onrender.com";

// =======================================================
// AXIOS INSTANCE
// =======================================================

const API = axios.create({
  baseURL: `${BASE_URL}/api/v1`,

  // IMPORTANT FOR COOKIES + MOBILE AUTH
  withCredentials: true,

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
    console.error("❌ Token Read Error:", error);

    return null;
  }
};

const clearAuthData = () => {
  try {
    localStorage.removeItem("accessToken");

    localStorage.removeItem("refreshToken");

    localStorage.removeItem("user");
  } catch (error) {
    console.error("❌ Auth Cleanup Error:", error);
  }
};

// =======================================================
// REQUEST INTERCEPTOR
// =======================================================

API.interceptors.request.use(
  (config) => {
    try {
      const token = getAccessToken();

      config.headers = config.headers || {};

      // ================================================
      // AUTH TOKEN
      // ================================================

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // ================================================
      // REMOVE PROBLEMATIC HEADERS
      // ================================================

      delete config.headers["x-request-time"];

      return config;
    } catch (error) {
      console.error("❌ REQUEST INTERCEPTOR ERROR:", error);

      return config;
    }
  },

  (error) => {
    console.error("❌ REQUEST ERROR:", error);

    return Promise.reject(error);
  }
);

// =======================================================
// RESPONSE INTERCEPTOR
// =======================================================

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    // ================================================
    // NETWORK / CORS / SERVER DOWN
    // ================================================

    if (!error.response) {
      console.error("🌐 NETWORK ERROR:", error);

      return Promise.reject({
        success: false,
        message:
          "Unable to connect to server. Please try again later.",
      });
    }

    const status = error.response.status;

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Something went wrong";

    console.error(`❌ API ERROR [${status}]`, message);

    // ================================================
    // UNAUTHORIZED
    // ================================================

    if (status === 401) {
      clearAuthData();

      const currentPath = window.location.pathname;

      // avoid redirect loop
      if (
        currentPath !== "/login" &&
        currentPath !== "/"
      ) {
        window.location.href = "/login";
      }
    }

    // ================================================
    // FORBIDDEN
    // ================================================

    if (status === 403) {
      console.error("⛔ ACCESS DENIED");
    }

    // ================================================
    // VALIDATION ERROR
    // ================================================

    if (status === 422) {
      console.error("⚠️ VALIDATION ERROR");
    }

    // ================================================
    // SERVER ERROR
    // ================================================

    if (status >= 500) {
      console.error("🔥 SERVER ERROR");
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
// AUTH HELPERS
// =======================================================

export const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem("accessToken", token);
    }
  } catch (error) {
    console.error("❌ SAVE TOKEN ERROR:", error);
  }
};

export const logoutUser = () => {
  clearAuthData();

  window.location.href = "/login";
};

// =======================================================
// BACKEND HEALTH CHECK
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