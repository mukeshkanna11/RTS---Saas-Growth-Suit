import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  // ======================================================
  // STATE
  // ======================================================

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const isSubmitting = useRef(false);

  // ======================================================
  // STORE
  // ======================================================

  const login = useAuthStore((s) => s.login);

  const navigate = useNavigate();

  // ======================================================
  // INPUT CHANGE
  // ======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ======================================================
  // LOGIN
  // ======================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading || isSubmitting.current) return;

    isSubmitting.current = true;

    setLoading(true);

    setError("");

    try {
      // ==================================================
      // API REQUEST
      // ==================================================

      const response = await loginUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      // ==================================================
      // SAFE RESPONSE
      // ==================================================

      const data =
        response?.data?.data ||
        response?.data ||
        {};

      const user = data?.user;

      const accessToken =
        data?.accessToken ||
        data?.token;

      // ==================================================
      // VALIDATION
      // ==================================================

      if (!user || !accessToken) {
        throw new Error(
          "Invalid authentication response"
        );
      }

      if (!user?.tenantId) {
        throw new Error(
          "Tenant information missing"
        );
      }

      // ==================================================
      // STORE TOKEN
      // IMPORTANT FIX
      // ==================================================

      localStorage.setItem(
        "accessToken",
        accessToken
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      // OPTIONAL
      localStorage.setItem(
        "tenantId",
        user.tenantId
      );

      // ==================================================
      // ZUSTAND STORE
      // ==================================================

      login({
        user,
        accessToken,
      });

      // ==================================================
      // REDIRECT
      // ==================================================

      const roleRoute =
        user.role === "admin"
          ? "/admin"
          : user.role === "manager"
          ? "/manager"
          : "/employee";

      navigate(roleRoute, {
        replace: true,
      });
    } catch (err) {
      console.error(
        "❌ LOGIN ERROR:",
        err
      );

      // ================================================
      // API ERROR
      // ================================================

      const apiMessage =
        err?.response?.data?.message;

      // ================================================
      // RATE LIMIT
      // ================================================

      if (err?.response?.status === 429) {
        setError(
          "Too many login attempts. Please wait and try again."
        );
      }

      // ================================================
      // UNAUTHORIZED
      // ================================================

      else if (
        err?.response?.status === 401
      ) {
        setError(
          apiMessage ||
            "Invalid email or password"
        );
      }

      // ================================================
      // SERVER ERROR
      // ================================================

      else if (
        err?.response?.status >= 500
      ) {
        setError(
          "Server error. Please try again later."
        );
      }

      // ================================================
      // NETWORK ERROR
      // ================================================

      else if (err?.request) {
        setError(
          "Unable to connect to server."
        );
      }

      // ================================================
      // DEFAULT
      // ================================================

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

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#020617] px-4">

      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[140px]" />

        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[140px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      </div>

      {/* CARD */}
      <motion.div
        initial={{
          opacity: 0,
          y: 30,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.45,
        }}
        className="relative z-10 w-full max-w-md overflow-hidden border shadow-2xl bg-white/[0.04] backdrop-blur-3xl border-white/10 rounded-3xl"
      >

        {/* TOP BAR */}
        <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />

        <div className="p-8">

          {/* LOGO */}
          <div className="flex justify-center mb-6">

            <div className="relative">

              <div className="absolute inset-0 rounded-2xl bg-cyan-500/30 blur-xl" />

              <div className="relative flex items-center justify-center w-20 h-20 text-2xl font-black text-white shadow-2xl rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700">

                RTS

              </div>

            </div>

          </div>

          {/* HEADER */}
          <div className="mb-8 text-center">

            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-medium border rounded-full text-cyan-300 bg-cyan-500/10 border-cyan-500/20">

              <Building2 size={14} />

              Enterprise Multi-Tenant SaaS

            </div>

            <h1 className="text-3xl font-black tracking-tight text-white">

              Welcome Back

            </h1>

            <p className="mt-3 text-sm leading-relaxed text-slate-400">

              Securely access your organization workspace,
              CRM system, analytics, and automation suite.

            </p>

          </div>

          {/* ERROR */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3 px-4 py-3 mb-6 text-sm text-red-300 border bg-red-500/10 border-red-500/20 rounded-2xl"
            >

              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>

            </motion.div>
          )}

          {/* FORM */}
          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* EMAIL */}
            <div>

              <label className="block mb-2 text-sm font-medium text-slate-300">

                Email Address

              </label>

              <div className="flex items-center gap-3 px-4 transition-all duration-300 border h-14 rounded-2xl bg-slate-900/80 border-slate-700 focus-within:border-cyan-500">

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
                  className="w-full text-white bg-transparent outline-none placeholder:text-slate-500"
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div>

              <label className="block mb-2 text-sm font-medium text-slate-300">

                Password

              </label>

              <div className="flex items-center gap-3 px-4 transition-all duration-300 border h-14 rounded-2xl bg-slate-900/80 border-slate-700 focus-within:border-cyan-500">

                <Lock
                  size={18}
                  className="text-purple-400"
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
                  className="w-full text-white bg-transparent outline-none placeholder:text-slate-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="text-slate-400 hover:text-white"
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
                className="font-medium text-cyan-400 hover:text-cyan-300"
              >

                Forgot password?

              </button>

            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full gap-2 h-14 font-semibold text-black transition-all duration-300 shadow-xl rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
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

          {/* FOOTER */}
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
                className="font-semibold text-cyan-400 hover:text-cyan-300"
              >

                Create Account

              </button>

            </p>

          </div>

        </div>

      </motion.div>

    </div>
  );
}