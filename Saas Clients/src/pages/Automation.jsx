import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import {
  Zap,
  Plus,
  Search,
  Bot,
  Mail,
  MessageSquare,
  Workflow,
  Activity,
  Sparkles,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  Settings2,
  Trash2,
  Pencil,
  PlayCircle,
  Filter,
  ChevronRight,
  Building2,
  Globe,
  BarChart3,
  Layers3,
  Rocket,
} from "lucide-react";

export default function Automation() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [testModal, setTestModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    trigger: { type: "lead_created" },
    actions: [],
  });

  const [testData, setTestData] = useState({
    trigger: "lead_created",
    payload: {
      name: "",
      email: "",
      phone: "",
    },
  });

  // =========================================================
  // FETCH AUTOMATIONS
  // =========================================================

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const res = await API.get("/automation");
      setAutomations(res.data?.data || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  // =========================================================
  // SAVE
  // =========================================================

  const saveAutomation = async () => {
    try {
      if (editMode) {
        await API.put(`/automation/${form._id}`, form);
      } else {
        await API.post("/automation", form);
      }

      setIsModalOpen(false);
      setEditMode(false);
      resetForm();
      fetchAutomations();
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      trigger: { type: "lead_created" },
      actions: [],
    });
  };

  // =========================================================
  // DELETE
  // =========================================================

  const deleteAutomation = async (id) => {
    if (!confirm("Delete this automation workflow?")) return;

    await API.delete(`/automation/${id}`);
    fetchAutomations();
  };

  // =========================================================
  // TOGGLE
  // =========================================================

  const toggleAutomation = async (id) => {
    try {
      setActionLoading(id);
      await API.patch(`/automation/${id}/toggle`);
      fetchAutomations();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================================
  // TEST
  // =========================================================

  const testAutomation = async () => {
    try {
      await API.post("/automation/test", testData);
      alert("Automation workflow tested successfully 🚀");
      setTestModal(false);
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  // =========================================================
  // ACTION BUILDER
  // =========================================================

  const addAction = () => {
    setForm({
      ...form,
      actions: [
        ...form.actions,
        {
          type: "email",
          config: {
            subject: "",
            message: "",
            delay: 0,
          },
        },
      ],
    });
  };

  const updateAction = (index, field, value) => {
    const updated = [...form.actions];
    updated[index].config[field] = value;

    setForm({
      ...form,
      actions: updated,
    });
  };

  // =========================================================
  // FILTERS
  // =========================================================

  const filtered = useMemo(() => {
    return automations.filter((a) => {
      return (
        a.name?.toLowerCase().includes(search.toLowerCase()) &&
        (filter === "all" || a.trigger?.type === filter)
      );
    });
  }, [automations, search, filter]);

  // =========================================================
  // STATS
  // =========================================================

  const totalAutomations = automations.length;
  const activeAutomations = automations.filter((a) => a.isActive).length;
  const inactiveAutomations = totalAutomations - activeAutomations;

  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-hidden">

      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 p-6 lg:p-8">

        {/* ========================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================= */}

        <div className="grid gap-6 mb-8 lg:grid-cols-3">

          <div className="relative overflow-hidden border lg:col-span-2 rounded-3xl border-white/10 bg-white/5 backdrop-blur-xl">

            <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 blur-[100px]" />

            <div className="relative p-8">

              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm border rounded-full bg-cyan-500/10 border-cyan-400/20 text-cyan-300">
                <Sparkles size={16} />
                ReadyTechSolutions • Premium SaaS Automation Engine
              </div>

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div className="max-w-2xl">
                  <h1 className="mb-4 text-4xl font-black leading-tight lg:text-4xl">
                    Build Smart
                    <span className="text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text">
                      {" "}
                      AI Automations
                    </span>
                  </h1>

                  <p className="max-w-xl text-base leading-8 text-gray-300 lg:text-lg">
                    Enterprise-grade automation workflows for modern SaaS businesses.
                    Automate emails, lead management, WhatsApp engagement,
                    onboarding sequences, CRM actions and intelligent customer journeys.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-6">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="flex items-center gap-2 px-5 py-3 font-semibold transition-all duration-300 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-105"
                    >
                      <Plus size={18} />
                      Create Workflow
                    </button>

                    <button
                      onClick={() => setTestModal(true)}
                      className="flex items-center gap-2 px-5 py-3 font-semibold transition-all duration-300 border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      <PlayCircle size={18} />
                      Run Test
                    </button>
                  </div>
                </div>

                <div className="grid w-full gap-4 lg:w-[280px]">

                  <div className="p-5 border rounded-2xl border-white/10 bg-white/5 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-400">AI Workflows</p>
                        <h2 className="text-3xl font-bold">{totalAutomations}</h2>
                      </div>
                      <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-300">
                        <Workflow />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <CheckCircle2 size={14} />
                      Fully operational
                    </div>
                  </div>

                  <div className="p-5 border rounded-2xl border-white/10 bg-white/5 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-400">Active Flows</p>
                        <h2 className="text-3xl font-bold text-green-400">
                          {activeAutomations}
                        </h2>
                      </div>
                      <div className="p-3 text-green-300 rounded-xl bg-green-500/10">
                        <Activity />
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Real-time event execution
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}

          <div className="p-6 border rounded-3xl border-white/10 bg-white/5 backdrop-blur-xl">

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 text-purple-300 rounded-2xl bg-purple-500/10">
                <Building2 />
              </div>

              <div>
                <h3 className="text-xl font-bold">ReadyTechSolutions</h3>
                <p className="text-sm text-gray-400">
                  Next-Gen SaaS Infrastructure
                </p>
              </div>
            </div>

            <div className="space-y-4">

              <FeatureCard
                icon={<Bot size={18} />}
                title="AI Workflow Engine"
                text="Smart trigger-based automations with scalable architecture."
              />

              <FeatureCard
                icon={<Mail size={18} />}
                title="Email Sequences"
                text="Send onboarding, follow-ups, invoices and nurture campaigns."
              />

              <FeatureCard
                icon={<MessageSquare size={18} />}
                title="WhatsApp Automation"
                text="Automated WhatsApp notifications and customer engagement."
              />

              <FeatureCard
                icon={<ShieldCheck size={18} />}
                title="Enterprise Security"
                text="Protected APIs, token validation and secured automation flows."
              />

            </div>

            <div className="p-4 mt-6 border rounded-2xl border-cyan-500/20 bg-cyan-500/10">
              <div className="flex items-center gap-2 mb-2 text-cyan-300">
                <Rocket size={18} />
                <span className="font-semibold">Premium SaaS Stack</span>
              </div>

              <p className="text-sm leading-7 text-gray-300">
                React • Tailwind CSS • Node.js • Express • MongoDB • JWT Auth • AI Workflows • Automation APIs
              </p>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* STATS */}
        {/* ========================================================= */}

        <div className="grid gap-5 mb-8 md:grid-cols-2 xl:grid-cols-4">

          <StatCard
            icon={<Layers3 size={20} />}
            title="Total Workflows"
            value={totalAutomations}
            sub="Automation pipelines"
          />

          <StatCard
            icon={<CheckCircle2 size={20} />}
            title="Active"
            value={activeAutomations}
            sub="Currently running"
          />

          <StatCard
            icon={<Clock3 size={20} />}
            title="Inactive"
            value={inactiveAutomations}
            sub="Paused automations"
          />

          <StatCard
            icon={<BarChart3 size={20} />}
            title="Performance"
            value="99.9%"
            sub="Execution success"
          />

        </div>

        {/* ========================================================= */}
        {/* FILTER BAR */}
        {/* ========================================================= */}

        <div className="flex flex-col gap-4 p-5 mb-8 border lg:items-center lg:flex-row lg:justify-between rounded-3xl border-white/10 bg-white/5 backdrop-blur-xl">

          <div>
            <h2 className="text-2xl font-bold">Automation Workflows</h2>
            <p className="text-sm text-gray-400">
              Manage and monitor your AI-powered automation systems.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">

            <div className="relative">
              <Search
                size={18}
                className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2"
              />

              <input
                className="w-full py-3 pl-10 pr-4 border outline-none md:w-72 rounded-2xl border-white/10 bg-black/30 focus:border-cyan-400"
                placeholder="Search automation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="relative">
              <Filter
                size={18}
                className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2"
              />

              <select
                className="w-full py-3 pl-10 pr-10 border outline-none appearance-none md:w-60 rounded-2xl border-white/10 bg-black/30 focus:border-cyan-400"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Triggers</option>
                <option value="lead_created">Lead Created</option>
                <option value="lead_updated">Lead Updated</option>
              </select>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* TABLE */}
        {/* ========================================================= */}

        <div className="overflow-hidden border rounded-3xl border-white/10 bg-white/5 backdrop-blur-xl">

          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h3 className="text-xl font-bold">Workflow Management</h3>
              <p className="mt-1 text-sm text-gray-400">
                Enterprise automation control panel
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 font-semibold transition-all duration-300 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105"
            >
              <Plus size={18} />
              New Workflow
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              Loading automation workflows...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Workflow size={60} className="mb-4 text-gray-500" />
              <h3 className="mb-2 text-2xl font-bold">No Workflows Found</h3>
              <p className="max-w-md text-gray-400">
                Create your first intelligent automation workflow to streamline business operations.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">

                <thead className="border-b border-white/10 bg-white/5">
                  <tr className="text-sm text-left text-gray-400">
                    <th className="px-6 py-4">Workflow</th>
                    <th className="px-6 py-4">Trigger</th>
                    <th className="px-6 py-4">Actions</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Execution</th>
                    <th className="px-6 py-4 text-right">Controls</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((a) => (
                    <tr
                      key={a._id}
                      className="transition-all duration-300 border-b border-white/5 hover:bg-white/[0.03]"
                    >

                      <td className="px-6 py-5">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-300">
                              <Zap size={18} />
                            </div>

                            <div>
                              <h3 className="font-semibold">{a.name}</h3>
                              <p className="text-xs text-gray-400">
                                {a.description || "AI-powered workflow automation"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-2 px-3 py-2 text-sm text-purple-300 border rounded-xl border-purple-500/20 bg-purple-500/10">
                          <Activity size={16} />
                          {a.trigger?.type}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {(a.actions || []).map((action, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-2 px-3 py-2 text-xs border rounded-xl border-white/10 bg-black/20"
                            >
                              {action.type === "email" ? (
                                <Mail size={14} className="text-cyan-300" />
                              ) : (
                                <MessageSquare
                                  size={14}
                                  className="text-green-300"
                                />
                              )}
                              {action.type}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <button
                          onClick={() => toggleAutomation(a._id)}
                          disabled={actionLoading === a._id}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                            a.isActive
                              ? "bg-green-500/20 text-green-300 border border-green-500/20"
                              : "bg-gray-700/50 text-gray-300 border border-white/10"
                          }`}
                        >
                          {actionLoading === a._id
                            ? "Updating..."
                            : a.isActive
                            ? "Active"
                            : "Inactive"}
                        </button>
                      </td>

                      <td className="px-6 py-5">
                        <div>
                          <div className="flex items-center gap-2 mb-2 text-sm text-green-400">
                            <CheckCircle2 size={14} />
                            Healthy
                          </div>

                          <div className="w-40 h-2 overflow-hidden rounded-full bg-white/10">
                            <div className="w-[85%] h-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-3">

                          <button
                            onClick={() => {
                              setForm(a);
                              setEditMode(true);
                              setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm transition-all duration-300 border rounded-xl border-cyan-500/20 bg-cyan-500/10 text-cyan-300 hover:scale-105"
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          <button
                            onClick={() => deleteAutomation(a._id)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-300 transition-all duration-300 border rounded-xl border-red-500/20 bg-red-500/10 hover:scale-105"
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================= */}
      {/* CREATE / EDIT MODAL */}
      {/* ========================================================= */}

      {isModalOpen && (
        <Modal
          title={editMode ? "Edit Workflow" : "Create New Workflow"}
          onClose={() => {
            setIsModalOpen(false);
            setEditMode(false);
            resetForm();
          }}
        >

         <div className="space-y-6">

  {/* ===================================================== */}
  {/* HEADER */}
  {/* ===================================================== */}

  <div className="relative overflow-hidden border shadow-2xl rounded-3xl border-white/10 bg-gradient-to-br from-[#131c31] via-[#0f172a] to-[#111827]">

    <div className="absolute top-0 right-0 rounded-full w-60 h-60 bg-cyan-500/10 blur-3xl" />
    <div className="absolute bottom-0 left-0 rounded-full w-60 h-60 bg-purple-500/10 blur-3xl" />

    <div className="relative p-6">

      <div className="flex items-center gap-4">

        <div className="flex items-center justify-center shadow-lg w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20">
          <Workflow className="text-white" size={24} />
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {editMode
              ? "Update Automation Workflow"
              : "Create AI Workflow"}
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-400">
            Build intelligent automations for leads, emails,
            WhatsApp, CRM triggers and customer journeys.
          </p>
        </div>

      </div>

    </div>
  </div>

  {/* ===================================================== */}
  {/* MAIN FORM */}
  {/* ===================================================== */}

  <div className="grid gap-5 lg:grid-cols-2">

    {/* LEFT SIDE */}
    <div className="space-y-5">

      {/* WORKFLOW NAME */}
      <div className="p-5 border shadow-xl rounded-3xl border-white/10 bg-[#111827]/90">

        <label className="block mb-3 text-sm font-semibold tracking-wide uppercase text-cyan-300">
          Workflow Name
        </label>

        <input
          className="w-full px-5 py-4 text-white placeholder-gray-500 transition-all duration-300 border outline-none rounded-2xl border-white/10 bg-[#0B1120] focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10"
          placeholder="Lead Follow-up Automation"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
        />

      </div>

      {/* DESCRIPTION */}
      <div className="p-5 border shadow-xl rounded-3xl border-white/10 bg-[#111827]/90">

        <label className="block mb-3 text-sm font-semibold tracking-wide text-purple-300 uppercase">
          Workflow Description
        </label>

        <textarea
          className="w-full h-36 px-5 py-4 text-white placeholder-gray-500 transition-all duration-300 border outline-none resize-none rounded-2xl border-white/10 bg-[#0B1120] focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10"
          placeholder="Describe how this automation should behave..."
          value={form.description}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
        />

      </div>

      {/* TRIGGER */}
      <div className="p-5 border shadow-xl rounded-3xl border-white/10 bg-[#111827]/90">

        <label className="block mb-3 text-sm font-semibold tracking-wide text-indigo-300 uppercase">
          Trigger Event
        </label>

        <select
          className="w-full px-5 py-4 text-white transition-all duration-300 border outline-none rounded-2xl border-white/10 bg-[#0B1120] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
          value={form.trigger.type}
          onChange={(e) =>
            setForm({
              ...form,
              trigger: {
                type: e.target.value,
              },
            })
          }
        >
          <option value="lead_created">
            Lead Created
          </option>

          <option value="lead_updated">
            Lead Updated
          </option>

          <option value="deal_created">
            Deal Created
          </option>

          <option value="invoice_paid">
            Invoice Paid
          </option>

        </select>

      </div>

    </div>

    {/* RIGHT SIDE */}
    <div className="p-5 border shadow-xl rounded-3xl border-white/10 bg-[#111827]/90">

      <div className="flex items-center justify-between mb-5">

        <div>
          <h3 className="text-lg font-bold text-white">
            Workflow Actions
          </h3>

          <p className="mt-1 text-sm text-gray-400">
            Configure execution flow and automation actions.
          </p>
        </div>

        <button
          onClick={addAction}
          className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 shadow-lg rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105"
        >
          <Plus size={16} />
          Add Action
        </button>

      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">

        {form.actions.map((a, i) => (
          <div
            key={i}
            className="relative overflow-hidden border shadow-lg rounded-3xl border-white/10 bg-gradient-to-br from-[#0B1120] to-[#111827]"
          >

            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-cyan-500/5 blur-2xl" />

            <div className="relative p-5">

              {/* HEADER */}
              <div className="flex items-center justify-between mb-5">

                <div className="flex items-center gap-3">

                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600">
                    {a.type === "email" ? (
                      <Mail size={18} />
                    ) : (
                      <MessageSquare size={18} />
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-white">
                      Action #{i + 1}
                    </h4>

                    <p className="text-xs text-gray-400">
                      Automation execution block
                    </p>
                  </div>

                </div>

                <button
                  onClick={() => {
                    const updated = [...form.actions];
                    updated.splice(i, 1);

                    setForm({
                      ...form,
                      actions: updated,
                    });
                  }}
                  className="flex items-center justify-center w-10 h-10 text-red-300 transition-all duration-300 rounded-xl bg-red-500/10 hover:bg-red-500/20"
                >
                  <Trash2 size={16} />
                </button>

              </div>

              {/* GRID */}
              <div className="grid gap-4 md:grid-cols-2">

                {/* TYPE */}
                <div>

                  <label className="block mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Action Type
                  </label>

                  <select
                    className="w-full px-4 py-3 text-white border outline-none rounded-2xl border-white/10 bg-[#121826] focus:border-cyan-400"
                    value={a.type}
                    onChange={(e) => {
                      const updated = [...form.actions];
                      updated[i].type = e.target.value;

                      setForm({
                        ...form,
                        actions: updated,
                      });
                    }}
                  >
                    <option value="email">
                      Email Notification
                    </option>

                    <option value="whatsapp">
                      WhatsApp Message
                    </option>

                  </select>

                </div>

                {/* DELAY */}
                <div>

                  <label className="block mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Delay Time
                  </label>

                  <input
                    type="number"
                    className="w-full px-4 py-3 text-white border outline-none rounded-2xl border-white/10 bg-[#121826] focus:border-purple-400"
                    placeholder="0"
                    onChange={(e) =>
                      updateAction(
                        i,
                        "delay",
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>

              {/* SUBJECT */}
              <div className="mt-4">

                <label className="block mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Subject Line
                </label>

                <input
                  className="w-full px-4 py-3 text-white border outline-none rounded-2xl border-white/10 bg-[#121826] focus:border-indigo-400"
                  placeholder="Welcome to ReadyTechSolutions"
                  onChange={(e) =>
                    updateAction(
                      i,
                      "subject",
                      e.target.value
                    )
                  }
                />

              </div>

              {/* MESSAGE */}
              <div className="mt-4">

                <label className="block mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Message Content
                </label>

                <textarea
                  className="w-full h-32 px-4 py-3 text-white border outline-none resize-none rounded-2xl border-white/10 bg-[#121826] focus:border-cyan-400"
                  placeholder="Write automation content..."
                  onChange={(e) =>
                    updateAction(
                      i,
                      "message",
                      e.target.value
                    )
                  }
                />

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>

  </div>

  {/* ===================================================== */}
  {/* FOOTER ACTION */}
  {/* ===================================================== */}

  <div className="sticky bottom-0 z-20 p-5 border shadow-2xl rounded-3xl border-white/10 bg-[#0F172A]/90 backdrop-blur-xl">

    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

      <div>
        <h3 className="text-lg font-bold text-white">
          Ready to Launch Automation?
        </h3>

        <p className="mt-1 text-sm text-gray-400">
          Your workflow will execute automatically based on trigger events.
        </p>
      </div>

      <button
        onClick={saveAutomation}
        className="px-8 py-4 text-base font-bold text-white transition-all duration-300 shadow-2xl rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:scale-105 hover:shadow-cyan-500/20"
      >
        {editMode
          ? "Update Workflow"
          : "Create Workflow"}
      </button>

    </div>

  </div>

</div>

        </Modal>
      )}

      {/* ========================================================= */}
      {/* TEST MODAL */}
      {/* ========================================================= */}

      {testModal && (
        <Modal
          title="Test Automation Workflow"
          onClose={() => setTestModal(false)}
        >

          <div className="space-y-5">

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Lead Name
              </label>

              <input
                className="w-full input-premium"
                placeholder="John Doe"
                onChange={(e) =>
                  setTestData({
                    ...testData,
                    payload: {
                      ...testData.payload,
                      name: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Email Address
              </label>

              <input
                className="w-full input-premium"
                placeholder="john@example.com"
                onChange={(e) =>
                  setTestData({
                    ...testData,
                    payload: {
                      ...testData.payload,
                      email: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Phone Number
              </label>

              <input
                className="w-full input-premium"
                placeholder="+91 9876543210"
                onChange={(e) =>
                  setTestData({
                    ...testData,
                    payload: {
                      ...testData.payload,
                      phone: e.target.value,
                    },
                  })
                }
              />
            </div>

            <button
              onClick={testAutomation}
              className="flex items-center justify-center w-full gap-2 py-4 font-semibold transition-all duration-300 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-[1.02]"
            >
              <PlayCircle size={18} />
              Execute Test Workflow
            </button>

          </div>

        </Modal>
      )}
    </div>
  );
}

// =========================================================
// STAT CARD
// =========================================================

function StatCard({ icon, title, value, sub }) {
  return (
    <div className="relative overflow-hidden border rounded-3xl border-white/10 bg-white/5 backdrop-blur-xl">

      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative p-6">

        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="mb-2 text-sm text-gray-400">{title}</p>
            <h2 className="text-4xl font-black">{value}</h2>
          </div>

          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-300">
            {icon}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <ChevronRight size={15} />
          {sub}
        </div>

      </div>
    </div>
  );
}

// =========================================================
// FEATURE CARD
// =========================================================

function FeatureCard({ icon, title, text }) {
  return (
    <div className="flex gap-4 p-4 transition-all duration-300 border rounded-2xl border-white/10 bg-black/20 hover:bg-white/[0.04]">

      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-300 shrink-0">
        {icon}
      </div>

      <div>
        <h4 className="mb-1 font-semibold">{title}</h4>
        <p className="text-sm leading-6 text-gray-400">
          {text}
        </p>
      </div>

    </div>
  );
}

// =========================================================
// MODAL
// =========================================================

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-sm">

      <div className="w-full max-w-3xl max-h-[95vh] overflow-y-auto rounded-[32px] border border-white/10 bg-[#0B1020] shadow-2xl shadow-cyan-500/10">

        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#0B1020]/90 backdrop-blur-xl">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-gray-400">
              ReadyTechSolutions Automation Suite
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-xl bg-white/5 hover:bg-red-500/20"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>

      </div>
    </div>
  );
}
