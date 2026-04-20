import API from "./axios";
import { useAuthStore } from "../store/authStore";

/* =========================
   LOGIN
========================= */
export const loginUser = async (data) => {
  const res = await API.post("/auth/login", data);

  const { accessToken, refreshToken, user } = res.data.data;

  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);

  // single source of truth
  useAuthStore.getState().login({ user, accessToken });

  return res.data;
};

/* =========================
   REGISTER
========================= */
export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data);

  const { accessToken, refreshToken, user } = res.data.data;

  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);

  useAuthStore.getState().login({ user, accessToken });

  return res.data;
};

/* =========================
   LOGOUT (CLEAN - NO HARD RELOAD)
========================= */
export const logoutUser = async () => {
  try {
    await API.post("/auth/logout");
  } catch (err) {
    console.warn("Logout API failed, continuing local logout");
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    useAuthStore.getState().logout();

    // ❌ NO window.location.replace()
    // let React handle routing cleanly
  }
};

/* =========================
   LOAD USER (SAFE)
========================= */
export const loadUser = async () => {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      useAuthStore.getState().logout();
      return;
    }

    const res = await API.get("/auth/me");

    useAuthStore.getState().login({
      user: res.data.data,
      accessToken: token,
    });

  } catch (err) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    useAuthStore.getState().logout();
  }
};