import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import { useAuthStore } from "./store/authStore";

/* ================= PAGES ================= */
import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import CRM from "./pages/CRM";
import Campaigns from "./pages/Campaigns";
import Automation from "./pages/Automation";
import Analytics from "./pages/Analytics";
import Subscription from "./pages/Subscription";

/* ================= LAYOUT + GUARD ================= */
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

/* ================= ROLE REDIRECT ================= */
const RoleRedirect = ({ user }) => {
  if (!user?.role) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

export default function App() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const init = useAuthStore((s) => s.init);

  /* ================= INIT AUTH ================= */
  useEffect(() => {
    init(); // loads user from token/localStorage
  }, [init]);

  /* ================= LOADING SCREEN ================= */
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-white bg-slate-950">
        <div className="text-center animate-pulse">
          <div className="text-5xl">🚀</div>
          <p className="mt-3 text-lg font-semibold">
            Loading ReadyTech SaaS...
          </p>
          <p className="text-sm text-slate-400">
            Preparing your workspace
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* ================= PUBLIC ROUTES ================= */}
        <Route
          path="/login"
          element={
            user?.role ? (
              <Navigate to={`/${user.role}`} replace />
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/register"
          element={
            user?.role ? (
              <Navigate to={`/${user.role}`} replace />
            ) : (
              <Register />
            )
          }
        />

        {/* ================= ROLE BASED APP ================= */}
        {["admin", "manager", "employee"].map((role) => (
          <Route
            key={role}
            path={`/${role}`}
            element={
              <ProtectedRoute role={role}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* ================= DASHBOARD ================= */}
            <Route index element={<Dashboard />} />

            {/* ================= MODULE ROUTES ================= */}
            <Route path="leads" element={<Leads />} />
            <Route path="crm" element={<CRM />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="automation" element={<Automation />} />
            <Route path="analytics" element={<Analytics />} />

            {/* ================= ADMIN ONLY FEATURE ================= */}
            <Route
              path="subscription"
              element={
                role === "admin" ? (
                  <Subscription />
                ) : (
                  <Navigate to={`/${role}`} replace />
                )
              }
            />
          </Route>
        ))}

        {/* ================= ROOT REDIRECT ================= */}
        <Route path="/" element={<RoleRedirect user={user} />} />

        {/* ================= 404 ================= */}
        <Route
          path="*"
          element={
            <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
              <h1 className="text-6xl font-bold">404</h1>
              <p className="mt-2 text-slate-400">
                Page not found
              </p>
            </div>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}