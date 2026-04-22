import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/admin/Dashboard";
import ManagerDashboard from "./pages/manager/Dashboard";
import EmployeeDashboard from "./pages/employee/Dashboard";

import Leads from "./pages/Leads";
import CRM from "./pages/CRM";
import Campaigns from "./pages/Campaigns";
import Automation from "./pages/Automation";

import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";

// ================= DASHBOARD MAP =================
const dashboards = {
  admin: <AdminDashboard />,
  manager: <ManagerDashboard />,
  employee: <EmployeeDashboard />,
};

// ================= ROLE REDIRECT =================
const RoleRedirect = ({ user }) => {
  if (!user?.role) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

// ================= ✅ FIX: FUNCTION (NOT COMPONENT) =================
const getModuleRoutes = (role) => [
  <Route
    key={`${role}-leads`}
    path={`/${role}/leads`}
    element={
      <ProtectedRoute role={role}>
        <Leads />
      </ProtectedRoute>
    }
  />,
  <Route
    key={`${role}-crm`}
    path={`/${role}/crm`}
    element={
      <ProtectedRoute role={role}>
        <CRM />
      </ProtectedRoute>
    }
  />,
  <Route
    key={`${role}-campaigns`}
    path={`/${role}/campaigns`}
    element={
      <ProtectedRoute role={role}>
        <Campaigns />
      </ProtectedRoute>
    }
  />,
  <Route
    key={`${role}-automation`}
    path={`/${role}/automation`}
    element={
      <ProtectedRoute role={role}>
        <Automation />
      </ProtectedRoute>
    }
  />,
];

export default function App() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-white bg-black">
        <div className="animate-pulse">🚀 Loading ReadyTech SaaS...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}
        <Route
          path="/login"
          element={
            user?.role ? <Navigate to={`/${user.role}`} replace /> : <Login />
          }
        />

        <Route
          path="/register"
          element={
            user?.role ? <Navigate to={`/${user.role}`} replace /> : <Register />
          }
        />

        {/* DASHBOARDS */}
        {Object.keys(dashboards).map((role) => (
          <Route
            key={role}
            path={`/${role}`}
            element={
              <ProtectedRoute role={role}>
                {dashboards[role]}
              </ProtectedRoute>
            }
          />
        ))}

        {/* ✅ MODULE ROUTES (FIXED) */}
        {["admin", "manager", "employee"].flatMap((role) =>
          getModuleRoutes(role)
        )}

        {/* ROOT */}
        <Route path="/" element={<RoleRedirect user={user} />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="flex flex-col items-center justify-center min-h-screen text-white bg-black">
              <h1 className="text-4xl font-bold">404</h1>
              <p className="text-gray-400">Page not found</p>
            </div>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}