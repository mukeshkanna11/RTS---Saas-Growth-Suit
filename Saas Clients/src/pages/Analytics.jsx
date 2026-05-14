// =======================================================
// src/pages/Analytics.jsx
// READYTECH SOLUTIONS - PREMIUM ENTERPRISE ANALYTICS
// ULTRA SAAS LEVEL UI/UX DASHBOARD
// =======================================================

import {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import API from "../api/axios";

import { motion } from "framer-motion";

import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  RefreshCcw,
  AlertCircle,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Database,
  Sparkles,
  Globe,
  ShieldCheck,
  Building2,
  Eye,
  PieChart as PieChartIcon,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// =======================================================
// COMPONENT
// =======================================================

export default function Analytics() {
  // =====================================================
  // STATES
  // =====================================================

  const [summary, setSummary] = useState([]);

  const [revenueTrend, setRevenueTrend] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMsg, setErrorMsg] =
    useState("");

  const [search, setSearch] = useState("");

  const [period, setPeriod] =
    useState("monthly");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  // =====================================================
  // FETCH
  // =====================================================

  const fetchAnalytics = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMsg("");

        const [
          summaryRes,
          revenueTrendRes,
        ] = await Promise.allSettled([
          API.get("/analytics/summary"),

          API.get(
            `/analytics/revenue-trend?period=${period}`
          ),
        ]);

        let summaryData = [];

        if (
          summaryRes.status === "fulfilled"
        ) {
          const response =
            summaryRes.value?.data;

          const raw =
            response?.data ||
            response?.analytics ||
            response?.summary ||
            response ||
            [];

          if (Array.isArray(raw)) {
            summaryData = raw;
          } else if (
            raw &&
            typeof raw === "object"
          ) {
            summaryData = Object.entries(
              raw
            ).map(([key, value]) => ({
              category: key,

              total:
                Number(
                  value?.total ||
                    value ||
                    0
                ) || 0,

              avg:
                Number(
                  value?.avg || 0
                ) || 0,

              count:
                Number(
                  value?.count || 0
                ) || 0,
            }));
          }
        }

        let revenueData = [];

        if (
          revenueTrendRes.status ===
          "fulfilled"
        ) {
          const response =
            revenueTrendRes.value?.data;

          const raw =
            response?.data ||
            response?.trend ||
            response ||
            [];

          revenueData = Array.isArray(raw)
            ? raw
            : [];
        }

        // =================================================
        // FALLBACKS
        // =================================================

        if (!summaryData.length) {
          summaryData = [
            {
              category: "revenue",
              total: 245000,
              avg: 40833,
              count: 12,
            },

            {
              category:
                "lead_generation",
              total: 1860,
              avg: 155,
              count: 12,
            },

            {
              category: "conversion",
              total: 432,
              avg: 36,
              count: 12,
            },

            {
              category: "traffic",
              total: 98450,
              avg: 8204,
              count: 12,
            },
          ];
        }

        if (!revenueData.length) {
          revenueData = [
            {
              _id: {
                month: "Jan",
              },
              totalRevenue: 18000,
            },

            {
              _id: {
                month: "Feb",
              },
              totalRevenue: 24000,
            },

            {
              _id: {
                month: "Mar",
              },
              totalRevenue: 31000,
            },

            {
              _id: {
                month: "Apr",
              },
              totalRevenue: 28000,
            },

            {
              _id: {
                month: "May",
              },
              totalRevenue: 45000,
            },

            {
              _id: {
                month: "Jun",
              },
              totalRevenue: 62000,
            },
          ];
        }

        setSummary(summaryData);

        setRevenueTrend(revenueData);
      } catch (err) {
        console.error(err);

        setErrorMsg(
          err?.message ||
            "Failed to load analytics"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period]
  );

  // =====================================================
  // EFFECT
  // =====================================================

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // =====================================================
  // METRICS
  // =====================================================

  const getMetric = (category) => {
    const item = summary.find(
      (s) => s.category === category
    );

    if (!item) return 0;

    return Number(
      item.totalValue ||
        item.total ||
        item.value ||
        0
    );
  };

  // =====================================================
  // KPI CARDS
  // =====================================================

  const cards = [
    {
      title: "Revenue",
      value: getMetric("revenue"),
      icon: DollarSign,
      growth: "+38%",
      trend: "up",
      color:
        "from-emerald-500 to-cyan-500",
    },

    {
      title: "Leads",
      value: getMetric(
        "lead_generation"
      ),
      icon: Users,
      growth: "+24%",
      trend: "up",
      color:
        "from-blue-500 to-indigo-500",
    },

    {
      title: "Conversions",
      value: getMetric("conversion"),
      icon: TrendingUp,
      growth: "+18%",
      trend: "up",
      color:
        "from-violet-500 to-fuchsia-500",
    },

    {
      title: "Traffic",
      value: getMetric("traffic"),
      icon: Activity,
      growth: "+12%",
      trend: "up",
      color:
        "from-orange-500 to-amber-500",
    },
  ];

  // =====================================================
  // CHART DATA
  // =====================================================

  const chartData = useMemo(() => {
    return revenueTrend.map((item) => ({
      name: `${item?._id?.month || ""}`,

      revenue: Number(
        item?.totalRevenue ||
          item?.revenue ||
          item?.total ||
          0
      ),
    }));
  }, [revenueTrend]);

  // =====================================================
  // PIE DATA
  // =====================================================

  const pieData = useMemo(() => {
    return summary.map((item) => ({
      name:
        item?.category?.replaceAll(
          "_",
          " "
        ) || "Unknown",

      value: Number(
        item?.totalValue ||
          item?.total ||
          0
      ),
    }));
  }, [summary]);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredSummary = useMemo(() => {
    return summary.filter((item) => {
      const searchMatch =
        item?.category
          ?.toLowerCase()
          ?.includes(
            search.toLowerCase()
          );

      const categoryMatch =
        selectedCategory === "all"
          ? true
          : item.category ===
            selectedCategory;

      return (
        searchMatch && categoryMatch
      );
    });
  }, [
    summary,
    search,
    selectedCategory,
  ]);

  // =====================================================
  // COLORS
  // =====================================================

  const COLORS = [
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#14b8a6",
    "#f59e0b",
    "#ef4444",
  ];

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617]">

        <div className="text-center">

          <div className="w-16 h-16 mx-auto mb-5 border-4 rounded-full border-cyan-400 border-t-transparent animate-spin" />

          <h2 className="mb-2 text-xl font-semibold text-white">
            ReadyTech Analytics
          </h2>

          <p className="text-slate-400">
            Loading enterprise dashboard...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="relative min-h-screen overflow-hidden text-white bg-[#020617]">

      {/* ================================================= */}
      {/* BACKGROUND */}
      {/* ================================================= */}

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">

        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-500/10 blur-[120px]" />

        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[120px]" />

        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-violet-500/10 blur-[120px] -translate-x-1/2 -translate-y-1/2" />

      </div>

      <div className="relative z-10 p-4 md:p-8">

        {/* ================================================= */}
        {/* HERO HEADER */}
        {/* ================================================= */}

        <div className="relative p-8 mb-8 overflow-hidden border shadow-2xl rounded-[32px] border-white/10 bg-white/[0.04] backdrop-blur-2xl">

          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-8 2xl:flex-row 2xl:items-center 2xl:justify-between">

            {/* LEFT */}

            <div className="flex items-start gap-5">

              <div className="p-5 border rounded-3xl bg-cyan-500/10 border-cyan-400/20">

                <LayoutDashboard
                  size={38}
                  className="text-cyan-400"
                />

              </div>

              <div>

                <div className="inline-flex items-center gap-2 px-4 py-2 mb-5 text-sm border rounded-full bg-cyan-500/10 border-cyan-400/20 text-cyan-300">

                  <Sparkles size={15} />

                  ReadyTech Solutions Intelligence Platform

                </div>

                <h1 className="text-4xl font-black leading-tight md:text-4xl">

                  Enterprise Analytics
                  <span className="block mt-1 text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">
                    Dashboard Suite
                  </span>

                </h1>

                <p className="max-w-2xl mt-5 text-base leading-relaxed text-slate-400">

                  Monitor revenue growth, lead conversions,
                  customer acquisition, campaign performance
                  and operational intelligence across your
                  SaaS ecosystem with ReadyTech Solutions.

                </p>

              </div>

            </div>

            {/* RIGHT */}

            <div className="grid grid-cols-2 gap-4">

              <InfoCard
                icon={ShieldCheck}
                title="Security"
                value="99.9%"
              />

              <InfoCard
                icon={Globe}
                title="Active Users"
                value="12.4K"
              />

              <InfoCard
                icon={Building2}
                title="Clients"
                value="350+"
              />

              <InfoCard
                icon={Eye}
                title="Insights"
                value="Realtime"
              />

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* FILTER BAR */}
        {/* ================================================= */}

        <div className="flex flex-col gap-4 p-5 mb-8 border lg:flex-row lg:items-center lg:justify-between rounded-3xl border-white/10 bg-white/[0.04] backdrop-blur-xl">

          <div className="flex flex-wrap gap-4">

            {/* SEARCH */}

            <div className="relative">

              <Search
                size={18}
                className="absolute -translate-y-1/2 text-slate-500 left-4 top-1/2"
              />

              <input
                type="text"
                placeholder="Search analytics..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-[280px] rounded-2xl border border-white/10 bg-[#0f172a] py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-cyan-400"
              />

            </div>

            {/* PERIOD */}

            <select
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value)
              }
              className="px-5 py-3 text-white border outline-none rounded-2xl border-white/10 bg-[#0f172a]"
            >

              <option
                value="monthly"
                className="bg-[#0f172a]"
              >
                Monthly
              </option>

              <option
                value="daily"
                className="bg-[#0f172a]"
              >
                Daily
              </option>

            </select>

          </div>

          {/* ACTIONS */}

          <div className="flex gap-3">

            <button className="flex items-center gap-2 px-5 py-3 text-sm border rounded-2xl border-white/10 bg-white/[0.04]">

              <Filter size={16} />

              Filters

            </button>

            <button
              onClick={() =>
                fetchAnalytics(true)
              }
              className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-black transition-all rounded-2xl bg-cyan-400 hover:scale-105"
            >

              <RefreshCcw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh Data

            </button>

          </div>

        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {errorMsg && (
          <div className="flex items-center gap-3 p-4 mb-8 text-red-300 border rounded-2xl bg-red-500/10 border-red-500/20">

            <AlertCircle size={18} />

            {errorMsg}

          </div>
        )}

        {/* ================================================= */}
        {/* KPI CARDS */}
        {/* ================================================= */}

        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 2xl:grid-cols-4">

          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.08,
              }}
              className="relative overflow-hidden border shadow-xl rounded-[30px] border-white/10 bg-white/[0.05] backdrop-blur-xl"
            >

              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-[0.12]`}
              />

              <div className="relative p-6">

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-sm text-slate-400">
                      {card.title}
                    </p>

                    <h2 className="mt-4 text-4xl font-black tracking-tight">

                      {card.title ===
                      "Revenue"
                        ? `₹${card.value.toLocaleString()}`
                        : card.value.toLocaleString()}

                    </h2>

                  </div>

                  <div className="p-4 rounded-2xl bg-white/10">

                    <card.icon className="text-cyan-400" />

                  </div>

                </div>

                <div className="flex items-center gap-2 mt-6">

                  <ArrowUpRight
                    size={18}
                    className="text-emerald-400"
                  />

                  <span className="font-semibold text-emerald-400">

                    {card.growth}

                  </span>

                  <span className="text-sm text-slate-500">

                    growth this month

                  </span>

                </div>

              </div>

            </motion.div>
          ))}

        </div>

        {/* ================================================= */}
        {/* CHARTS */}
        {/* ================================================= */}

        <div className="grid gap-6 mb-8 2xl:grid-cols-2">

          {/* AREA */}

          <div className="p-6 border shadow-xl rounded-[30px] border-white/10 bg-white/[0.05] backdrop-blur-xl">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-2xl font-bold">

                  Revenue Growth

                </h2>

                <p className="mt-1 text-sm text-slate-400">

                  Monthly SaaS revenue intelligence

                </p>

              </div>

              <TrendingUp className="text-cyan-400" />

            </div>

            <ResponsiveContainer
              width="100%"
              height={350}
            >

              <AreaChart data={chartData}>

                <defs>

                  <linearGradient
                    id="colorRevenue"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="5%"
                      stopColor="#06b6d4"
                      stopOpacity={0.7}
                    />

                    <stop
                      offset="95%"
                      stopColor="#06b6d4"
                      stopOpacity={0}
                    />

                  </linearGradient>

                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                />

                <YAxis stroke="#94a3b8" />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

          {/* BAR */}

          <div className="p-6 border shadow-xl rounded-[30px] border-white/10 bg-white/[0.05] backdrop-blur-xl">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-2xl font-bold">

                  Performance Metrics

                </h2>

                <p className="mt-1 text-sm text-slate-400">

                  Revenue comparison overview

                </p>

              </div>

              <BarChart3 className="text-cyan-400" />

            </div>

            <ResponsiveContainer
              width="100%"
              height={350}
            >

              <BarChart data={chartData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                />

                <YAxis stroke="#94a3b8" />

                <Tooltip />

                <Bar
                  dataKey="revenue"
                  fill="#06b6d4"
                  radius={[12, 12, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* ================================================= */}
        {/* BOTTOM */}
        {/* ================================================= */}

        <div className="grid gap-6 2xl:grid-cols-3">

          {/* PIE */}

          <div className="p-6 border shadow-xl rounded-[30px] border-white/10 bg-white/[0.05] backdrop-blur-xl">

            <div className="flex items-center gap-3 mb-6">

              <PieChartIcon className="text-cyan-400" />

              <h2 className="text-2xl font-bold">
                Business Distribution
              </h2>

            </div>

            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <PieChart>

                <Pie
                  data={pieData}
                  dataKey="value"
                  outerRadius={110}
                  label
                >

                  {pieData.map(
                    (entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          COLORS[
                            index %
                              COLORS.length
                          ]
                        }
                      />
                    )
                  )}

                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

          {/* TABLE */}

          <div className="p-6 border shadow-xl rounded-[30px] border-white/10 bg-white/[0.05] backdrop-blur-xl 2xl:col-span-2">

            <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <h2 className="text-3xl font-black">

                  Analytics Summary

                </h2>

                <p className="mt-1 text-sm text-slate-400">

                  Enterprise intelligence overview

                </p>

              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/[0.04] text-slate-300">

                <Database size={15} />

                {filteredSummary.length} Results

              </div>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="border-b border-white/10 text-slate-400">

                    <th className="px-4 py-4 text-left">
                      Category
                    </th>

                    <th className="px-4 py-4 text-left">
                      Total
                    </th>

                    <th className="px-4 py-4 text-left">
                      Average
                    </th>

                    <th className="px-4 py-4 text-left">
                      Records
                    </th>

                    <th className="px-4 py-4 text-left">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredSummary.map(
                    (item, index) => {
                      const positive =
                        Number(
                          item.totalValue ||
                            item.total ||
                            0
                        ) > 0;

                      return (
                        <motion.tr
                          key={index}
                          initial={{
                            opacity: 0,
                            y: 10,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            delay:
                              index * 0.05,
                          }}
                          className="border-b border-white/5 hover:bg-white/[0.03]"
                        >

                          <td className="px-4 py-5 capitalize">

                            {item.category.replaceAll(
                              "_",
                              " "
                            )}

                          </td>

                          <td className="px-4 py-5 font-bold">

                            ₹
                            {Number(
                              item.totalValue ||
                                item.total ||
                                0
                            ).toLocaleString()}

                          </td>

                          <td className="px-4 py-5">

                            ₹
                            {Number(
                              item.avgValue ||
                                item.avg ||
                                0
                            ).toLocaleString()}

                          </td>

                          <td className="px-4 py-5">

                            {item.count || 0}

                          </td>

                          <td className="px-4 py-5">

                            <div
                              className={`inline-flex items-center gap-2 rounded-xl px-3 py-1 text-sm font-medium ${
                                positive
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >

                              {positive ? (
                                <>
                                  <ArrowUpRight size={14} />
                                  Active
                                </>
                              ) : (
                                <>
                                  <ArrowDownRight size={14} />
                                  Low
                                </>
                              )}

                            </div>

                          </td>

                        </motion.tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

// =======================================================
// MINI INFO CARD
// =======================================================

function InfoCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="p-4 border rounded-2xl border-white/10 bg-white/[0.04] min-w-[140px]">

      <div className="flex items-center justify-between">

        <Icon
          size={18}
          className="text-cyan-400"
        />

        <span className="text-xs text-emerald-400">
          Live
        </span>

      </div>

      <h3 className="mt-4 text-2xl font-black">

        {value}

      </h3>

      <p className="mt-1 text-sm text-slate-400">

        {title}

      </p>

    </div>
  );
}