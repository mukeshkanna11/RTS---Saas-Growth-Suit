// src/App.jsx

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

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
import Users from "./pages/Users";

/* ================= LAYOUT + GUARD ================= */
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

/* =====================================================
   ROLE REDIRECT
===================================================== */
function RoleRedirect({ user }) {
  if (!user?.role) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const init = useAuthStore((s) => s.init);

  /* =====================================================
     INIT AUTH
  ===================================================== */
  useEffect(() => {
    init();
  }, [init]);

  /* =====================================================
     LOADING SCREEN
  ===================================================== */
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-white bg-[#020617]">
        <div className="text-center animate-pulse">
          <div className="text-6xl">🚀</div>

          <h2 className="mt-4 text-2xl font-bold">
            ReadyTech SaaS CRM
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Preparing your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            PUBLIC ROUTES
        ===================================================== */}

        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={`/${user.role}`} replace />
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/register"
          element={
            user ? (
              <Navigate to={`/${user.role}`} replace />
            ) : (
              <Register />
            )
          }
        />

        {/* =====================================================
            ADMIN ROUTES
        ===================================================== */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* DASHBOARD */}
          <Route index element={<Dashboard />} />

          {/* MODULES */}
          <Route path="leads" element={<Leads />} />
          <Route path="crm" element={<CRM />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="automation" element={<Automation />} />
          <Route path="analytics" element={<Analytics />} />

          {/* ADMIN ONLY */}
          <Route path="users" element={<Users />} />
          <Route
            path="subscription"
            element={<Subscription />}
          />
        </Route>

        {/* =====================================================
            MANAGER ROUTES
        ===================================================== */}

        <Route
          path="/manager"
          element={
            <ProtectedRoute role="manager">
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* DASHBOARD */}
          <Route index element={<Dashboard />} />

          {/* MODULES */}
          <Route path="leads" element={<Leads />} />
          <Route path="crm" element={<CRM />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="automation" element={<Automation />} />
          <Route path="analytics" element={<Analytics />} />

          {/* BLOCKED ROUTES */}
          <Route
            path="users"
            element={<Navigate to="/manager" replace />}
          />

          <Route
            path="subscription"
            element={<Navigate to="/manager" replace />}
          />
        </Route>

        {/* =====================================================
            EMPLOYEE ROUTES
        ===================================================== */}

        <Route
          path="/employee"
          element={
            <ProtectedRoute role="employee">
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* DASHBOARD */}
          <Route index element={<Dashboard />} />

          {/* LIMITED MODULES */}
          <Route path="leads" element={<Leads />} />
          <Route path="crm" element={<CRM />} />

          {/* BLOCKED ROUTES */}
          <Route
            path="campaigns"
            element={<Navigate to="/employee" replace />}
          />

          <Route
            path="automation"
            element={<Navigate to="/employee" replace />}
          />

          <Route
            path="analytics"
            element={<Navigate to="/employee" replace />}
          />

          <Route
            path="users"
            element={<Navigate to="/employee" replace />}
          />

          <Route
            path="subscription"
            element={<Navigate to="/employee" replace />}
          />
        </Route>

        {/* =====================================================
            ROOT REDIRECT
        ===================================================== */}

        <Route
          path="/"
          element={<RoleRedirect user={user} />}
        />

        {/* =====================================================
            404 PAGE
        ===================================================== */}

        <Route
          path="*"
          element={
            <div className="flex flex-col items-center justify-center min-h-screen text-white bg-[#020617]">
              <h1 className="font-bold text-7xl">404</h1>

              <p className="mt-3 text-slate-400">
                Page not found
              </p>

              <button
                onClick={() => window.history.back()}
                className="px-5 py-2 mt-6 text-sm font-medium transition bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Go Back
              </button>
            </div>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}