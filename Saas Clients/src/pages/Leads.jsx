// =======================================================
// src/pages/Leads.jsx
// READYTECH SOLUTIONS - ULTRA PREMIUM LEADS WORKSPACE
// ENTERPRISE SAAS LEAD MANAGEMENT PLATFORM
// FULL PREMIUM UI / UX EXPERIENCE
// =======================================================

import {
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";

import { motion } from "framer-motion";

import {
  Search,
  Plus,
  Trash2,
  Upload,
  Users,
  TrendingUp,
  Target,
  Sparkles,
  Building2,
  Activity,
  ShieldCheck,
  Briefcase,
  Phone,
  Mail,
  Crown,
  CheckCircle2,
  Filter,
  BarChart3,
  Flame,
  RefreshCcw,
} from "lucide-react";

import API from "../api/axios";
import { useAuthStore } from "../store/authStore";

export default function Leads() {
  // =====================================================
  // AUTH
  // =====================================================

  const token = useAuthStore((s) => s.token);

  // =====================================================
  // STATES
  // =====================================================

  const [leads, setLeads] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [file, setFile] = useState(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [showModal, setShowModal] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "website",
    companyName: "",
    jobTitle: "",
    dealValue: "",
    notes: "",
    tags: [],
  });

  // =====================================================
  // FETCH LEADS
  // =====================================================

  const fetchLeads = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      const res = await API.get("/leads");

      const leadsData =
        res?.data?.data?.leads || [];

      setLeads(leadsData);
    } catch (err) {
      console.error(err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // =====================================================
  // EFFECT
  // =====================================================

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // =====================================================
  // CREATE LEAD
  // =====================================================

  const handleCreateLead = async () => {
    try {
      setFormError("");

      if (!form.name.trim()) {
        return setFormError(
          "Lead name required"
        );
      }

      if (
        form.phone &&
        !/^[0-9]{10}$/.test(form.phone)
      ) {
        return setFormError(
          "Phone must be 10 digits"
        );
      }

      const payload = {
        ...form,
        status: "new",
        dealValue: Number(
          form.dealValue || 0
        ),
      };

      const res = await API.post(
        "/leads",
        payload
      );

      const newLead =
        res?.data?.data || payload;

      setLeads((prev) => [
        newLead,
        ...prev,
      ]);

      setShowModal(false);

      setForm({
        name: "",
        email: "",
        phone: "",
        source: "website",
        companyName: "",
        jobTitle: "",
        dealValue: "",
        notes: "",
        tags: [],
      });
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
          "Lead creation failed"
      );
    }
  };

  // =====================================================
  // DELETE LEAD
  // =====================================================

  const handleDelete = async (id) => {
    const previous = [...leads];

    setLeads((prev) =>
      prev.filter((l) => l._id !== id)
    );

    try {
      await API.delete(`/leads/${id}`);
    } catch {
      setLeads(previous);
    }
  };

  // =====================================================
  // STATUS UPDATE
  // =====================================================

  const handleStatusChange = async (
    id,
    status
  ) => {
    const previous = [...leads];

    setLeads((prev) =>
      prev.map((l) =>
        l._id === id
          ? { ...l, status }
          : l
      )
    );

    try {
      await API.patch(
        `/leads/${id}/status`,
        {
          status,
        }
      );
    } catch {
      setLeads(previous);
    }
  };

  // =====================================================
  // CSV IMPORT
  // =====================================================

  const handleCSVUpload = async () => {
    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    try {
      await API.post(
        "/leads/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  // =====================================================
  // FILTERED LEADS
  // =====================================================

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchMatch =
        lead?.name
          ?.toLowerCase()
          ?.includes(
            search.toLowerCase()
          ) ||
        lead?.email
          ?.toLowerCase()
          ?.includes(
            search.toLowerCase()
          ) ||
        lead?.companyName
          ?.toLowerCase()
          ?.includes(
            search.toLowerCase()
          );

      const statusMatch =
        statusFilter === "all"
          ? true
          : lead?.status ===
            statusFilter;

      return searchMatch && statusMatch;
    });
  }, [leads, search, statusFilter]);

  // =====================================================
  // STATS
  // =====================================================

  const stats = useMemo(() => {
    return {
      total: leads.length,

      new: leads.filter(
        (l) => l.status === "new"
      ).length,

      qualified: leads.filter(
        (l) => l.status === "qualified"
      ).length,

      converted: leads.filter(
        (l) => l.status === "converted"
      ).length,

      revenue: leads.reduce(
        (sum, l) =>
          sum +
          Number(l?.dealValue || 0),
        0
      ),
    };
  }, [leads]);

  // =====================================================
  // SCORE TAG
  // =====================================================

  const getScoreTag = (score) => {
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-red-400 rounded-full bg-red-500/10">
          <Flame size={13} />
          Hot
        </span>
      );
    }

    if (score >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-yellow-400 rounded-full bg-yellow-500/10">
          ⚡ Warm
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400">
        ❄ Cold
      </span>
    );
  };

  // =====================================================
  // BADGE
  // =====================================================

  const badge = (status) => {
    switch (status) {
      case "new":
        return "bg-cyan-500/10 text-cyan-400";

      case "qualified":
        return "bg-yellow-500/10 text-yellow-400";

      case "converted":
        return "bg-emerald-500/10 text-emerald-400";

      case "contacted":
        return "bg-violet-500/10 text-violet-400";

      default:
        return "bg-slate-500/10 text-slate-300";
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen overflow-hidden bg-[#030712] text-white">

      {/* ================================================= */}
      {/* BACKGROUND EFFECTS */}
      {/* ================================================= */}

      <div className="fixed inset-0 -z-10">

        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[140px]" />

        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-500/10 blur-[140px]" />

      </div>

      <div className="p-4 md:p-6">

        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <div className="relative overflow-hidden border shadow-2xl mb-8 rounded-[34px] border-white/10 bg-white/[0.05] backdrop-blur-2xl">

          <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-cyan-500/10 blur-[120px]" />

          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-violet-500/10 blur-[120px]" />

          <div className="relative z-10 p-7 md:p-10">

            <div className="flex flex-col gap-10 xl:flex-row xl:items-center xl:justify-between">

              {/* LEFT */}

              <div className="max-w-3xl">

                <div className="inline-flex items-center gap-2 px-4 py-2 mb-5 text-sm border rounded-full border-cyan-500/20 bg-cyan-500/10 text-cyan-300">

                  <Crown size={16} />

                  ReadyTech Solutions Premium Lead Engine

                </div>

                <h1 className="text-4xl font-black leading-tight md:text-4xl">

                  Intelligent Lead
                  <span className="block mt-2 text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text">

                    Management Platform

                  </span>

                </h1>

                <p className="max-w-2xl mt-6 text-base leading-8 text-slate-300">

                  Accelerate customer acquisition,
                  automate lead operations,
                  monitor sales performance
                  and convert opportunities faster
                  with ReadyTech Solutions'
                  enterprise SaaS lead system.

                </p>

                <div className="flex flex-wrap gap-3 mt-8">

                  <div className="flex items-center gap-2 px-4 py-3 border rounded-2xl border-white/10 bg-white/[0.05]">

                    <Sparkles
                      size={18}
                      className="text-cyan-400"
                    />

                    <span className="text-sm">
                      AI Lead Intelligence
                    </span>

                  </div>

                  <div className="flex items-center gap-2 px-4 py-3 border rounded-2xl border-white/10 bg-white/[0.05]">

                    <Target
                      size={18}
                      className="text-violet-400"
                    />

                    <span className="text-sm">
                      Smart Conversion Tracking
                    </span>

                  </div>

                  <div className="flex items-center gap-2 px-4 py-3 border rounded-2xl border-white/10 bg-white/[0.05]">

                    <ShieldCheck
                      size={18}
                      className="text-emerald-400"
                    />

                    <span className="text-sm">
                      Enterprise Security
                    </span>

                  </div>

                </div>
              </div>

              {/* RIGHT */}

              <div className="grid grid-cols-2 gap-4 min-w-[320px]">

                {[
                  {
                    title: "Total Leads",
                    value: stats.total,
                    icon: Users,
                    color:
                      "from-cyan-500/20 to-blue-500/20 border-cyan-500/20",
                  },

                  {
                    title: "Qualified",
                    value: stats.qualified,
                    icon: CheckCircle2,
                    color:
                      "from-yellow-500/20 to-orange-500/20 border-yellow-500/20",
                  },

                  {
                    title: "Converted",
                    value: stats.converted,
                    icon: TrendingUp,
                    color:
                      "from-emerald-500/20 to-teal-500/20 border-emerald-500/20",
                  },

                  {
                    title: "Revenue",
                    value: `₹${stats.revenue.toLocaleString()}`,
                    icon: BarChart3,
                    color:
                      "from-violet-500/20 to-fuchsia-500/20 border-violet-500/20",
                  },
                ].map((item, index) => (
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
                    className={`rounded-3xl border bg-gradient-to-br ${item.color} p-5 backdrop-blur-xl`}
                  >

                    <div className="flex items-center justify-between">

                      <div className="p-3 rounded-2xl bg-black/30">

                        <item.icon size={22} />

                      </div>

                      <Activity
                        size={18}
                        className="text-emerald-400"
                      />

                    </div>

                    <h2 className="mt-5 text-3xl font-black">

                      {item.value}

                    </h2>

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
        {/* FILTER BAR */}
        {/* ================================================= */}

        <div className="grid gap-4 p-5 mb-8 border shadow-2xl xl:grid-cols-5 rounded-[30px] border-white/10 bg-white/[0.04] backdrop-blur-2xl">

          {/* SEARCH */}

          <div className="relative xl:col-span-2">

            <Search
              size={18}
              className="absolute text-slate-500 left-4 top-4"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search leads, companies, emails..."
              className="w-full h-14 pl-12 pr-4 text-white transition-all border outline-none rounded-2xl border-white/10 bg-[#0f172a] focus:border-cyan-400"
            />

          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="h-14 px-4 text-white border outline-none rounded-2xl border-white/10 bg-[#0f172a]"
          >

            <option value="all">
              All Status
            </option>

            <option value="new">
              New
            </option>

            <option value="contacted">
              Contacted
            </option>

            <option value="qualified">
              Qualified
            </option>

            <option value="converted">
              Converted
            </option>

          </select>

          {/* FILE */}

          <label className="flex items-center gap-3 px-4 border cursor-pointer rounded-2xl border-white/10 bg-[#0f172a]">

            <Upload
              size={18}
              className="text-cyan-400"
            />

            <span className="text-sm text-slate-300">

              {file
                ? file.name
                : "Choose CSV File"}

            </span>

            <input
              type="file"
              hidden
              onChange={(e) =>
                setFile(
                  e.target.files[0]
                )
              }
            />

          </label>

          {/* ACTIONS */}

          <div className="flex gap-3">

            <button
              onClick={handleCSVUpload}
              className="flex items-center justify-center flex-1 gap-2 font-semibold transition-all h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400"
            >

              <Upload size={18} />

              Import

            </button>

            <button
              onClick={() =>
                setShowModal(true)
              }
              className="flex items-center justify-center flex-1 gap-2 h-14 font-semibold transition-all rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 hover:scale-[1.02]"
            >

              <Plus size={18} />

              Add Lead

            </button>

          </div>

        </div>

        {/* ================================================= */}
        {/* TABLE */}
        {/* ================================================= */}

        <div className="overflow-hidden border shadow-2xl rounded-[30px] border-white/10 bg-white/[0.04] backdrop-blur-2xl">

          {/* HEADER */}

          <div className="flex flex-col gap-4 p-6 border-b md:flex-row md:items-center md:justify-between border-white/10">

            <div>

              <h2 className="text-3xl font-black">

                Enterprise Leads

              </h2>

              <p className="mt-1 text-slate-400">

                Premium customer acquisition
                intelligence and sales tracking.

              </p>

            </div>

            <div className="inline-flex items-center gap-2 px-4 py-3 border rounded-2xl border-white/10 bg-white/[0.05]">

              <Filter
                size={16}
                className="text-cyan-400"
              />

              <span className="text-sm text-slate-300">

                {filteredLeads.length} Leads

              </span>

            </div>

          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1200px]">

              <thead className="border-b border-white/10 bg-black/20">

                <tr className="text-sm text-slate-400">

                  <th className="px-6 py-5 text-left">
                    Lead
                  </th>

                  <th className="px-6 py-5 text-left">
                    Company
                  </th>

                  <th className="px-6 py-5 text-left">
                    Score
                  </th>

                  <th className="px-6 py-5 text-left">
                    Status
                  </th>

                  <th className="px-6 py-5 text-left">
                    Deal Value
                  </th>

                  <th className="px-6 py-5 text-left">
                    Tags
                  </th>

                  <th className="px-6 py-5 text-left">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-16 text-center text-slate-400"
                    >
                      Loading leads...
                    </td>
                  </tr>
                ) : filteredLeads.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-16 text-center text-slate-500"
                    >
                      No leads found
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map(
                    (l, index) => (
                      <motion.tr
                        key={l._id}
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
                            index * 0.04,
                        }}
                        className="border-b border-white/5 hover:bg-white/[0.03]"
                      >

                        {/* LEAD */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-4">

                            <div className="flex items-center justify-center text-lg font-black w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600">

                              {l?.name?.charAt(
                                0
                              )}

                            </div>

                            <div>

                              <h3 className="font-bold">

                                {l?.name}

                              </h3>

                              <div className="mt-1 space-y-1 text-sm text-slate-400">

                                <div className="flex items-center gap-2">

                                  <Mail size={14} />

                                  {l?.email ||
                                    "-"}

                                </div>

                                <div className="flex items-center gap-2">

                                  <Phone size={14} />

                                  {l?.phone ||
                                    "-"}

                                </div>

                              </div>

                            </div>

                          </div>

                        </td>

                        {/* COMPANY */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-2 text-slate-300">

                            <Building2
                              size={16}
                              className="text-violet-400"
                            />

                            {l?.companyName ||
                              "ReadyTech Solutions"}

                          </div>

                          <div className="mt-2 text-xs text-slate-500">

                            {l?.jobTitle ||
                              "Business Lead"}

                          </div>

                        </td>

                        {/* SCORE */}

                        <td className="px-6 py-5">

                          {getScoreTag(
                            l?.score || 0
                          )}

                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">

                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${badge(
                              l?.status
                            )}`}
                          >

                            {l?.status}

                          </span>

                        </td>

                        {/* VALUE */}

                        <td className="px-6 py-5 font-bold text-emerald-400">

                          ₹
                          {Number(
                            l?.dealValue || 0
                          ).toLocaleString()}

                        </td>

                        {/* TAGS */}

                        <td className="px-6 py-5">

                          <div className="flex flex-wrap gap-2">

                            {(l?.tags || [])
                              .slice(0, 3)
                              .map(
                                (
                                  tag,
                                  index
                                ) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 text-xs border rounded-full bg-white/5 border-white/10 text-slate-300"
                                  >

                                    #{tag}

                                  </span>
                                )
                              )}

                          </div>

                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <select
                              value={
                                l?.status
                              }
                              onChange={(e) =>
                                handleStatusChange(
                                  l._id,
                                  e.target
                                    .value
                                )
                              }
                              className="h-10 px-3 text-sm text-white border outline-none rounded-xl border-white/10 bg-[#0f172a]"
                            >

                              <option value="new">
                                New
                              </option>

                              <option value="contacted">
                                Contacted
                              </option>

                              <option value="qualified">
                                Qualified
                              </option>

                              <option value="converted">
                                Converted
                              </option>

                              <option value="lost">
                                Lost
                              </option>

                            </select>

                            <button
                              onClick={() =>
                                handleDelete(
                                  l._id
                                )
                              }
                              className="flex items-center justify-center w-10 h-10 transition rounded-xl bg-red-500/10 hover:bg-red-500/20"
                            >

                              <Trash2
                                size={16}
                                className="text-red-400"
                              />

                            </button>

                          </div>

                        </td>

                      </motion.tr>
                    )
                  )
                )}

              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ================================================= */}
      {/* MODAL */}
      {/* ================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="w-full max-w-3xl overflow-hidden border shadow-2xl rounded-[32px] border-white/10 bg-[#0b1120]"
          >

            {/* HEADER */}

            <div className="p-6 border-b border-white/10">

              <div className="flex items-start justify-between">

                <div>

                  <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs rounded-full bg-cyan-500/10 text-cyan-300">

                    <Sparkles size={14} />

                    ReadyTech Lead Creation

                  </div>

                  <h2 className="text-3xl font-black">

                    Create New Lead

                  </h2>

                  <p className="mt-2 text-slate-400">

                    Add premium business
                    opportunities into your
                    enterprise pipeline.

                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="px-4 py-2 transition rounded-xl bg-white/5 hover:bg-white/10"
                >

                  Close

                </button>

              </div>

            </div>

            {/* ERROR */}

            {formError && (
              <div className="p-4 mx-6 mt-6 text-sm text-red-300 border rounded-2xl bg-red-500/10 border-red-500/20">

                {formError}

              </div>
            )}

            {/* FORM */}

            <div className="grid gap-4 p-6 md:grid-cols-2">

              <input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name:
                      e.target.value,
                  })
                }
                className="h-14 px-4 text-white border outline-none rounded-2xl border-white/10 bg-[#111827]"
              />

              <input
                placeholder="Email Address"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email:
                      e.target.value,
                  })
                }
                className="h-14 px-4 text-white border outline-none rounded-2xl border-white/10 bg-[#111827]"
              />

              <input
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone:
                      e.target.value,
                  })
                }
                className="h-14 px-4 text-white border outline-none rounded-2xl border-white/10 bg-[#111827]"
              />

              <input
                placeholder="Company Name"
                value={form.companyName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    companyName:
                      e.target.value,
                  })
                }
                className="h-14 px-4 text-white border outline-none rounded-2xl border-white/10 bg-[#111827]"
              />

              <select
                value={form.jobTitle}
                onChange={(e) =>
                  setForm({
                    ...form,
                    jobTitle:
                      e.target.value,
                  })
                }
                className="h-14 px-4 text-white border outline-none rounded-2xl border-white/10 bg-[#111827]"
              >

                <option value="">
                  Select Job Title
                </option>

                <option value="CEO">
                  CEO
                </option>

                <option value="Founder">
                  Founder
                </option>

                <option value="Manager">
                  Manager
                </option>

                <option value="Developer">
                  Developer
                </option>

                <option value="Marketing">
                  Marketing
                </option>

              </select>

              <input
                type="number"
                placeholder="Deal Value"
                value={form.dealValue}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dealValue:
                      e.target.value,
                  })
                }
                className="h-14 px-4 text-white border outline-none rounded-2xl border-white/10 bg-[#111827]"
              />

              <select
                value={form.source}
                onChange={(e) =>
                  setForm({
                    ...form,
                    source:
                      e.target.value,
                  })
                }
                className="h-14 px-4 text-white border outline-none rounded-2xl border-white/10 bg-[#111827]"
              >

                <option value="website">
                  Website
                </option>

                <option value="linkedin">
                  LinkedIn
                </option>

                <option value="facebook">
                  Facebook
                </option>

                <option value="google">
                  Google
                </option>

                <option value="referral">
                  Referral
                </option>

              </select>

              <textarea
                rows={4}
                placeholder="Lead Notes"
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes:
                      e.target.value,
                  })
                }
                className="px-4 py-4 text-white border outline-none md:col-span-2 rounded-2xl border-white/10 bg-[#111827]"
              />

            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-4 p-6 border-t border-white/10">

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="px-6 py-3 transition rounded-2xl bg-white/5 hover:bg-white/10"
              >

                Cancel

              </button>

              <button
                onClick={
                  handleCreateLead
                }
                className="flex items-center gap-2 px-6 py-3 font-semibold transition-all rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 hover:scale-[1.02]"
              >

                <Plus size={18} />

                Create Lead

              </button>

            </div>

          </motion.div>
        </div>
      )}
    </div>
  );
}