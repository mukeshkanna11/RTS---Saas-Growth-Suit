import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

import {
  LayoutDashboard,
  Users,
  Target,
  Briefcase,
  Settings,
  BarChart3,
  Layers,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);

  const base = `/${user?.role || "admin"}`; // 🔥 dynamic base

  const menu = [
    { name: "Dashboard", path: `${base}`, icon: <LayoutDashboard size={18} /> },
    { name: "Users", path: `${base}/users`, icon: <Users size={18} /> },
    { name: "Leads", path: `${base}/leads`, icon: <Target size={18} /> },
    { name: "CRM", path: `${base}/crm`, icon: <Briefcase size={18} /> },
    { name: "Automation", path: `${base}/automation`, icon: <Layers size={18} /> },
    { name: "Analytics", path: `${base}/analytics`, icon: <BarChart3 size={18} /> },
    { name: "Settings", path: `${base}/settings`, icon: <Settings size={18} /> },
  ];

  return (
    <div
      className={`h-screen bg-gray-950 border-r border-gray-800 flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >

      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-white">
              ReadyTech
            </h1>
            <p className="text-xs text-gray-400">
              Solutions
            </p>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      {/* MENU */}
      <div className="flex-1 p-3 space-y-1">
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition group ${
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <div>{item.icon}</div>

            {!collapsed && (
              <span className="text-sm font-medium">
                {item.name}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* USER */}
      <div className="flex items-center gap-3 p-4 border-t border-gray-800">
        <div className="flex items-center justify-center w-10 h-10 font-bold text-white rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
          {user?.name?.charAt(0) || "U"}
        </div>

        {!collapsed && (
          <div>
            <p className="text-sm font-medium text-white">
              {user?.name}
            </p>
            <p className="text-xs text-gray-400 capitalize">
              {user?.role}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}