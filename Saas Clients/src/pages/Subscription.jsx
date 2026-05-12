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
  ShieldCheck,
  TrendingUp,
  Activity,
  Loader2,
  RefreshCcw,
  XCircle,
  Send,
  Mail,
  Phone,
  User,
  Download,
  Sparkles,
} from "lucide-react";

export default function Subscription() {
  // ======================================================
  // BASE API
  // ======================================================

  const BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  const API = `${BASE_URL}/api/v1`;

  // ======================================================
  // STATE
  // ======================================================

  const [currentPlan, setCurrentPlan] =
    useState(null);

  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState("");

  const [billingCycle, setBillingCycle] =
    useState("monthly");

  const [showUpgradeModal, setShowUpgradeModal] =
    useState(false);

  const [selectedPlan, setSelectedPlan] =
    useState("");

  const [formLoading, setFormLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [upgradeForm, setUpgradeForm] =
    useState({
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      notes: "",
    });

  // ======================================================
  // TOKEN
  // ======================================================

  const token =
    localStorage.getItem("accessToken");

  // ======================================================
  // AXIOS INSTANCE
  // ======================================================

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API,
      timeout: 30000,
    });

    instance.interceptors.request.use(
      (config) => {
        const accessToken =
          localStorage.getItem(
            "accessToken"
          );

        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
      }
    );

    return instance;
  }, [API]);

  // ======================================================
  // PLANS
  // ======================================================

  const plans = useMemo(
    () => [
      {
        key: "starter",
        name: "Starter",
        monthly: 2999,
        yearly: 29999,
        icon: Rocket,
        badge: "Startup Ready",
        description:
          "Perfect for startups and small businesses.",

        features: [
          "5 Projects",
          "5 Team Members",
          "CRM Dashboard",
          "Lead Management",
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
        description:
          "Automation and scaling tools for growing teams.",

        features: [
          "20 Projects",
          "20 Team Members",
          "Campaign Builder",
          "AI Automation",
          "Advanced Analytics",
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
          "Unlimited scale with advanced security and integrations.",

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

  // ======================================================
  // FETCH DATA
  // ======================================================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [subscriptionRes, analyticsRes] =
        await Promise.all([
          api.get("/subscription/me"),

          api.get(
            "/subscription/analytics/overview"
          ),
        ]);

      setCurrentPlan(
        subscriptionRes?.data?.data || null
      );

      setAnalytics(
        analyticsRes?.data?.data || null
      );
    } catch (err) {
      console.error(err);

      if (
        err?.response?.status === 401
      ) {
        localStorage.removeItem(
          "accessToken"
        );

        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  }, [api]);

  // ======================================================
  // OPEN MODAL
  // ======================================================

  const openUpgradeModal = (plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  // ======================================================
  // UPGRADE REQUEST
  // ======================================================

  const submitUpgradeRequest = async () => {
  try {

    setFormLoading(true);

    const payload = {
      ...upgradeForm,
      plan: selectedPlan,
      billingCycle,
    };

    console.log(
      "🚀 SENDING PAYLOAD:",
      payload
    );

    console.log(
      "🌐 API URL:",
      `${API}/subscription/upgrade-request`
    );

    const res = await api.post(
      "/subscription/upgrade-request",
      payload
    );

    console.log(
      "✅ UPGRADE RESPONSE:",
      res.data
    );

    if (res.data.success) {
      alert(
        "Upgrade request sent successfully ✅"
      );

      setShowUpgradeModal(false);

      setUpgradeForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        notes: "",
      });
    }

  } catch (err) {

    console.error(
      "❌ UPGRADE ERROR:",
      err
    );

    console.error(
      err?.response?.data
    );

    alert(
      err?.response?.data?.message ||
      "Request failed"
    );

  } finally {
    setFormLoading(false);
  }
};

  // ======================================================
  // CANCEL SUBSCRIPTION
  // ======================================================

  const cancelSubscription =
    async () => {
      try {
        if (!currentPlan?._id) {
          return;
        }

        setActionLoading("cancel");

        await api.patch(
          `/subscription/${currentPlan._id}/cancel`
        );

        await fetchData();

        alert(
          "Subscription cancelled successfully"
        );
      } catch (err) {
        console.error(err);

        alert(
          err?.response?.data?.message ||
            "Cancel failed"
        );
      } finally {
        setActionLoading("");
      }
    };

  // ======================================================
  // DOWNLOAD INVOICE
  // ======================================================

  const downloadInvoice =
    async () => {
      try {
        if (!currentPlan?._id) {
          return alert(
            "No active subscription found"
          );
        }

        setActionLoading("invoice");

        const response =
          await api.get(
            `/subscription/${currentPlan._id}/invoice`,
            {
              responseType: "blob",
            }
          );

        const blob = new Blob(
          [response.data],
          {
            type: "application/pdf",
          }
        );

        const url =
          window.URL.createObjectURL(blob);

        const link =
          document.createElement("a");

        link.href = url;

        link.download = `Invoice-${currentPlan._id}.pdf`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);

        alert(
          err?.response?.data?.message ||
            "Invoice download failed"
        );
      } finally {
        setActionLoading("");
      }
    };

  // ======================================================
  // LOAD
  // ======================================================

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetchData();
  }, [fetchData, token]);

  // ======================================================
  // LOADER
  // ======================================================

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

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="min-h-screen bg-[#050816] text-white px-6 py-8">
      {/* HEADER */}

      <div className="flex flex-col gap-4 mb-10 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Subscription Dashboard
          </h1>

          <p className="mt-2 text-slate-400">
            Manage plans, invoices,
            billing and enterprise growth.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-5 py-3 transition rounded-2xl bg-slate-800 hover:bg-slate-700"
        >
          <RefreshCcw size={18} />
          Refresh
        </button>
      </div>

      {/* CURRENT PLAN */}

      <div className="p-6 mb-10 border rounded-3xl border-cyan-500/20 bg-slate-900/70">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-slate-400">
              Current Subscription
            </p>

            <h2 className="mt-2 text-3xl font-bold capitalize">
              {currentPlan?.plan ||
                "No Active Plan"}
            </h2>

            <div className="flex flex-wrap gap-3 mt-4">
              <Badge>
                Status:
                {" "}
                {currentPlan?.status ||
                  "inactive"}
              </Badge>

              <Badge>
                Billing:
                {" "}
                {currentPlan?.billingCycle ||
                  "monthly"}
              </Badge>

              <Badge>
                Team:
                {" "}
                {currentPlan?.teamMembers ||
                  0}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={downloadInvoice}
              className="flex items-center gap-2 px-5 py-3 font-semibold text-black transition bg-cyan-400 rounded-2xl hover:bg-cyan-300"
            >
              <Download size={18} />

              {actionLoading ===
              "invoice"
                ? "Downloading..."
                : "Download Invoice"}
            </button>

            <button
              onClick={
                cancelSubscription
              }
              className="flex items-center gap-2 px-5 py-3 font-semibold transition bg-red-600 rounded-2xl hover:bg-red-500"
            >
              <XCircle size={18} />

              {actionLoading ===
              "cancel"
                ? "Cancelling..."
                : "Cancel"}
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}

      <div className="grid gap-6 mb-12 md:grid-cols-4">
        <StatCard
          icon={CreditCard}
          title="Current Plan"
          value={
            currentPlan?.plan ||
            "No Plan"
          }
        />

        <StatCard
          icon={Activity}
          title="Status"
          value={
            currentPlan?.status ||
            "Inactive"
          }
        />

        <StatCard
          icon={CalendarDays}
          title="Renewal Date"
          value={
            currentPlan?.renewalDate
              ? new Date(
                  currentPlan.renewalDate
                ).toLocaleDateString()
              : "N/A"
          }
        />

        <StatCard
          icon={Users}
          title="Team Members"
          value={
            currentPlan?.teamMembers ||
            0
          }
        />
      </div>

      {/* ANALYTICS */}

      <div className="grid gap-6 mb-12 md:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          title="Revenue"
          value={`₹${
            analytics?.totalRevenue ||
            0
          }`}
        />

        <StatCard
          icon={Users}
          title="Subscriptions"
          value={
            analytics?.totalSubscriptions ||
            0
          }
        />

        <StatCard
          icon={CheckCircle2}
          title="Active"
          value={
            analytics?.activeSubscriptions ||
            0
          }
        />

        <StatCard
          icon={ShieldCheck}
          title="Cancelled"
          value={
            analytics?.cancelledSubscriptions ||
            0
          }
        />
      </div>

      {/* BILLING TOGGLE */}

      <div className="flex items-center gap-3 mb-10">
        {["monthly", "yearly"].map(
          (cycle) => (
            <button
              key={cycle}
              onClick={() =>
                setBillingCycle(
                  cycle
                )
              }
              className={`px-5 py-2 rounded-xl capitalize transition ${
                billingCycle === cycle
                  ? "bg-cyan-400 text-black"
                  : "bg-slate-800"
              }`}
            >
              {cycle}
            </button>
          )
        )}
      </div>

      {/* PLAN CARDS */}

      <div className="grid gap-8 md:grid-cols-3">
        {plans.map((plan, idx) => {
          const price =
            billingCycle ===
            "monthly"
              ? plan.monthly
              : plan.yearly;

          return (
            <motion.div
              key={plan.key}
              initial={{
                opacity: 0,
                y: 40,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: idx * 0.12,
              }}
              className={`rounded-3xl border bg-gradient-to-br ${plan.color} p-7 backdrop-blur-xl`}
            >
              <div className="flex items-center justify-between mb-5">
                <plan.icon size={30} />

                <span className="px-3 py-1 text-xs rounded-full bg-white/10">
                  {plan.badge}
                </span>
              </div>

              <h3 className="text-2xl font-bold">
                {plan.name}
              </h3>

              <p className="mt-2 text-slate-300">
                {plan.description}
              </p>

              <div className="mt-6">
                <span className="text-4xl font-bold">
                  ₹{price}
                </span>

                <span className="text-slate-400">
                  /
                  {billingCycle ===
                  "monthly"
                    ? "month"
                    : "year"}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {plan.features.map(
                  (
                    feature,
                    index
                  ) => (
                    <div
                      key={index}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2
                        className="text-green-400"
                        size={18}
                      />

                      <span className="text-sm">
                        {feature}
                      </span>
                    </div>
                  )
                )}
              </div>

              <button
                onClick={() =>
                  openUpgradeModal(
                    plan.key
                  )
                }
                className="w-full py-3 mt-8 font-semibold text-black transition rounded-2xl bg-cyan-400 hover:bg-cyan-300"
              >
                Upgrade Plan
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* MODAL */}

      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
          >
            <motion.div
              initial={{
                scale: 0.9,
              }}
              animate={{
                scale: 1,
              }}
              exit={{
                scale: 0.9,
              }}
              className="w-full max-w-2xl p-8 border rounded-3xl bg-slate-900 border-slate-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="text-cyan-400" />

                <h2 className="text-3xl font-bold capitalize">
                  Upgrade -
                  {" "}
                  {selectedPlan}
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  icon={User}
                  placeholder="Full Name"
                  value={
                    upgradeForm.name
                  }
                  onChange={(e) =>
                    setUpgradeForm({
                      ...upgradeForm,
                      name:
                        e.target
                          .value,
                    })
                  }
                />

                <InputField
                  icon={Mail}
                  placeholder="Email"
                  value={
                    upgradeForm.email
                  }
                  onChange={(e) =>
                    setUpgradeForm({
                      ...upgradeForm,
                      email:
                        e.target
                          .value,
                    })
                  }
                />

                <InputField
                  icon={Phone}
                  placeholder="Phone"
                  value={
                    upgradeForm.phone
                  }
                  onChange={(e) =>
                    setUpgradeForm({
                      ...upgradeForm,
                      phone:
                        e.target
                          .value,
                    })
                  }
                />

                <InputField
                  icon={Building2}
                  placeholder="Company"
                  value={
                    upgradeForm.company
                  }
                  onChange={(e) =>
                    setUpgradeForm({
                      ...upgradeForm,
                      company:
                        e.target
                          .value,
                    })
                  }
                />
              </div>

              <textarea
                rows="3"
                placeholder="Address"
                className="w-full p-4 mt-4 outline-none rounded-2xl bg-slate-800"
                value={
                  upgradeForm.address
                }
                onChange={(e) =>
                  setUpgradeForm({
                    ...upgradeForm,
                    address:
                      e.target.value,
                  })
                }
              />

              <textarea
                rows="3"
                placeholder="Additional Notes"
                className="w-full p-4 mt-4 outline-none rounded-2xl bg-slate-800"
                value={
                  upgradeForm.notes
                }
                onChange={(e) =>
                  setUpgradeForm({
                    ...upgradeForm,
                    notes:
                      e.target.value,
                  })
                }
              />

              <div className="flex gap-4 mt-6">
                <button
                  onClick={
                    submitUpgradeRequest
                  }
                  className="flex items-center justify-center flex-1 gap-2 py-3 font-bold text-black transition rounded-2xl bg-cyan-400 hover:bg-cyan-300"
                >
                  <Send size={18} />

                  {formLoading
                    ? "Sending..."
                    : "Send Request"}
                </button>

                <button
                  onClick={() =>
                    setShowUpgradeModal(
                      false
                    )
                  }
                  className="flex-1 py-3 transition rounded-2xl bg-slate-700 hover:bg-slate-600"
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

// ======================================================
// INPUT FIELD
// ======================================================

function InputField({
  icon: Icon,
  ...props
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800">
      <Icon
        size={18}
        className="text-cyan-400"
      />

      <input
        {...props}
        className="w-full bg-transparent outline-none"
      />
    </div>
  );
}

// ======================================================
// STAT CARD
// ======================================================

function StatCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="p-6 border rounded-3xl bg-slate-900/80 border-slate-800">
      <Icon className="mb-3 text-cyan-400" />

      <p className="text-slate-400">
        {title}
      </p>

      <h3 className="text-2xl font-bold capitalize">
        {value}
      </h3>
    </div>
  );
}

// ======================================================
// BADGE
// ======================================================

function Badge({ children }) {
  return (
    <span className="px-3 py-1 text-sm border rounded-full bg-cyan-500/10 border-cyan-500/20">
      {children}
    </span>
  );
}