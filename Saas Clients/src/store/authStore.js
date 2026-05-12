// =======================================================
// src/store/authStore.js
// FIXED PRODUCTION AUTH STORE (STABLE + /ME SYNC)
// =======================================================

import { create } from "zustand";
import API from "../api/axios";

export const useAuthStore = create((set, get) => ({

  // ===============================
  // STATE
  // ===============================

  user: null,
  token: localStorage.getItem("accessToken") || null,
  loading: true,
  initialized: false,

  // ===============================
  // INIT (BOOTSTRAP SESSION)
  // ===============================

  init: async () => {
    set({ loading: true });

    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        set({
          user: null,
          token: null,
          loading: false,
          initialized: true,
        });
        return;
      }

      // 🔥 IMPORTANT: ALWAYS TRUST BACKEND /me
      const res = await API.get("/auth/me");

      const user = res?.data?.data; // ✅ FIXED (your backend format)

      if (!user) throw new Error("Invalid user response");

      localStorage.setItem("user", JSON.stringify(user));

      set({
        user,
        token,
        loading: false,
        initialized: true,
      });

    } catch (err) {
      console.error("AUTH INIT FAILED:", err);

      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      set({
        user: null,
        token: null,
        loading: false,
        initialized: true,
      });
    }
  },

  // ===============================
  // LOGIN
  // ===============================

  setAuth: ({ user, token }) => {
    if (!token || !user) return;

    localStorage.setItem("accessToken", token);
    localStorage.setItem("user", JSON.stringify(user));

    set({
      user,
      token,
      loading: false,
      initialized: true,
    });
  },

  // ===============================
  // LOGOUT
  // ===============================

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("tenantId");

    set({
      user: null,
      token: null,
      loading: false,
      initialized: true,
    });
  },

  // ===============================
  // UPDATE USER (SYNC SAFE)
  // ===============================

  updateUser: (data) => {
    const current = get().user;
    if (!current) return;

    const updated = { ...current, ...data };

    localStorage.setItem("user", JSON.stringify(updated));

    set({ user: updated });
  },

}));