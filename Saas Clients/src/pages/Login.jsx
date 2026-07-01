// =======================================================
<<<<<<< HEAD
// src/pages/Login.jsx — READYTECH SOLUTIONS
// Enterprise Login · Compact 60/40 Dashboard Layout
// =======================================================

import { memo, useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Lock, Mail, AlertCircle, Loader2,
  Eye, EyeOff, Cpu, BarChart3, Database, Sparkles,
  CheckCircle2, Check, Users, Zap, Activity,
} from "lucide-react";
import { loginUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";

// ─── Static data (outside component — zero re-creation cost) ──────────────────

const KPI_METRICS = [
  { value: "99.9%", label: "Uptime SLA",     icon: Activity, color: "text-cyan-400",    bg: "bg-cyan-500/10"    },
  { value: "256",   label: "Bit Encryption", icon: Lock,     color: "text-violet-400",  bg: "bg-violet-500/10"  },
  { value: "10K+",  label: "Active Users",   icon: Users,    color: "text-blue-400",    bg: "bg-blue-500/10"    },
  { value: "50ms",  label: "Response Time",  icon: Zap,      color: "text-emerald-400", bg: "bg-emerald-500/10" },
];

const FEATURES = [
  { icon: BarChart3, title: "Analytics Dashboard",  desc: "Real-time insights"       },
  { icon: Database,  title: "CRM Management",       desc: "Customer lifecycle"        },
  { icon: Users,     title: "Employee Management",  desc: "HR & payroll automation"   },
  { icon: Cpu,       title: "AI Marketing Suite",   desc: "Campaign automation"       },
];

const LOGIN_STEPS = [
  "Validating Credentials",
  "Authenticating User",
  "Loading Workspace",
  "Redirecting…",
];

const ERROR_MESSAGES = {
  400: "Invalid request. Please check your credentials.",
  401: "Invalid email or password.",
  403: "Access denied. Contact your administrator.",
  429: "Too many login attempts. Please wait a moment.",
  500: "Server error. Our team has been notified.",
  502: "Service temporarily unavailable. Please retry.",
  503: "Service is under maintenance. Please try again soon.",
  504: "Request timed out. Check your connection.",
};

const ROLE_ROUTES = {
  admin:    "/admin",
  manager:  "/manager",
  client:   "/client",
  employee: "/employee",
};

// ─── Pure helpers ──────────────────────────────────────────────────────────────

function getErrorMessage(err) {
  if (!err?.response) {
    if (err?.request) return "Unable to connect. Check your internet connection.";
    return err?.message || "An unexpected error occurred.";
  }
  const status = err.response.status;
  const apiMsg = err.response?.data?.message;
  return ERROR_MESSAGES[status] || apiMsg || "An unexpected error occurred.";
}

function getPasswordStrength(pwd) {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (pwd.length >= 12)          score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { label: "Weak",   pct: 33,  color: "bg-red-500"    };
  if (score <= 3) return { label: "Fair",   pct: 66,  color: "bg-yellow-500" };
  return              { label: "Strong", pct: 100, color: "bg-emerald-500" };
}

// ─── Left Panel — memoized, never re-renders when form state changes ───────────

const LeftPanel = memo(() => (
  <div className="relative hidden lg:flex flex-col">

    {/* Gradient tint */}
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.08] via-blue-600/[0.06] to-indigo-700/[0.08]" />
    {/* Right divider */}
    <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/[0.1] to-transparent" />

    <div className="relative z-10 flex h-full flex-col p-6 xl:p-7 gap-5">

      {/* ── Brand ── */}
      <div>
        {/* Logo row */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-[11px] font-black text-white shadow-md shadow-cyan-500/20">
            RTS
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none">ReadyTech Solutions</p>
            <p className="mt-0.5 text-[10px] text-slate-500">Enterprise SaaS Platform</p>
          </div>
        </div>

        {/* Headline block */}
        <div className="mt-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/[0.09] px-2.5 py-1 text-[10px] font-medium text-cyan-300">
            <Sparkles size={10} />
            Smart Business Infrastructure
          </div>
          <h1 className="mt-2.5 text-[1.35rem] font-black leading-tight tracking-tight text-white">
            One Platform.<br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
              Total Business Control.
            </span>
          </h1>
          <p className="mt-2 text-[12px] leading-[1.6] text-slate-400 max-w-[260px]">
            Manage CRM, analytics, automation, and operations through one secure intelligent platform.
          </p>
        </div>
      </div>

      {/* ── KPI Metrics — 2×2 compact grid ── */}
      <div>
        <p className="mb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-600">
          Platform Metrics
        </p>
        <div className="grid grid-cols-2 gap-2">
          {KPI_METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5"
              >
                <div className={`mb-2 w-fit rounded-lg p-1 ${metric.bg}`}>
                  <Icon size={12} className={metric.color} />
                </div>
                <p className={`text-[1.05rem] font-black leading-none ${metric.color}`}>
                  {metric.value}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">{metric.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Features — 2×2 compact grid ── */}
      <div>
        <p className="mb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-600">
          Platform Modules
        </p>
        <div className="grid grid-cols-2 gap-2">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.025] px-2.5 py-2"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-500/[0.12]">
                  <Icon size={12} className="text-cyan-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white leading-tight truncate">{feat.title}</p>
                  <p className="text-[9px] text-slate-500 leading-tight">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Trust footer — pushed to bottom ── */}
      <div className="mt-auto flex items-center justify-between text-[10px] text-slate-600">
        <span>
          Trusted by{" "}
          <span className="font-semibold text-slate-400">10,000+</span> businesses
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={10} className="text-emerald-400" />
            SOC 2
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={10} className="text-blue-400" />
            ISO 27001
          </span>
        </div>
      </div>
    </div>
  </div>
));

LeftPanel.displayName = "LeftPanel";

// ─── Main Login Component ──────────────────────────────────────────────────────

export default function Login() {

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock,     setCapsLock]     = useState(false);
  const [loginStep,    setLoginStep]    = useState(-1);
  const [rememberMe,   setRememberMe]   = useState(false);

  const isSubmitting = useRef(false);
  const stepTimer    = useRef(null);

  const setAuth  = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  useEffect(() => () => clearTimeout(stepTimer.current), []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.getModifierState) setCapsLock(e.getModifierState("CapsLock"));
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup",   handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup",   handleKey);
    };
  }, []);

  const handleEmailChange    = useCallback((e) => setEmail(e.target.value),    []);
  const handlePasswordChange = useCallback((e) => setPassword(e.target.value), []);
  const togglePassword       = useCallback(() => setShowPassword((p) => !p),   []);
  const toggleRemember       = useCallback(() => setRememberMe((r) => !r),     []);

  const pwdStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    if (loading || isSubmitting.current) return;
    if (!email.trim() || !password) return;

    isSubmitting.current = true;
    setLoading(true);
    setError("");
    setLoginStep(0);

    stepTimer.current = setTimeout(() => setLoginStep(1), 500);

    try {
      const response = await loginUser({
        email:    email.trim().toLowerCase(),
        password,
      });

      clearTimeout(stepTimer.current);

      const data        = response?.data?.data || response?.data || {};
      const user        = data?.user;
      const accessToken = data?.accessToken || data?.token;

      if (!user)        throw new Error("User data missing");
      if (!accessToken) throw new Error("Access token missing");

      setAuth({ user, token: accessToken });
      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      setLoginStep(2);
      stepTimer.current = setTimeout(() => {
        setLoginStep(3);
        const roleRoute = ROLE_ROUTES[user.role] || "/employee";
        stepTimer.current = setTimeout(() => {
          navigate(roleRoute, { replace: true });
        }, 350);
      }, 450);

    } catch (err) {
      clearTimeout(stepTimer.current);
      setError(getErrorMessage(err));
      setLoginStep(-1);
      setLoading(false);
      setTimeout(() => { isSubmitting.current = false; }, 700);
    }
  }, [email, password, loading, setAuth, navigate]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
=======
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
>>>>>>> ade4fece41a073615a127e6fc0da3d2b04542245

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712]">

<<<<<<< HEAD
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/[0.09] blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-indigo-600/[0.09] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-blue-600/[0.04] blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Center — tighter vertical padding to keep everything above the fold */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-3">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] shadow-2xl shadow-black/50 backdrop-blur-2xl lg:grid-cols-[3fr_2fr]"
        >

          {/* 60% — Left branding panel */}
          <LeftPanel />

          {/* 40% — Right form panel */}
          <div className="flex flex-col justify-center p-5 sm:p-6 lg:p-7">

            {/* Mobile logo */}
            <div className="mb-5 flex justify-center lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-sm font-black text-white shadow-lg shadow-cyan-500/20">
                RTS
              </div>
            </div>

            {/* ── Header ── */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-cyan-300">
                <ShieldCheck size={10} />
                Secure Access · 256-bit SSL
              </div>
              <h2 className="mt-2.5 text-2xl font-black tracking-tight text-white">
                Welcome Back
              </h2>
              <p className="mt-1 text-[12px] text-slate-400">
                Sign in to your ReadyTech enterprise dashboard.
              </p>
            </div>

            {/* ── Error alert ── */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-3.5 py-2.5 text-[12px] text-red-300">
                    <AlertCircle size={14} className="mt-px flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Form ── */}
            <form onSubmit={handleLogin} className="space-y-3" noValidate>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Email Address
                </label>
                <div className="group flex h-11 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 transition-all duration-200 focus-within:border-cyan-400/55 focus-within:bg-white/[0.05] hover:border-white/[0.14]">
                  <Mail
                    size={14}
                    className="flex-shrink-0 text-slate-600 transition-colors duration-200 group-focus-within:text-cyan-400"
                  />
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="you@company.com"
                    className="w-full bg-transparent text-sm text-white placeholder:text-slate-600 outline-none"
                  />
                  {email && <CheckCircle2 size={13} className="flex-shrink-0 text-emerald-400" />}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Password
                </label>
                <div className="group flex h-11 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 transition-all duration-200 focus-within:border-cyan-400/55 focus-within:bg-white/[0.05] hover:border-white/[0.14]">
                  <Lock
                    size={14}
                    className="flex-shrink-0 text-slate-600 transition-colors duration-200 group-focus-within:text-cyan-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    className="w-full bg-transparent text-sm text-white placeholder:text-slate-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={togglePassword}
                    tabIndex={-1}
                    className="flex-shrink-0 rounded p-0.5 text-slate-600 transition hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Caps lock */}
                <AnimatePresence>
                  {capsLock && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-1.5 text-[10px] font-medium text-amber-400"
                    >
                      <AlertCircle size={10} />
                      Caps Lock is on
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Password strength */}
                <AnimatePresence>
                  {password && pwdStrength && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-600">Password strength</span>
                        <span className={`text-[9px] font-bold ${
                          pwdStrength.label === "Weak"   ? "text-red-400"    :
                          pwdStrength.label === "Fair"   ? "text-yellow-400" :
                                                           "text-emerald-400"
                        }`}>{pwdStrength.label}</span>
                      </div>
                      <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pwdStrength.pct}%` }}
                          transition={{ duration: 0.3 }}
                          className={`h-full rounded-full ${pwdStrength.color}`}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] text-slate-500 transition-colors hover:text-slate-300">
                  <div
                    role="checkbox"
                    aria-checked={rememberMe}
                    tabIndex={0}
                    onClick={toggleRemember}
                    onKeyDown={(e) => e.key === " " && toggleRemember()}
                    className={`flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded border transition-all ${
                      rememberMe ? "border-cyan-500 bg-cyan-500" : "border-white/20 bg-white/[0.04]"
                    }`}
                  >
                    {rememberMe && <Check size={8} className="text-white" />}
                  </div>
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-[11px] font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Multi-step loading progress */}
              <AnimatePresence>
                {loading && loginStep >= 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1.5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                      {LOGIN_STEPS.map((step, i) => {
                        const isDone   = i < loginStep;
                        const isActive = i === loginStep;
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-2 text-[11px] transition-opacity duration-200 ${
                              isDone || isActive ? "opacity-100" : "opacity-25"
                            }`}
                          >
                            <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                              isDone   ? "bg-emerald-500" :
                              isActive ? "border border-cyan-400/50 bg-cyan-500/15" :
                                         "border border-white/10 bg-white/[0.03]"
                            }`}>
                              {isDone   && <Check size={7} className="text-white" />}
                              {isActive && <Loader2 size={7} className="animate-spin text-cyan-400" />}
                            </div>
                            <span className={
                              isDone   ? "text-emerald-400" :
                              isActive ? "font-medium text-cyan-300" :
                                         "text-slate-600"
                            }>{step}</span>
                            {isDone && <Check size={9} className="ml-auto flex-shrink-0 text-emerald-400" />}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 text-sm font-semibold tracking-wide text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:scale-[1.012] hover:shadow-cyan-500/30 active:scale-[0.988] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-white/0 transition-all duration-300 group-hover:bg-white/[0.08]" />
                <div className="relative flex items-center gap-2">
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" />Authenticating…</>
                    : <><ShieldCheck size={15} />Secure Login</>
                  }
                </div>
              </button>
            </form>

            {/* ── Security badges ── */}
            <div className="mt-4 border-t border-white/[0.07] pt-3.5">
              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-600">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-emerald-400" />
                  Enterprise Security
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={11} className="text-blue-400" />
                  SOC 2 Compliant
                </span>
                <span className="flex items-center gap-1">
                  <Lock size={11} className="text-violet-400" />
                  256-bit Encrypted
                </span>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
=======
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
>>>>>>> ade4fece41a073615a127e6fc0da3d2b04542245
