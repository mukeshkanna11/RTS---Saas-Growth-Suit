import { useState, useRef } from "react";
import { loginUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Mail } from "lucide-react";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const isSubmitting = useRef(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading || isSubmitting.current) return;

    isSubmitting.current = true;
    setLoading(true);
    setError("");

    try {
      const res = await loginUser(form);

      const data = res?.data?.data || res?.data;
      const user = data?.user;
      const accessToken = data?.accessToken || data?.token;

      if (!user || !accessToken) {
        throw new Error("Invalid server response");
      }

      // Zustand
      login({ user, accessToken });

      // Permanent persistence
      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      navigate(`/${user.role}`, { replace: true });

    } catch (err) {
      console.error("LOGIN ERROR:", err);

      if (err?.response?.status === 429) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else if (err?.response) {
        setError(err.response.data?.message || "Invalid credentials");
      } else if (err?.request) {
        setError("Server not responding. Try again.");
      } else {
        setError(err.message || "Something went wrong");
      }

    } finally {
      setLoading(false);

      setTimeout(() => {
        isSubmitting.current = false;
      }, 700);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 overflow-hidden bg-[#050816]">

      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#1e3a8a22,transparent_40%),radial-gradient(circle_at_bottom_left,#7c3aed22,transparent_40%)]"></div>

      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md p-8 border shadow-2xl bg-white/5 backdrop-blur-2xl border-white/10 rounded-3xl"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 text-xl font-bold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600">
            RTS
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Secure Login Portal
          </h2>
          <p className="mt-2 text-slate-400">
            Access your SaaS workspace with confidence
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-3 mb-5 text-sm text-red-300 border rounded-2xl bg-red-500/10 border-red-500/30"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="text-sm text-slate-400">Email Address</label>
            <div className="flex items-center gap-3 px-4 py-3 mt-2 border rounded-2xl bg-slate-900/80 border-slate-700">
              <Mail size={18} className="text-cyan-400" />
              <input
                type="email"
                required
                value={form.email}
                autoComplete="email"
                placeholder="Enter your email"
                className="w-full text-white bg-transparent outline-none"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400">Password</label>
            <div className="flex items-center gap-3 px-4 py-3 mt-2 border rounded-2xl bg-slate-900/80 border-slate-700">
              <Lock size={18} className="text-purple-400" />
              <input
                type="password"
                required
                value={form.password}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full text-white bg-transparent outline-none"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-cyan-500" />
              Remember me
            </label>

            <span className="cursor-pointer hover:text-white">
              Forgot password?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-black transition rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Login Securely"}
          </button>
        </form>

        {/* Trust Section */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-500">
          <ShieldCheck size={15} className="text-green-400" />
          Protected by enterprise-grade security
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-center text-slate-400">
          Don’t have an account?{" "}
          <span
            className="font-medium cursor-pointer text-cyan-400 hover:underline"
            onClick={() => navigate("/register")}
          >
            Create one
          </span>
        </p>
      </motion.div>
    </div>
  );
}