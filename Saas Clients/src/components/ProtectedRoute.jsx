import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({ children, role }) {
  const user = useAuthStore((s) => s.user);

  // ❌ IMPORTANT: do NOT block UI with loading screen
  // This prevents dashboard blink

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}