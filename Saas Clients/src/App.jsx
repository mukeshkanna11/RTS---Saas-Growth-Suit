// =======================================================
// src/App.jsx
// FAST + PRODUCTION SAAS ROUTER (NO LOADER BLOCK)
// =======================================================

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

/* ================= LAYOUT ================= */

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

/* ================= ROLE REDIRECT ================= */

function RoleRedirect() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role?.toLowerCase();

  const roleMap = {
    admin: "/admin",
    manager: "/manager",
    employee: "/employee",
  };

  return <Navigate to={roleMap[role] || "/login"} replace />;
}

/* ================= MAIN APP ================= */

export default function App() {
  const init = useAuthStore((s) => s.init);

  // ⚡ BACKGROUND INIT (NO UI BLOCK)
  useEffect(() => {
    init(); // runs silently
  }, [init]);

  return (
    <BrowserRouter>
      <Routes>

        {/* ================= PUBLIC ================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ================= ROOT ================= */}
        <Route path="/" element={<RoleRedirect />} />

        {/* ================= ADMIN ================= */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="crm" element={<CRM />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="automation" element={<Automation />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="users" element={<Users />} />
          <Route path="subscription" element={<Subscription />} />
        </Route>

        {/* ================= MANAGER ================= */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="crm" element={<CRM />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="automation" element={<Automation />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* ================= EMPLOYEE ================= */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="crm" element={<CRM />} />
        </Route>

        {/* ================= 404 ================= */}
        <Route path="*" element={<div>404 Not Found</div>} />

      </Routes>
    </BrowserRouter>
  );
}