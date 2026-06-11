// src/layouts/MainLayout.jsx

import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";
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
  Users,
  ShieldCheck,
  Bell,
  Receipt,      // 👈 Add this
} from "lucide-react";

import { logoutUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import logo from "../assets/Logo.png";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const [collapsed, setCollapsed] = useState(false);
const [profileOpen, setProfileOpen] = useState(false);
  const role = user?.role || "employee";

  /* =====================================================
     FIXED MENUS (MATCHES YOUR ROUTER EXACTLY)
  ===================================================== */
  const menus = useMemo(
    () => ({
      admin: [
  { label: "Dashboard", path: "/admin", icon: <Home size={18} /> },
  { label: "Users", path: "/admin/users", icon: <Users size={18} /> },
  { label: "Leads", path: "/admin/leads", icon: <Target size={18} /> },
  { label: "Deals", path: "/admin/crm", icon: <Briefcase size={18} /> },
  { label: "Campaigns", path: "/admin/campaigns", icon: <Activity size={18} /> },
  { label: "Automation", path: "/admin/automation", icon: <Layers size={18} /> },
  { label: "Analytics", path: "/admin/analytics", icon: <BarChart3 size={18} /> },
  { label: "Subscription", path: "/admin/subscription", icon: <CreditCard size={18} /> },
  { label: "Invoice", path: "/admin/invoice", icon: <Receipt size={18} /> },
],
      manager: [
        { label: "Dashboard", path: "/manager", icon: <Home size={18} /> },
        { label: "Leads", path: "/manager/leads", icon: <Target size={18} /> },
        { label: "Deals", path: "/manager/crm", icon: <Briefcase size={18} /> },
        { label: "Campaigns", path: "/manager/campaigns", icon: <Activity size={18} /> },
        { label: "Analytics", path: "/manager/analytics", icon: <BarChart3 size={18} /> },
      ],

      employee: [
        { label: "Dashboard", path: "/employee", icon: <Home size={18} /> },
        { label: "Leads", path: "/employee/leads", icon: <Target size={18} /> },
        { label: "Deals", path: "/employee/crm", icon: <Briefcase size={18} /> },
      ],
    }),
    []
  );

  /* =====================================================
     FIXED ACTIVE ROUTE LOGIC (IMPORTANT FIX)
  ===================================================== */
  const isActive = (path) => {
    if (path === `/${role}`) {
      return location.pathname === `/${role}`;
    }
    return location.pathname.startsWith(path);
  };

  /* =====================================================
     FIXED PAGE TITLE (NO MORE DASHBOARD STICKING ISSUE)
  ===================================================== */
  const currentPage = useMemo(() => {
    const allMenus = menus[role] || [];

    const found = allMenus
      .slice()
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => location.pathname.startsWith(item.path));

    return found?.label || "Dashboard";
  }, [location.pathname, menus, role]);

  /* =====================================================
     NAV ITEM
  ===================================================== */
  const NavItem = ({ icon, label, path }) => {
    const active = isActive(path);

    return (
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(path)}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition
        ${
          active
            ? "bg-blue-500/20 text-white border border-blue-500/30"
            : "text-gray-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        {active && (
          <div className="absolute left-0 w-[3px] h-6 bg-blue-400 rounded-r-full" />
        )}

        {icon}

        {!collapsed && <span className="text-sm">{label}</span>}
      </motion.div>
    );
  };

  /* =====================================================
     LOGOUT
  ===================================================== */
  const handleLogout = async () => {
    await logoutUser();
  };

const roleColors = {
  admin: "from-purple-500 to-pink-500",
  manager: "from-blue-500 to-cyan-500",
  employee: "from-green-500 to-emerald-500",
};
  
  return (
    <div className="flex h-screen text-white bg-[#020617]">

      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl" />
      </div>

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`z-20 flex flex-col justify-between border-r border-white/10 bg-[#0B0F19]/90 backdrop-blur-xl transition-all
        ${collapsed ? "w-[70px]" : "w-[240px]"}`}
      >
        <div className="p-3">

          {/* toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded hover:bg-white/10"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* logo */}
          <div className="flex items-center gap-3 px-2 mb-6">

  {/* LOGO */}
  <div className="flex items-center justify-center flex-shrink-0 border w-9 h-9 rounded-xl bg-white/5 border-white/10">
    <img
      src={logo}
      alt="ReadyTechSolutions"
      className="object-contain w-6 h-6"
    />
  </div>

  {/* TEXT (HIDDEN WHEN COLLAPSED + RESPONSIVE) */}
  {!collapsed && (
    <div className="min-w-0 leading-tight">
      <p className="text-sm font-semibold tracking-wide truncate">
        ReadyTechSolutions
      </p>

      <p className="text-[11px] text-gray-400 truncate">
        Growth Suite
      </p>
    </div>
  )}
</div>

          {/* ROLE BADGE */}
{!collapsed && (
  <div className="flex items-center justify-between px-2.5 py-1.5 mb-4 text-[11px] font-medium rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-300">

    <div className="flex items-center gap-1.5 min-w-0">
      <ShieldCheck size={13} className="flex-shrink-0 text-blue-400" />

      <span className="capitalize truncate">
        {role}
      </span>
    </div>

    {/* tiny status dot */}
    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />

  </div>
)}

          {/* NAVIGATION */}
<nav className="flex flex-col gap-1 px-1">
  {(menus?.[role] || []).map((m) => (
    <NavItem
      key={m.path}
      icon={m.icon}
      label={m.label}
      path={m.path}
    />
  ))}
</nav>
        </div>

        {/* bottom */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/10"
          >
            <LogOut size={14} className="inline mr-2" />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex flex-col flex-1">

        {/* HEADER */}
<header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b backdrop-blur-xl bg-[#0B0F19]/80 border-white/10">

  {/* LEFT - PAGE TITLE */}
  <div className="min-w-0">
    <h1 className="text-base font-semibold tracking-wide truncate sm:text-lg">
      {currentPage}
    </h1>

    <p className="hidden text-xs text-gray-400 sm:block">
      Growth Suite • Manage your workspace efficiently
    </p>
  </div>


  {/* RIGHT ACTIONS */}
  <div className="flex items-center gap-2 sm:gap-3">

    {/* NOTIFICATIONS */}
    <button className="relative p-2 transition rounded-xl hover:bg-white/10">
      <Bell size={18} />

      <span className="absolute w-2 h-2 bg-red-500 rounded-full top-2 right-2 animate-pulse" />
    </button>

    {/* STATUS BADGE (DESKTOP ONLY) */}
    <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 text-[11px] text-green-300 border border-green-500/20 bg-green-500/10 rounded-lg">
      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
      System Active
    </div>

    

{/* USER PROFILE */}
<div className="relative">

  {/* AVATAR BUTTON */}
  <button
    onClick={() => setProfileOpen(!profileOpen)}
    className="flex items-center gap-2 px-2 py-1 transition-all duration-200 border rounded-full bg-white/5 border-white/10 hover:bg-white/10 hover:scale-[1.02]"
  >

    {/* AVATAR */}
    <div
      className={`flex items-center justify-center w-7 h-7 text-[11px] font-bold text-white rounded-full shadow-md bg-gradient-to-r ${
        roleColors?.[role] || "from-blue-500 to-purple-600"
      } uppercase`}
    >
      {user?.name?.trim()?.charAt(0)?.toUpperCase() || "U"}
    </div>

    {/* STATUS DOT */}
    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />

  </button>

  {/* DROPDOWN */}
  {profileOpen && (
    <div className="absolute right-0 mt-3 w-52 bg-[#0B0F19]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">

      {/* USER HEADER */}
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-sm font-semibold text-white truncate">
          {user?.name || "User"}
        </p>
        <p className="text-xs text-gray-400 capitalize">
          {role} workspace
        </p>
      </div>

      {/* LOGOUT */}
      <div className="p-2">

        <button
          onClick={handleLogout}
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-red-400 transition rounded-xl hover:bg-red-500/10 hover:text-red-300"
        >
          <span>Logout</span>

          <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20">
            Exit
          </span>
        </button>

      </div>

    </div>
  )}

</div>

  </div>

</header>

        {/* CONTENT */}
        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}