import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Target,
  Briefcase,
  Activity,
  Layers,
  BarChart3,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { logoutUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";

/* ✅ PRODUCTION SAFE LOGO (VITE) */
import logo from "../assets/Logo.png";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const role = location.pathname.split("/")[1] || "admin";
  const [collapsed, setCollapsed] = useState(false);

  const user = useAuthStore((s) => s.user);

  /* ================= NAV ITEM ================= */
  const NavItem = ({ icon, label, path }) => {
    const active = location.pathname === path;

    return (
      <motion.div
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate(path)}
        className={`relative flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden
        ${
          active
            ? "bg-gradient-to-r from-blue-500/30 to-purple-600/30 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)]"
            : "text-gray-400 hover:bg-white/10 hover:text-white"
        }`}
      >
        {active && (
          <div className="absolute left-0 w-[3px] h-5 bg-blue-400 rounded-r-full" />
        )}

        <div className="flex-shrink-0">{icon}</div>

        {!collapsed && (
          <span className="text-sm font-medium truncate">{label}</span>
        )}
      </motion.div>
    );
  };

  return (
    <div className="relative flex h-screen text-white bg-[#020617] overflow-hidden">

      {/* 🌌 BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-72 h-72 bg-blue-500/20 blur-3xl top-10 left-10" />
        <div className="absolute w-72 h-72 bg-purple-600/20 blur-3xl bottom-10 right-10" />
      </div>

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`relative z-10 flex flex-col justify-between transition-all duration-300 overflow-hidden
        ${collapsed ? "w-16" : "w-64"} 
        bg-[#0B0F19]/90 backdrop-blur-xl border-r border-white/10`}
      >
        {/* TOP */}
        <div className="p-4 flex flex-col h-full">

          {/* TOGGLE */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 text-gray-400 rounded hover:bg-white/10 hover:text-white"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* LOGO + NAME */}
          <div className="flex items-center gap-3 mb-6 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={logo}
                alt="ReadyTechSolutions"
                className="h-10 w-auto object-contain"
              />
              <div className="absolute -inset-2 bg-blue-500/10 blur-xl opacity-70 pointer-events-none" />
            </div>

            {!collapsed && (
              <div className="leading-tight min-w-0">
                <h2 className="text-sm font-semibold text-white truncate">
                  ReadyTechSolutions
                </h2>
                <p className="text-[11px] text-gray-400 truncate">
                  Growth Suite
                </p>
              </div>
            )}
          </div>

          {/* NAV */}
          <nav className="space-y-1 flex-1">
            <NavItem icon={<Home size={18} />} label="Dashboard" path={`/${role}`} />
            <NavItem icon={<Target size={18} />} label="Leads" path={`/${role}/leads`} />
            <NavItem icon={<Briefcase size={18} />} label="CRM" path={`/${role}/crm`} />
            <NavItem icon={<Activity size={18} />} label="Campaigns" path={`/${role}/campaigns`} />
            <NavItem icon={<Layers size={18} />} label="Automation" path={`/${role}/automation`} />
            <NavItem icon={<BarChart3 size={18} />} label="Analytics" path={`/${role}/analytics`} />
            <NavItem icon={<CreditCard size={18} />} label="Subscriptions" path={`/${role}/subscription`} />
          </nav>
        </div>

        {/* BOTTOM */}
        <div className="p-4 border-t border-white/10 space-y-3">

          {/* USER */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 text-sm font-semibold rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] text-gray-400 capitalize truncate">
                  {user?.role || role}
                </p>
              </div>
            )}
          </div>

          {/* LOGOUT */}
          <button
            onClick={logoutUser}
            className="flex items-center justify-center w-full gap-2 py-2 text-xs text-red-400 transition rounded-lg hover:bg-red-500/20"
          >
            <LogOut size={14} />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex flex-col flex-1 overflow-hidden z-10">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl">

          {/* LEFT */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-base font-semibold capitalize">
                {role}
              </h1>
              <p className="text-xs text-gray-400">
                Manage your {role} workspace
              </p>
            </div>

            <div className="w-px h-7 bg-white/10" />

            <div className="px-2 py-1 text-[10px] rounded-md bg-green-500/10 text-green-400 border border-green-500/20">
              Active
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">

            <button className="px-4 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition">
              + New
            </button>

            <div className="relative p-2 rounded-lg hover:bg-white/10 cursor-pointer">
              🔔
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>

            <div className="flex items-center gap-3 pl-3 border-l border-white/10 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 text-sm font-semibold rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-400 capitalize truncate">
                  {user?.role || role}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-4 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}