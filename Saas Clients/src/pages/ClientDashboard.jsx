import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaBullhorn,
  FaMousePointer,
  FaChartLine,
  FaBell,
  FaExclamationTriangle,
  FaSync,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const API =
  "https://rts-saas-growth-suit-1.onrender.com";

export default function ClientDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API}/api/v1/client/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDashboard(
        res.data.data || res.data
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-white bg-slate-950">
        Loading Dashboard...
      </div>
    );

  const {
    overview = {},
    budget = {},
    funnel = {},
    channelPerformance = [],
    activeCampaigns = [],
    alerts = [],
    notifications = [],
  } = dashboard || {};

  const channels =
    channelPerformance.length > 0
      ? channelPerformance
      : [
          {
            channel: "Google Ads",
            percentage: 78,
          },
          {
            channel: "Meta Ads",
            percentage: 58,
          },
          {
            channel: "Email",
            percentage: 44,
          },
          {
            channel: "LinkedIn",
            percentage: 29,
          },
          {
            channel: "SEO",
            percentage: 21,
          },
        ];

  return (
    <div className="min-h-screen p-6 text-white bg-slate-950">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-5 mb-8 lg:flex-row">

        <div>
          <p className="text-blue-400">
            ReadyTech Solutions
          </p>

          <h1 className="text-4xl font-bold">
            Client Dashboard
          </h1>

          <p className="mt-2 text-slate-400">
            Marketing Performance Overview
          </p>
        </div>

        <div className="flex gap-3">

          <Link
            to="/client"
            className="px-4 py-2 bg-blue-600 rounded-xl"
          >
            Dashboard
          </Link>

          <Link
            to="/client/campaigns"
            className="px-4 py-2 rounded-xl bg-slate-800"
          >
            Campaigns
          </Link>

          <Link
            to="/client/analytics"
            className="px-4 py-2 rounded-xl bg-slate-800"
          >
            Analytics
          </Link>

          <button
            onClick={loadDashboard}
            className="px-4 py-2 rounded-xl bg-slate-800"
          >
            <FaSync />
          </button>

        </div>
      </div>

      {/* COMPANY OVERVIEW */}

      <div className="p-6 mb-8 border bg-slate-900 border-slate-800 rounded-3xl">

        <h2 className="mb-2 text-2xl font-semibold">
          ReadyTech Solutions
        </h2>

        <p className="text-slate-400">
          Driving Growth Through Technology,
          Branding & Digital Marketing
        </p>

        <div className="grid gap-4 mt-6 md:grid-cols-4">

          <Info
            label="Plan"
            value="Premium"
          />

          <Info
            label="Health Score"
            value="92%"
          />

          <Info
            label="Account Manager"
            value="RTS Team"
          />

          <Info
            label="Status"
            value="Active"
          />

        </div>
      </div>

      {/* KPI */}

      <div className="grid gap-5 mb-8 md:grid-cols-4">

        <Card
          icon={<FaBullhorn />}
          title="Impressions"
          value={
            overview.impressions ||
            "482K"
          }
        />

        <Card
          icon={<FaMousePointer />}
          title="Clicks"
          value={
            overview.clicks ||
            "18.3K"
          }
        />

        <Card
          icon={<FaChartLine />}
          title="Conversions"
          value={
            overview.conversions ||
            "1204"
          }
        />

        <Card
          icon={<FaChartLine />}
          title="Budget Used"
          value={`₹${
            budget.spent || "1.8L"
          }`}
        />

      </div>

      <div className="grid gap-6 mb-8 lg:grid-cols-2">

        {/* CHANNELS */}

        <div className="p-6 border bg-slate-900 border-slate-800 rounded-3xl">

          <h2 className="mb-5 text-xl font-bold">
            Channel Performance
          </h2>

          {channels.map((item, i) => (
            <div
              key={i}
              className="mb-4"
            >
              <div className="flex justify-between mb-1">
                <span>
                  {item.channel}
                </span>

                <span>
                  {item.percentage}%
                </span>
              </div>

              <div className="h-2 rounded-full bg-slate-800">

                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{
                    width: `${item.percentage}%`,
                  }}
                />

              </div>
            </div>
          ))}
        </div>

        {/* FUNNEL */}

        <div className="p-6 border bg-slate-900 border-slate-800 rounded-3xl">

          <h2 className="mb-5 text-xl font-bold">
            Conversion Funnel
          </h2>

          <div className="grid grid-cols-2 gap-4">

            <Funnel
              title="Aware"
              value={
                funnel.aware ||
                "482K"
              }
            />

            <Funnel
              title="Engaged"
              value={
                funnel.engaged ||
                "18.3K"
              }
            />

            <Funnel
              title="Lead"
              value={
                funnel.lead ||
                "3210"
              }
            />

            <Funnel
              title="Converted"
              value={
                funnel.converted ||
                "1204"
              }
            />

          </div>

        </div>
      </div>

      {/* CAMPAIGNS */}

      <div className="p-6 mb-8 border bg-slate-900 border-slate-800 rounded-3xl">

        <h2 className="mb-5 text-xl font-bold">
          Active Campaigns
        </h2>

        {(activeCampaigns.length
          ? activeCampaigns
          : [
              {
                campaignName:
                  "Summer Sale",
                status: "Active",
                conversionRate: 4.2,
              },
              {
                campaignName:
                  "Brand Awareness",
                status: "Active",
                conversionRate: 2.8,
              },
            ]).map(
          (campaign, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-4 border-b border-slate-800"
            >
              <div>
                <h3>
                  {
                    campaign.campaignName
                  }
                </h3>

                <p className="text-slate-400">
                  Conversion :
                  {
                    campaign.conversionRate
                  }
                  %
                </p>
              </div>

              <span className="px-3 py-1 text-green-400 rounded-full bg-green-500/20">
                {campaign.status}
              </span>
            </div>
          )
        )}
      </div>

      {/* ALERTS + NOTIFICATIONS */}

      <div className="grid gap-6 lg:grid-cols-2">

        <div className="p-6 border bg-slate-900 border-slate-800 rounded-3xl">

          <h2 className="mb-4 font-bold">
            Alerts
          </h2>

          {alerts.map((a, i) => (
            <div
              key={i}
              className="flex gap-3 mb-4"
            >
              <FaExclamationTriangle className="text-yellow-500" />

              <div>
                <h4>{a.title}</h4>
                <p className="text-slate-400">
                  {a.message}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border bg-slate-900 border-slate-800 rounded-3xl">

          <h2 className="mb-4 font-bold">
            Notifications
          </h2>

          {notifications.map(
            (n, i) => (
              <div
                key={i}
                className="flex gap-3 mb-4"
              >
                <FaBell className="text-blue-400" />

                <div>
                  <h4>{n.title}</h4>
                  <p className="text-slate-400">
                    {n.message}
                  </p>
                </div>
              </div>
            )
          )}
        </div>

      </div>

    </div>
  );
}

const Card = ({
  icon,
  title,
  value,
}) => (
  <div className="p-5 border bg-slate-900 border-slate-800 rounded-3xl">
    <div className="mb-3 text-2xl text-blue-400">
      {icon}
    </div>

    <p className="text-slate-400">
      {title}
    </p>

    <h2 className="mt-2 text-3xl font-bold">
      {value}
    </h2>
  </div>
);

const Info = ({
  label,
  value,
}) => (
  <div>
    <p className="text-slate-400">
      {label}
    </p>

    <h3 className="font-semibold">
      {value}
    </h3>
  </div>
);

const Funnel = ({
  title,
  value,
}) => (
  <div className="p-4 bg-slate-800 rounded-2xl">
    <p className="text-slate-400">
      {title}
    </p>

    <h3 className="text-2xl font-bold">
      {value}
    </h3>
  </div>
);