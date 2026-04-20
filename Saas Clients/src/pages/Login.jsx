import { useState, useRef } from "react";
import { loginUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  // 🔥 HARD LOCK (prevents rapid multi-trigger even if state lags)
  const isSubmitting = useRef(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    // 🔒 Prevent double submit (state + ref protection)
    if (loading || isSubmitting.current) return;

    isSubmitting.current = true;
    setLoading(true);
    setError("");

    try {
      const res = await loginUser(form);

      const data = res?.data?.data || res?.data;
      const user = data?.user;
      const accessToken = data?.accessToken;

      if (!user || !accessToken) {
        throw new Error("Invalid server response");
      }

      login({ user, accessToken });

      navigate(`/${user.role}`, { replace: true });

    } catch (err) {
      console.error("LOGIN ERROR:", err);

      // 🔥 SPECIAL HANDLING FOR RATE LIMIT
      if (err?.response?.status === 429) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else if (err.response) {
        setError(err.response.data?.message || "Invalid credentials");
      } else if (err.request) {
        setError("Server not responding. Try again.");
      } else {
        setError(err.message || "Something went wrong");
      }

    } finally {
      setLoading(false);

      // 🔓 unlock after small delay (extra safety against rapid spam)
      setTimeout(() => {
        isSubmitting.current = false;
      }, 600);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-black via-gray-950 to-gray-900">

      <div className="relative w-full max-w-md p-8 border shadow-2xl bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl">

        <div className="absolute inset-0 opacity-20 blur-3xl bg-gradient-to-r from-blue-500 to-purple-600"></div>

        <div className="relative z-10">

          {/* LOGO */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center text-lg font-bold text-white shadow-lg w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
              RTS
            </div>
          </div>

          {/* HEADER */}
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-white">
              Welcome Back 👋
            </h2>
            <p className="mt-1 text-gray-400">
              Login to your CRM workspace
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="px-4 py-2 mb-4 text-sm text-red-300 border rounded-lg bg-red-500/10 border-red-500/30">
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label className="text-sm text-gray-400">Email</label>
              <input
                type="email"
                required
                value={form.email}
                autoComplete="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 mt-1 text-white bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">Password</label>
              <input
                type="password"
                required
                value={form.password}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full px-4 py-2 mt-1 text-white bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center justify-between text-sm text-gray-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-blue-500" />
                Remember me
              </label>

              <span className="cursor-pointer hover:text-white">
                Forgot password?
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 font-semibold text-white transition rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* FOOTER */}
          <p className="mt-6 text-sm text-center text-gray-400">
            Don’t have an account?{" "}
            <span
              className="text-blue-500 cursor-pointer hover:underline"
              onClick={() => navigate("/register")}
            >
              Register
            </span>
          </p>

        </div>
      </div>
    </div>
  );
}