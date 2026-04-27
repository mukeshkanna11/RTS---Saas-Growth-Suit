// ===============================
// src/pages/Analytics.jsx
// FULL SAAS LEVEL UPDATED VERSION
// ===============================

import { useEffect, useState } from "react";
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
} from "lucide-react";

export default function Analytics() {
  const [summary, setSummary] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [summaryRes, revenueRes] = await Promise.all([
        API.get("/analytics/summary"),
        API.get("/analytics/revenue-trend"),
      ]);

      setSummary(summaryRes.data?.data || []);
      setRevenueTrend(revenueRes.data?.data || []);
    } catch (err) {
      console.error("Analytics Error:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Unable to fetch analytics data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getMetric = (category) =>
    summary.find((s) => s.category === category)?.total || 0;

  const cards = [
    {
      title: "Revenue",
      value: `₹${getMetric("revenue")}`,
      icon: DollarSign,
    },
    {
      title: "Leads",
      value: getMetric("lead_generation"),
      icon: Users,
    },
    {
      title: "Conversions",
      value: getMetric("conversion"),
      icon: TrendingUp,
    },
    {
      title: "Traffic",
      value: getMetric("traffic"),
      icon: Activity,
    },
  ];

  return (
    <div className="min-h-screen p-6 text-white bg-slate-950">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="mt-1 text-slate-400">
            Real-time SaaS business intelligence overview
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-5 py-3 font-semibold text-black transition-all bg-cyan-500 hover:bg-cyan-400 rounded-2xl"
        >
          <RefreshCcw size={18} />
          Refresh Data
        </button>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 mb-6 border border-red-500/30 bg-red-500/10 rounded-2xl">
          <AlertCircle className="text-red-400" />
          <span className="text-red-300">{errorMsg}</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          Loading analytics...
        </div>
      ) : (
        <>
          {/* Cards */}
          <div className="grid grid-cols-1 gap-6 mb-10 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 border shadow-xl bg-slate-900 border-slate-800 rounded-3xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-slate-400">{card.title}</h2>
                  <card.icon className="text-cyan-400" />
                </div>
                <h3 className="text-3xl font-bold">{card.value}</h3>
              </motion.div>
            ))}
          </div>

          {/* Data Sections */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Trend */}
            <div className="p-6 border bg-slate-900 border-slate-800 rounded-3xl">
              <h2 className="flex items-center gap-2 mb-4 text-xl font-semibold">
                <BarChart3 className="text-cyan-400" />
                Revenue Trend
              </h2>

              <div className="space-y-4">
                {revenueTrend.length > 0 ? (
                  revenueTrend.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between p-4 bg-slate-800 rounded-2xl"
                    >
                      <span>
                        {item._id?.month}/{item._id?.year}
                      </span>
                      <span className="font-bold text-green-400">
                        ₹{item.totalRevenue}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No revenue trend data</p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="p-6 border bg-slate-900 border-slate-800 rounded-3xl">
              <h2 className="mb-4 text-xl font-semibold">
                Performance Summary
              </h2>

              <div className="space-y-4">
                {summary.length > 0 ? (
                  summary.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between p-4 bg-slate-800 rounded-2xl"
                    >
                      <span>{item.category}</span>
                      <span className="font-semibold text-cyan-400">
                        {item.total}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No summary data</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}