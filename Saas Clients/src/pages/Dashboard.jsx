import { useEffect, useMemo, useState, useCallback } from "react";
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
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock3,
  BarChart3,
  RefreshCcw,
} from "lucide-react";

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  // ======================================================
  // STATES
  // ======================================================
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    users: 0,
    activeUsers: 0,

    leads: 0,
    newLeads: 0,
    qualifiedLeads: 0,

    deals: 0,
    wonDeals: 0,
    lostDeals: 0,

    revenue: 0,
    pipeline: 0,
  });

  const [recentDeals, setRecentDeals] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);

  const [error, setError] = useState("");

  // ======================================================
  // PAGE TITLE
  // ======================================================
  const title = useMemo(() => {
    switch (user?.role) {
      case "admin":
        return "Admin Dashboard";

      case "manager":
        return "Manager Dashboard";

      default:
        return "Employee Dashboard";
    }
  }, [user]);

  // ======================================================
  // FETCH DASHBOARD
  // ======================================================
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      let users = [];
      let leads = [];
      let deals = [];

      // ======================================================
      // ADMIN
      // ======================================================
      if (user?.role === "admin") {
        const [usersRes, leadsRes, dealsRes] = await Promise.all([
          api.get("/users"),
          api.get("/leads"),
          api.get("/crm/deals"),
        ]);

        users = usersRes.data?.data || [];
        leads = leadsRes.data?.data?.leads || [];
        deals = dealsRes.data?.data || [];
      }

      // ======================================================
      // MANAGER
      // ======================================================
      else if (user?.role === "manager") {
        const [leadsRes, dealsRes] = await Promise.all([
          api.get("/leads/team"),
          api.get("/crm/deals/team"),
        ]);

        leads = leadsRes.data?.data || [];
        deals = dealsRes.data?.data || [];
      }

      // ======================================================
      // EMPLOYEE
      // ======================================================
      else {
        const [leadsRes, dealsRes] = await Promise.all([
          api.get("/leads/my"),
          api.get("/crm/deals/my"),
        ]);

        leads = leadsRes.data?.data || [];
        deals = dealsRes.data?.data || [];
      }

      // ======================================================
      // CALCULATIONS
      // ======================================================
      const revenue = deals
        .filter((d) => d.stage === "won")
        .reduce((a, b) => a + (b.value || 0), 0);

      const pipeline = deals
        .filter((d) => d.stage !== "won" && d.stage !== "lost")
        .reduce((a, b) => a + (b.value || 0), 0);

      setStats({
        users: users.length,

        activeUsers: users.filter((u) => u.isActive).length,

        leads: leads.length,

        newLeads: leads.filter((l) => l.status === "new").length,

        qualifiedLeads: leads.filter(
          (l) =>
            l.status === "qualified" ||
            l.pipelineStage === "qualified"
        ).length,

        deals: deals.length,

        wonDeals: deals.filter((d) => d.stage === "won").length,

        lostDeals: deals.filter((d) => d.stage === "lost").length,

        revenue,

        pipeline,
      });

      // ======================================================
      // RECENT DATA
      // ======================================================
      setRecentDeals(deals.slice(0, 5));
      setRecentLeads(leads.slice(0, 5));
    } catch (err) {
      console.error(err);

      setError("Failed to load dashboard");

      if (err.response?.status === 401) {
        await logoutUser();
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ======================================================
  // LOAD
  // ======================================================
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ======================================================
  // KPI CONFIG
  // ======================================================
  const kpis = useMemo(() => {
    // ======================================================
    // ADMIN
    // ======================================================
    if (user?.role === "admin") {
      return [
        {
          title: "Total Users",
          value: stats.users,
          icon: <Users size={20} />,
        },

        {
          title: "Active Users",
          value: stats.activeUsers,
          icon: <UserCheck size={20} />,
        },

        {
          title: "Total Leads",
          value: stats.leads,
          icon: <Target size={20} />,
        },

        {
          title: "Total Deals",
          value: stats.deals,
          icon: <Briefcase size={20} />,
        },

        {
          title: "Revenue",
          value: `₹${stats.revenue.toLocaleString()}`,
          icon: <DollarSign size={20} />,
        },

        {
          title: "Pipeline",
          value: `₹${stats.pipeline.toLocaleString()}`,
          icon: <BarChart3 size={20} />,
        },
      ];
    }

    // ======================================================
    // MANAGER
    // ======================================================
    if (user?.role === "manager") {
      return [
        {
          title: "Team Leads",
          value: stats.leads,
          icon: <Target size={20} />,
        },

        {
          title: "Qualified Leads",
          value: stats.qualifiedLeads,
          icon: <CheckCircle2 size={20} />,
        },

        {
          title: "Team Deals",
          value: stats.deals,
          icon: <Briefcase size={20} />,
        },

        {
          title: "Won Deals",
          value: stats.wonDeals,
          icon: <TrendingUp size={20} />,
        },

        {
          title: "Revenue",
          value: `₹${stats.revenue.toLocaleString()}`,
          icon: <DollarSign size={20} />,
        },
      ];
    }

    // ======================================================
    // EMPLOYEE
    // ======================================================
    return [
      {
        title: "My Leads",
        value: stats.leads,
        icon: <Target size={20} />,
      },

      {
        title: "New Leads",
        value: stats.newLeads,
        icon: <Clock3 size={20} />,
      },

      {
        title: "My Deals",
        value: stats.deals,
        icon: <Briefcase size={20} />,
      },

      {
        title: "Won Deals",
        value: stats.wonDeals,
        icon: <CheckCircle2 size={20} />,
      },
    ];
  }, [stats, user]);

  // ======================================================
  // UI
  // ======================================================
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">

      {/* ======================================================
          TOPBAR
      ====================================================== */}
      <div className="flex flex-col gap-4 px-6 py-5 border-b border-gray-800 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-3xl font-bold">{title}</h1>

          <p className="mt-1 text-sm text-gray-400">
            Welcome back, {user?.name}
          </p>
        </div>

        <div className="flex items-center gap-3">

          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-4 py-2 transition border border-gray-700 rounded-xl bg-white/5 hover:bg-white/10"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>

          <div className="flex items-center gap-2 px-4 py-2 border border-blue-500/20 rounded-xl bg-blue-500/10">
            <ShieldCheck size={16} className="text-blue-400" />

            <span className="text-sm font-medium uppercase">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          BODY
      ====================================================== */}
      <div className="p-6">

        {/* ======================================================
            COMPANY CARD
        ====================================================== */}
        <div className="p-6 mb-6 border border-gray-800 rounded-3xl bg-white/5 backdrop-blur">

          <div className="flex items-center gap-4">

            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10">
              <Building2 className="text-blue-400" />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                ReadyTech SaaS CRM
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Multi-tenant CRM platform with role-based access
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}
        {error && (
          <div className="p-4 mb-5 text-red-400 border border-red-500 rounded-2xl bg-red-500/10">
            {error}
          </div>
        )}

        {/* ======================================================
            KPI GRID
        ====================================================== */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {kpis.map((item, index) => (
            <KpiCard key={index} {...item} />
          ))}
        </div>

        {/* ======================================================
            RECENT SECTION
        ====================================================== */}
        <div className="grid grid-cols-1 gap-6 mt-8 xl:grid-cols-2">

          {/* ======================================================
              RECENT LEADS
          ====================================================== */}
          <SectionCard title="Recent Leads">

            {recentLeads.length === 0 ? (
              <EmptyState text="No leads found" />
            ) : (
              recentLeads.map((lead) => (
                <div
                  key={lead._id}
                  className="flex items-center justify-between p-4 border border-gray-800 rounded-2xl bg-white/5"
                >
                  <div>
                    <h4 className="font-medium">
                      {lead.name}
                    </h4>

                    <p className="text-sm text-gray-400">
                      {lead.companyName || "No company"}
                    </p>
                  </div>

                  <StatusBadge status={lead.status} />
                </div>
              ))
            )}
          </SectionCard>

          {/* ======================================================
              RECENT DEALS
          ====================================================== */}
          <SectionCard title="Recent Deals">

            {recentDeals.length === 0 ? (
              <EmptyState text="No deals found" />
            ) : (
              recentDeals.map((deal) => (
                <div
                  key={deal._id}
                  className="flex items-center justify-between p-4 border border-gray-800 rounded-2xl bg-white/5"
                >
                  <div>
                    <h4 className="font-medium">
                      {deal.title}
                    </h4>

                    <p className="text-sm text-gray-400">
                      ₹{deal.value?.toLocaleString()}
                    </p>
                  </div>

                  <StatusBadge status={deal.stage} />
                </div>
              ))
            )}
          </SectionCard>
        </div>

        {/* ======================================================
            LOADING
        ====================================================== */}
        {loading && (
          <div className="flex items-center justify-center mt-10">
            <div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================================================
   KPI CARD
====================================================== */
function KpiCard({ title, value, icon }) {
  return (
    <div className="relative overflow-hidden border border-gray-800 rounded-3xl bg-white/5 backdrop-blur">

      <div className="p-6">

        <div className="flex items-center justify-between">

          <p className="text-sm text-gray-400">
            {title}
          </p>

          <div className="text-blue-400">
            {icon}
          </div>
        </div>

        <h2 className="mt-4 text-3xl font-bold tracking-tight">
          {value}
        </h2>
      </div>

      <div className="absolute inset-0 opacity-0 bg-gradient-to-r from-blue-500/0 to-blue-500/10 hover:opacity-100"></div>
    </div>
  );
}

/* ======================================================
   SECTION CARD
====================================================== */
function SectionCard({ title, children }) {
  return (
    <div className="p-5 border border-gray-800 rounded-3xl bg-white/5">

      <div className="flex items-center justify-between mb-5">

        <h3 className="text-lg font-semibold">
          {title}
        </h3>

        <Activity size={18} className="text-blue-400" />
      </div>

      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

/* ======================================================
   STATUS BADGE
====================================================== */
function StatusBadge({ status }) {
  const styles = {
    new: "bg-blue-500/10 text-blue-400",
    contacted: "bg-yellow-500/10 text-yellow-400",
    qualified: "bg-purple-500/10 text-purple-400",
    proposal: "bg-indigo-500/10 text-indigo-400",
    negotiation: "bg-orange-500/10 text-orange-400",
    won: "bg-green-500/10 text-green-400",
    lost: "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
        styles[status] || "bg-gray-500/10 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

/* ======================================================
   EMPTY STATE
====================================================== */
function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center border border-gray-700 border-dashed rounded-2xl">

      <XCircle className="mb-2 text-gray-500" />

      <p className="text-sm text-gray-400">
        {text}
      </p>
    </div>
  );
}