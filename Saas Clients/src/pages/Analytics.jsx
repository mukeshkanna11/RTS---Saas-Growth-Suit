// =======================================================
// src/pages/Analytics.jsx
// FULL ENTERPRISE SAAS ANALYTICS DASHBOARD
// FULLY WORKING + OPTIMIZED VERSION
// =======================================================

import { useEffect, useMemo, useState } from "react";
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

  const fetchAnalytics = async (
    showRefresh = false
  ) => {
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
      ] = await Promise.all([
        API.get("/analytics/summary"),

        API.get(
          `/analytics/revenue-trend?period=${period}`
        ),
      ]);

      setSummary(
        summaryRes?.data?.data || []
      );

      setRevenueTrend(
        revenueTrendRes?.data?.data || []
      );
    } catch (err) {
      console.error(
        "ANALYTICS ERROR:",
        err
      );

      setErrorMsg(
        err?.response?.data?.message ||
          "Unable to load analytics"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // EFFECT
  // =====================================================

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  // =====================================================
  // SAFE METRIC
  // =====================================================

  const getMetric = (category) => {
  const item = summary.find(
    (s) => s.category === category
  );

  return item?.total || 0;
};

  // =====================================================
  // KPI CARDS
  // =====================================================

  const cards = [
    {
      title: "Revenue",
      value: getMetric("revenue"),
      icon: DollarSign,
      growth: "+18%",
      trend: "up",
    },

    {
      title: "Leads",
      value: getMetric(
        "lead_generation"
      ),
      icon: Users,
      growth: "+12%",
      trend: "up",
    },

    {
      title: "Conversions",
      value: getMetric(
        "conversion"
      ),
      icon: TrendingUp,
      growth: "+8%",
      trend: "up",
    },

    {
      title: "Traffic",
      value: getMetric("traffic"),
      icon: Activity,
      growth: "-3%",
      trend: "down",
    },
  ];

  // =====================================================
  // REVENUE CHART DATA
  // =====================================================

  const chartData = useMemo(() => {
    return revenueTrend.map((item) => ({
      name:
        period === "daily"
          ? `${item._id?.day}/${item._id?.month}`
          : `${item._id?.month}/${item._id?.year}`,

      revenue:
        item.totalRevenue || 0,
    }));
  }, [revenueTrend, period]);

  // =====================================================
  // PIE CHART DATA
  // =====================================================

  const pieData = summary.map((item) => ({
  name: item.category.replaceAll("_", " "),
  value: item.total || 0,
}));

  // =====================================================
  // FILTERED SUMMARY
  // =====================================================

  const filteredSummary = summary.filter(
    (item) => {
      const searchMatch =
        item.category
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
    }
  );

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
  // LOADING UI
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-[#020617]">
        <div className="text-center">

          <div className="w-12 h-12 mx-auto mb-4 border-4 rounded-full border-cyan-400 border-t-transparent animate-spin" />

          <p className="text-slate-400">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="min-h-screen p-6 text-white bg-[#020617]">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col gap-5 mb-8 xl:flex-row xl:items-center xl:justify-between">

        <div className="flex items-center gap-4">

          <div className="p-4 border rounded-2xl bg-cyan-500/10 border-cyan-500/20">
            <LayoutDashboard className="text-cyan-400" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Analytics Dashboard
            </h1>

            <p className="text-sm text-slate-400">
              Enterprise SaaS Growth Suite
            </p>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex flex-wrap items-center gap-3">

          {/* SEARCH */}

          <div className="relative">

            <Search
              size={16}
              className="absolute -translate-y-1/2 left-3 top-1/2 text-slate-500"
            />

            <input
              type="text"
              placeholder="Search category..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-64 py-2 pl-10 pr-4 text-sm border outline-none rounded-xl bg-white/5 border-white/10 focus:border-cyan-400"
            />
          </div>

          {/* PERIOD */}

          <select
            value={period}
            onChange={(e) =>
              setPeriod(e.target.value)
            }
            className="px-4 py-2 text-sm border outline-none rounded-xl bg-white/5 border-white/10"
          >
            <option value="monthly">
              Monthly
            </option>

            <option value="daily">
              Daily
            </option>
          </select>

          {/* CATEGORY */}

          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(
                e.target.value
              )
            }
            className="px-4 py-2 text-sm border outline-none rounded-xl bg-white/5 border-white/10"
          >
            <option value="all">
              All Categories
            </option>

            <option value="revenue">
              Revenue
            </option>

            <option value="lead_generation">
              Leads
            </option>

            <option value="conversion">
              Conversion
            </option>

            <option value="traffic">
              Traffic
            </option>
          </select>

          {/* REFRESH */}

          <button
            onClick={() =>
              fetchAnalytics(true)
            }
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-black transition rounded-xl bg-cyan-400 hover:bg-cyan-300"
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
        <div className="flex items-center gap-3 p-4 mb-6 text-red-300 border border-red-500/20 rounded-2xl bg-red-500/10">

          <AlertCircle size={18} />

          <span>{errorMsg}</span>
        </div>
      )}

      {/* ================================================= */}
      {/* KPI CARDS */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 gap-5 mb-8 md:grid-cols-2 xl:grid-cols-4">

        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: index * 0.1,
            }}
            className="relative overflow-hidden border bg-white/5 border-white/10 rounded-3xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-400">
                    {card.title}
                  </p>

                  <h2 className="mt-3 text-4xl font-bold">
                    {Number(
                      card.value
                    ).toLocaleString()}
                  </h2>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-500/10">

                  <card.icon className="text-cyan-400" />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-5">

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
                  className={`text-sm font-medium ${
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

      <div className="grid gap-6 mb-8 xl:grid-cols-2">

        {/* AREA CHART */}

        <div className="p-6 border bg-white/5 border-white/10 rounded-3xl">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-xl font-semibold">
                Revenue Trend
              </h2>

              <p className="text-sm text-slate-400">
                Revenue analytics overview
              </p>
            </div>

            <TrendingUp className="text-cyan-400" />
          </div>

          {chartData.length ? (
            <ResponsiveContainer
              width="100%"
              height={320}
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
                      stopOpacity={0.8}
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
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[320px] text-slate-500">
              No revenue data
            </div>
          )}
        </div>

        {/* BAR CHART */}

        <div className="p-6 border bg-white/5 border-white/10 rounded-3xl">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-xl font-semibold">
                Revenue Comparison
              </h2>

              <p className="text-sm text-slate-400">
                Performance comparison
              </p>
            </div>

            <BarChart3 className="text-cyan-400" />
          </div>

          {chartData.length ? (
            <ResponsiveContainer
              width="100%"
              height={320}
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
                  fill="#0ea5e9"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[320px] text-slate-500">
              No comparison data
            </div>
          )}
        </div>
      </div>

      {/* ================================================= */}
      {/* BOTTOM GRID */}
      {/* ================================================= */}

      <div className="grid gap-6 xl:grid-cols-3">

        {/* PIE CHART */}

        <div className="p-6 border bg-white/5 border-white/10 rounded-3xl">

          <h2 className="mb-6 text-xl font-semibold">
            Category Distribution
          </h2>

          {pieData.length ? (
            <ResponsiveContainer
              width="100%"
              height={320}
            >
              <PieChart>

                <Pie
                  data={pieData}
                  dataKey="value"
                  outerRadius={100}
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
          ) : (
            <div className="flex items-center justify-center h-[320px] text-slate-500">
              No distribution data
            </div>
          )}
        </div>


<div className="relative overflow-hidden border shadow-2xl xl:col-span-2 bg-white/5 border-white/10 rounded-3xl">

  {/* BACKGROUND GLOW */}

  <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl" />

  <div className="relative p-6">

    {/* ================================================== */}
    {/* HEADER */}
    {/* ================================================== */}

    <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">

      <div>

        <div className="flex items-center gap-3 mb-2">

          <div className="p-3 border rounded-2xl bg-cyan-500/10 border-cyan-500/20">

            <BarChart3
              size={20}
              className="text-cyan-400"
            />
          </div>

          <div>

            <h2 className="text-2xl font-bold">
              Analytics Summary
            </h2>

            <p className="text-sm text-slate-400">
              Enterprise business intelligence overview
            </p>
          </div>
        </div>
      </div>

      {/* RESULTS */}

      <div className="flex items-center gap-3">

        <div className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white/5 border-white/10">

          <Filter
            size={16}
            className="text-cyan-400"
          />

          <span className="text-sm text-slate-300">

            {filteredSummary.length} Results
          </span>
        </div>
      </div>
    </div>

    {/* ================================================== */}
    {/* EMPTY STATE */}
    {/* ================================================== */}

    {!filteredSummary.length ? (
      <div className="flex flex-col items-center justify-center py-20 text-center">

        <div className="p-5 mb-5 rounded-full bg-white/5">

          <BarChart3
            size={40}
            className="text-slate-500"
          />
        </div>

        <h3 className="mb-2 text-xl font-semibold text-slate-300">
          No Analytics Data
        </h3>

        <p className="max-w-md text-sm text-slate-500">
          No analytics records found for the
          selected filters or search query.
        </p>
      </div>
    ) : (
      <>
        {/* ================================================== */}
        {/* TABLE */}
        {/* ================================================== */}

        <div className="overflow-x-auto">

          <table className="w-full">

            {/* ============================================== */}
            {/* TABLE HEAD */}
            {/* ============================================== */}

            <thead>

              <tr className="border-b border-white/10 bg-white/[0.03]">

                <th className="px-5 py-4 text-xs font-semibold tracking-wider text-left uppercase text-slate-400">

                  Category
                </th>

                <th className="px-5 py-4 text-xs font-semibold tracking-wider text-left uppercase text-slate-400">

                  Total Value
                </th>

                <th className="px-5 py-4 text-xs font-semibold tracking-wider text-left uppercase text-slate-400">

                  Average
                </th>

                <th className="px-5 py-4 text-xs font-semibold tracking-wider text-left uppercase text-slate-400">

                  Records
                </th>

                <th className="px-5 py-4 text-xs font-semibold tracking-wider text-left uppercase text-slate-400">

                  Status
                </th>
              </tr>
            </thead>

            {/* ============================================== */}
            {/* TABLE BODY */}
            {/* ============================================== */}

            <tbody>

              {filteredSummary.map(
                (item, index) => {
                  const isPositive =
                    Number(item.total || 0) > 0;

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
                      className="transition border-b border-white/5 hover:bg-white/[0.03]"
                    >
                      {/* CATEGORY */}

                      <td className="px-5 py-5">

                        <div className="flex items-center gap-3">

                          <div className="w-3 h-3 rounded-full bg-cyan-400" />

                          <div>

                            <p className="font-medium capitalize text-slate-200">

                              {item.category.replaceAll(
                                "_",
                                " "
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">

                              Analytics Category
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* TOTAL */}

                      <td className="px-5 py-5">

                        <div>

                          <p className="text-lg font-bold text-white">

                            {Number(
                              item.total || 0
                            ).toLocaleString()}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">

                            Total Metrics
                          </p>
                        </div>
                      </td>

                      {/* AVG */}

                      <td className="px-5 py-5">

                        <div>

                          <p className="font-semibold text-slate-200">

                            {Number(
                              item.avg || 0
                            ).toLocaleString()}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">

                            Avg Performance
                          </p>
                        </div>
                      </td>

                      {/* COUNT */}

                      <td className="px-5 py-5">

                        <div className="inline-flex items-center gap-2 px-3 py-1 text-sm border rounded-xl bg-white/5 border-white/10 text-slate-300">

                          <Activity size={14} />

                          {item.count}
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-5">

                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1 text-sm rounded-xl border ${
                            isPositive
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-red-500/10 border-red-500/20 text-red-400"
                          }`}
                        >
                          {isPositive ? (
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

        {/* ================================================== */}
        {/* FOOTER */}
        {/* ================================================== */}

        <div className="flex flex-col gap-3 pt-5 mt-6 border-t border-white/10 md:flex-row md:items-center md:justify-between">

          <p className="text-sm text-slate-500">

            Showing{" "}
            <span className="font-medium text-slate-300">

              {filteredSummary.length}
            </span>{" "}
            analytics categories
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-500">

            <div className="w-2 h-2 rounded-full bg-emerald-400" />

            Live SaaS Analytics Data
          </div>
        </div>
      </>
    )}
  </div>
</div>
      </div>
    </div>
  );
}