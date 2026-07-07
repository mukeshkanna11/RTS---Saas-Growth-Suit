import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import api from "../api/axios";
import { logoutUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";

import {
  Users, Activity, Target, Briefcase, DollarSign, TrendingUp,
  Building2, ShieldCheck, UserCheck, CheckCircle2, XCircle, Clock3,
  BarChart3, RefreshCcw, ArrowUpRight, ArrowDownRight, Sparkles,
  CalendarDays, Globe2, Zap, Wallet, LineChart, Layers3,
  PieChart, ChevronRight, Plus,
} from "lucide-react";

// ── Animation presets ─────────────────────────────────────────────────────────
const FU = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = (d = 0.07) => ({
  hidden: {},
  show:   { transition: { staggerChildren: d } },
});

// ── Accent color map (complete strings — Tailwind JIT safe) ───────────────────
const A = {
  blue:    { icon: "bg-blue-500/15 text-blue-400",     bar: "bg-blue-500",    line: "via-blue-500/50"    },
  cyan:    { icon: "bg-cyan-500/15 text-cyan-400",     bar: "bg-cyan-500",    line: "via-cyan-500/50"    },
  emerald: { icon: "bg-emerald-500/15 text-emerald-400", bar: "bg-emerald-500", line: "via-emerald-500/50" },
  violet:  { icon: "bg-violet-500/15 text-violet-400", bar: "bg-violet-500",   line: "via-violet-500/50"  },
  amber:   { icon: "bg-amber-500/15 text-amber-400",   bar: "bg-amber-500",   line: "via-amber-500/50"   },
  rose:    { icon: "bg-rose-500/15 text-rose-400",     bar: "bg-rose-500",    line: "via-rose-500/50"    },
  indigo:  { icon: "bg-indigo-500/15 text-indigo-400", bar: "bg-indigo-500",  line: "via-indigo-500/50"  },
};

// ── Quick actions (static; colour-coded with descriptions) ────────────────────
const QUICK_ACTIONS = [
  { icon: <Users size={17} />,     title: "Manage Users",        desc: "Add and control team access",   color: "blue"    },
  { icon: <Plus size={17} />,      title: "Create New Lead",     desc: "Capture new opportunities",     color: "cyan"    },
  { icon: <Briefcase size={17} />, title: "Track Deals",         desc: "Monitor your pipeline",          color: "emerald" },
  { icon: <BarChart3 size={17} />, title: "Revenue Analytics",   desc: "Deep financial insights",        color: "amber"   },
  { icon: <Activity size={17} />,  title: "Performance Reports", desc: "View team performance",          color: "violet"  },
];

// =============================================================================
// DASHBOARD
// =============================================================================
export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState({
    users: 0, activeUsers: 0,
    leads: 0, newLeads: 0, qualifiedLeads: 0,
    deals: 0, wonDeals: 0, lostDeals: 0,
    revenue: 0, pipeline: 0,
  });
  const [recentDeals, setRecentDeals] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [error, setError]             = useState("");

  // ── Title ──────────────────────────────────────────────────────────────────
  const title = useMemo(() => {
    switch (user?.role) {
      case "admin":   return "Admin Control Center";
      case "manager": return "Manager Workspace";
      default:        return "Employee Dashboard";
    }
  }, [user]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      let users = [], leads = [], deals = [];

      if (user?.role === "admin") {
        const [usersRes, leadsRes, dealsRes] = await Promise.all([
          api.get("/users"),
          api.get("/leads"),
          api.get("/crm/deals"),
        ]);
        users = usersRes.data?.data || [];
        leads = leadsRes.data?.data?.leads || [];
        deals = dealsRes.data?.data || [];
      } else if (user?.role === "manager") {
        const [leadsRes, dealsRes] = await Promise.all([
          api.get("/leads/team"),
          api.get("/crm/deals/team"),
        ]);
        leads = leadsRes.data?.data || [];
        deals = dealsRes.data?.data || [];
      } else {
        const [leadsRes, dealsRes] = await Promise.all([
          api.get("/leads/my"),
          api.get("/crm/deals/my"),
        ]);
        leads = leadsRes.data?.data || [];
        deals = dealsRes.data?.data || [];
      }

      const revenue  = deals.filter(d => d.stage === "won").reduce((a, b) => a + (b.value || 0), 0);
      const pipeline = deals.filter(d => d.stage !== "won" && d.stage !== "lost").reduce((a, b) => a + (b.value || 0), 0);

      setStats({
        users:          users.length,
        activeUsers:    users.filter(u => u.isActive).length,
        leads:          leads.length,
        newLeads:       leads.filter(l => l.status === "new").length,
        qualifiedLeads: leads.filter(l => l.status === "qualified" || l.pipelineStage === "qualified").length,
        deals:          deals.length,
        wonDeals:       deals.filter(d => d.stage === "won").length,
        lostDeals:      deals.filter(d => d.stage === "lost").length,
        revenue,
        pipeline,
      });
      setRecentDeals(deals.slice(0, 5));
      setRecentLeads(leads.slice(0, 5));
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard");
      if (err.response?.status === 401) await logoutUser();
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── KPI definitions ────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (user?.role === "admin") return [
      { title: "Total Users",  value: stats.users,                           growth: "+18%", icon: <Users size={20} />,     color: "blue"    },
      { title: "Active Users", value: stats.activeUsers,                     growth: "+12%", icon: <UserCheck size={20} />,  color: "cyan"    },
      { title: "Total Leads",  value: stats.leads,                           growth: "+22%", icon: <Target size={20} />,    color: "violet"  },
      { title: "Total Deals",  value: stats.deals,                           growth: "+8%",  icon: <Briefcase size={20} />, color: "emerald" },
      { title: "Revenue",      value: `₹${stats.revenue.toLocaleString()}`,   growth: "+31%", icon: <DollarSign size={20} />, color: "amber"  },
      { title: "Pipeline",     value: `₹${stats.pipeline.toLocaleString()}`,  growth: "+15%", icon: <BarChart3 size={20} />, color: "rose"    },
    ];
    if (user?.role === "manager") return [
      { title: "Team Leads",      value: stats.leads,                          growth: "+10%", icon: <Target size={20} />,       color: "blue"    },
      { title: "Qualified Leads", value: stats.qualifiedLeads,                 growth: "+18%", icon: <CheckCircle2 size={20} />, color: "violet"  },
      { title: "Team Deals",      value: stats.deals,                          growth: "+12%", icon: <Briefcase size={20} />,    color: "cyan"    },
      { title: "Won Deals",       value: stats.wonDeals,                       growth: "+28%", icon: <TrendingUp size={20} />,   color: "emerald" },
      { title: "Revenue",         value: `₹${stats.revenue.toLocaleString()}`,  growth: "+35%", icon: <Wallet size={20} />,       color: "amber"   },
      { title: "Pipeline",        value: `₹${stats.pipeline.toLocaleString()}`, growth: "+9%",  icon: <LineChart size={20} />,    color: "rose"    },
    ];
    return [
      { title: "My Leads",  value: stats.leads,                          growth: "+7%",  icon: <Target size={20} />,       color: "blue"    },
      { title: "New Leads", value: stats.newLeads,                       growth: "+11%", icon: <Clock3 size={20} />,       color: "cyan"    },
      { title: "My Deals",  value: stats.deals,                          growth: "+16%", icon: <Briefcase size={20} />,    color: "violet"  },
      { title: "Won Deals", value: stats.wonDeals,                       growth: "+23%", icon: <CheckCircle2 size={20} />, color: "emerald" },
      { title: "Revenue",   value: `₹${stats.revenue.toLocaleString()}`,  growth: "+29%", icon: <DollarSign size={20} />,  color: "amber"   },
      { title: "Pipeline",  value: `₹${stats.pipeline.toLocaleString()}`, growth: "+13%", icon: <PieChart size={20} />,    color: "rose"    },
    ];
  }, [stats, user]);

  // ── Metrics ────────────────────────────────────────────────────────────────
  const conversionRate = stats.leads ? ((stats.wonDeals  / stats.leads) * 100).toFixed(1) : 0;
  const lossRate       = stats.deals ? ((stats.lostDeals / stats.deals) * 100).toFixed(1) : 0;

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="min-h-screen text-white bg-[#050816] overflow-x-hidden">

      {/* ── Background ────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute w-[640px] h-[640px] rounded-full bg-blue-600/[0.07] blur-[150px] top-[-180px] left-[-180px]" />
        <div className="absolute w-[420px] h-[420px] rounded-full bg-violet-600/[0.07] blur-[120px] top-[35%] right-[3%]" />
        <div className="absolute w-[480px] h-[480px] rounded-full bg-cyan-500/[0.06] blur-[130px] bottom-[-80px] right-[-80px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-40 border-b border-white/[0.07] backdrop-blur-2xl bg-[#050816]/80">
          <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-2.5 text-[11px] font-semibold tracking-widest uppercase border rounded-full border-cyan-500/20 bg-cyan-500/[0.08] text-cyan-300">
                <Sparkles size={12} />
                Enterprise CRM Platform
              </div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back,{" "}
                <span className="font-semibold text-gray-300">{user?.name}</span>.
                Here&apos;s your live business overview.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchDashboard}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border rounded-xl border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] active:scale-95"
              >
                <RefreshCcw size={14} />
                Refresh
              </button>

              <div className="flex items-center gap-2.5 px-4 py-2.5 border rounded-xl border-blue-500/20 bg-blue-500/[0.07]">
                <ShieldCheck size={16} className="text-blue-400" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Role</p>
                  <p className="text-sm font-bold capitalize leading-tight">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main ────────────────────────────────────────────────────────── */}
        <div className="px-6 py-6 space-y-6 max-w-[1600px] mx-auto">

          {/* Hero */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={FU}
            className="relative overflow-hidden border border-white/[0.08] rounded-2xl bg-gradient-to-br from-[#0d1117] via-[#0f172a] to-[#0b1221]"
          >
            <div className="absolute top-0 right-0 w-[260px] h-[260px] bg-blue-500/[0.07] blur-[90px] pointer-events-none" />
            <div className="grid gap-8 p-7 lg:grid-cols-2">

              {/* Left */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 text-xs font-medium border rounded-full border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  System Operational
                </div>

                <h2 className="text-3xl font-black leading-tight tracking-tight">
                  ReadyTech SaaS CRM{" "}
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Intelligence
                  </span>
                </h2>

                <p className="max-w-md mt-4 text-sm leading-7 text-gray-400">
                  Enterprise CRM with secure multi-tenant architecture, intelligent lead tracking,
                  analytics-driven sales workflows and real-time team collaboration.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <HeroMiniCard icon={<Globe2 size={15} />}      title="Infrastructure" value="99.9% Uptime"     />
                  <HeroMiniCard icon={<Zap size={15} />}         title="Automation"     value="AI Powered"       />
                  <HeroMiniCard icon={<Layers3 size={15} />}     title="Architecture"   value="Multi Tenant"     />
                  <HeroMiniCard icon={<CalendarDays size={15} />} title="Analytics"     value="Realtime Insights" />
                </div>
              </div>

              {/* Right */}
              <div className="grid grid-cols-2 gap-3">
                <AnalyticsCard title="Conversion Rate" value={`${conversionRate}%`} sub="Lead to deal"  icon={<TrendingUp size={17} />}     positive />
                <AnalyticsCard title="Loss Rate"       value={`${lossRate}%`}       sub="Lost deals"    icon={<ArrowDownRight size={17} />}          />
                <AnalyticsCard title="Revenue Growth"  value="+32%"                 sub="vs last month" icon={<ArrowUpRight size={17} />}    positive />
                <AnalyticsCard
                  title="Active Pipeline"
                  value={`₹${stats.pipeline.toLocaleString()}`}
                  sub="Open opportunities"
                  icon={<BarChart3 size={17} />}
                  positive
                />
              </div>
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 text-red-300 border border-red-500/20 rounded-xl bg-red-500/[0.07]">
              <XCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* KPI Grid */}
          <motion.div
            variants={stagger(0.07)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {kpis.map((item, i) => (
              <KpiCard key={i} {...item} />
            ))}
          </motion.div>

          {/* Insights row */}
          <motion.div
            variants={stagger(0.1)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-5 xl:grid-cols-3"
          >
            {/* Company Overview */}
            <motion.div variants={FU} className="xl:col-span-2">
              <SectionCard title="Company Overview" icon={Building2}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <OverviewCard title="Business Growth"   value="+42%"        desc="Revenue growth in current quarter."   icon={<TrendingUp size={17} />}  color="emerald" />
                  <OverviewCard title="Lead Performance"  value={stats.leads}  desc="Total captured and managed leads."    icon={<Target size={17} />}      color="blue"    />
                  <OverviewCard title="Team Productivity" value="94%"          desc="Operational efficiency across teams." icon={<Users size={17} />}       color="violet"  />
                  <OverviewCard title="Customer Success"  value="98%"          desc="Client satisfaction and retention."   icon={<ShieldCheck size={17} />} color="amber"   />
                </div>
              </SectionCard>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={FU}>
              <SectionCard title="Quick Actions" icon={Zap}>
                <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-2">
                  {QUICK_ACTIONS.map((a, i) => (
                    <QuickAction key={i} {...a} />
                  ))}
                </motion.div>
              </SectionCard>
            </motion.div>
          </motion.div>

          {/* Recent Data */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

            <SectionCard title="Recent Leads" icon={Target}>
              {recentLeads.length === 0 ? (
                <EmptyState text="No leads found" />
              ) : (
                <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-2">
                  {recentLeads.map(lead => (
                    <ActivityRow key={lead._id} item={lead} type="lead" />
                  ))}
                </motion.div>
              )}
            </SectionCard>

            <SectionCard title="Recent Deals" icon={Briefcase}>
              {recentDeals.length === 0 ? (
                <EmptyState text="No deals found" />
              ) : (
                <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-2">
                  {recentDeals.map(deal => (
                    <ActivityRow key={deal._id} item={deal} type="deal" />
                  ))}
                </motion.div>
              )}
            </SectionCard>
          </div>

          {/* Performance */}
          <motion.div
            variants={stagger(0.1)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
          >
            <PerformanceCard
              title="Qualified Leads"
              value={stats.qualifiedLeads}
              total={stats.leads}
              desc="High intent customer opportunities."
              icon={<CheckCircle2 size={20} />}
              color="violet"
            />
            <PerformanceCard
              title="Won Deals"
              value={stats.wonDeals}
              total={stats.deals}
              desc="Successfully closed business deals."
              icon={<TrendingUp size={20} />}
              color="emerald"
            />
            <PerformanceCard
              title="Lost Deals"
              value={stats.lostDeals}
              total={stats.deals}
              desc="Opportunities requiring follow-up."
              icon={<XCircle size={20} />}
              color="rose"
            />
          </motion.div>

          {/* Footer */}
          <div className="flex flex-col gap-4 p-5 border border-white/[0.07] rounded-2xl bg-white/[0.02] lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-semibold tracking-tight">ReadyTech Enterprise CRM Suite</h3>
              <p className="mt-1 text-sm text-gray-500">
                Secure SaaS with enterprise scalability, advanced analytics and intelligent automation.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all bg-blue-600 rounded-xl hover:bg-blue-500 active:scale-95 flex-shrink-0">
              Explore Reports
              <ChevronRight size={15} />
            </button>
          </div>

        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm bg-[#050816]/75">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-[2px] border-white/10 border-t-blue-500 animate-spin" />
            <div
              className="absolute inset-1.5 rounded-full border-[2px] border-transparent border-b-cyan-400/70 animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "0.65s" }}
            />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-400">Syncing workspace...</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// KPI CARD
// =============================================================================
function KpiCard({ title, value, growth, icon, color = "blue" }) {
  const c = A[color] || A.blue;
  return (
    <motion.div
      variants={FU}
      className="relative overflow-hidden group border border-white/[0.07] bg-[#0c1018]/70 backdrop-blur-xl rounded-2xl hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
    >
      {/* Accent top line */}
      <div className={`absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent ${c.line} to-transparent`} />

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.icon}`}>
            {icon}
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/[0.09] border border-emerald-500/20 rounded-full px-2.5 py-1">
            <ArrowUpRight size={11} />
            {growth}
          </span>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">{title}</p>
          <h3 className="mt-1.5 text-3xl font-black tracking-tight">{value}</h3>
        </div>

        {/* Decorative sparkline */}
        <div className="mt-4 h-8 opacity-[0.13] group-hover:opacity-25 transition-opacity overflow-hidden">
          <svg viewBox="0 0 120 32" preserveAspectRatio="none" className="w-full h-full text-current">
            <polyline
              points="0,28 12,20 24,24 36,14 48,18 60,10 72,14 84,7 96,10 108,3 120,6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none transition-opacity" />
    </motion.div>
  );
}

// =============================================================================
// SECTION CARD  (replaces PremiumCard)
// =============================================================================
function SectionCard({ title, children, icon: Icon = Activity }) {
  return (
    <div className="p-5 border border-white/[0.07] rounded-2xl bg-[#0c1018]/60 backdrop-blur-xl h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold tracking-tight">{title}</h3>
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <Icon size={14} className="text-gray-500" />
        </div>
      </div>
      {children}
    </div>
  );
}

// =============================================================================
// HERO MINI CARD
// =============================================================================
function HeroMiniCard({ icon, title, value }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
      <div className="text-cyan-400 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{title}</p>
        <p className="text-sm font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// =============================================================================
// ANALYTICS CARD  (hero right column)
// =============================================================================
function AnalyticsCard({ title, value, sub, icon, positive = false }) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-4 border ${
      positive
        ? "border-emerald-500/20 bg-emerald-500/[0.05]"
        : "border-rose-500/20 bg-rose-500/[0.05]"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          positive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
        }`}>
          {icon}
        </div>
        <span className={`text-[10px] font-black ${positive ? "text-emerald-400" : "text-rose-400"}`}>
          {positive ? "▲" : "▼"}
        </span>
      </div>
      <h3 className="text-2xl font-black">{value}</h3>
      <p className="text-xs font-semibold mt-1 text-gray-300">{title}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}

// =============================================================================
// OVERVIEW CARD
// =============================================================================
function OverviewCard({ title, value, desc, icon, color = "blue" }) {
  const c = A[color] || A.blue;
  return (
    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
        <ArrowUpRight size={14} className="text-gray-600" />
      </div>
      <h3 className="mt-4 text-2xl font-black">{value}</h3>
      <p className="mt-1 text-sm font-semibold text-gray-200">{title}</p>
      <p className="mt-1 text-xs leading-5 text-gray-500">{desc}</p>
    </div>
  );
}

// =============================================================================
// QUICK ACTION
// =============================================================================
function QuickAction({ icon, title, desc, color = "blue" }) {
  const c = A[color] || A.blue;
  return (
    <motion.button
      variants={FU}
      className="flex items-center justify-between w-full p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-200 group text-left"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c.icon}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{title}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
        </div>
      </div>
      <ChevronRight
        size={14}
        className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all flex-shrink-0"
      />
    </motion.button>
  );
}

// =============================================================================
// ACTIVITY ROW  (unified leads + deals)
// =============================================================================
function ActivityRow({ item, type }) {
  const name     = type === "lead" ? item.name  : item.title;
  const subtitle = type === "lead"
    ? (item.companyName || "Independent")
    : `₹${item.value?.toLocaleString() || 0}`;
  const status   = type === "lead" ? item.status : item.stage;
  const initials = (name || "?").split(" ").slice(0, 2).map(w => w?.[0]?.toUpperCase()).join("");
  const avatarCls = type === "lead"
    ? "from-blue-500/40 to-cyan-500/20 text-blue-300"
    : "from-emerald-500/40 to-teal-500/20 text-emerald-300";

  return (
    <motion.div
      variants={FU}
      className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold bg-gradient-to-br ${avatarCls}`}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{name}</p>
          <p className="text-[11px] text-gray-500 truncate">{subtitle}</p>
        </div>
      </div>
      <StatusBadge status={status} />
    </motion.div>
  );
}

// =============================================================================
// PERFORMANCE CARD
// =============================================================================
function PerformanceCard({ title, value, total, desc, icon, color = "cyan" }) {
  const c   = A[color] || A.cyan;
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

  return (
    <motion.div variants={FU} className="p-5 border border-white/[0.07] rounded-2xl bg-[#0c1018]/60 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Live</span>
      </div>

      <h2 className="mt-5 text-4xl font-black">{value}</h2>
      <h3 className="mt-1.5 font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-gray-500">{desc}</p>

      {/* Progress bar */}
      <div className="mt-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Progress</span>
          <span className="text-[11px] font-bold text-gray-400">{pct}%</span>
        </div>
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${c.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// STATUS BADGE
// =============================================================================
function StatusBadge({ status }) {
  const styles = {
    new:         "bg-blue-500/10 text-blue-300 border-blue-500/20",
    contacted:   "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
    qualified:   "bg-purple-500/10 text-purple-300 border-purple-500/20",
    proposal:    "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    negotiation: "bg-orange-500/10 text-orange-300 border-orange-500/20",
    won:         "bg-green-500/10 text-green-300 border-green-500/20",
    lost:        "bg-red-500/10 text-red-300 border-red-500/20",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border flex-shrink-0 ${
      styles[status] || "bg-gray-500/10 text-gray-300 border-gray-500/20"
    }`}>
      {status}
    </span>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================
function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl border-white/[0.08]">
      <div className="w-11 h-11 mb-3 rounded-xl bg-white/[0.04] flex items-center justify-center">
        <XCircle size={18} className="text-gray-600" />
      </div>
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
