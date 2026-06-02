import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";

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

import ClientDashboard from "./pages/ClientDashboard";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

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
    client: "/client",
  };

  return (
    <Navigate
      to={roleMap[role] || "/login"}
      replace
    />
  );
}

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<RoleRedirect />} />

        {/* ADMIN */}
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
          <Route
            path="subscription"
            element={<Subscription />}
          />
        </Route>

        {/* MANAGER */}
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

        {/* EMPLOYEE */}
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

        {/* CLIENT */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<ClientDashboard />}
          />
          <Route
            path="campaigns"
            element={<Campaigns />}
          />
          <Route
            path="analytics"
            element={<Analytics />}
          />
        </Route>

        <Route
          path="*"
          element={<div>404 Not Found</div>}
        />

      </Routes>
    </BrowserRouter>
  );
}