import { useEffect, useMemo, useState, useCallback } from "react";

// ======================================================
// FULLY REBUILT PREMIUM SAAS SUBSCRIPTION PAGE
// PERFECT ALIGNMENT + RESPONSIVE STRUCTURE
// ENTERPRISE LEVEL UI
// ======================================================
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
  Globe,
  Zap,
  ArrowRight,
  Star,
  Briefcase,
  Clock3,
  BarChart3,
  Wallet,
  Layers3,
  CircleDollarSign,
  ChevronRight,
  BadgeCheck,
  MessageSquare,
} from "lucide-react";

export default function Subscription() {
  // ======================================================
  // COMPANY DETAILS
  // ======================================================

  const COMPANY = {
    name: "ReadyTechSolutions",
    tagline:
      "Enterprise-grade SaaS automation platform for modern businesses.",
    email: "info@readytechsolutions.in",
    phone: "+91  70107 97721",
    website: "https://readytechsolutions.in/",
    address:
      "Coimbatore, Tamil Nadu, India",
  };

  // ======================================================
  // API
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

  const [upgradeForm, setUpgradeForm] =
    useState({
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      notes: "",
    });

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
  // PREMIUM PLANS
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
        highlight: "Best for startups",
        description:
          "Launch and manage your SaaS operations with essential automation tools.",

        features: [
          "5 Projects",
          "5 Team Members",
          "CRM Dashboard",
          "Lead Management",
          "Analytics Dashboard",
          "Email Automation",
          "Customer Support",
        ],

        gradient:
          "from-cyan-500/20 via-blue-500/10 to-indigo-500/20",

        border:
          "border-cyan-500/20",
      },

      {
        key: "growth",
        name: "Growth",
        monthly: 7999,
        yearly: 79999,
        icon: Crown,
        badge: "Most Popular",
        highlight: "Fast growing businesses",
        description:
          "Advanced AI-powered growth automation for scaling SaaS companies.",

        features: [
          "20 Projects",
          "20 Team Members",
          "AI Automation",
          "Advanced Reports",
          "Campaign Builder",
          "Priority Support",
          "Custom Branding",
        ],

        gradient:
          "from-purple-500/20 via-pink-500/10 to-fuchsia-500/20",

        border:
          "border-purple-500/30",
      },

      {
        key: "enterprise",
        name: "Enterprise",
        monthly: 19999,
        yearly: 199999,
        icon: Building2,
        badge: "Enterprise Scale",
        highlight: "Unlimited scalability",
        description:
          "Enterprise-grade infrastructure with security, integrations and priority services.",

        features: [
          "Unlimited Projects",
          "Unlimited Team",
          "ERP Modules",
          "Custom Integrations",
          "Dedicated Manager",
          "24/7 Premium Support",
          "Advanced Security",
        ],

        gradient:
          "from-amber-500/20 via-orange-500/10 to-yellow-500/20",

        border:
          "border-amber-500/20",
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
  // MODAL
  // ======================================================

  const openUpgradeModal = (plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  // ======================================================
  // SUBMIT REQUEST
  // ======================================================

  const submitUpgradeRequest = async () => {
    try {
      setFormLoading(true);

      const payload = {
        ...upgradeForm,
        plan: selectedPlan,
        billingCycle,
      };

      const res = await api.post(
        "/subscription/upgrade-request",
        payload
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
      console.error(err);

      alert(
        err?.response?.data?.message ||
          "Request failed"
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ======================================================
  // CANCEL
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
  // INITIAL LOAD
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
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden relative">
      {/* PREMIUM BACKGROUND */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] left-[-120px] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[140px]" />

        <div className="absolute bottom-[-200px] right-[-120px] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[140px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.15),transparent_40%)]" />

        <div className="z-10 flex flex-col items-center gap-5">
          <div className="p-6 border rounded-full bg-cyan-500/10 border-cyan-500/20">
            <Loader2 className="animate-spin text-cyan-400" size={42} />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold">
              Loading Premium Dashboard
            </h2>

            <p className="mt-2 text-slate-400">
              Preparing your SaaS workspace...
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden">
      {/* BACKGROUND */}

      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/20 blur-[140px] rounded-full" />

        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/20 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 px-6 py-8 lg:px-12">
        {/* HERO */}

        <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.75fr] gap-8 items-stretch mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex flex-col justify-between overflow-hidden border border-cyan-500/10 rounded-[36px] bg-gradient-to-br from-[#0f172a]/95 via-[#111827]/95 to-[#020617] p-8 lg:p-10 shadow-[0_0_80px_rgba(6,182,212,0.08)] backdrop-blur-3xl"
          >
            <div className="absolute top-[-60px] right-[-60px] w-72 h-72 bg-cyan-500/20 blur-[120px] rounded-full" />

            <div className="absolute bottom-[-80px] left-[-80px] w-72 h-72 bg-blue-500/10 blur-[120px] rounded-full" />

            <div className="relative z-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold tracking-[3px] uppercase border rounded-full bg-cyan-500/10 border-cyan-400/20 text-cyan-300">
                    <Sparkles size={14} />
                    Premium SaaS Platform
                  </div>

                  <h1 className="text-4xl sm:text-4xl xl:text-4xl font-black leading-[1.1] tracking-tight text-white">
                    {COMPANY.name}
                  </h1>

                  <p className="max-w-2xl mt-6 text-base leading-8 sm:text-lg text-slate-300">
                    {COMPANY.tagline}
                  </p>
                </div>

                <div className="hidden xl:flex items-center justify-center min-w-[90px] h-[90px] rounded-[28px] border border-cyan-400/20 bg-cyan-500/10 backdrop-blur-xl shadow-lg shadow-cyan-500/10">
                  <Sparkles className="text-cyan-300" size={38} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 mt-10 md:grid-cols-3">
                <FeatureCard
                  icon={Zap}
                  title="AI Automation"
                  value="Smart Workflows"
                />

                <FeatureCard
                  icon={ShieldCheck}
                  title="Enterprise Security"
                  value="Protected Systems"
                />

                <FeatureCard
                  icon={BarChart3}
                  title="Real-time Insights"
                  value="Advanced Analytics"
                />
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-5 pt-10 mt-10 border-t border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2 px-4 py-2 border rounded-2xl bg-white/5 border-white/10">
                  <ShieldCheck size={16} className="text-cyan-300" />
                  Enterprise Ready
                </div>

                <div className="flex items-center gap-2 px-4 py-2 border rounded-2xl bg-white/5 border-white/10">
                  <Users size={16} className="text-cyan-300" />
                  Trusted by Teams
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={fetchData}
                  className="flex items-center justify-center gap-2 px-6 py-4 font-semibold text-black transition-all duration-300 rounded-2xl bg-cyan-400 hover:bg-cyan-300 hover:scale-[1.02] shadow-lg shadow-cyan-500/20"
                >
                  <RefreshCcw size={18} />
                  Refresh Dashboard
                </button>

                <button className="flex items-center justify-center gap-2 px-6 py-4 transition-all duration-300 border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-400/20">
                  <Globe size={18} className="text-cyan-300" />
                  Visit Website
                </button>
              </div>
            </div>
          </motion.div>

          {/* COMPANY CARD */}

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            className="border rounded-[32px] border-white/10 bg-white/5 backdrop-blur-2xl p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-slate-400">
                  Company Overview
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  Premium Support
                </h2>
              </div>

              <div className="p-4 text-black rounded-2xl bg-cyan-400">
                <BadgeCheck />
              </div>
            </div>

            <div className="space-y-5">
              <InfoRow
                icon={Mail}
                label="Email"
                value={COMPANY.email}
              />

              <InfoRow
                icon={Phone}
                label="Phone"
                value={COMPANY.phone}
              />

              <InfoRow
                icon={Globe}
                label="Website"
                value={COMPANY.website}
              />

              <InfoRow
                icon={Building2}
                label="Location"
                value={COMPANY.address}
              />
            </div>

            <div className="p-5 mt-8 border rounded-3xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Dedicated Account Manager
                  </p>

                  <h3 className="mt-1 text-xl font-bold">
                    Enterprise Ready
                  </h3>
                </div>

                <ChevronRight className="text-cyan-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* CURRENT PLAN */}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] mb-10">
          <div className="relative overflow-hidden border rounded-[32px] border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-slate-900 p-8">
            <div className="absolute right-0 top-0 w-52 h-52 bg-cyan-400/10 blur-[120px]" />

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm border rounded-full bg-cyan-500/10 border-cyan-500/20 text-cyan-300">
                  <Sparkles size={16} />
                  Active Subscription
                </div>

                <h2 className="text-4xl font-black capitalize">
                  {currentPlan?.plan ||
                    "No Active Plan"}
                </h2>

                <p className="max-w-xl mt-3 leading-7 text-slate-400">
                  Manage billing, invoices, renewals and enterprise tools from your premium dashboard.
                </p>

                <div className="flex flex-wrap gap-3 mt-6">
                  <Badge>
                    Status: {currentPlan?.status || "inactive"}
                  </Badge>

                  <Badge>
                    Billing: {currentPlan?.billingCycle || "monthly"}
                  </Badge>

                  <Badge>
                    Team: {currentPlan?.teamMembers || 0}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col w-full gap-4 lg:w-auto">
                <button
                  onClick={downloadInvoice}
                  className="flex items-center justify-center gap-2 px-6 py-4 font-semibold text-black transition rounded-2xl bg-cyan-400 hover:bg-cyan-300"
                >
                  <Download size={18} />

                  {actionLoading ===
                  "invoice"
                    ? "Downloading..."
                    : "Download Invoice"}
                </button>

                <button
                  onClick={cancelSubscription}
                  className="flex items-center justify-center gap-2 px-6 py-4 font-semibold transition rounded-2xl bg-red-500/90 hover:bg-red-500"
                >
                  <XCircle size={18} />

                  {actionLoading ===
                  "cancel"
                    ? "Cancelling..."
                    : "Cancel Subscription"}
                </button>
              </div>
            </div>
          </div>

          {/* QUICK STATS */}

          <div className="grid gap-5 md:grid-cols-2">
            <StatCard
              icon={Wallet}
              title="Revenue"
              value={`₹${analytics?.totalRevenue || 0}`}
            />

            <StatCard
              icon={Users}
              title="Subscribers"
              value={analytics?.totalSubscriptions || 0}
            />

            <StatCard
              icon={Activity}
              title="Active"
              value={analytics?.activeSubscriptions || 0}
            />

            <StatCard
              icon={Clock3}
              title="Renewal"
              value={
                currentPlan?.renewalDate
                  ? new Date(
                      currentPlan.renewalDate
                    ).toLocaleDateString()
                  : "N/A"
              }
            />
          </div>
        </div>

        {/* BILLING TOGGLE */}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <p className="text-slate-400">
              Flexible Pricing Plans
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Choose Your Premium Plan
            </h2>
          </div>

          <div className="flex items-center gap-3 p-2 border rounded-2xl border-white/10 bg-white/5 backdrop-blur-xl">
            {[
              "monthly",
              "yearly",
            ].map((cycle) => (
              <button
                key={cycle}
                onClick={() =>
                  setBillingCycle(cycle)
                }
                className={`px-6 py-3 rounded-xl capitalize transition-all font-semibold ${
                  billingCycle === cycle
                    ? "bg-cyan-400 text-black"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {cycle}
              </button>
            ))}
          </div>
        </div>

        {/* PLAN CARDS */}

        <div className="grid gap-8 xl:grid-cols-3 mb-14">
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
                  y: 50,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: idx * 0.15,
                }}
                whileHover={{
                  y: -10,
                }}
                className={`relative overflow-hidden rounded-[34px] border ${plan.border} bg-gradient-to-br ${plan.gradient} backdrop-blur-2xl p-8`}
              >
                <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full blur-[80px]" />

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center justify-center border w-14 h-14 rounded-2xl bg-white/10 border-white/10">
                    <plan.icon size={28} />
                  </div>

                  <span className="px-4 py-2 text-xs border rounded-full bg-white/10 border-white/10">
                    {plan.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-3xl font-black">
                    {plan.name}
                  </h3>

                  <p className="mt-2 text-sm text-cyan-300">
                    {plan.highlight}
                  </p>

                  <p className="mt-4 leading-7 text-slate-300">
                    {plan.description}
                  </p>
                </div>

                <div className="flex items-end gap-2 mt-8">
                  <span className="text-5xl font-black">
                    ₹{price}
                  </span>

                  <span className="pb-2 text-slate-400">
                    /
                    {billingCycle ===
                    "monthly"
                      ? "month"
                      : "year"}
                  </span>
                </div>

                <div className="mt-8 space-y-4">
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

                        <span className="text-sm text-slate-200">
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
                  className="flex items-center justify-center w-full gap-2 py-4 mt-8 font-bold text-black transition-all rounded-2xl bg-cyan-400 hover:bg-cyan-300"
                >
                  Upgrade Plan
                  <ArrowRight size={18} />
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* ENTERPRISE SECTION */}

        <div className="grid gap-8 lg:grid-cols-3 mb-14">
          <PremiumInfoCard
            icon={Layers3}
            title="Enterprise Integrations"
            desc="Connect CRM, ERP, automation tools and analytics systems seamlessly."
          />

          <PremiumInfoCard
            icon={CircleDollarSign}
            title="Revenue Optimization"
            desc="Track recurring revenue, churn and customer lifetime value with precision."
          />

          <PremiumInfoCard
            icon={MessageSquare}
            title="24/7 Support"
            desc="Dedicated support engineers and onboarding specialists for enterprise customers."
          />
        </div>
      </div>

      {/* MODAL */}

      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
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
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.9,
                opacity: 0,
              }}
              className="relative w-full max-w-3xl overflow-hidden border rounded-[36px] bg-[#0B1220] border-white/10"
            >
              <div className="absolute top-0 right-0 w-60 h-60 bg-cyan-500/10 blur-[120px]" />

              <div className="relative z-10 p-8 lg:p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center justify-center w-16 h-16 text-black rounded-3xl bg-cyan-400">
                    <Sparkles size={28} />
                  </div>

                  <div>
                    <h2 className="text-4xl font-black capitalize">
                      Upgrade - {selectedPlan}
                    </h2>

                    <p className="mt-2 text-slate-400">
                      Complete your enterprise upgrade request.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <InputField
                    icon={User}
                    placeholder="Full Name"
                    value={upgradeForm.name}
                    onChange={(e) =>
                      setUpgradeForm({
                        ...upgradeForm,
                        name:
                          e.target.value,
                      })
                    }
                  />

                  <InputField
                    icon={Mail}
                    placeholder="Email Address"
                    value={upgradeForm.email}
                    onChange={(e) =>
                      setUpgradeForm({
                        ...upgradeForm,
                        email:
                          e.target.value,
                      })
                    }
                  />

                  <InputField
                    icon={Phone}
                    placeholder="Phone Number"
                    value={upgradeForm.phone}
                    onChange={(e) =>
                      setUpgradeForm({
                        ...upgradeForm,
                        phone:
                          e.target.value,
                      })
                    }
                  />

                  <InputField
                    icon={Briefcase}
                    placeholder="Company Name"
                    value={upgradeForm.company}
                    onChange={(e) =>
                      setUpgradeForm({
                        ...upgradeForm,
                        company:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <textarea
                  rows="4"
                  placeholder="Company Address"
                  className="w-full p-5 mt-5 border outline-none rounded-3xl bg-white/5 border-white/10 focus:border-cyan-400/40"
                  value={upgradeForm.address}
                  onChange={(e) =>
                    setUpgradeForm({
                      ...upgradeForm,
                      address:
                        e.target.value,
                    })
                  }
                />

                <textarea
                  rows="4"
                  placeholder="Additional Notes"
                  className="w-full p-5 mt-5 border outline-none rounded-3xl bg-white/5 border-white/10 focus:border-cyan-400/40"
                  value={upgradeForm.notes}
                  onChange={(e) =>
                    setUpgradeForm({
                      ...upgradeForm,
                      notes:
                        e.target.value,
                    })
                  }
                />

                <div className="grid gap-4 mt-8 md:grid-cols-2">
                  <button
                    onClick={submitUpgradeRequest}
                    className="flex items-center justify-center gap-2 py-4 font-bold text-black transition rounded-2xl bg-cyan-400 hover:bg-cyan-300"
                  >
                    <Send size={18} />

                    {formLoading
                      ? "Sending Request..."
                      : "Send Upgrade Request"}
                  </button>

                  <button
                    onClick={() =>
                      setShowUpgradeModal(
                        false
                      )
                    }
                    className="py-4 font-semibold transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
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
    <div className="flex items-center gap-4 p-5 transition-all border rounded-3xl bg-white/5 border-white/10 focus-within:border-cyan-400/40">
      <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-400">
        <Icon size={18} />
      </div>

      <input
        {...props}
        className="w-full bg-transparent outline-none placeholder:text-slate-500"
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
    <motion.div
      whileHover={{
        y: -5,
      }}
      className="relative overflow-hidden p-6 border rounded-[28px] bg-white/5 border-white/10 backdrop-blur-2xl"
    >
      <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 blur-[60px]" />

      <div className="relative z-10">
        <div className="flex items-center justify-center mb-5 w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400">
          <Icon />
        </div>

        <p className="text-slate-400">
          {title}
        </p>

        <h3 className="mt-2 text-3xl font-black capitalize">
          {value}
        </h3>
      </div>
    </motion.div>
  );
}

// ======================================================
// BADGE
// ======================================================

function Badge({ children }) {
  return (
    <span className="px-4 py-2 text-sm border rounded-full bg-cyan-500/10 border-cyan-500/20 text-cyan-200">
      {children}
    </span>
  );
}

// ======================================================
// FEATURE CARD
// ======================================================

function FeatureCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="p-5 border rounded-3xl bg-white/5 border-white/10 backdrop-blur-xl">
      <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-2xl bg-cyan-500/10 text-cyan-400">
        <Icon size={20} />
      </div>

      <p className="text-sm text-slate-400">
        {title}
      </p>

      <h3 className="mt-2 text-lg font-bold">
        {value}
      </h3>
    </div>
  );
}

// ======================================================
// INFO ROW
// ======================================================

function InfoRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-2xl bg-white/5 border-white/5">
      <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-400">
        <Icon size={18} />
      </div>

      <div>
        <p className="text-sm text-slate-400">
          {label}
        </p>

        <h3 className="mt-1 font-semibold">
          {value}
        </h3>
      </div>
    </div>
  );
}

// ======================================================
// PREMIUM INFO CARD
// ======================================================

function PremiumInfoCard({
  icon: Icon,
  title,
  desc,
}) {
  return (
    <motion.div
      whileHover={{
        y: -8,
      }}
      className="relative overflow-hidden p-8 border rounded-[32px] bg-white/5 border-white/10 backdrop-blur-2xl"
    >
      <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 blur-[80px]" />

      <div className="relative z-10">
        <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-3xl bg-cyan-500/10 text-cyan-400">
          <Icon size={28} />
        </div>

        <h3 className="text-2xl font-bold">
          {title}
        </h3>

        <p className="mt-4 leading-7 text-slate-400">
          {desc}
        </p>

        <button className="flex items-center gap-2 mt-6 font-semibold transition-all text-cyan-300 hover:text-cyan-200">
          Learn More
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
