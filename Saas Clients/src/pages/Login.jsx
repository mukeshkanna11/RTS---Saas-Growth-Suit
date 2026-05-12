// =======================================================
// src/pages/Login.jsx
// PRODUCTION READY ENTERPRISE LOGIN
// RESPONSIVE + NO OVERFLOW + CLEAN ALIGNMENT
// =======================================================

import { useRef, useState } from "react";

import {
  useNavigate,
} from "react-router-dom";

import { motion } from "framer-motion";

import {
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react";

import { loginUser } from "../api/auth";

import { useAuthStore } from "../store/authStore";

export default function Login() {
  // =====================================================
  // STATE
  // =====================================================

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const isSubmitting = useRef(false);

  // =====================================================
  // STORE
  // =====================================================

  const setAuth = useAuthStore(
    (s) => s.setAuth
  );

  const navigate = useNavigate();

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } =
      e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // HANDLE LOGIN
  // =====================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    if (
      loading ||
      isSubmitting.current
    ) {
      return;
    }

    isSubmitting.current = true;

    setLoading(true);

    setError("");

    try {
      // ===============================================
      // LOGIN API
      // ===============================================

      const response =
        await loginUser({
          email: form.email
            .trim()
            .toLowerCase(),

          password: form.password,
        });

      // ===============================================
      // SAFE RESPONSE
      // ===============================================

      const data =
        response?.data?.data ||
        response?.data ||
        {};

      const user = data?.user;

      const accessToken =
        data?.accessToken ||
        data?.token;

      // ===============================================
      // VALIDATION
      // ===============================================

      if (!user) {
        throw new Error(
          "User data missing"
        );
      }

      if (!accessToken) {
        throw new Error(
          "Access token missing"
        );
      }

      if (!user?.role) {
        throw new Error(
          "User role missing"
        );
      }

      // ===============================================
      // UPDATE AUTH STORE
      // ===============================================

      setAuth({
        user,
        token: accessToken,
      });

      // ===============================================
      // ROLE REDIRECT
      // ===============================================

      let roleRoute = "/employee";

      if (user.role === "admin") {
        roleRoute = "/admin";
      }

      if (user.role === "manager") {
        roleRoute = "/manager";
      }

      // SMALL DELAY FOR STATE UPDATE

      setTimeout(() => {
        navigate(roleRoute, {
          replace: true,
        });
      }, 120);

    } catch (err) {
      console.error(
        "❌ LOGIN ERROR:",
        err
      );

      const apiMessage =
        err?.response?.data?.message;

      // ===============================================
      // ERROR HANDLING
      // ===============================================

      if (
        err?.response?.status === 429
      ) {
        setError(
          "Too many attempts. Please wait and try again."
        );
      }

      else if (
        err?.response?.status === 401
      ) {
        setError(
          apiMessage ||
            "Invalid credentials"
        );
      }

      else if (
        err?.response?.status === 403
      ) {
        setError(
          apiMessage ||
            "Access denied"
        );
      }

      else if (
        err?.response?.status >= 500
      ) {
        setError(
          "Server error. Please try again later."
        );
      }

      else if (err?.request) {
        setError(
          "Unable to connect to server."
        );
      }

      else {
        setError(
          apiMessage ||
            err.message ||
            "Login failed"
        );
      }

    } finally {
      setLoading(false);

      setTimeout(() => {
        isSubmitting.current = false;
      }, 800);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617]">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute top-0 left-0 w-[450px] h-[450px] bg-cyan-500/10 blur-[120px]" />

        <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-blue-600/10 blur-[120px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:38px_38px]" />

      </div>

      {/* =================================================
          CONTAINER
      ================================================= */}

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-10">

        {/* =================================================
            CARD
        ================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.4,
          }}
          className="w-full max-w-md overflow-hidden border shadow-2xl bg-white/[0.05] backdrop-blur-2xl border-white/10 rounded-3xl"
        >

          {/* TOP BAR */}

          <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600" />

          {/* CONTENT */}

          <div className="p-6 sm:p-8">

            {/* =============================================
                LOGO
            ============================================= */}

            <div className="flex justify-center">

              <div className="relative">

                <div className="absolute inset-0 rounded-2xl bg-cyan-500/30 blur-xl" />

                <div className="relative flex items-center justify-center w-20 h-20 text-2xl font-black text-white shadow-2xl rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700">

                  RTS

                </div>

              </div>

            </div>

            {/* =============================================
                HEADER
            ============================================= */}

            <div className="mt-6 text-center">

              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-medium border rounded-full text-cyan-300 bg-cyan-500/10 border-cyan-500/20">

                <Building2 size={14} />

                Enterprise CRM Platform

              </div>

              <h1 className="text-3xl font-black tracking-tight text-white">

                Welcome Back

              </h1>

              <p className="mt-3 text-sm leading-relaxed text-slate-400">

                Securely access your
                CRM, analytics, leads,
                automation, and business
                management dashboard.

              </p>

            </div>

            {/* =============================================
                ERROR
            ============================================= */}

            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                className="flex gap-3 px-4 py-3 mt-6 text-sm text-red-300 border bg-red-500/10 border-red-500/20 rounded-2xl"
              >

                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>

              </motion.div>
            )}

            {/* =============================================
                FORM
            ============================================= */}

            <form
              onSubmit={handleLogin}
              className="mt-6 space-y-5"
            >

              {/* EMAIL */}

              <div>

                <label className="block mb-2 text-sm font-medium text-slate-300">

                  Email Address

                </label>

                <div className="flex items-center gap-3 px-4 transition border h-14 rounded-2xl bg-slate-900/70 border-slate-700 focus-within:border-cyan-500">

                  <Mail
                    size={18}
                    className="text-cyan-400"
                  />

                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    placeholder="you@company.com"
                    onChange={handleChange}
                    className="w-full text-sm text-white bg-transparent outline-none placeholder:text-slate-500"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div>

                <label className="block mb-2 text-sm font-medium text-slate-300">

                  Password

                </label>

                <div className="flex items-center gap-3 px-4 transition border h-14 rounded-2xl bg-slate-900/70 border-slate-700 focus-within:border-cyan-500">

                  <Lock
                    size={18}
                    className="text-indigo-400"
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    required
                    autoComplete="current-password"
                    value={form.password}
                    placeholder="Enter password"
                    onChange={handleChange}
                    className="w-full text-sm text-white bg-transparent outline-none placeholder:text-slate-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="transition text-slate-400 hover:text-white"
                  >

                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>

              </div>

              {/* OPTIONS */}

              <div className="flex items-center justify-between text-sm">

                <label className="flex items-center gap-2 cursor-pointer text-slate-400">

                  <input
                    type="checkbox"
                    className="accent-cyan-500"
                  />

                  Remember me

                </label>

                <button
                  type="button"
                  className="font-medium transition text-cyan-400 hover:text-cyan-300"
                >

                  Forgot Password?

                </button>

              </div>

              {/* BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center w-full gap-2 h-14 font-semibold text-white transition-all duration-300 shadow-xl rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />

                    Secure Login
                  </>
                )}

              </button>

            </form>

            {/* =============================================
                FOOTER
            ============================================= */}

            <div className="pt-6 mt-8 border-t border-white/10">

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">

                <ShieldCheck
                  size={14}
                  className="text-green-400"
                />

                Enterprise-grade encrypted authentication

              </div>

              <p className="mt-5 text-sm text-center text-slate-400">

                Don’t have an account?{" "}

                <button
                  onClick={() =>
                    navigate("/register")
                  }
                  className="font-semibold transition text-cyan-400 hover:text-cyan-300"
                >

                  Create Account

                </button>

              </p>

            </div>

          </div>

        </motion.div>

      </div>

    </div>
  );
}