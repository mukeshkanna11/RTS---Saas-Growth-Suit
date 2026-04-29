import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
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
  RefreshCcw,
  XCircle,
  Send,
  Mail,
  Phone,
  MapPin,
  User,
} from "lucide-react";

export default function Subscription() {
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const API = `${BASE_URL}/api/v1`;

  const [currentPlan, setCurrentPlan] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");

  // Modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [upgradeForm, setUpgradeForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    notes: "",
  });

  const token = localStorage.getItem("token");

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API,
      timeout: 15000,
    });

    instance.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers["Content-Type"] = "application/json";
      return config;
    });

    return instance;
  }, [API, token]);

  const plans = useMemo(
    () => [
      {
        key: "starter",
        name: "Starter",
        monthly: 2999,
        yearly: 29999,
        icon: Rocket,
        badge: "Startup Ready",
        description: "Perfect for new businesses entering digital growth.",
        features: [
          "5 Projects",
          "5 Team Members",
          "Lead Management",
          "CRM Dashboard",
          "Basic Analytics",
        ],
        color:
          "from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border-cyan-500/20",
      },
      {
        key: "growth",
        name: "Growth",
        monthly: 7999,
        yearly: 79999,
        icon: Crown,
        badge: "Most Popular",
        description: "Advanced automation and campaign scaling tools.",
        features: [
          "20 Projects",
          "20 Team Members",
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
        monthly: 19999,
        yearly: 199999,
        icon: Building2,
        badge: "Enterprise Scale",
        description:
          "Unlimited scale with top-level security & integrations.",
        features: [
          "Unlimited Projects",
          "Unlimited Team",
          "ERP Modules",
          "Custom Integrations",
          "Priority Support",
        ],
        color:
          "from-amber-500/20 via-orange-500/10 to-yellow-500/20 border-amber-500/20",
      },
    ],
    []
  );

  const fetchData = useCallback(async () => {
  if (!token) {
    console.warn("No auth token found. Redirecting to login...");
    window.location.href = "/login";
    return;
  }

  try {
    setLoading(true);

    console.log("Fetching subscription data...");

    const [subRes, analyticsRes] = await Promise.all([
      api.get("/subscription/me"),
      api.get("/subscription/analytics/overview"),
    ]);

    console.log("Subscription Response:", subRes?.data);
    console.log("Analytics Response:", analyticsRes?.data);

    setCurrentPlan(subRes?.data?.data || null);
    setAnalytics(analyticsRes?.data?.data || null);
  } catch (error) {
    console.error("Subscription fetch failed:", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      url: error?.config?.url,
      method: error?.config?.method,
    });

    if (error?.response?.status === 401) {
      console.warn("Unauthorized. Clearing session...");
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }

    if (!error?.response) {
      console.error(
        "Network/Server issue: Backend may be unreachable, sleeping, or blocked by CORS."
      );
    }

    setCurrentPlan(null);
    setAnalytics(null);
  } finally {
    setLoading(false);
  }
}, [api, token]);

  const openUpgradeModal = (planKey) => {
    setSelectedPlan(planKey);
    setShowUpgradeModal(true);
  };

  const submitUpgradeRequest = async () => {
  if (
    !upgradeForm.name.trim() ||
    !upgradeForm.email.trim() ||
    !upgradeForm.phone.trim() ||
    !upgradeForm.notes.trim()
  ) {
    alert("Please complete all required fields.");
    return;
  }

  try {
    setFormLoading(true);

    const payload = {
      name: upgradeForm.name.trim(),
      email: upgradeForm.email.trim(),
      phone: upgradeForm.phone.trim(),
      company: upgradeForm.company?.trim() || "N/A",
      address: upgradeForm.address?.trim() || "N/A",
      notes: upgradeForm.notes.trim(),
      plan: selectedPlan,
      billingCycle,
    };

    const response = await axios.post(
      `${API}/subscription/upgrade-request`,
      payload,
      {
        ...getAuthHeaders(),
        timeout: 10000,
      }
    );

    if (response?.data?.success) {
      alert("Request submitted successfully. Our team will contact you soon.");

      setShowUpgradeModal(false);

      setUpgradeForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        notes: "",
      });
    } else {
      throw new Error(response?.data?.message || "Unexpected response");
    }
  } catch (error) {
    console.error("Upgrade request failed:", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    if (error.code === "ECONNABORTED") {
      alert("Server response delayed. Please try again.");
    } else if (!error.response) {
      alert("Network issue. Please check your connection.");
    } else {
      alert(error.response.data.message || "Request failed.");
    }
  } finally {
    setFormLoading(false);
  }
};

  const cancelSubscription = async () => {
    if (!currentPlan?._id) return;

    try {
      setActionLoading("cancel");

      await axios.patch(
        `${API}/subscription/${currentPlan._id}/cancel`,
        {},
        getAuthHeaders()
      );

      await fetchData();
      alert("Subscription cancelled successfully.");
    } catch (error) {
      alert(error?.response?.data?.message || "Cancel failed.");
    } finally {
      setActionLoading("");
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      <div className="flex flex-col gap-4 mb-10 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Subscription Dashboard</h1>
          <p className="mt-2 text-slate-400">
            Manage plans, send upgrade requests, and grow your business.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700"
        >
          <RefreshCcw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 mb-12 md:grid-cols-4">
        <StatCard
          icon={CreditCard}
          title="Current Plan"
          value={currentPlan?.plan || "No Plan"}
        />
        <StatCard
          icon={Activity}
          title="Status"
          value={currentPlan?.status || "Inactive"}
        />
        <StatCard
          icon={CalendarDays}
          title="Renewal"
          value={
            currentPlan?.renewalDate
              ? new Date(currentPlan.renewalDate).toLocaleDateString()
              : "N/A"
          }
        />
        <StatCard
          icon={Users}
          title="Team Members"
          value={currentPlan?.teamMembers || 0}
        />
      </div>

      {/* Analytics */}
      <div className="grid gap-6 mb-12 md:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          title="Revenue"
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

      {/* Billing */}
      <div className="flex items-center gap-3 mb-8">
        {["monthly", "yearly"].map((cycle) => (
          <button
            key={cycle}
            onClick={() => setBillingCycle(cycle)}
            className={`px-5 py-2 rounded-xl ${
              billingCycle === cycle
                ? "bg-cyan-400 text-black"
                : "bg-slate-800"
            }`}
          >
            {cycle}
          </button>
        ))}
      </div>

      {/* Plans */}
      <div className="grid gap-8 md:grid-cols-3">
        {plans.map((plan, idx) => {
          const price =
            billingCycle === "monthly" ? plan.monthly : plan.yearly;

          return (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.12 }}
              className={`rounded-3xl border bg-gradient-to-br ${plan.color} p-7 backdrop-blur-xl`}
            >
              <div className="flex items-center justify-between mb-5">
                <plan.icon size={30} />
                <span className="px-3 py-1 text-xs rounded-full bg-white/10">
                  {plan.badge}
                </span>
              </div>

              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="mt-2 text-slate-300">{plan.description}</p>

              <div className="mt-6">
                <span className="text-4xl font-bold">₹{price}</span>
                <span className="text-slate-400">
                  /{billingCycle === "monthly" ? "month" : "year"}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="text-green-400" size={18} />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => openUpgradeModal(plan.key)}
                className="w-full py-3 mt-8 font-semibold text-black rounded-2xl bg-cyan-400 hover:bg-cyan-300"
              >
                Upgrade Plan
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Cancel */}
      <div className="mt-12">
        <button
          onClick={cancelSubscription}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 rounded-2xl hover:bg-red-500"
        >
          <XCircle size={18} />
          {actionLoading === "cancel"
            ? "Cancelling..."
            : "Cancel Subscription"}
        </button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-2xl p-8 border bg-slate-900 rounded-3xl border-slate-700"
            >
              <h2 className="mb-6 text-3xl font-bold">
                Upgrade Request - {selectedPlan}
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  icon={User}
                  placeholder="Full Name"
                  value={upgradeForm.name}
                  onChange={(e) =>
                    setUpgradeForm({ ...upgradeForm, name: e.target.value })
                  }
                />
                <InputField
                  icon={Mail}
                  placeholder="Email"
                  value={upgradeForm.email}
                  onChange={(e) =>
                    setUpgradeForm({ ...upgradeForm, email: e.target.value })
                  }
                />
                <InputField
                  icon={Phone}
                  placeholder="Phone"
                  value={upgradeForm.phone}
                  onChange={(e) =>
                    setUpgradeForm({ ...upgradeForm, phone: e.target.value })
                  }
                />
                <InputField
                  icon={Building2}
                  placeholder="Company"
                  value={upgradeForm.company}
                  onChange={(e) =>
                    setUpgradeForm({ ...upgradeForm, company: e.target.value })
                  }
                />
              </div>

              <textarea
                rows="3"
                placeholder="Address"
                className="w-full p-4 mt-4 rounded-2xl bg-slate-800"
                value={upgradeForm.address}
                onChange={(e) =>
                  setUpgradeForm({ ...upgradeForm, address: e.target.value })
                }
              />

              <textarea
                rows="3"
                placeholder="Additional Notes"
                className="w-full p-4 mt-4 rounded-2xl bg-slate-800"
                value={upgradeForm.notes}
                onChange={(e) =>
                  setUpgradeForm({ ...upgradeForm, notes: e.target.value })
                }
              />

              <div className="flex gap-4 mt-6">
                <button
                  onClick={submitUpgradeRequest}
                  className="flex items-center justify-center flex-1 gap-2 py-3 font-bold text-black rounded-2xl bg-cyan-400"
                >
                  <Send size={18} />
                  {formLoading ? "Sending..." : "Send Request"}
                </button>

                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-700"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputField({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800">
      <Icon size={18} className="text-cyan-400" />
      <input
        {...props}
        className="w-full bg-transparent outline-none"
      />
    </div>
  );
}

function StatCard({ icon: Icon, title, value }) {
  return (
    <div className="p-6 border rounded-3xl bg-slate-900/80 border-slate-800">
      <Icon className="mb-3 text-cyan-400" />
      <p className="text-slate-400">{title}</p>
      <h3 className="text-2xl font-bold capitalize">{value}</h3>
    </div>
  );
}