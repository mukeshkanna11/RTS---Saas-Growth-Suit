// =======================================================
// src/api/auth.js
// PRODUCTION STABLE AUTH FLOW (FIXED)
// NO LOGIN LOOP + SAFE /ME SYNC
// =======================================================

import API from "./axios";
import { useAuthStore } from "../store/authStore";

/* ======================================================
   NORMALIZE AUTH RESPONSE
====================================================== */

const normalizeAuth = (data) => {
  return {
    user:
      data?.user ||
      data?.data?.user ||
      null,

    accessToken:
      data?.accessToken ||
      data?.token ||
      data?.data?.accessToken ||
      data?.data?.token ||
      null,

    refreshToken:
      data?.refreshToken ||
      data?.data?.refreshToken ||
      null,
  };
};

/* ======================================================
   SAVE AUTH TO STORE + STORAGE
====================================================== */

const saveAuth = ({ user, accessToken, refreshToken }) => {
  const store = useAuthStore.getState();

  if (!user || !accessToken) {
    throw new Error("Invalid auth data");
  }

  // store token only
  localStorage.setItem("accessToken", accessToken);

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }

  // IMPORTANT: store user in zustand (not source of truth)
  store.setAuth({
    user,
    token: accessToken,
  });

  localStorage.setItem("user", JSON.stringify(user));
};

/* ======================================================
   LOGIN
====================================================== */

export const loginUser = async (payload) => {
  try {
    const res = await API.post("/auth/login", payload);

    console.log("✅ LOGIN RESPONSE:", res.data);

    const normalized = normalizeAuth(res.data);

    if (!normalized.user || !normalized.accessToken) {
      throw new Error("Invalid login response");
    }

    saveAuth(normalized);

    return res;
  } catch (err) {
    console.error("❌ LOGIN API ERROR:", err);
    throw err;
  }
};

/* ======================================================
   REGISTER
====================================================== */

export const registerUser = async (payload) => {
  try {
    const res = await API.post("/auth/register", payload);

    console.log("✅ REGISTER RESPONSE:", res.data);

    const normalized = normalizeAuth(res.data);

    if (normalized.user && normalized.accessToken) {
      saveAuth(normalized);
    }

    return res;
  } catch (err) {
    console.error("❌ REGISTER API ERROR:", err);
    throw err;
  }
};

/* ======================================================
   LOAD USER (FIXED - BACKEND IS SOURCE OF TRUTH)
/* ====================================================== */

export const loadUser = async () => {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      useAuthStore.getState().logout();
      return null;
    }

    // ALWAYS TRUST BACKEND
    const res = await API.get("/auth/me");

    const user = res?.data?.data;

    if (!user) {
      throw new Error("No user from server");
    }

    useAuthStore.getState().setAuth({
      user,
      token,
    });

    localStorage.setItem("user", JSON.stringify(user));

    return user;
  } catch (err) {
    console.error("❌ LOAD USER FAILED:", err);

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    useAuthStore.getState().logout();

    return null;
  }
};

/* ======================================================
   LOGOUT
====================================================== */

export const logoutUser = async () => {
  try {
    try {
      await API.post("/auth/logout");
    } catch {
      console.warn("Logout API skipped");
    }

    useAuthStore.getState().logout();
  } catch (err) {
    console.error("❌ LOGOUT ERROR:", err);
  }
};