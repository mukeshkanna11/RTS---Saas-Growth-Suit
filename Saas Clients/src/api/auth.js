import API from "./axios";
import { useAuthStore } from "../store/authStore";

/* =========================
   SAFE AUTH NORMALIZER
========================= */
const normalizeAuth = (data) => {
  return {
    user: data?.user || null,
    accessToken: data?.accessToken || data?.token || null,
    refreshToken: data?.refreshToken || null,
  };
};

/* =========================
   SAVE AUTH
========================= */
const setAuth = ({ user, accessToken, refreshToken }) => {
  const store = useAuthStore.getState();

  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
  }

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  store.login({ user, accessToken });
};

/* =========================
   LOGIN
========================= */
export const loginUser = async (data) => {
  const res = await API.post("/auth/login", data);

  console.log("LOGIN RESPONSE:", res.data); // 🔍 debug

  const normalized = normalizeAuth(res.data?.data);

  if (!normalized.accessToken || !normalized.user) {
    throw new Error("Invalid login response");
  }

  setAuth(normalized);

  return res.data;
};

/* =========================
   REGISTER
========================= */
export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data);

  console.log("REGISTER RESPONSE:", res.data); // 🔍 debug

  const normalized = normalizeAuth(res.data?.data);

  if (!normalized.accessToken || !normalized.user) {
    throw new Error("Invalid register response");
  }

  setAuth(normalized);

  return res.data;
};

/* =========================
   LOGOUT
========================= */
export const logoutUser = async () => {
  try {
    await API.post("/auth/logout");
  } catch (err) {
    console.warn("Logout API failed, continuing local logout");
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    useAuthStore.getState().logout();
  }
};

/* =========================
   LOAD USER
========================= */
export const loadUser = async () => {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      useAuthStore.getState().logout();
      return null;
    }

    const res = await API.get("/auth/me");

    const user = res.data?.data;

    if (!user) throw new Error("No user found");

    useAuthStore.getState().login({
      user,
      accessToken: token,
    });

    return user;
  } catch (err) {
    console.error("LOAD USER FAILED:", err.message);

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    useAuthStore.getState().logout();

    return null;
  }
};