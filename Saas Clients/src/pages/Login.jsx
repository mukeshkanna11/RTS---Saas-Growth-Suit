// =======================================================
// src/pages/Login.jsx
// READYTECH SOLUTIONS
// COMPACT PREMIUM ENTERPRISE LOGIN
// CLEAN • MODERN • SAAS LEVEL UI
// =======================================================

import { useRef, useState } from "react";

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
  Cpu,
  BarChart3,
  Database,
  Globe,
  Sparkles,
  CheckCircle2,
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
  // FEATURES
  // =====================================================

  const features = [
    {
      icon: Cpu,
      title: "AI Automation",
    },
    {
      icon: BarChart3,
      title: "Analytics",
    },
    {
      icon: Database,
      title: "CRM System",
    },
    {
      icon: Globe,
      title: "Cloud Platform",
    },
  ];

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

      const response =
        await loginUser({
          email: form.email
            .trim()
            .toLowerCase(),

          password: form.password,
        });

      const data =
        response?.data?.data ||
        response?.data ||
        {};

      const user = data?.user;

      const accessToken =
        data?.accessToken ||
        data?.token;

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

      setAuth({
  user,
  token: accessToken,
});

localStorage.setItem("token", accessToken);
localStorage.setItem("user", JSON.stringify(user));

     let roleRoute = "/employee";

switch (user.role) {
  case "admin":
    roleRoute = "/admin";
    break;

  case "manager":
    roleRoute = "/manager";
    break;

  case "client":
    roleRoute = "/client";
    break;

  case "employee":
  default:
    roleRoute = "/employee";
}

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
        err?.response?.data
          ?.message;

      if (
        err?.response?.status ===
        429
      ) {
        setError(
          "Too many attempts. Please wait."
        );
      }

      else if (
        err?.response?.status ===
        401
      ) {
        setError(
          apiMessage ||
            "Invalid credentials"
        );
      }

      else if (
        err?.response?.status >=
        500
      ) {
        setError(
          "Server error. Try again later."
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
        isSubmitting.current =
          false;
      }, 700);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712]">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute top-[-120px] left-[-120px] h-[300px] w-[300px] rounded-full bg-cyan-500/15 blur-[100px]" />

        <div className="absolute bottom-[-100px] right-[-100px] h-[280px] w-[280px] rounded-full bg-indigo-600/15 blur-[100px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:34px_34px]" />

      </div>

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-6">

        <motion.div
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
          }}
          className="grid w-full max-w-5xl overflow-hidden border shadow-2xl lg:grid-cols-2 rounded-3xl border-white/10 bg-white/[0.04] backdrop-blur-2xl"
        >

          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <div className="relative hidden lg:flex">

            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-indigo-700/10" />

            <div className="relative z-10 flex flex-col justify-between w-full p-8">

              {/* TOP */}

              <div>

                <div className="inline-flex items-center gap-3">

                  <div className="flex items-center justify-center w-12 h-12 text-sm font-black text-white shadow-lg rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-cyan-500/20">

                    RTS

                  </div>

                  <div>

                    <h2 className="text-base font-bold text-white">

                      ReadyTech Solutions

                    </h2>

                    <p className="text-xs text-slate-400">

                      Enterprise SaaS Platform

                    </p>

                  </div>

                </div>

                <div className="mt-10">

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-medium">

                    <Sparkles size={12} />

                    Smart Business Infrastructure

                  </div>

                  <h1 className="max-w-sm mt-5 text-3xl font-black leading-tight tracking-tight text-white">

                    Secure Enterprise
                    Workspace Platform

                  </h1>

                  <p className="max-w-md mt-4 text-sm leading-7 text-slate-400">

                    Manage CRM, analytics,
                    automation, employee
                    systems, and operations
                    through one secure
                    intelligent platform.

                  </p>

                </div>

              </div>

              {/* FEATURES */}

              <div className="grid grid-cols-2 gap-3 mt-8">

                {features.map(
                  (
                    item,
                    index
                  ) => {
                    const Icon =
                      item.icon;

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-2xl bg-white/[0.03] border-white/10"
                      >

                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10">

                          <Icon
                            size={18}
                            className="text-cyan-300"
                          />

                        </div>

                        <div>

                          <p className="text-sm font-semibold text-white">

                            {item.title}

                          </p>

                          <p className="text-[11px] mt-0.5 text-slate-500">

                            Enterprise Ready

                          </p>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          </div>

          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <div className="relative flex items-center justify-center p-6 sm:p-8">

            <div className="w-full max-w-sm">

              {/* MOBILE LOGO */}

              <div className="flex justify-center lg:hidden">

                <div className="flex items-center justify-center w-16 h-16 text-lg font-black text-white shadow-xl rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-cyan-500/20">

                  RTS

                </div>

              </div>

              {/* HEADER */}

              <div className="mt-6 text-center lg:mt-0">

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-cyan-300 text-[11px] font-medium">

                  <ShieldCheck size={12} />

                  Secure Access

                </div>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-white">

                  Welcome Back

                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">

                  Login to your
                  ReadyTech enterprise
                  dashboard.

                </p>

              </div>

              {/* ERROR */}

              {error && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="flex gap-3 px-4 py-3 mt-5 text-sm text-red-300 border bg-red-500/10 border-red-500/20 rounded-2xl"
                >

                  <AlertCircle
                    size={16}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{error}</span>

                </motion.div>
              )}

              {/* FORM */}

{/* FORM */}

<form
  onSubmit={handleLogin}
  className="mt-6 space-y-4"
>

  {/* EMAIL */}

  <div className="space-y-2">

    <label className="text-[13px] font-medium text-slate-300">

      Email Address

    </label>

    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-all duration-300 focus-within:border-cyan-400/60 hover:border-white/20">

      <div className="flex items-center gap-3 px-4 h-14">

        <div className="flex items-center justify-center rounded-lg w-9 h-9 bg-cyan-500/10">

          <Mail
            size={16}
            className="text-cyan-300"
          />

        </div>

        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          value={form.email}
          placeholder="you@readytech.com"
          onChange={handleChange}
          className="w-full text-sm font-medium text-white bg-transparent outline-none placeholder:text-slate-500"
        />

      </div>

    </div>

  </div>

  {/* PASSWORD */}

  <div className="space-y-2">

    <label className="text-[13px] font-medium text-slate-300">

      Password

    </label>

    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-all duration-300 focus-within:border-cyan-400/60 hover:border-white/20">

      <div className="flex items-center gap-3 px-4 h-14">

        <div className="flex items-center justify-center rounded-lg w-9 h-9 bg-indigo-500/10">

          <Lock
            size={16}
            className="text-indigo-300"
          />

        </div>

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
          className="w-full text-sm font-medium text-white bg-transparent outline-none placeholder:text-slate-500"
        />

        <button
          type="button"
          onClick={() =>
            setShowPassword(
              !showPassword
            )
          }
          className="flex items-center justify-center w-8 h-8 transition rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
        >

          {showPassword ? (
            <EyeOff size={16} />
          ) : (
            <Eye size={16} />
          )}

        </button>

      </div>

    </div>

  </div>

  {/* OPTIONS */}

  <div className="flex items-center justify-between px-1 text-[12px]">

    <label className="flex items-center gap-2 cursor-pointer text-slate-400">

      <input
        type="checkbox"
        className="w-3.5 h-3.5 accent-cyan-500"
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
    className="relative flex items-center justify-center w-full h-14 gap-2 overflow-hidden text-sm font-semibold tracking-wide text-white transition-all duration-300 shadow-xl rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 shadow-cyan-500/20"
  >

    <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-white/10 hover:opacity-100" />

    {loading ? (
      <>
        <Loader2
          size={17}
          className="animate-spin"
        />

        Authenticating...

      </>
    ) : (
      <>
        <ShieldCheck size={17} />

        Secure Login

      </>
    )}

  </button>

</form>

              {/* FOOTER */}

              <div className="pt-5 mt-6 border-t border-white/10">

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">

                  <CheckCircle2
                    size={14}
                    className="text-green-400"
                  />

                  Enterprise-grade protected authentication

                </div>

              </div>

            </div>

          </div>

        </motion.div>

      </div>

    </div>
  );
}