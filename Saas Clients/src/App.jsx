import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/admin/Dashboard";
import ManagerDashboard from "./pages/manager/Dashboard";
import EmployeeDashboard from "./pages/employee/Dashboard";

import Leads from "./pages/Leads";
import CRM from "./pages/CRM";

import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";

export default function App() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const init = useAuthStore((s) => s.init);

  // =========================
  // INIT AUTH ONCE
  // =========================
  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>

      {/* =========================
          GLOBAL NON-BLOCKING LOADER
          (prevents blank screen flicker)
      ========================= */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center text-white bg-black/70 backdrop-blur-sm">
          <div className="text-sm animate-pulse">
            Loading...
          </div>
        </div>
      )}

      <Routes>

        {/* ================= PUBLIC ROUTES ================= */}

        <Route
          path="/login"
          element={
            user?.role
              ? <Navigate to={`/${user.role}`} replace />
              : <Login />
          }
        />

        <Route
          path="/register"
          element={
            user?.role
              ? <Navigate to={`/${user.role}`} replace />
              : <Register />
          }
        />

        {/* ================= ADMIN ================= */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/leads"
          element={
            <ProtectedRoute role="admin">
              <Leads />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/crm"
          element={
            <ProtectedRoute role="admin">
              <CRM />
            </ProtectedRoute>
          }
        />

        {/* ================= MANAGER ================= */}

        <Route
          path="/manager"
          element={
            <ProtectedRoute role="manager">
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/leads"
          element={
            <ProtectedRoute role="manager">
              <Leads />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/crm"
          element={
            <ProtectedRoute role="manager">
              <CRM />
            </ProtectedRoute>
          }
        />

        {/* ================= EMPLOYEE ================= */}

        <Route
          path="/employee"
          element={
            <ProtectedRoute role="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/leads"
          element={
            <ProtectedRoute role="employee">
              <Leads />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/crm"
          element={
            <ProtectedRoute role="employee">
              <CRM />
            </ProtectedRoute>
          }
        />

        {/* ================= ROOT REDIRECT ================= */}

        <Route
          path="/"
          element={
            user?.role
              ? <Navigate to={`/${user.role}`} replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* ================= 404 ================= */}

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}