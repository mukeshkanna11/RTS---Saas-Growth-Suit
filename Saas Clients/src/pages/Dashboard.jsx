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
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Bell,
  CalendarDays,
  Globe2,
  Zap,
  Wallet,
  LineChart,
  Layers3,
  PieChart,
  ChevronRight,
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
  // TITLE
  // ======================================================
  const title = useMemo(() => {
    switch (user?.role) {
      case "admin":
        return "Admin Control Center";

      case "manager":
        return "Manager Workspace";

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
  // KPI
  // ======================================================
  const kpis = useMemo(() => {
    if (user?.role === "admin") {
      return [
        {
          title: "Total Users",
          value: stats.users,
          growth: "+18%",
          icon: <Users size={22} />,
        },

        {
          title: "Active Users",
          value: stats.activeUsers,
          growth: "+12%",
          icon: <UserCheck size={22} />,
        },

        {
          title: "Total Leads",
          value: stats.leads,
          growth: "+22%",
          icon: <Target size={22} />,
        },

        {
          title: "Total Deals",
          value: stats.deals,
          growth: "+8%",
          icon: <Briefcase size={22} />,
        },

        {
          title: "Revenue",
          value: `₹${stats.revenue.toLocaleString()}`,
          growth: "+31%",
          icon: <DollarSign size={22} />,
        },

        {
          title: "Pipeline",
          value: `₹${stats.pipeline.toLocaleString()}`,
          growth: "+15%",
          icon: <BarChart3 size={22} />,
        },
      ];
    }

    if (user?.role === "manager") {
      return [
        {
          title: "Team Leads",
          value: stats.leads,
          growth: "+10%",
          icon: <Target size={22} />,
        },

        {
          title: "Qualified Leads",
          value: stats.qualifiedLeads,
          growth: "+18%",
          icon: <CheckCircle2 size={22} />,
        },

        {
          title: "Team Deals",
          value: stats.deals,
          growth: "+12%",
          icon: <Briefcase size={22} />,
        },

        {
          title: "Won Deals",
          value: stats.wonDeals,
          growth: "+28%",
          icon: <TrendingUp size={22} />,
        },

        {
          title: "Revenue",
          value: `₹${stats.revenue.toLocaleString()}`,
          growth: "+35%",
          icon: <Wallet size={22} />,
        },

        {
          title: "Pipeline",
          value: `₹${stats.pipeline.toLocaleString()}`,
          growth: "+9%",
          icon: <LineChart size={22} />,
        },
      ];
    }

    return [
      {
        title: "My Leads",
        value: stats.leads,
        growth: "+7%",
        icon: <Target size={22} />,
      },

      {
        title: "New Leads",
        value: stats.newLeads,
        growth: "+11%",
        icon: <Clock3 size={22} />,
      },

      {
        title: "My Deals",
        value: stats.deals,
        growth: "+16%",
        icon: <Briefcase size={22} />,
      },

      {
        title: "Won Deals",
        value: stats.wonDeals,
        growth: "+23%",
        icon: <CheckCircle2 size={22} />,
      },

      {
        title: "Revenue",
        value: `₹${stats.revenue.toLocaleString()}`,
        growth: "+29%",
        icon: <DollarSign size={22} />,
      },

      {
        title: "Pipeline",
        value: `₹${stats.pipeline.toLocaleString()}`,
        growth: "+13%",
        icon: <PieChart size={22} />,
      },
    ];
  }, [stats, user]);

  // ======================================================
  // METRICS
  // ======================================================
  const conversionRate = stats.leads
    ? ((stats.wonDeals / stats.leads) * 100).toFixed(1)
    : 0;

  const lossRate = stats.deals
    ? ((stats.lostDeals / stats.deals) * 100).toFixed(1)
    : 0;

  // ======================================================
  // UI
  // ======================================================
  return (
    <div className="min-h-screen text-white bg-[#050816] overflow-hidden">

      {/* ======================================================
          BACKGROUND
      ====================================================== */}
      <div className="fixed inset-0 z-0 pointer-events-none">

        <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] top-[-120px] left-[-120px]" />

        <div className="absolute w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[120px] bottom-[-120px] right-[-120px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative z-10">

        {/* ======================================================
            HEADER
        ====================================================== */}
        <div className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-2xl bg-[#050816]/80">

          <div className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 text-xs font-semibold tracking-wider uppercase border rounded-full border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                <Sparkles size={14} />
                Enterprise CRM Platform
              </div>

              <h1 className="text-3xl font-bold tracking-tight lg:text-3xl">
                {title}
              </h1>

              <p className="mt-2 text-gray-400">
                Welcome back,{" "}
                <span className="font-semibold text-white">
                  {user?.name}
                </span>
                . Here's your complete business overview and
                live performance metrics.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              <button
                onClick={fetchDashboard}
                className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-300 border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 hover:scale-[1.02]"
              >
                <RefreshCcw size={16} />
                Refresh Data
              </button>

              <div className="flex items-center gap-3 px-5 py-3 border rounded-2xl border-blue-500/20 bg-blue-500/10">

                <ShieldCheck
                  size={18}
                  className="text-blue-400"
                />

                <div>
                  <p className="text-xs text-gray-400">
                    ACCESS ROLE
                  </p>

                  <p className="text-sm font-semibold uppercase">
                    {user?.role}
                  </p>
                </div>
              </div>

              {/* <button className="relative flex items-center justify-center w-12 h-12 transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10">
                <Bell size={18} />

                <span className="absolute w-2 h-2 bg-red-500 rounded-full top-2 right-2"></span>
              </button> */}
            </div>
          </div>
        </div>

        {/* ======================================================
            MAIN
        ====================================================== */}
        <div className="p-6">

          {/* ======================================================
              HERO SECTION
          ====================================================== */}
          <div className="relative overflow-hidden border shadow-2xl rounded-[32px] border-white/10 bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#0B1120]">

            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 blur-[100px]" />

            <div className="grid gap-10 p-8 lg:grid-cols-2 lg:p-10">

              {/* LEFT */}
              <div>

                <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium border rounded-full border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                  <Activity size={16} />
                  System Operational
                </div>

                <h2 className="max-w-2xl text-4xl font-black leading-tight font-poppins lg:text-4xl">
                  ReadyTech SaaS CRM <span className="text-cyan-400">Intelligence Platform</span>
                </h2>

                <p className="max-w-xl mt-5 leading-8 text-gray-400">
                  Advanced enterprise CRM ecosystem designed
                  for modern organizations with secure
                  multi-tenant architecture, intelligent lead
                  tracking, analytics-driven sales workflows
                  and real-time team collaboration tools.
                </p>

                <div className="grid grid-cols-2 gap-4 mt-8">

                  <HeroMiniCard
                    icon={<Globe2 size={18} />}
                    title="Global Infrastructure"
                    value="99.9% Uptime"
                  />

                  <HeroMiniCard
                    icon={<Zap size={18} />}
                    title="Automation"
                    value="AI Powered"
                  />

                  <HeroMiniCard
                    icon={<Layers3 size={18} />}
                    title="Multi Tenant"
                    value="Secure Access"
                  />

                  <HeroMiniCard
                    icon={<CalendarDays size={18} />}
                    title="Analytics"
                    value="Realtime Insights"
                  />
                </div>
              </div>

              {/* RIGHT */}
              <div className="grid grid-cols-2 gap-5">

                <AnalyticsCard
                  title="Conversion Rate"
                  value={`${conversionRate}%`}
                  sub="Lead to deal conversion"
                  icon={<TrendingUp size={20} />}
                />

                <AnalyticsCard
                  title="Loss Rate"
                  value={`${lossRate}%`}
                  sub="Lost opportunity ratio"
                  icon={<ArrowDownRight size={20} />}
                />

                <AnalyticsCard
                  title="Revenue Growth"
                  value="+32%"
                  sub="Compared to last month"
                  icon={<ArrowUpRight size={20} />}
                />

                <AnalyticsCard
                  title="Active Pipeline"
                  value={`₹${stats.pipeline.toLocaleString()}`}
                  sub="Current open opportunities"
                  icon={<BarChart3 size={20} />}
                />
              </div>
            </div>
          </div>

          {/* ======================================================
              ERROR
          ====================================================== */}
          {error && (
            <div className="p-4 mt-6 text-red-300 border border-red-500/20 rounded-2xl bg-red-500/10">
              {error}
            </div>
          )}

          {/* ======================================================
              KPI GRID
          ====================================================== */}
          <div className="grid grid-cols-1 gap-6 mt-8 sm:grid-cols-2 xl:grid-cols-3">

            {kpis.map((item, index) => (
              <KpiCard key={index} {...item} />
            ))}
          </div>

          {/* ======================================================
              INSIGHTS
          ====================================================== */}
          <div className="grid grid-cols-1 gap-6 mt-8 xl:grid-cols-3">

            {/* COMPANY OVERVIEW */}
            <div className="xl:col-span-2">

              <PremiumCard title="Company Overview">

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  <OverviewCard
                    title="Business Growth"
                    value="+42%"
                    desc="Revenue growth in the current quarter."
                    icon={<TrendingUp size={20} />}
                  />

                  <OverviewCard
                    title="Lead Performance"
                    value={stats.leads}
                    desc="Total captured and managed leads."
                    icon={<Target size={20} />}
                  />

                  <OverviewCard
                    title="Team Productivity"
                    value="94%"
                    desc="Operational efficiency across teams."
                    icon={<Users size={20} />}
                  />

                  <OverviewCard
                    title="Customer Success"
                    value="98%"
                    desc="Client satisfaction and retention rate."
                    icon={<ShieldCheck size={20} />}
                  />
                </div>
              </PremiumCard>
            </div>

            {/* QUICK ACTIONS */}
            <div>

              <PremiumCard title="Quick Actions">

                <div className="space-y-4">

                  <QuickAction
                    icon={<Users size={18} />}
                    title="Manage Users"
                  />

                  <QuickAction
                    icon={<Target size={18} />}
                    title="Create New Lead"
                  />

                  <QuickAction
                    icon={<Briefcase size={18} />}
                    title="Track Deals"
                  />

                  <QuickAction
                    icon={<DollarSign size={18} />}
                    title="Revenue Analytics"
                  />

                  <QuickAction
                    icon={<Activity size={18} />}
                    title="Performance Reports"
                  />
                </div>
              </PremiumCard>
            </div>
          </div>

          {/* ======================================================
              RECENT DATA
          ====================================================== */}
          <div className="grid grid-cols-1 gap-6 mt-8 xl:grid-cols-2">

            {/* LEADS */}
            <PremiumCard title="Recent Leads">

              {recentLeads.length === 0 ? (
                <EmptyState text="No leads found" />
              ) : (
                <div className="space-y-4">

                  {recentLeads.map((lead) => (
                    <div
                      key={lead._id}
                      className="flex items-center justify-between p-4 transition border rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                    >

                      <div className="flex items-center gap-4">

                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10">
                          <Users
                            size={20}
                            className="text-blue-400"
                          />
                        </div>

                        <div>
                          <h4 className="font-semibold">
                            {lead.name}
                          </h4>

                          <p className="text-sm text-gray-400">
                            {lead.companyName ||
                              "No company"}
                          </p>
                        </div>
                      </div>

                      <StatusBadge status={lead.status} />
                    </div>
                  ))}
                </div>
              )}
            </PremiumCard>

            {/* DEALS */}
            <PremiumCard title="Recent Deals">

              {recentDeals.length === 0 ? (
                <EmptyState text="No deals found" />
              ) : (
                <div className="space-y-4">

                  {recentDeals.map((deal) => (
                    <div
                      key={deal._id}
                      className="flex items-center justify-between p-4 transition border rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                    >

                      <div className="flex items-center gap-4">

                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10">
                          <Briefcase
                            size={20}
                            className="text-emerald-400"
                          />
                        </div>

                        <div>
                          <h4 className="font-semibold">
                            {deal.title}
                          </h4>

                          <p className="text-sm text-gray-400">
                            ₹
                            {deal.value?.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <StatusBadge status={deal.stage} />
                    </div>
                  ))}
                </div>
              )}
            </PremiumCard>
          </div>

          {/* ======================================================
              PERFORMANCE SECTION
          ====================================================== */}
          <div className="grid grid-cols-1 gap-6 mt-8 lg:grid-cols-3">

            <PerformanceCard
              title="Qualified Leads"
              value={stats.qualifiedLeads}
              desc="High intent customer opportunities."
              icon={<CheckCircle2 size={20} />}
            />

            <PerformanceCard
              title="Won Deals"
              value={stats.wonDeals}
              desc="Successfully closed business deals."
              icon={<TrendingUp size={20} />}
            />

            <PerformanceCard
              title="Lost Deals"
              value={stats.lostDeals}
              desc="Opportunities requiring follow-up."
              icon={<XCircle size={20} />}
            />
          </div>

          {/* ======================================================
              FOOTER
          ====================================================== */}
          <div className="mt-10">

            <div className="flex flex-col gap-4 p-6 border rounded-3xl border-white/10 bg-white/[0.03] lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h3 className="text-lg font-semibold">
                  ReadyTech Enterprise CRM Suite
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Secure SaaS infrastructure with enterprise
                  scalability, advanced analytics and
                  intelligent workflow automation.
                </p>
              </div>

              <button className="flex items-center gap-2 px-5 py-3 font-medium transition bg-blue-600 rounded-2xl hover:bg-blue-500">
                Explore Reports
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* ======================================================
              LOADING
          ====================================================== */}
          {loading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">

              <div className="flex flex-col items-center">

                <div className="border-4 border-blue-500 rounded-full w-14 h-14 border-t-transparent animate-spin"></div>

                <p className="mt-4 text-sm text-gray-300">
                  Loading dashboard...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   KPI CARD
====================================================== */
function KpiCard({ title, value, growth, icon }) {
  return (
    <div className="relative overflow-hidden transition-all duration-300 border group rounded-[28px] border-white/10 bg-white/[0.04] hover:bg-white/[0.06] hover:-translate-y-1">

      <div className="absolute inset-0 opacity-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent group-hover:opacity-100"></div>

      <div className="relative p-6">

        <div className="flex items-center justify-between">

          <div className="flex items-center justify-center w-12 h-12 text-blue-400 rounded-2xl bg-blue-500/10">
            {icon}
          </div>

          <div className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full text-emerald-300 bg-emerald-500/10">
            <ArrowUpRight size={12} />
            {growth}
          </div>
        </div>

        <div className="mt-6">

          <p className="text-sm text-gray-400">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight">
            {value}
          </h2>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   PREMIUM CARD
====================================================== */
function PremiumCard({ title, children }) {
  return (
    <div className="p-6 border rounded-[30px] border-white/10 bg-white/[0.04] backdrop-blur-xl">

      <div className="flex items-center justify-between mb-6">

        <h3 className="text-xl font-bold">
          {title}
        </h3>

        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-500/10">
          <Activity
            size={18}
            className="text-blue-400"
          />
        </div>
      </div>

      {children}
    </div>
  );
}

/* ======================================================
   HERO MINI CARD
====================================================== */
function HeroMiniCard({ icon, title, value }) {
  return (
    <div className="p-4 border rounded-2xl border-white/10 bg-white/[0.04]">

      <div className="flex items-center gap-3">

        <div className="text-cyan-400">
          {icon}
        </div>

        <div>
          <p className="text-xs text-gray-400">
            {title}
          </p>

          <h4 className="mt-1 font-semibold">
            {value}
          </h4>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   ANALYTICS CARD
====================================================== */
function AnalyticsCard({
  title,
  value,
  sub,
  icon,
}) {
  return (
    <div className="relative overflow-hidden border rounded-3xl border-white/10 bg-white/[0.04] p-6">

      <div className="flex items-center justify-between">

        <div className="flex items-center justify-center w-12 h-12 text-blue-400 rounded-2xl bg-blue-500/10">
          {icon}
        </div>

        <TrendingUp
          size={18}
          className="text-emerald-400"
        />
      </div>

      <h2 className="mt-6 text-3xl font-black">
        {value}
      </h2>

      <p className="mt-2 font-medium">
        {title}
      </p>

      <p className="mt-1 text-sm text-gray-400">
        {sub}
      </p>
    </div>
  );
}

/* ======================================================
   OVERVIEW CARD
====================================================== */
function OverviewCard({
  title,
  value,
  desc,
  icon,
}) {
  return (
    <div className="p-5 transition border rounded-3xl border-white/10 bg-white/[0.03] hover:bg-white/[0.05]">

      <div className="flex items-center justify-between">

        <div className="flex items-center justify-center w-12 h-12 text-indigo-400 rounded-2xl bg-indigo-500/10">
          {icon}
        </div>

        <ArrowUpRight
          size={18}
          className="text-emerald-400"
        />
      </div>

      <h2 className="mt-5 text-3xl font-black">
        {value}
      </h2>

      <p className="mt-2 text-lg font-semibold">
        {title}
      </p>

      <p className="mt-1 text-sm leading-6 text-gray-400">
        {desc}
      </p>
    </div>
  );
}

/* ======================================================
   QUICK ACTION
====================================================== */
function QuickAction({ icon, title }) {
  return (
    <button className="flex items-center justify-between w-full p-4 transition border rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.06]">

      <div className="flex items-center gap-3">

        <div className="flex items-center justify-center w-10 h-10 text-blue-400 rounded-xl bg-blue-500/10">
          {icon}
        </div>

        <span className="font-medium">
          {title}
        </span>
      </div>

      <ChevronRight
        size={18}
        className="text-gray-500"
      />
    </button>
  );
}

/* ======================================================
   PERFORMANCE CARD
====================================================== */
function PerformanceCard({
  title,
  value,
  desc,
  icon,
}) {
  return (
    <div className="p-6 border rounded-[28px] border-white/10 bg-white/[0.04]">

      <div className="flex items-center justify-between">

        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400">
          {icon}
        </div>

        <span className="text-xs text-gray-400">
          Updated Live
        </span>
      </div>

      <h2 className="mt-6 text-4xl font-black">
        {value}
      </h2>

      <h3 className="mt-2 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-gray-400">
        {desc}
      </p>
    </div>
  );
}

/* ======================================================
   STATUS BADGE
====================================================== */
function StatusBadge({ status }) {
  const styles = {
    new: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
    contacted:
      "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20",
    qualified:
      "bg-purple-500/10 text-purple-300 border border-purple-500/20",
    proposal:
      "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20",
    negotiation:
      "bg-orange-500/10 text-orange-300 border border-orange-500/20",
    won: "bg-green-500/10 text-green-300 border border-green-500/20",
    lost: "bg-red-500/10 text-red-300 border border-red-500/20",
  };

  return (
    <span
      className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
        styles[status] ||
        "bg-gray-500/10 text-gray-300 border border-gray-500/20"
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
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-3xl border-white/10 bg-white/[0.02]">

      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-white/5">

        <XCircle className="text-gray-500" />
      </div>

      <p className="text-sm text-gray-400">
        {text}
      </p>
    </div>
  );
}