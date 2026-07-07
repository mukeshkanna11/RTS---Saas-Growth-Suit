// =======================================================
// src/components/ProtectedRoute.jsx
// PRODUCTION STABLE + NO REDIRECT LOOP
// =======================================================

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/* ======================================================
   LOADER
====================================================== */

function RouteLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#020617] text-white">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto border-4 rounded-full border-cyan-400 border-t-transparent animate-spin" />
        <p className="mt-4 text-sm text-slate-400">
          Verifying secure access...
        </p>
      </div>
    </div>
  );
}

/* ======================================================
   PROTECTED ROUTE (FIXED VERSION)
====================================================== */

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const {
    user,
    token,
    loading,
    initialized,
  } = useAuthStore();

  // ===============================
  // LOCAL INIT GUARD
  // ===============================

  const [booting, setBooting] = useState(true);

  useEffect(() => {
  if (initialized) {
    setBooting(false);
  }
}, [initialized]);
  // ===============================
  // LOADING STATE
  // ===============================

  if (loading || booting || !initialized) {
    return <RouteLoader />;
  }

  // ===============================
  // NO AUTH
  // ===============================

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // ===============================
  // ROLE CHECK
  // ===============================

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  // ===============================
  // SUCCESS
  // ===============================

  return children;
}