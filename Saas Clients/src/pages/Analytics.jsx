// =======================================================
// src/pages/Analytics.jsx
// ULTRA ENTERPRISE ANALYTICS DASHBOARD
// REAL API + FALLBACK + FULL UI/UX OPTIMIZED
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
  // FETCH ANALYTICS
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

        // =================================================
        // API CALLS
        // =================================================

        const [
          summaryRes,
          revenueTrendRes,
        ] = await Promise.allSettled([
          API.get("/analytics/summary"),

          API.get(
            `/analytics/revenue-trend?period=${period}`
          ),
        ]);

        // =================================================
        // SUMMARY PARSER
        // =================================================

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
          }

          // AUTO CONVERT OBJECT → ARRAY
          else if (
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

          console.log(
            "✅ SUMMARY DATA:",
            summaryData
          );
        }

        // =================================================
        // REVENUE TREND PARSER
        // =================================================

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

          console.log(
            "✅ REVENUE TREND:",
            revenueData
          );
        }

        // =================================================
        // FALLBACK SUMMARY
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

        // =================================================
        // FALLBACK REVENUE TREND
        // =================================================

        if (!revenueData.length) {
          revenueData = [
            {
              _id: {
                month: "Jan",
                year: 2026,
              },
              totalRevenue: 18000,
            },

            {
              _id: {
                month: "Feb",
                year: 2026,
              },
              totalRevenue: 24000,
            },

            {
              _id: {
                month: "Mar",
                year: 2026,
              },
              totalRevenue: 31000,
            },

            {
              _id: {
                month: "Apr",
                year: 2026,
              },
              totalRevenue: 28000,
            },

            {
              _id: {
                month: "May",
                year: 2026,
              },
              totalRevenue: 45000,
            },
          ];
        }

        // =================================================
        // FINAL SET
        // =================================================

        setSummary(summaryData);

        setRevenueTrend(revenueData);
      } catch (err) {
        console.error(
          "🔥 ANALYTICS ERROR:",
          err
        );

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
  // SAFE METRIC
  // =====================================================

  // =====================================================
// SAFE METRIC
// =====================================================

const getMetric = (category) => {
  const item = summary.find(
    (s) => s.category === category
  );

  if (!item) return 0;

  // SUPPORT BOTH API STRUCTURES
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
    color: "from-emerald-500 to-cyan-500",
  },

  {
    title: "Leads",
    value: getMetric("lead_generation"),
    icon: Users,
    growth: "+24%",
    trend: "up",
    color: "from-blue-500 to-cyan-500",
  },

  {
    title: "Conversions",
    value: getMetric("conversion"),
    icon: TrendingUp,
    growth: "+18%",
    trend: "up",
    color: "from-violet-500 to-fuchsia-500",
  },

  {
    title: "Traffic",
    value: getMetric("traffic"),
    icon: Activity,
    growth: "+12%",
    trend: "up",
    color: "from-orange-500 to-amber-500",
  },
];

  // =====================================================
  // CHART DATA
  // =====================================================

  const chartData = useMemo(() => {
    return revenueTrend.map((item) => ({
      name:
        period === "daily"
          ? `${item?._id?.day || ""}/${
              item?._id?.month || ""
            }`
          : `${
              item?._id?.month || ""
            }`,

      revenue: Number(
        item?.totalRevenue ||
          item?.revenue ||
          item?.total ||
          0
      ),
    }));
  }, [revenueTrend, period]);

  // =====================================================
  // PIE DATA
  // =====================================================

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
  // FILTERED SUMMARY
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
      <div className="flex items-center justify-center min-h-screen bg-[#020617] text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 border-4 rounded-full w-14 h-14 border-cyan-400 border-t-transparent animate-spin" />

          <p className="text-slate-400">
            Loading analytics dashboard...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

return (
  <div className="min-h-screen p-4 text-white md:p-6 bg-[#020617]">

    {/* ================================================= */}
    {/* TOP BACKGROUND */}
    {/* ================================================= */}

    <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">

      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px]" />

      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px]" />
    </div>

    {/* ================================================= */}
    {/* HEADER */}
    {/* ================================================= */}

    <div className="flex flex-col gap-5 mb-8 2xl:flex-row 2xl:items-center 2xl:justify-between">

      {/* LEFT */}

      <div className="flex items-center gap-4">

        <div className="p-4 border shadow-lg rounded-3xl bg-cyan-500/10 border-cyan-500/20">

          <LayoutDashboard
            size={30}
            className="text-cyan-400"
          />
        </div>

        <div>

          <h1 className="text-2xl font-bold tracking-tight md:text-2xl">

            Analytics Dashboard
          </h1>

          <p className="mt-1 text-slate-400">

            Enterprise SaaS Intelligence Platform
          </p>
        </div>
      </div>

      {/* RIGHT */}

      <div className="flex flex-wrap items-center gap-3">

        {/* SEARCH */}

        <div className="relative">

          <Search
            size={17}
            className="absolute -translate-y-1/2 left-3 top-1/2 text-slate-500"
          />

          <input
            type="text"
            placeholder="Search analytics..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-[260px] rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm outline-none backdrop-blur-xl transition focus:border-cyan-400"
          />
        </div>

        {/* PERIOD */}

        <select
          value={period}
          onChange={(e) =>
            setPeriod(e.target.value)
          }
          className="px-4 py-3 text-sm border outline-none rounded-2xl border-white/10 bg-white/5 backdrop-blur-xl"
        >
          <option value="monthly">
            Monthly
          </option>

          <option value="daily">
            Daily
          </option>
        </select>

        {/* REFRESH */}

        <button
          onClick={() =>
            fetchAnalytics(true)
          }
          className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-black transition rounded-2xl bg-cyan-400 hover:scale-105 hover:bg-cyan-300"
        >
          <RefreshCcw
            size={16}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>
    </div>

    {/* ================================================= */}
    {/* ERROR */}
    {/* ================================================= */}

    {errorMsg && (
      <div className="flex items-center gap-3 p-4 mb-6 text-red-300 border rounded-2xl border-red-500/20 bg-red-500/10">

        <AlertCircle size={18} />

        <span>{errorMsg}</span>
      </div>
    )}

    {/* ================================================= */}
    {/* KPI CARDS */}
    {/* ================================================= */}

    <div className="grid grid-cols-1 gap-5 mb-8 md:grid-cols-2 2xl:grid-cols-4">

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
          className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] backdrop-blur-xl"
        >
          {/* GLOW */}

          <div
            className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-[0.08]`}
          />

          <div className="absolute w-40 h-40 rounded-full -top-10 -right-10 bg-cyan-400/10 blur-3xl" />

          <div className="relative p-6">

            {/* TOP */}

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  {card.title}
                </p>

                <h2 className="mt-4 text-2xl font-bold tracking-tight">

                  {card.title ===
                  "Revenue"
                    ? `₹${card.value.toLocaleString()}`
                    : card.value.toLocaleString()}
                </h2>
              </div>

              <div className="p-4 transition rounded-2xl bg-white/10 group-hover:scale-110">

                <card.icon className="text-cyan-400" />
              </div>
            </div>

            {/* BOTTOM */}

            <div className="flex items-center gap-2 mt-6">

              {card.trend === "up" ? (
                <ArrowUpRight
                  size={18}
                  className="text-emerald-400"
                />
              ) : (
                <ArrowDownRight
                  size={18}
                  className="text-red-400"
                />
              )}

              <span
                className={`text-sm font-semibold ${
                  card.trend === "up"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {card.growth}
              </span>

              <span className="text-sm text-slate-500">
                vs previous period
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

      {/* AREA CHART */}

      <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">

        <div className="flex items-center justify-between mb-6">

          <div>

            <h2 className="text-2xl font-bold">
              Revenue Trend
            </h2>

            <p className="mt-1 text-sm text-slate-400">

              Revenue growth analytics
            </p>
          </div>

          <TrendingUp className="text-cyan-400" />
        </div>

        <ResponsiveContainer
          width="100%"
          height={340}
        >
          <AreaChart data={chartData}>

            <defs>

              <linearGradient
                id="revenueGradient"
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

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#06b6d4"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* BAR CHART */}

      <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">

        <div className="flex items-center justify-between mb-6">

          <div>

            <h2 className="text-2xl font-bold">
              Revenue Comparison
            </h2>

            <p className="mt-1 text-sm text-slate-400">

              Performance metrics overview
            </p>
          </div>

          <BarChart3 className="text-cyan-400" />
        </div>

        <ResponsiveContainer
          width="100%"
          height={340}
        >
          <BarChart data={chartData}>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
            />

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="revenue"
              fill="#06b6d4"
              radius={[10, 10, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* ================================================= */}
    {/* BOTTOM SECTION */}
    {/* ================================================= */}

    <div className="grid gap-6 2xl:grid-cols-3">

      {/* PIE CHART */}

      <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">

        <div className="flex items-center gap-3 mb-6">

          <Database className="text-cyan-400" />

          <h2 className="text-2xl font-bold">
            Distribution
          </h2>
        </div>

        <ResponsiveContainer
          width="100%"
          height={340}
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

      {/* SUMMARY */}

      <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl 2xl:col-span-2">

        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">

          <div>

            <h2 className="text-2xl font-black">
              Analytics Summary
            </h2>

            <p className="mt-1 text-sm text-slate-400">

              Business intelligence insights
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 text-sm border w-fit rounded-2xl border-white/10 bg-white/5 text-slate-300">

            <Filter size={15} />

            {filteredSummary.length} Results
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="text-sm border-b border-white/10 text-slate-400">

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
                      className="border-b border-white/5 transition hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-5">

                        <div className="flex items-center gap-3">

                          <div className="w-3 h-3 rounded-full bg-cyan-400" />

                          <span className="capitalize text-slate-200">

                            {item.category.replaceAll(
                              "_",
                              " "
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-5 font-bold text-white">

                        ₹
                        {Number(
                          item.totalValue ||
                            item.total ||
                            0
                        ).toLocaleString()}
                      </td>

                      <td className="px-4 py-5 text-slate-300">

                        ₹
                        {Number(
                          item.avgValue ||
                            item.avg ||
                            0
                        ).toLocaleString()}
                      </td>

                      <td className="px-4 py-5">

                        <div className="inline-flex items-center gap-2 px-3 py-1 text-sm border rounded-xl border-white/10 bg-white/5 text-slate-300">

                          <Activity size={14} />

                          {item.count || 0}
                        </div>
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
);
}