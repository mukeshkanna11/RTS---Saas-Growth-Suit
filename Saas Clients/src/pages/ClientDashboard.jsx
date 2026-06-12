import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FaBullhorn,
  FaMousePointer,
  FaChartLine,
  FaBell,
  FaExclamationTriangle,
  FaSync,
  FaUsers,
  FaMoneyBillWave,
  FaWhatsapp,
  FaEnvelope,
  FaRocket,
} from "react-icons/fa";

import { Link } from "react-router-dom";

const API =
  "https://rts-saas-growth-suit-1.onrender.com";

export default function ClientDashboard() {
  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);
    
const [supportMessage, setSupportMessage] = useState("");
const [sending, setSending] = useState(false);
const [successMsg, setSuccessMsg] = useState("");
const [chatOpen, setChatOpen] = useState(false);


  


  const loadDashboard =
    async () => {
      try {
        setLoading(true);

        const token =
          localStorage.getItem(
            "token"
          );

        const res =
          await axios.get(
            `${API}/api/v1/client/dashboard`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        setDashboard(
          res.data?.data ||
            res.data ||
            {}
        );

        setError(null);
      } catch (err) {
        console.error(err);

        setError(
          err?.response?.data
            ?.message ||
            "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadDashboard();
  }, []);

  const {
    overview = {},
    performance = {},
    budget = {},
    funnel = {},
    channelPerformance = [],
    activeCampaigns = [],
    recentLeads = [],
    topCampaign = {},
    alerts = [],
    notifications = [],
    email = {},
    whatsapp = {},
  } = dashboard || {};

  const metrics = useMemo(
    () => ({
      impressions:
        overview.impressions || 0,

      clicks:
        overview.clicks || 0,

      leads:
        overview.leads || 0,

      conversions:
        overview.conversions || 0,

      ctr:
        performance.ctr || 0,

      conversionRate:
        performance.conversionRate ||
        0,

      cpl:
        performance.cpl || 0,

      roas:
        performance.roas || 0,
    }),
    [overview, performance]
  );

  const budgetData = useMemo(
    () => ({
      allocated:
        budget.allocated || 0,

      spent:
        budget.spent || 0,

      utilization:
        budget.utilization || 0,

      remaining:
        (budget.allocated || 0) -
        (budget.spent || 0),
    }),
    [budget]
  );

  const funnelData = useMemo(
    () => ({
      aware:
        funnel.aware || 0,

      engaged:
        funnel.engaged || 0,

      lead:
        funnel.lead || 0,

      converted:
        funnel.converted || 0,
    }),
    [funnel]
  );

  const channels = useMemo(
    () =>
      channelPerformance.map(
        (item) => ({
          id: item._id,

          channel: item._id,

          impressions:
            item.impressions || 0,

          clicks:
            item.clicks || 0,

          conversions:
            item.conversions || 0,

          percentage:
            overview.clicks > 0
              ? Math.round(
                  (item.clicks /
                    overview.clicks) *
                    100
                )
              : 0,
        })
      ),
    [
      channelPerformance,
      overview.clicks,
    ]
  );

  const campaignStats =
    useMemo(() => {
      const totalCampaigns =
        activeCampaigns.length;

      const activeCount =
        activeCampaigns.filter(
          (c) =>
            c.status ===
            "active"
        ).length;

      const totalBudget =
        activeCampaigns.reduce(
          (acc, c) =>
            acc +
            (c.budgetAllocated ||
              0),
          0
        );

      const totalSpent =
        activeCampaigns.reduce(
          (acc, c) =>
            acc +
            (c.budgetSpent ||
              0),
          0
        );

      return {
        totalCampaigns,
        activeCount,
        totalBudget,
        totalSpent,
      };
    }, [activeCampaigns]);

  const latestLeads =
    useMemo(
      () =>
        [...recentLeads]
          .sort(
            (a, b) =>
              new Date(
                b.createdAt
              ) -
              new Date(
                a.createdAt
              )
          )
          .slice(0, 10),
      [recentLeads]
    );

  const leadStats =
    useMemo(() => {
      const converted =
        recentLeads.filter(
          (lead) =>
            lead.status ===
            "converted"
        ).length;

      const qualified =
        recentLeads.filter(
          (lead) =>
            lead.status ===
            "qualified"
        ).length;

      const totalDealValue =
        recentLeads.reduce(
          (acc, lead) =>
            acc +
            (lead.dealValue ||
              0),
          0
        );

      return {
        converted,
        qualified,
        totalDealValue,
      };
    }, [recentLeads]);

  const notificationStats =
    useMemo(() => {
      const unread =
        notifications.filter(
          (n) =>
            !n.isRead
        ).length;

      return {
        total:
          notifications.length,
        unread,
      };
    }, [notifications]);

  const alertStats =
    useMemo(() => {
      const unread =
        alerts.filter(
          (a) =>
            !a.isRead
        ).length;

      const high =
        alerts.filter(
          (a) =>
            a.severity ===
            "high"
        ).length;

      return {
        total:
          alerts.length,
        unread,
        high,
      };
    }, [alerts]);

  const emailStats =
    useMemo(
      () => ({
        sent:
          email.sent || 0,

        opened:
          email.opened || 0,

        clicked:
          email.clicked || 0,
      }),
      [email]
    );

  const whatsappStats =
    useMemo(
      () => ({
        sent:
          whatsapp.sent || 0,

        delivered:
          whatsapp.delivered ||
          0,

        read:
          whatsapp.read || 0,
      }),
      [whatsapp]
    );

  const dashboardData = useMemo(
  () => ({
    metrics,
    budgetData,
    funnelData,
    channels,
    campaignStats,
    activeCampaigns,
    latestLeads,
    leadStats,
    bestCampaign: topCampaign,
    notificationStats,
    notifications,
    alertStats,
    alerts,
    emailStats,
    whatsappStats,
  }),
  [
    metrics,
    budgetData,
    funnelData,
    channels,
    campaignStats,
    activeCampaigns,
    latestLeads,
    leadStats,
    topCampaign,
    notificationStats,
    notifications,
    alertStats,
    alerts,
    emailStats,
    whatsappStats,
  ]
);

useEffect(() => {
  console.log(
    "Dashboard Data:",
    dashboardData
  );
}, [dashboardData]);

const Info = ({
  label,
  value,
}) => (
  <div className="p-4 rounded-xl bg-slate-800">
    <p className="text-sm text-slate-400">
      {label}
    </p>

    <h3 className="mt-2 text-xl font-bold">
      {value ?? 0}
    </h3>
  </div>
);

const Funnel = ({
  title,
  value,
}) => (
  <div className="p-4 rounded-xl bg-slate-800">
    <p className="text-sm text-slate-400">
      {title}
    </p>

    <h3 className="mt-2 text-2xl font-bold">
      {value ?? 0}
    </h3>
  </div>
);

const PremiumCard = ({
  icon,
  title,
  value,
}) => (
  <div className="p-6 transition-all border bg-slate-900 border-slate-800 rounded-3xl hover:border-cyan-500">

    {icon && (
      <div className="mb-4 text-2xl text-cyan-400">
        {icon}
      </div>
    )}

    <p className="text-slate-400">
      {title}
    </p>

    <h2 className="mt-2 text-3xl font-bold">
      {value ?? 0}
    </h2>

  </div>
);

const sendSupportRequest = async () => {
  try {
    if (!supportMessage.trim()) {
      return alert("Please enter your message");
    }

    setSending(true);

    const token =
      localStorage.getItem("token");

    const res = await axios.post(
      "https://rts-saas-growth-suit-1.onrender.com/api/v1/client/support/contact",
      {
        message: supportMessage.trim(),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },
      }
    );

    setSuccessMsg(
      res?.data?.message ||
        "Thank you for contacting ReadyTech Solutions. Our team will reach out within 24 hours."
    );

    setSupportMessage("");
  } catch (err) {
    console.error(
      "Support Error:",
      err?.response?.data || err
    );

    alert(
      err?.response?.data?.message ||
        "Failed to send request"
    );
  } finally {
    setSending(false);
  }
};

const StatRow = ({
  label,
  value,
}) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/60">

    <span className="text-slate-400">
      {label}
    </span>

    <span className="text-lg font-bold">
      {value?.toLocaleString()}
    </span>

  </div>
);

  return (
    <div className="min-h-screen p-6 text-white bg-slate-950">

      {/* HEADER */}

      <div className="relative mb-8 overflow-hidden border shadow-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border-slate-800 rounded-3xl">

  {/* Background Glow */}
  <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl" />
  <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl" />

  <div className="relative z-10 p-6 lg:p-8">

    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

      {/* LEFT SIDE */}

      <div className="max-w-2xl">

        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-medium border rounded-full bg-cyan-500/10 text-cyan-300 border-cyan-500/20">

          <span className="w-2 h-2 bg-green-400 rounded-full" />

          ACTIVE CLIENT ACCOUNT

        </div>

        <h1 className="mb-2 text-3xl font-bold tracking-tight lg:text-2xl">

          ReadyTech Solutions

        </h1>

        <p className="max-w-xl leading-relaxed text-slate-400">

          Driving business growth through Digital Marketing,
          Automation, CRM Solutions, Lead Generation,
          Branding, and Performance Campaign Management.

        </p>

        <div className="flex flex-wrap gap-3 mt-5">

          <span className="px-3 py-1 text-sm rounded-xl bg-slate-800 text-slate-300">
            SaaS Growth Partner
          </span>

          <span className="px-3 py-1 text-sm rounded-xl bg-slate-800 text-slate-300">
            Premium Plan
          </span>

          <span className="px-3 py-1 text-sm rounded-xl bg-slate-800 text-slate-300">
            Health Score 92%
          </span>

        </div>

      </div>

      {/* RIGHT SIDE */}

      <div className="grid grid-cols-3 gap-3 lg:min-w-[380px]">

        <div className="p-4 border bg-slate-800/60 backdrop-blur border-slate-700 rounded-2xl">

          <p className="mb-1 text-xs text-slate-400">
            Notifications
          </p>

          <h3 className="text-2xl font-bold">
            {notifications?.length || 0}
          </h3>

        </div>

        <div className="p-4 border bg-slate-800/60 backdrop-blur border-slate-700 rounded-2xl">

          <p className="mb-1 text-xs text-slate-400">
            Alerts
          </p>

          <h3 className="text-2xl font-bold text-red-400">
            {alerts?.length || 0}
          </h3>

        </div>

        <button
          onClick={loadDashboard}
          className="flex flex-col items-center justify-center gap-2 transition-all border bg-cyan-500/10 border-cyan-500/20 rounded-2xl hover:bg-cyan-500/20"
        >

          <FaSync className="text-xl text-cyan-400" />

          <span className="text-xs font-medium">
            Refresh
          </span>

        </button>

      </div>

    </div>

  </div>

</div>

      

      {/* TOP PERFORMING CAMPAIGN */}

<div className="relative mb-8 overflow-hidden border shadow-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 border-slate-800 rounded-3xl">

  {/* Glow Effects */}

  <div className="absolute top-0 right-0 rounded-full w-72 h-72 bg-cyan-500/10 blur-3xl" />
  <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />

  <div className="relative z-10 p-6 lg:p-8">

    {/* Header */}

    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

      <div>

        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold border rounded-full text-cyan-300 bg-cyan-500/10 border-cyan-500/20">

          🚀 TOP PERFORMING CAMPAIGN

        </div>

        <h2 className="text-3xl font-bold lg:text-2xl">

          {topCampaign?.campaignName || "Summer Growth Campaign"}

        </h2>

        <p className="mt-2 text-slate-400">

          {topCampaign?.channel || "Meta Ads"} • High Performing Marketing Initiative

        </p>

      </div>

      <div className="px-4 py-2 border rounded-2xl bg-emerald-500/10 border-emerald-500/20">

        <p className="text-xs text-slate-400">
          Campaign Status
        </p>

        <h3 className="font-bold text-emerald-400">
          Active & Optimized
        </h3>

      </div>

    </div>

    {/* Main Metrics */}

    <div className="grid gap-4 mt-8 md:grid-cols-2 xl:grid-cols-4">

      <div className="p-5 border bg-slate-800/50 border-slate-700 rounded-2xl">

        <p className="text-sm text-slate-400">
          Leads Generated
        </p>

        <h3 className="mt-2 text-3xl font-bold text-cyan-400">
          {topCampaign?.leads || 0}
        </h3>

      </div>

      <div className="p-5 border bg-slate-800/50 border-slate-700 rounded-2xl">

        <p className="text-sm text-slate-400">
          Conversions
        </p>

        <h3 className="mt-2 text-3xl font-bold text-green-400">
          {topCampaign?.conversions || 0}
        </h3>

      </div>

      <div className="p-5 border bg-slate-800/50 border-slate-700 rounded-2xl">

        <p className="text-sm text-slate-400">
          Budget Allocated
        </p>

        <h3 className="mt-2 text-3xl font-bold text-yellow-400">
          ₹{topCampaign?.budgetAllocated?.toLocaleString() || "0"}
        </h3>

      </div>

      <div className="p-5 border bg-slate-800/50 border-slate-700 rounded-2xl">

        <p className="text-sm text-slate-400">
          Budget Spent
        </p>

        <h3 className="mt-2 text-3xl font-bold text-orange-400">
          ₹{topCampaign?.budgetSpent?.toLocaleString() || "0"}
        </h3>

      </div>

    </div>

    {/* Bottom Insights */}

    <div className="grid gap-4 mt-8 lg:grid-cols-3">

      <div className="p-4 rounded-2xl bg-slate-800/40">

        <p className="text-sm text-slate-400">
          Conversion Rate
        </p>

        <h3 className="mt-2 text-2xl font-bold text-green-400">
          {topCampaign?.conversionRate || "4.8"}%
        </h3>

      </div>

      <div className="p-4 rounded-2xl bg-slate-800/40">

        <p className="text-sm text-slate-400">
          ROI Performance
        </p>

        <h3 className="mt-2 text-2xl font-bold text-cyan-400">
          {topCampaign?.roi || "320"}%
        </h3>

      </div>

      <div className="p-4 rounded-2xl bg-slate-800/40">

        <p className="text-sm text-slate-400">
          Campaign Health
        </p>

        <h3 className="mt-2 text-2xl font-bold text-emerald-400">
          Excellent
        </h3>

      </div>

    </div>

  </div>

</div>

      {/* KPI OVERVIEW */}

<div className="grid gap-4 mb-8 sm:grid-cols-2 xl:grid-cols-4">

  <div className="relative p-5 overflow-hidden transition-all duration-300 border group bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 rounded-3xl hover:border-cyan-500/50">

    <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-cyan-500/10 blur-2xl" />

    <div className="relative flex items-start justify-between">

      <div>

        <p className="text-xs font-medium tracking-wide uppercase text-slate-400">
          Impressions
        </p>

        <h3 className="mt-2 text-2xl font-bold">
          {overview.impressions?.toLocaleString() || "0"}
        </h3>

        <p className="mt-2 text-xs text-green-400">
          ↑ 12.5% This Month
        </p>

      </div>

      <div className="p-3 rounded-2xl bg-cyan-500/10">
        <FaBullhorn className="text-lg text-cyan-400" />
      </div>

    </div>

  </div>

  <div className="relative p-5 overflow-hidden transition-all duration-300 border group bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 rounded-3xl hover:border-blue-500/50">

    <div className="relative flex items-start justify-between">

      <div>

        <p className="text-xs font-medium tracking-wide uppercase text-slate-400">
          Clicks
        </p>

        <h3 className="mt-2 text-2xl font-bold">
          {overview.clicks?.toLocaleString() || "0"}
        </h3>

        <p className="mt-2 text-xs text-green-400">
          ↑ 8.3% This Month
        </p>

      </div>

      <div className="p-3 rounded-2xl bg-blue-500/10">
        <FaMousePointer className="text-lg text-blue-400" />
      </div>

    </div>

  </div>

  <div className="relative p-5 overflow-hidden transition-all duration-300 border group bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 rounded-3xl hover:border-emerald-500/50">

    <div className="relative flex items-start justify-between">

      <div>

        <p className="text-xs font-medium tracking-wide uppercase text-slate-400">
          Leads
        </p>

        <h3 className="mt-2 text-2xl font-bold">
          {overview.leads?.toLocaleString() || "0"}
        </h3>

        <p className="mt-2 text-xs text-green-400">
          ↑ 15.7% This Month
        </p>

      </div>

      <div className="p-3 rounded-2xl bg-emerald-500/10">
        <FaUsers className="text-lg text-emerald-400" />
      </div>

    </div>

  </div>

  <div className="relative p-5 overflow-hidden transition-all duration-300 border group bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 rounded-3xl hover:border-orange-500/50">

    <div className="relative flex items-start justify-between">

      <div>

        <p className="text-xs font-medium tracking-wide uppercase text-slate-400">
          Conversions
        </p>

        <h3 className="mt-2 text-2xl font-bold">
          {overview.conversions?.toLocaleString() || "0"}
        </h3>

        <p className="mt-2 text-xs text-green-400">
          ↑ 10.1% This Month
        </p>

      </div>

      <div className="p-3 rounded-2xl bg-orange-500/10">
        <FaRocket className="text-lg text-orange-400" />
      </div>

    </div>

  </div>

</div>

      {/* BUDGET OVERVIEW */}

<div className="relative mb-8 overflow-hidden border shadow-xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border-slate-800 rounded-3xl">

  {/* Glow */}
  <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />

  <div className="relative z-10 p-6 lg:p-8">

    {/* Header */}

    <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">

      <div>

        <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400">

          💰 BUDGET MANAGEMENT

        </div>

        <h2 className="text-2xl font-bold">
          Campaign Budget Overview
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Track spending, utilization and budget performance.
        </p>

      </div>

      <div className="text-right">

        <p className="text-xs uppercase text-slate-500">
          Utilization
        </p>

        <h3 className="text-3xl font-bold text-emerald-400">
          {budget.utilization || 0}%
        </h3>

      </div>

    </div>

    {/* Progress */}

    <div className="mb-8">

      <div className="flex justify-between mb-2">

        <span className="text-sm text-slate-400">
          Budget Consumption
        </span>

        <span className="text-sm font-semibold text-white">
          {budget.utilization || 0}%
        </span>

      </div>

      <div className="w-full h-4 overflow-hidden rounded-full bg-slate-800">

        <div
          className="h-4 rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500"
          style={{
            width: `${budget.utilization || 0}%`,
          }}
        />

      </div>

    </div>

    {/* Budget Metrics */}

    <div className="grid gap-4 md:grid-cols-3">

      <div className="p-5 border bg-slate-800/40 border-slate-700 rounded-2xl">

        <p className="text-sm text-slate-400">
          Budget Allocated
        </p>

        <h3 className="mt-2 text-2xl font-bold text-cyan-400">
          ₹{budget.allocated?.toLocaleString() || "0"}
        </h3>

      </div>

      <div className="p-5 border bg-slate-800/40 border-slate-700 rounded-2xl">

        <p className="text-sm text-slate-400">
          Budget Spent
        </p>

        <h3 className="mt-2 text-2xl font-bold text-orange-400">
          ₹{budget.spent?.toLocaleString() || "0"}
        </h3>

      </div>

      <div className="p-5 border bg-slate-800/40 border-slate-700 rounded-2xl">

        <p className="text-sm text-slate-400">
          Remaining Budget
        </p>

        <h3 className="mt-2 text-2xl font-bold text-emerald-400">
          ₹{(
            (budget.allocated || 0) -
            (budget.spent || 0)
          ).toLocaleString()}
        </h3>

      </div>

    </div>

    {/* Bottom Status */}

    <div className="flex items-center justify-between p-4 mt-6 border rounded-2xl bg-slate-800/30 border-slate-700">

      <div>

        <p className="text-sm text-slate-400">
          Budget Health Status
        </p>

        <h4 className="font-semibold text-emerald-400">
          Performing Within Budget Limits
        </h4>

      </div>

      <div className="px-3 py-2 text-sm font-medium rounded-xl bg-emerald-500/10 text-emerald-400">

        Healthy

      </div>

    </div>

  </div>

</div>

      <div className="grid gap-6 mb-8 lg:grid-cols-2">

        <div className="relative overflow-hidden border shadow-xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border-slate-800 rounded-3xl">

  <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl" />

  <div className="relative z-10 p-6">

    <div className="flex items-center justify-between mb-6">

      <div>

        <p className="mb-2 text-xs font-medium tracking-wider uppercase text-cyan-400">
          Marketing Channels
        </p>

        <h2 className="text-2xl font-bold">
          Performance Overview
        </h2>

      </div>

      <div className="px-3 py-2 rounded-xl bg-slate-800">
        Live Tracking
      </div>

    </div>

    {[
      {
        name: "Google Ads",
        value:
          channels?.find(
            c => c.channel === "Google Ads"
          )?.percentage || 78,
        icon: "🔍",
      },
      {
        name: "Meta Ads",
        value:
          channels?.find(
            c => c.channel === "Meta Ads"
          )?.percentage || 72,
        icon: "📘",
      },
      {
        name: "Instagram Ads",
        value:
          channels?.find(
            c => c.channel === "Instagram Ads"
          )?.percentage || 65,
        icon: "📸",
      },
      {
        name: "LinkedIn",
        value:
          channels?.find(
            c => c.channel === "LinkedIn"
          )?.percentage || 58,
        icon: "💼",
      },
    ].map((item) => (

      <div
        key={item.name}
        className="p-4 mb-4 border bg-slate-800/40 border-slate-700 rounded-2xl"
      >

        <div className="flex items-center justify-between mb-3">

          <div className="flex items-center gap-3">

            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-700">

              {item.icon}

            </div>

            <div>

              <h3 className="font-semibold">
                {item.name}
              </h3>

              <p className="text-xs text-slate-500">
                Advertising Channel
              </p>

            </div>

          </div>

          <span className="font-bold text-cyan-400">
            {item.value}%
          </span>

        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-700">

          <div
            className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
            style={{
              width: `${item.value}%`,
            }}
          />

        </div>

      </div>

    ))}

  </div>

</div>

       <div className="relative overflow-hidden border shadow-xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border-slate-800 rounded-3xl">

  <div className="p-6">

    <p className="mb-2 text-xs font-medium tracking-wider text-indigo-400 uppercase">
      Customer Journey
    </p>

    <h2 className="mb-6 text-2xl font-bold">
      Conversion Funnel
    </h2>

    <div className="space-y-4">

      <div className="p-4 rounded-2xl bg-slate-800/50">
        <p className="text-sm text-slate-400">
          Awareness
        </p>
        <h3 className="text-2xl font-bold text-cyan-400">
          {funnel.aware || "482K"}
        </h3>
      </div>

      <div className="p-4 rounded-2xl bg-slate-800/50">
        <p className="text-sm text-slate-400">
          Engagement
        </p>
        <h3 className="text-2xl font-bold text-blue-400">
          {funnel.engaged || "18.3K"}
        </h3>
      </div>

      <div className="p-4 rounded-2xl bg-slate-800/50">
        <p className="text-sm text-slate-400">
          Leads
        </p>
        <h3 className="text-2xl font-bold text-green-400">
          {funnel.lead || "3210"}
        </h3>
      </div>

      <div className="p-4 rounded-2xl bg-slate-800/50">
        <p className="text-sm text-slate-400">
          Converted
        </p>
        <h3 className="text-2xl font-bold text-yellow-400">
          {funnel.converted || "1204"}
        </h3>
      </div>

    </div>

  </div>

</div>


    <div className="overflow-hidden border shadow-xl bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 rounded-3xl">

  <div className="p-6 border-b border-slate-800">

    <p className="mb-2 text-xs font-medium tracking-wider text-green-400 uppercase">
      Campaign Management
    </p>

    <h2 className="text-2xl font-bold">
      Active Campaigns
    </h2>

  </div>

  <div className="divide-y divide-slate-800">

    {(activeCampaigns?.length
      ? activeCampaigns
      : [
          {
            campaignName: "Summer Growth Campaign",
            status: "Active",
            conversionRate: 4.2,
          },
          {
            campaignName: "Meta Lead Generation",
            status: "Running",
            conversionRate: 3.8,
          },
        ]).map((campaign, i) => (

      <div
        key={i}
        className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between hover:bg-slate-800/20"
      >

        <div>

          <h3 className="font-semibold">
            {campaign.campaignName}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Conversion Rate: {campaign.conversionRate}%
          </p>

        </div>

        <div className="flex items-center gap-4">

          <span className="px-3 py-1 text-green-400 rounded-full bg-green-500/10">
            {campaign.status}
          </span>

          <span className="font-bold text-cyan-400">
            {campaign.conversionRate}%
          </span>

        </div>

      </div>

    ))}

  </div>

</div>



<div className="p-6 mb-8 border bg-slate-900 border-slate-800 rounded-3xl">

  <h2 className="mb-6 text-xl font-bold">
    Recent Leads
  </h2>

  <div className="space-y-4">

    {recentLeads?.slice(0, 5).map((lead) => (

      <div
        key={lead._id}
        className="flex items-center justify-between p-4 rounded-xl bg-slate-800"
      >

        <div>

          <h3>
            {lead.name}
          </h3>

          <p className="text-slate-400">
            {lead.companyName}
          </p>

        </div>

        <div className="text-right">

          <p>
            ₹{lead.dealValue}
          </p>

          <p className="text-green-400">
            {lead.status}
          </p>

        </div>

      </div>

    ))}

  </div>

</div>
    
    
  {/* COMMUNICATION ANALYTICS */}

<div className="grid gap-6 mb-8 lg:grid-cols-2">

  {/* EMAIL */}

  <div className="overflow-hidden border shadow-xl bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 rounded-3xl">

    <div className="flex items-center justify-between p-6 border-b border-slate-800">

      <div>

        <h2 className="text-xl font-bold">
          Email Analytics
        </h2>

        <p className="text-sm text-slate-400">
          Campaign email performance
        </p>

      </div>

      <div className="p-3 rounded-xl bg-cyan-500/20">
        📧
      </div>

    </div>

    <div className="p-6 space-y-5">

      <StatRow
        label="Emails Sent"
        value={email.sent || 2480}
      />

      <StatRow
        label="Opened"
        value={email.opened || 1820}
      />

      <StatRow
        label="Clicked"
        value={email.clicked || 694}
      />

      <div>

        <div className="flex justify-between mb-2">

          <span className="text-slate-400">
            Open Rate
          </span>

          <span className="font-semibold text-cyan-400">
            73%
          </span>

        </div>

        <div className="h-3 rounded-full bg-slate-800">

          <div
            className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
            style={{
              width: "73%",
            }}
          />

        </div>

      </div>

      <div>

        <div className="flex justify-between mb-2">

          <span className="text-slate-400">
            CTR
          </span>

          <span className="font-semibold text-green-400">
            28%
          </span>

        </div>

        <div className="h-3 rounded-full bg-slate-800">

          <div
            className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
            style={{
              width: "28%",
            }}
          />

        </div>

      </div>

    </div>

  </div>

  {/* WHATSAPP */}

  <div className="overflow-hidden border shadow-xl bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 rounded-3xl">

    <div className="flex items-center justify-between p-6 border-b border-slate-800">

      <div>

        <h2 className="text-xl font-bold">
          WhatsApp Analytics
        </h2>

        <p className="text-sm text-slate-400">
          Messaging engagement metrics
        </p>

      </div>

      <div className="p-3 rounded-xl bg-green-500/20">
        💬
      </div>

    </div>

    <div className="p-6 space-y-5">

      <StatRow
        label="Messages Sent"
        value={whatsapp.sent || 3200}
      />

      <StatRow
        label="Delivered"
        value={whatsapp.delivered || 3080}
      />

      <StatRow
        label="Read"
        value={whatsapp.read || 2520}
      />

      <div>

        <div className="flex justify-between mb-2">

          <span className="text-slate-400">
            Delivery Rate
          </span>

          <span className="font-semibold text-green-400">
            96%
          </span>

        </div>

        <div className="h-3 rounded-full bg-slate-800">

          <div
            className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
            style={{
              width: "96%",
            }}
          />

        </div>

      </div>

      <div>

        <div className="flex justify-between mb-2">

          <span className="text-slate-400">
            Read Rate
          </span>

          <span className="font-semibold text-cyan-400">
            81%
          </span>

        </div>

        <div className="h-3 rounded-full bg-slate-800">

          <div
            className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
            style={{
              width: "81%",
            }}
          />

        </div>

      </div>

    </div>

  </div>

</div>

{/* NOTIFICATIONS */}

<div className="grid gap-6 mb-8 lg:grid-cols-2">


  <div className="overflow-hidden border shadow-xl bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 rounded-3xl">

    <div className="flex items-center justify-between p-6 border-b border-slate-800">

      <div>
        <h2 className="text-xl font-bold">
          Notifications
        </h2>

        <p className="text-sm text-slate-400">
          Latest system updates
        </p>
      </div>

      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/20">

        <FaBell className="text-cyan-400" />

      </div>

    </div>

    <div className="p-4 space-y-3 overflow-y-auto max-h-96">

      {notifications?.length > 0 ? (

        notifications.map((n) => (

          <div
            key={n._id}
            className="p-4 transition-all border cursor-pointer bg-slate-800/60 border-slate-700 rounded-2xl hover:border-cyan-500 hover:bg-slate-800"
          >

            <div className="flex items-start gap-3">

              <div className="w-3 h-3 mt-2 rounded-full bg-cyan-400" />

              <div className="flex-1">

                <p className="font-medium text-white">
                  {n.title || "Notification"}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {n.message}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {new Date(
                    n.createdAt
                  ).toLocaleString()}
                </p>

              </div>

            </div>

          </div>

        ))

      ) : (

        <div className="flex flex-col items-center justify-center py-10 text-center">

          <FaBell className="mb-3 text-4xl text-slate-600" />

          <p className="text-slate-400">
            No Notifications
          </p>

        </div>

      )}

    </div>

  </div>

  {/* ALERTS */}

  <div className="overflow-hidden border shadow-xl bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 rounded-3xl">

    <div className="flex items-center justify-between p-6 border-b border-slate-800">

      <div>

        <h2 className="text-xl font-bold">
          Alerts
        </h2>

        <p className="text-sm text-slate-400">
          Critical account events
        </p>

      </div>

      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/20">

        <FaExclamationTriangle className="text-red-400" />

      </div>

    </div>

    <div className="p-4 space-y-3 overflow-y-auto max-h-96">

      {alerts?.length > 0 ? (

        alerts.map((a) => (

          <div
            key={a._id}
            className="p-4 transition-all border bg-red-500/5 border-red-500/20 rounded-2xl hover:border-red-500/50"
          >

            <div className="flex items-start gap-3">

              <div className="w-3 h-3 mt-2 bg-red-400 rounded-full" />

              <div className="flex-1">

                <p className="font-medium text-white">
                  {a.title || "Alert"}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {a.message}
                </p>

                <div className="flex items-center gap-2 mt-3">

                  <span className="px-2 py-1 text-xs text-red-300 rounded-lg bg-red-500/20">
                    {a.severity || "High"}
                  </span>

                </div>

              </div>

            </div>

          </div>

        ))

      ) : (

        <div className="flex flex-col items-center justify-center py-10 text-center">

          <FaExclamationTriangle className="mb-3 text-4xl text-slate-600" />

          <p className="text-slate-400">
            No Alerts Found
          </p>

        </div>

      )}

    </div>

    

  </div>


<div className="fixed z-50 bottom-6 right-6">

  <button
    onClick={() => setChatOpen(true)}
    className="w-16 h-16 text-2xl text-white transition-all duration-300 rounded-full shadow-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-110"
  >
    💬
  </button>

</div>

{
  chatOpen && (
    <div
      className="
      fixed
      bottom-24
      right-6
      w-[400px]
      max-w-[95vw]
      h-[600px]
      bg-[#0F172A]
      rounded-3xl
      overflow-hidden
      shadow-[0_20px_60px_rgba(0,0,0,0.45)]
      border
      border-slate-700
      z-50
      backdrop-blur-xl
      "
    >
      {/* Header */}

      <div
        className="flex items-center justify-between p-5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-12 h-12 text-xl rounded-full bg-white/20"
          >
            🚀
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">
              ReadyTech Support
            </h3>

            <p className="text-xs text-cyan-100">
              Online • Response within 24 hrs
            </p>
          </div>
        </div>

        <button
          onClick={() => setChatOpen(false)}
          className="text-xl text-white transition-all hover:rotate-90"
        >
          ✕
        </button>
      </div>

      {/* Body */}

      <div
        className="
        p-5
        h-[420px]
        overflow-y-auto
        bg-[#0F172A]
        "
      >
        <div
          className="
          bg-slate-800
          text-slate-200
          rounded-2xl
          p-4
          max-w-[85%]
          "
        >
          👋 Welcome to ReadyTech Support.

          <br />
          <br />

          Need help with:

          <ul className="mt-2 space-y-1 text-sm">
            <li>• Subscription Issues</li>
            <li>• Invoice Problems</li>
            <li>• CRM Assistance</li>
            <li>• Automation Setup</li>
          </ul>
        </div>

        {successMsg && (
          <div
            className="p-4 mt-4 border bg-emerald-500/15 border-emerald-500/30 text-emerald-300 rounded-2xl"
          >
            ✅ {successMsg}
          </div>
        )}
      </div>

      {/* Footer */}

      <div
        className="absolute bottom-0 left-0 right-0 p-4 border-t bg-slate-900 border-slate-700"
      >
        <textarea
          rows={3}
          value={supportMessage}
          onChange={(e) =>
            setSupportMessage(e.target.value)
          }
          placeholder="Type your message..."
          className="w-full p-4 text-white border outline-none resize-none bg-slate-800 border-slate-700 placeholder-slate-400 rounded-2xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
        />

        <button
          onClick={sendSupportRequest}
          disabled={sending}
          className="
          mt-3
          w-full
          py-3
          rounded-2xl
          bg-gradient-to-r
          from-cyan-500
          to-blue-600
          text-white
          font-semibold
          hover:scale-[1.02]
          transition-all
          shadow-lg
          "
        >
          {sending ? (
            "Sending..."
          ) : (
            "Send Message →"
          )}
        </button>
      </div>
    </div>
  )
}

</div>

</div>



    </div>
  )
}