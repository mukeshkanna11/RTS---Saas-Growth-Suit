import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Crown,
  Rocket,
  Building2,
  CreditCard,
  CalendarDays,
  Users,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Activity,
  Loader2,
} from "lucide-react";

export default function Subscription() {
  const API =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  const [currentPlan, setCurrentPlan] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem("token");

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const plans = useMemo(
    () => [
      {
        key: "starter",
        name: "Starter",
        price: "₹2,999",
        cycle: "/month",
        icon: Rocket,
        badge: "Best for Startups",
        description:
          "Launch your business with essential tools and powerful automation.",
        features: [
          "5 Projects Included",
          "5 Team Members",
          "Lead Management",
          "CRM Dashboard",
          "Email Automation",
          "Basic Analytics",
        ],
        color:
          "from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border-cyan-500/20",
      },
      {
        key: "growth",
        name: "Growth",
        price: "₹7,999",
        cycle: "/month",
        icon: Crown,
        badge: "Most Popular",
        description:
          "Scale faster with advanced automation and campaign tools.",
        features: [
          "20 Projects Included",
          "20 Team Members",
          "Advanced CRM",
          "Campaign Builder",
          "AI Automation",
          "Full Analytics",
        ],
        color:
          "from-purple-500/20 via-pink-500/10 to-fuchsia-500/20 border-purple-500/20",
      },
      {
        key: "enterprise",
        name: "Enterprise",
        price: "₹19,999",
        cycle: "/month",
        icon: Building2,
        badge: "For Enterprises",
        description:
          "Complete ecosystem for large organizations with unlimited scale.",
        features: [
          "Unlimited Projects",
          "Unlimited Team Members",
          "ERP Module",
          "Custom Integrations",
          "Priority Support",
          "Advanced Security",
        ],
        color:
          "from-amber-500/20 via-orange-500/10 to-yellow-500/20 border-amber-500/20",
      },
    ],
    []
  );

 const fetchData = async () => {
  const storedToken = localStorage.getItem("token");

  if (!storedToken) {
    console.warn("No token found. Redirecting to login...");
    window.location.href = "/login";
    return;
  }

  try {
    const headers = {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    };

    const [subRes, analyticsRes] = await Promise.all([
      axios.get(`${API}/subscription/me`, headers),
      axios.get(`${API}/subscription/analytics/overview`, headers),
    ]);

    setCurrentPlan(subRes.data?.data || null);
    setAnalytics(analyticsRes.data?.data || null);
  } catch (error) {
    console.error("Fetch Error:", error?.response?.data || error.message);

    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  } finally {
    setLoading(false);
  }
};

  const upgradePlan = async (planKey) => {
    if (!currentPlan?._id) {
      alert("No subscription found.");
      return;
    }

    try {
      setActionLoading(true);

      await axios.patch(
        `${API}/subscription/${currentPlan._id}/change-plan`,
        { plan: planKey },
        getAuthHeaders()
      );

      await fetchData();

      alert("Subscription upgraded successfully!");
    } catch (error) {
      console.error(
        "Upgrade Error:",
        error?.response?.data || error.message
      );
      alert("Upgrade failed.");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-lg">
          <Loader2 className="animate-spin" />
          Loading subscription dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8 text-white bg-[#050816]">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">
          Subscription Dashboard
        </h1>
        <p className="max-w-2xl mt-3 text-slate-400">
          Manage your SaaS subscription, explore premium plans, and monitor
          your business growth with real-time insights.
        </p>
      </div>

      {/* Current Subscription */}
      <div className="grid gap-6 mb-10 md:grid-cols-4">
        <div className="p-6 border rounded-3xl bg-slate-900/80 border-slate-800">
          <CreditCard className="mb-3 text-cyan-400" />
          <p className="text-slate-400">Current Plan</p>
          <h3 className="text-2xl font-bold capitalize">
            {currentPlan?.plan || "No Plan"}
          </h3>
        </div>

        <div className="p-6 border rounded-3xl bg-slate-900/80 border-slate-800">
          <Activity className="mb-3 text-green-400" />
          <p className="text-slate-400">Status</p>
          <h3 className="text-2xl font-bold capitalize">
            {currentPlan?.status || "Inactive"}
          </h3>
        </div>

        <div className="p-6 border rounded-3xl bg-slate-900/80 border-slate-800">
          <CalendarDays className="mb-3 text-amber-400" />
          <p className="text-slate-400">Renewal</p>
          <h3 className="text-lg font-bold">
            {currentPlan?.renewalDate
              ? new Date(currentPlan.renewalDate).toLocaleDateString()
              : "N/A"}
          </h3>
        </div>

        <div className="p-6 border rounded-3xl bg-slate-900/80 border-slate-800">
          <Users className="mb-3 text-purple-400" />
          <p className="text-slate-400">Team Members</p>
          <h3 className="text-2xl font-bold">
            {currentPlan?.teamMembers || 0}
          </h3>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid gap-6 mb-12 md:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          title="Total Revenue"
          value={`₹${analytics?.totalRevenue || 0}`}
        />
        <StatCard
          icon={Users}
          title="Subscriptions"
          value={analytics?.totalSubscriptions || 0}
        />
        <StatCard
          icon={CheckCircle2}
          title="Active"
          value={analytics?.activeSubscriptions || 0}
        />
        <StatCard
          icon={ShieldCheck}
          title="Cancelled"
          value={analytics?.cancelledSubscriptions || 0}
        />
      </div>

      {/* Pricing Plans */}
      <div>
        <h2 className="mb-6 text-3xl font-bold">Choose Your Plan</h2>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.12 }}
              className={`rounded-3xl border bg-gradient-to-br ${plan.color} p-7 backdrop-blur-xl shadow-2xl`}
            >
              <div className="flex items-center justify-between mb-6">
                <plan.icon className="text-cyan-400" size={30} />
                <span className="px-3 py-1 text-xs rounded-full bg-white/10">
                  {plan.badge}
                </span>
              </div>

              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="mt-2 text-slate-300">{plan.description}</p>

              <div className="mt-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-slate-400">{plan.cycle}</span>
              </div>

              <div className="mt-6 space-y-3">
                {plan.features.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2
                      className="text-green-400 shrink-0"
                      size={18}
                    />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={actionLoading}
                onClick={() => upgradePlan(plan.key)}
                className="w-full py-3 mt-8 font-semibold text-black transition rounded-2xl bg-cyan-400 hover:bg-cyan-300"
              >
                {actionLoading ? "Processing..." : "Upgrade Plan"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Extra Value Section */}
      <div className="grid gap-6 mt-14 md:grid-cols-3">
        <FeatureCard
          icon={Sparkles}
          title="AI Powered Automation"
          text="Reduce manual work with intelligent workflows and smart campaigns."
        />
        <FeatureCard
          icon={BarChart3}
          title="Business Intelligence"
          text="Real-time analytics to help you make better business decisions."
        />
        <FeatureCard
          icon={ShieldCheck}
          title="Enterprise Security"
          text="Advanced protection with secure tenant-based architecture."
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value }) {
  return (
    <div className="p-6 border rounded-3xl bg-slate-900/80 border-slate-800">
      <Icon className="mb-3 text-cyan-400" />
      <p className="text-slate-400">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="p-6 border rounded-3xl bg-slate-900/80 border-slate-800">
      <Icon className="mb-3 text-cyan-400" />
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 text-slate-400">{text}</p>
    </div>
  );
}