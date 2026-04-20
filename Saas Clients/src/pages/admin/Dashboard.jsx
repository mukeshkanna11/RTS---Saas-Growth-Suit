import { useEffect, useState } from "react";
import api from "../../api/axios";
import { logoutUser } from "../../api/auth";
import { useNavigate, useLocation } from "react-router-dom";

import {
  Home,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Briefcase,
  Layers,
  Activity,
  DollarSign,
  Target
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState({
    users: 0,
    leads: 0,
    deals: 0,
    revenue: 0,
    active: 0,
  });

  const [error, setError] = useState(null);

  // =========================
  // FETCH (NO LOADING STATE)
  // =========================
  const fetchDashboard = async () => {
    try {
      const [usersRes, leadsRes, dealsRes] = await Promise.all([
        api.get("/users"),
        api.get("/leads"),
        api.get("/crm/deals"),
      ]);

      const users = usersRes.data?.data || [];
      const leads = leadsRes.data?.data?.leads || [];
      const deals = dealsRes.data?.data || [];

      const revenue = deals.reduce((sum, d) => sum + (d.value || 0), 0);

      setStats({
        users: users.length,
        leads: leads.length,
        deals: deals.length,
        revenue,
        active: users.filter((u) => u.isActive).length,
      });

      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard");

      if (err.response?.status === 401) {
        await logoutUser();
      }
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    fetchDashboard();
  }, []);

  // =========================
  // AUTO REFRESH
  // =========================
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboard();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // =========================
  // NAV ITEM
  // =========================
  const NavItem = ({ icon, label, path }) => {
    const active = location.pathname === path;

    return (
      <div
        onClick={() => navigate(path)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${
          active
            ? "bg-blue-600/20 text-blue-400"
            : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`}
      >
        {icon}
        {label}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen text-white bg-[#0B0F19]">

      {/* SIDEBAR */}
      <aside className="flex flex-col justify-between w-64 p-5 border-r border-gray-800 bg-black/40">
        <div>
          <h2 className="mb-8 text-xl font-bold">🚀 Growth Suite</h2>

          <nav className="space-y-2">
            <NavItem icon={<Home size={18} />} label="Dashboard" path="/admin" />
            <NavItem icon={<Users size={18} />} label="Users" path="/admin/users" />
            <NavItem icon={<Target size={18} />} label="Leads" path="/admin/leads" />
            <NavItem icon={<Briefcase size={18} />} label="CRM" path="/admin/crm" />
            <NavItem icon={<Layers size={18} />} label="Automation" path="/admin/automation" />
            <NavItem icon={<BarChart3 size={18} />} label="Analytics" path="/admin/analytics" />
            <NavItem icon={<Activity size={18} />} label="Campaigns" path="/admin/campaigns" />
            <NavItem icon={<Settings size={18} />} label="Settings" path="/admin/settings" />
          </nav>
        </div>

        <button
          onClick={logoutUser}
          className="flex items-center gap-2 text-red-400 hover:text-red-500"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* MAIN */}
      <div className="flex flex-col flex-1">

        {/* TOP BAR */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-black/30">
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>

          <div className="flex items-center gap-4">
            <div className="flex items-center px-3 py-1 bg-gray-800 rounded-lg">
              <Search size={16} className="text-gray-400" />
              <input
                placeholder="Search..."
                className="ml-2 text-sm bg-transparent outline-none"
              />
            </div>

            <Bell className="text-gray-400" />

            <div className="px-3 py-1 bg-gray-800 rounded-lg">
              Admin
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-4">

          {/* ERROR */}
          {error && (
            <div className="p-3 text-red-400 border rounded-lg bg-red-500/10 border-red-500/20">
              {error}
            </div>
          )}

          {/* KPI (ALWAYS VISIBLE — NO BLINK) */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">

            <Card title="Users" value={stats.users} icon={<Users />} />
            <Card title="Active" value={stats.active} icon={<Activity />} />
            <Card title="Leads" value={stats.leads} icon={<Target />} />
            <Card title="Deals" value={stats.deals} icon={<Briefcase />} />
            <Card title="Revenue" value={`₹${stats.revenue}`} icon={<DollarSign />} />

          </div>

        </div>
      </div>
    </div>
  );
}

/* =========================
   CARD
========================= */
function Card({ title, value, icon }) {
  return (
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{title}</p>
        <div className="text-blue-400">{icon}</div>
      </div>
      <h2 className="mt-2 text-2xl font-bold">{value}</h2>
    </div>
  );
}