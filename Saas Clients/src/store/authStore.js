import { create } from "zustand";

/* -------------------------------
   SAFE STORAGE
-------------------------------- */
const getStoredUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user && user !== "undefined" ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const getStoredToken = () => localStorage.getItem("accessToken");

/* -------------------------------
   AUTH STORE
-------------------------------- */
export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  loading: false,

  /* INIT */
  init: () => {
    set({
      user: getStoredUser(),
      token: getStoredToken(),
      loading: false,
    });
  },

  /* LOGIN */
  login: ({ user, accessToken }) => {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }

    set({
      user,
      token: accessToken,
      loading: false,
    });
  },

  /* LOGOUT */
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    set({
      user: null,
      token: null,
      loading: false,
    });
  },
}));