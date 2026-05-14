// =======================================================
// src/pages/CRM.jsx
// READYTECH SOLUTIONS - ULTRA PREMIUM CRM WORKSPACE
// FULLY RESPONSIVE ENTERPRISE SAAS CRM UI
// FIXED PIPELINE LAYOUT (NO HORIZONTAL SCROLL)
// =======================================================

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

import {
  Search,
  Plus,
  Trash2,
  Pencil,
  DollarSign,
  Mail,
  Phone,
  Building2,
  Activity,
  Crown,
  Sparkles,
  TrendingUp,
  Target,
  CheckCircle2,
  BarChart3,
  Users,
  Briefcase,
} from "lucide-react";

import API from "../api/axios";
import { useAuthStore } from "../store/authStore";

export default function CRM() {
  const user = useAuthStore((s) => s.user);

  // =====================================================
  // STATES
  // =====================================================

  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  const [editId, setEditId] = useState(null);

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");

  // =====================================================
  // PIPELINE STAGES
  // =====================================================

  const stages = [
    "new",
    "contacted",
    "qualified",
    "proposal",
    "negotiation",
    "won",
    "lost",
  ];

  // =====================================================
  // FETCH CRM
  // =====================================================

  const fetchCRM = async () => {
    try {
      setLoading(true);

      let contactsRes;
      let dealsRes;

      if (user?.role === "admin") {
        [contactsRes, dealsRes] = await Promise.all([
          API.get("/crm/contacts"),
          API.get("/crm/deals"),
        ]);
      } else if (user?.role === "manager") {
        [contactsRes, dealsRes] = await Promise.all([
          API.get("/crm/contacts/team"),
          API.get("/crm/deals/team"),
        ]);
      } else {
        [contactsRes, dealsRes] = await Promise.all([
          API.get("/crm/contacts/my"),
          API.get("/crm/deals/my"),
        ]);
      }

      setContacts(contactsRes?.data?.data || []);
      setDeals(dealsRes?.data?.data || []);
    } catch (err) {
      console.log(err);
      setError("Failed to load CRM workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRM();
  }, []);

  // =====================================================
  // FILTER CONTACTS
  // =====================================================

  const filtered = useMemo(() => {
    return (contacts || []).filter((c) =>
      c?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [contacts, search]);

  // =====================================================
  // SAVE CONTACT
  // =====================================================

  const saveContact = async () => {
    try {
      setError("");

      if (!form.name.trim()) {
        return setError("Contact name required");
      }

      if (editId) {
        await API.put(`/crm/contacts/${editId}`, form);
      } else {
        await API.post("/crm/contacts", form);
      }

      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
      });

      setEditId(null);

      fetchCRM();
    } catch (err) {
      setError("Failed to save contact");
    }
  };

  // =====================================================
  // DELETE CONTACT
  // =====================================================

  const removeContact = async (id) => {
    try {
      await API.delete(`/crm/contacts/${id}`);
      fetchCRM();
    } catch (err) {
      setError("Delete failed");
    }
  };

  // =====================================================
  // EDIT
  // =====================================================

  const edit = (c) => {
    setForm({
      name: c?.name || "",
      email: c?.email || "",
      phone: c?.phone || "",
      company: c?.company || "",
    });

    setEditId(c?._id);
  };

  // =====================================================
  // UPDATE DEAL STAGE
  // =====================================================

  const updateDealStage = async (id, stage) => {
    try {
      await API.put(`/crm/deals/${id}/stage`, {
        stage,
      });

      fetchCRM();
    } catch (err) {
      setError("Stage update failed");
    }
  };

  // =====================================================
  // GROUP DEALS
  // =====================================================

  const groupedDeals = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage] = (deals || []).filter(
        (d) => d?.stage === stage
      );

      return acc;
    }, {});
  }, [deals]);

  // =====================================================
  // TOTAL REVENUE
  // =====================================================

  const totalRevenue = useMemo(() => {
    return (deals || []).reduce(
      (sum, d) => sum + Number(d?.value || 0),
      0
    );
  }, [deals]);

  // =====================================================
  // KPI CARDS
  // =====================================================

  const stats = [
    {
      title: "Total Contacts",
      value: contacts.length,
      icon: Users,
      gradient:
        "from-cyan-500/20 to-blue-500/20",
      iconColor: "text-cyan-400",
    },

    {
      title: "Pipeline Deals",
      value: deals.length,
      icon: Briefcase,
      gradient:
        "from-violet-500/20 to-fuchsia-500/20",
      iconColor: "text-violet-400",
    },

    {
      title: "Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      gradient:
        "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
    },

    {
      title: "Growth",
      value: "+28%",
      icon: TrendingUp,
      gradient:
        "from-orange-500/20 to-amber-500/20",
      iconColor: "text-orange-400",
    },
  ];

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden">

      {/* ================================================= */}
      {/* BACKGROUND */}
      {/* ================================================= */}

      <div className="fixed inset-0 overflow-hidden -z-10">

        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[140px]" />

        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-500/10 blur-[140px]" />

      </div>

      <div className="p-4 md:p-6">

        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <div className="relative overflow-hidden border shadow-2xl mb-8 rounded-[34px] border-white/10 bg-white/[0.04] backdrop-blur-2xl">

          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[120px]" />

          <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/10 blur-[120px]" />

          <div className="relative z-10 p-6 md:p-10">

            <div className="flex flex-col gap-10 xl:flex-row xl:items-center xl:justify-between">

              {/* LEFT */}

              <div className="max-w-3xl">

                <div className="inline-flex items-center gap-2 px-4 py-2 mb-5 text-sm border rounded-full border-cyan-400/20 bg-cyan-500/10 text-cyan-300">

                  <Crown size={16} />

                  ReadyTech Solutions Enterprise CRM

                </div>

                <h1 className="text-4xl font-black leading-tight md:text-4xl">

                  Intelligent CRM
                  <span className="block mt-2 text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text">
                    Sales Workspace
                  </span>

                </h1>

                <p className="max-w-2xl mt-6 text-base leading-8 text-slate-300">

                  Manage enterprise clients, automate customer
                  engagement, monitor sales pipeline performance
                  and scale business growth with ReadyTech
                  Solutions premium SaaS CRM ecosystem.

                </p>

                <div className="flex flex-wrap gap-3 mt-8">

                  <FeatureBadge
                    icon={Sparkles}
                    color="text-cyan-400"
                    text="AI Lead Intelligence"
                  />

                  <FeatureBadge
                    icon={BarChart3}
                    color="text-violet-400"
                    text="Real-time Insights"
                  />

                  <FeatureBadge
                    icon={Target}
                    color="text-emerald-400"
                    text="Enterprise Automation"
                  />

                </div>

              </div>

              {/* RIGHT */}

              <div className="grid w-full gap-4 sm:grid-cols-2 xl:w-[420px]">

                {stats.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: index * 0.1,
                    }}
                    className={`rounded-3xl border border-white/10 bg-gradient-to-br ${item.gradient} p-5 backdrop-blur-xl`}
                  >

                    <div className="flex items-center justify-between">

                      <div className="p-3 rounded-2xl bg-black/30">
                        <item.icon
                          size={24}
                          className={item.iconColor}
                        />
                      </div>

                      <Activity
                        size={18}
                        className="text-emerald-400"
                      />

                    </div>

                    <h3 className="mt-5 text-3xl font-black">
                      {item.value}
                    </h3>

                    <p className="mt-1 text-sm text-slate-300">
                      {item.title}
                    </p>

                  </motion.div>
                ))}

              </div>

            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="p-4 mb-6 text-sm text-red-300 border rounded-2xl border-red-500/20 bg-red-500/10">
            {error}
          </div>
        )}

        {/* ================================================= */}
        {/* FORM SECTION */}
        {/* ================================================= */}

        <div className="grid gap-4 p-6 mb-10 border shadow-2xl lg:grid-cols-5 rounded-[30px] border-white/10 bg-white/[0.04] backdrop-blur-2xl">

          {/* SEARCH */}

          <div className="relative">

            <Search
              size={18}
              className="absolute text-slate-500 left-4 top-4"
            />

            <input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full h-14 pl-12 pr-4 text-white transition-all border outline-none rounded-2xl border-white/10 bg-[#0f172a] focus:border-cyan-400"
            />

          </div>

          {/* NAME */}

          <input
            placeholder="Contact Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            className="h-14 px-4 text-white transition-all border outline-none rounded-2xl border-white/10 bg-[#0f172a] focus:border-cyan-400"
          />

          {/* EMAIL */}

          <input
            placeholder="Email Address"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className="h-14 px-4 text-white transition-all border outline-none rounded-2xl border-white/10 bg-[#0f172a] focus:border-cyan-400"
          />

          {/* PHONE */}

          <input
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
            className="h-14 px-4 text-white transition-all border outline-none rounded-2xl border-white/10 bg-[#0f172a] focus:border-cyan-400"
          />

          {/* BUTTON */}

          <button
            onClick={saveContact}
            className="flex items-center justify-center gap-2 h-14 px-6 font-semibold transition-all duration-300 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 hover:scale-[1.02]"
          >

            <Plus size={18} />

            {editId ? "Update Contact" : "Create Contact"}

          </button>

        </div>

        {/* ================================================= */}
        {/* CONTACTS */}
        {/* ================================================= */}

        <div className="mb-12">

          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-3xl font-black">
                Customer Contacts
              </h2>

              <p className="mt-1 text-slate-400">
                Enterprise relationship management workspace.
              </p>

            </div>

            <div className="px-5 py-3 border rounded-2xl border-white/10 bg-white/[0.05]">
              <span className="text-sm text-slate-300">
                {filtered.length} Active Contacts
              </span>
            </div>

          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            {loading ? (
              <div className="text-slate-400">
                Loading contacts...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center border border-dashed rounded-3xl border-white/10 bg-white/[0.03] text-slate-400">
                No contacts found
              </div>
            ) : (
              filtered.map((c, index) => (
                <motion.div
                  key={c?._id}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: index * 0.05,
                  }}
                  whileHover={{
                    y: -4,
                  }}
                  className="relative overflow-hidden border shadow-2xl rounded-[28px] border-white/10 bg-white/[0.05] backdrop-blur-xl"
                >

                  <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 blur-3xl" />

                  <div className="relative p-5">

                    {/* TOP */}

                    <div className="flex items-start justify-between">

                      <div className="flex items-center gap-4">

                        <div className="flex items-center justify-center text-lg font-black w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600">

                          {c?.name?.charAt(0)}

                        </div>

                        <div>

                          <h3 className="text-lg font-bold">
                            {c?.name}
                          </h3>

                          <p className="text-sm text-slate-400">
                            Premium Client
                          </p>

                        </div>

                      </div>

                      <div className="flex gap-2">

                        <button
                          onClick={() => edit(c)}
                          className="p-2 transition rounded-xl bg-blue-500/10 hover:bg-blue-500/20"
                        >
                          <Pencil
                            size={16}
                            className="text-blue-400"
                          />
                        </button>

                        <button
                          onClick={() =>
                            removeContact(c?._id)
                          }
                          className="p-2 transition rounded-xl bg-red-500/10 hover:bg-red-500/20"
                        >
                          <Trash2
                            size={16}
                            className="text-red-400"
                          />
                        </button>

                      </div>
                    </div>

                    {/* INFO */}

                    <div className="mt-6 space-y-3">

                      <InfoRow
                        icon={Mail}
                        color="text-cyan-400"
                        value={c?.email || "No email"}
                      />

                      <InfoRow
                        icon={Phone}
                        color="text-emerald-400"
                        value={c?.phone || "No phone"}
                      />

                      <InfoRow
                        icon={Building2}
                        color="text-violet-400"
                        value={
                          c?.company ||
                          "ReadyTech Solutions"
                        }
                      />

                    </div>

                    {/* FOOTER */}

                    <div className="flex items-center justify-between pt-5 mt-6 border-t border-white/10">

                      <div className="flex items-center gap-2 text-sm text-emerald-400">

                        <CheckCircle2 size={16} />

                        Verified Lead

                      </div>

                      <div className="px-3 py-1 text-xs rounded-full bg-cyan-500/10 text-cyan-300">
                        Enterprise
                      </div>

                    </div>

                  </div>
                </motion.div>
              ))
            )}

          </div>
        </div>

        {/* ================================================= */}
        {/* DEAL PIPELINE */}
        {/* ================================================= */}

        <div>

          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-3xl font-black">
                Sales Pipeline
              </h2>

              <p className="mt-1 text-slate-400">
                Organized vertical pipeline workflow for enterprise sales management.
              </p>

            </div>

            <div className="flex items-center gap-2 px-4 py-2 border rounded-2xl border-white/10 bg-white/[0.05]">

              <TrendingUp
                size={16}
                className="text-emerald-400"
              />

              <span className="text-sm text-slate-300">
                ReadyTech Sales Intelligence
              </span>

            </div>

          </div>

          {/* ================================================= */}
          {/* GRID PIPELINE - FIXED */}
          {/* ================================================= */}

          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">

            {stages.map((stage, stageIndex) => {
              const dealsInStage =
                groupedDeals[stage] || [];

              const totalValue = dealsInStage.reduce(
                (sum, d) =>
                  sum + Number(d?.value || 0),
                0
              );

              return (
                <motion.div
                  key={stage}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: stageIndex * 0.08,
                  }}
                  className="rounded-[28px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl"
                  onDrop={(e) => {
                    const id =
                      e.dataTransfer.getData("dealId");

                    updateDealStage(id, stage);
                  }}
                  onDragOver={(e) =>
                    e.preventDefault()
                  }
                >

                  {/* HEADER */}

                  <div className="p-5 border-b border-white/10">

                    <div className="flex items-center justify-between">

                      <h3 className="text-sm font-black tracking-widest uppercase">

                        {stage}

                      </h3>

                      <div className="px-3 py-1 text-xs rounded-full bg-white/10">

                        {dealsInStage.length}

                      </div>

                    </div>

                    <div className="flex items-center gap-2 mt-4 text-emerald-400">

                      <DollarSign size={16} />

                      <span className="font-semibold">
                        ₹ {totalValue.toLocaleString()}
                      </span>

                    </div>

                  </div>

                  {/* DEALS */}

                  <div className="p-4 space-y-4 min-h-[380px]">

                    {dealsInStage.map((d) => (
                      <motion.div
                        key={d?._id}
                        draggable
                        whileHover={{
                          scale: 1.02,
                        }}
                        className="relative overflow-hidden p-5 transition border cursor-grab rounded-2xl border-white/10 bg-[#0f172a]"
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "dealId",
                            d?._id
                          );
                        }}
                      >

                        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-3xl" />

                        <div className="relative">

                          <div className="flex items-start justify-between">

                            <div>

                              <h4 className="text-lg font-bold">
                                {d?.title}
                              </h4>

                              <p className="mt-1 text-sm text-slate-400">
                                ReadyTech Enterprise Deal
                              </p>

                            </div>

                            <div className="px-3 py-1 text-xs rounded-full bg-violet-500/10 text-violet-300">

                              {d?.probability || 0}%

                            </div>

                          </div>

                          <div className="flex items-center justify-between mt-6">

                            <div>

                              <p className="text-xs text-slate-500">
                                Deal Value
                              </p>

                              <h3 className="mt-1 text-xl font-black text-emerald-400">

                                ₹
                                {Number(
                                  d?.value || 0
                                ).toLocaleString()}

                              </h3>

                            </div>

                            <div className="p-3 rounded-2xl bg-cyan-500/10">

                              <Briefcase
                                size={20}
                                className="text-cyan-400"
                              />

                            </div>

                          </div>

                        </div>
                      </motion.div>
                    ))}

                    {dealsInStage.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-40 text-center border border-dashed rounded-2xl border-white/10 bg-white/[0.03]">

                        <Briefcase
                          size={30}
                          className="mb-3 text-slate-500"
                        />

                        <p className="text-sm text-slate-400">
                          No deals available
                        </p>

                      </div>
                    )}

                  </div>

                </motion.div>
              );
            })}

          </div>
        </div>

      </div>
    </div>
  );
}

// =======================================================
// SMALL COMPONENTS
// =======================================================

function FeatureBadge({
  icon: Icon,
  color,
  text,
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border rounded-2xl border-white/10 bg-white/[0.05]">
      <Icon size={18} className={color} />
      <span className="text-sm">
        {text}
      </span>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  color,
  value,
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <Icon size={16} className={color} />
      {value}
    </div>
  );
}