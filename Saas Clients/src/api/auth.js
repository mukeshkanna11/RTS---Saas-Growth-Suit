import API from "./axios";
import { useAuthStore } from "../store/authStore";

/* =========================
   SAVE AUTH (central helper)
========================= */
const setAuth = ({ user, accessToken, refreshToken }) => {
  const store = useAuthStore.getState();

  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
  }

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }

  store.login({ user, accessToken });
};

/* =========================
   LOGIN
========================= */
export const loginUser = async (data) => {
  const res = await API.post("/auth/login", data);

  const { accessToken, refreshToken, user } = res.data?.data || {};

  if (!accessToken || !user) {
    throw new Error("Invalid login response");
  }

  setAuth({ user, accessToken, refreshToken });

  return res.data;
};

/* =========================
   REGISTER
========================= */
export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data);

  const { accessToken, refreshToken, user } = res.data?.data || {};

  if (!accessToken || !user) {
    throw new Error("Invalid register response");
  }

  setAuth({ user, accessToken, refreshToken });

  return res.data;
};

/* =========================
   LOGOUT (SAFE + CLEAN)
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
  }
};

/* =========================
   LOAD USER (BOOT AUTH)
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

    useAuthStore.getState().logout();

    return null;
  }
};