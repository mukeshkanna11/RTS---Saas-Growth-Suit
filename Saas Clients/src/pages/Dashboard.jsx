import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import { logoutUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import {
  Users,
  Activity,
  Target,
  Briefcase,
  DollarSign,
  TrendingUp,
  Building2,
  ShieldCheck,
} from "lucide-react";

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  const [stats, setStats] = useState({
    users: 0,
    leads: 0,
    deals: 0,
    revenue: 0,
    active: 0,
  });

  const [error, setError] = useState("");

  // ========================
  // TITLE
  // ========================
  const title = useMemo(() => {
    return user?.role === "admin"
      ? "Admin Dashboard"
      : user?.role === "manager"
      ? "Manager Dashboard"
      : "Employee Dashboard";
  }, [user]);

  // ========================
  // FETCH DATA
  // ========================
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

      const revenue = deals.reduce((a, b) => a + (b.value || 0), 0);

      setStats({
        users: users.length,
        leads: leads.length,
        deals: deals.length,
        revenue,
        active: users.filter((u) => u.isActive).length,
      });
    } catch (err) {
      setError("Dashboard load failed");

      if (err.response?.status === 401) {
        await logoutUser();
      }
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ========================
  // KPI CONFIG
  // ========================
  const kpis = useMemo(() => {
    if (user?.role === "admin") {
      return [
        { title: "Users", value: stats.users, icon: <Users /> },
        { title: "Active Users", value: stats.active, icon: <Activity /> },
        { title: "Leads", value: stats.leads, icon: <Target /> },
        { title: "Deals", value: stats.deals, icon: <Briefcase /> },
        { title: "Revenue", value: `₹${stats.revenue}`, icon: <DollarSign /> },
      ];
    }

    if (user?.role === "manager") {
      return [
        { title: "Team Leads", value: stats.leads, icon: <Target /> },
        { title: "Team Deals", value: stats.deals, icon: <Briefcase /> },
        { title: "Revenue", value: `₹${stats.revenue}`, icon: <TrendingUp /> },
      ];
    }

    return [
      { title: "My Leads", value: stats.leads, icon: <Target /> },
      { title: "My Deals", value: stats.deals, icon: <Briefcase /> },
    ];
  }, [stats, user]);

  return (
    <div className="min-h-screen text-white bg-[#0B0F19]">

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-gray-400">
            Welcome back, {user?.name}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full">
          <ShieldCheck size={16} />
          {user?.role?.toUpperCase()}
        </div>
      </div>

      {/* COMPANY PROFILE CARD */}
      <div className="p-6">
        <div className="p-5 mb-6 border border-gray-800 rounded-2xl bg-white/5 backdrop-blur">
          <div className="flex items-center gap-3">
            <Building2 className="text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold">Company Overview</h2>
              <p className="text-sm text-gray-400">
                Multi-tenant SaaS CRM System
              </p>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="p-3 mb-4 text-red-400 border border-red-500 rounded-lg bg-red-500/10">
            {error}
          </div>
        )}

        {/* KPI GRID */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {kpis.map((k, i) => (
            <Card key={i} {...k} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================
   CARD UI
========================= */
function Card({ title, value, icon }) {
  return (
    <div className="relative p-5 transition border border-gray-800 rounded-2xl bg-white/5 hover:scale-[1.02]">

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{title}</p>
        <div className="text-blue-400">{icon}</div>
      </div>

      <h2 className="mt-2 text-2xl font-bold">{value}</h2>

      <div className="absolute inset-0 opacity-0 rounded-2xl bg-gradient-to-r from-blue-500/0 to-blue-500/10 hover:opacity-100"></div>
    </div>
  );
}