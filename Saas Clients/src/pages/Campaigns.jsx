import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";

import {
  Rocket,
  Search,
  Mail,
  MessageSquare,
  Send,
  Pencil,
  Trash2,
  Sparkles,
  BarChart3,
  Activity,
  TrendingUp,
  Plus,
  X,
  Megaphone,
  Building2,
  Globe,
  CheckCircle2,
  Clock3,
  Layers3,
} from "lucide-react";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [editForm, setEditForm] = useState({});

  const [form, setForm] = useState({
    name: "",
    type: "email",
    subject: "",
    content: "",
  });

  /* ===================================================== */
  /* SAFE API */
  /* ===================================================== */

  const safeCall = async (fn, label) => {
    try {
      return await fn();
    } catch (err) {
      console.error(label, err);

      if (err.response) {
        alert(err.response.data?.message || "Server Error");
      } else {
        alert("Backend not reachable");
      }

      throw err;
    }
  };

  /* ===================================================== */
  /* FETCH */
  /* ===================================================== */

  const fetchCampaigns = async () => {
    try {
      setLoading(true);

      const res = await safeCall(
        () => API.get("/marketing/campaign"),
        "FETCH"
      );

      setCampaigns(res.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  /* ===================================================== */
  /* CREATE */
  /* ===================================================== */

  const createCampaign = async () => {
    if (!form.name || !form.content) {
      return alert("Campaign name & content required");
    }

    try {
      setActionLoading("create");

      const res = await safeCall(
        () =>
          API.post("/marketing/campaign", {
            ...form,
            type: form.type.toLowerCase(),
          }),
        "CREATE"
      );

      setCampaigns((prev) => [res.data.data, ...prev]);

      setForm({
        name: "",
        type: "email",
        subject: "",
        content: "",
      });
    } finally {
      setActionLoading(null);
    }
  };

  /* ===================================================== */
  /* SEND */
  /* ===================================================== */

  const sendCampaign = async (id) => {
    try {
      setActionLoading(id);

      await safeCall(
        () => API.post(`/marketing/campaign/${id}/send`),
        "SEND"
      );

      alert("Campaign sent successfully 🚀");

      fetchCampaigns();
    } finally {
      setActionLoading(null);
    }
  };

  /* ===================================================== */
  /* EDIT */
  /* ===================================================== */

  const openEdit = (c) => {
    setEditForm({
      _id: c._id,
      name: c.name || "",
      subject: c.subject || "",
      content: c.content || "",
      type: c.type || "email",
    });

    setIsEditOpen(true);
  };

  const updateCampaign = async () => {
    try {
      setActionLoading("update");

      const payload = {
        name: editForm.name,
        subject: editForm.subject,
        content: editForm.content,
        type: editForm.type,
      };

      await safeCall(
        () =>
          API.put(
            `/marketing/campaign/${editForm._id}`,
            payload
          ),
        "UPDATE"
      );

      setCampaigns((prev) =>
        prev.map((c) =>
          c._id === editForm._id
            ? { ...c, ...payload }
            : c
        )
      );

      setIsEditOpen(false);
    } finally {
      setActionLoading(null);
    }
  };

  /* ===================================================== */
  /* DELETE */
  /* ===================================================== */

  const deleteCampaign = async () => {
    try {
      setActionLoading("delete");

      await safeCall(
        () =>
          API.delete(
            `/marketing/campaign/${deleteConfirm}`
          ),
        "DELETE"
      );

      setCampaigns((prev) =>
        prev.filter((c) => c._id !== deleteConfirm)
      );

      setDeleteConfirm(null);
    } finally {
      setActionLoading(null);
    }
  };

  /* ===================================================== */
  /* FILTER */
  /* ===================================================== */

  const filtered = useMemo(() => {
    return campaigns.filter(
      (c) =>
        c.name
          ?.toLowerCase()
          .includes(search.toLowerCase()) &&
        (filter === "all" || c.type === filter)
    );
  }, [campaigns, search, filter]);

  /* ===================================================== */
  /* STATS */
  /* ===================================================== */

  const totalCampaigns = campaigns.length;

  const emailCampaigns = campaigns.filter(
    (c) => c.type === "email"
  ).length;

  const whatsappCampaigns = campaigns.filter(
    (c) => c.type === "whatsapp"
  ).length;

  return (
    <div className="min-h-screen text-white bg-[#050816] overflow-hidden">

      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/20 blur-[120px]" />
      </div>

      <div className="relative z-10 p-6 lg:p-8">

        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <div className="grid gap-6 mb-8 lg:grid-cols-3">

          {/* LEFT */}
          <div className="relative overflow-hidden border lg:col-span-2 rounded-[32px] border-white/10 bg-white/5 backdrop-blur-xl">

            <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 blur-[120px]" />

            <div className="relative p-8">

              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm border rounded-full bg-cyan-500/10 border-cyan-400/20 text-cyan-300">
                <Sparkles size={16} />
                ReadyTechSolutions • Marketing Campaign Suite
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight">
                Smart Campaign
                <span className="text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text">
                  {" "}
                  Management Platform
                </span>
              </h1>

              <p className="max-w-2xl mt-5 text-lg leading-8 text-gray-300">
                Launch AI-powered email and WhatsApp
                marketing campaigns with enterprise
                automation, analytics, engagement
                tracking and customer journey workflows.
              </p>

              <div className="flex flex-wrap gap-4 mt-8">

                <button
                  className="flex items-center gap-2 px-6 py-4 font-semibold transition-all duration-300 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-105"
                >
                  <Rocket size={18} />
                  Launch Campaign
                </button>

                <button
                  className="flex items-center gap-2 px-6 py-4 font-semibold border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                >
                  <BarChart3 size={18} />
                  View Analytics
                </button>

              </div>

            </div>
          </div>

          {/* RIGHT */}
          <div className="p-6 border rounded-[32px] border-white/10 bg-white/5 backdrop-blur-xl">

            <div className="flex items-center gap-4 mb-6">

              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600">
                <Building2 />
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  ReadyTechSolutions
                </h2>

                <p className="text-sm text-gray-400">
                  Premium SaaS Marketing Engine
                </p>
              </div>

            </div>

            <div className="space-y-4">

              <FeatureCard
                icon={<Mail size={18} />}
                title="Email Marketing"
                text="Professional email campaign workflows."
              />

              <FeatureCard
                icon={<MessageSquare size={18} />}
                title="WhatsApp Campaigns"
                text="Automated customer engagement campaigns."
              />

              <FeatureCard
                icon={<TrendingUp size={18} />}
                title="Performance Tracking"
                text="Campaign analytics & conversion insights."
              />

              <FeatureCard
                icon={<Globe size={18} />}
                title="Global Delivery"
                text="Scalable enterprise delivery infrastructure."
              />

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* STATS */}
        {/* ================================================= */}

        <div className="grid gap-5 mb-8 md:grid-cols-2 xl:grid-cols-4">

          <StatCard
            icon={<Layers3 size={20} />}
            title="Total Campaigns"
            value={totalCampaigns}
            sub="Marketing workflows"
          />

          <StatCard
            icon={<Mail size={20} />}
            title="Email Campaigns"
            value={emailCampaigns}
            sub="Email automation"
          />

          <StatCard
            icon={<MessageSquare size={20} />}
            title="WhatsApp"
            value={whatsappCampaigns}
            sub="Messaging campaigns"
          />

          <StatCard
            icon={<Activity size={20} />}
            title="Delivery Rate"
            value="99.9%"
            sub="Enterprise uptime"
          />

        </div>

        {/* ================================================= */}
        {/* CREATE CAMPAIGN */}
        {/* ================================================= */}

        <div className="p-6 mb-8 border rounded-[32px] border-white/10 bg-white/5 backdrop-blur-xl">

          <div className="flex items-center gap-4 mb-6">

            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600">
              <Megaphone />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Create New Campaign
              </h2>

              <p className="text-sm text-gray-400">
                Build modern AI-powered campaigns for
                marketing automation.
              </p>
            </div>

          </div>

          <div className="grid gap-5 lg:grid-cols-2">

            <Input
              placeholder="Campaign Name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />

            <select
  className="
    w-full
    px-5
    py-4
    text-white
    bg-[#0B1120]
    border
    border-white/10
    rounded-2xl
    outline-none
    appearance-none
    focus:border-cyan-400
    focus:ring-4
    focus:ring-cyan-500/10
    transition-all
    duration-300
  "
  value={form.type}
  onChange={(e) =>
    setForm({
      ...form,
      type: e.target.value,
    })
  }
>
  <option
    className="bg-[#0B1120] text-white"
    value="email"
  >
    Email Campaign
  </option>

  <option
    className="bg-[#0B1120] text-white"
    value="whatsapp"
  >
    WhatsApp Campaign
  </option>
</select>

            <Input
              className="lg:col-span-2"
              placeholder="Campaign Subject"
              value={form.subject}
              onChange={(e) =>
                setForm({
                  ...form,
                  subject: e.target.value,
                })
              }
            />

            <textarea
              rows={6}
              className="w-full p-5 text-white border outline-none resize-none lg:col-span-2 rounded-2xl border-white/10 bg-[#0B1120]"
              placeholder="Write premium campaign content..."
              value={form.content}
              onChange={(e) =>
                setForm({
                  ...form,
                  content: e.target.value,
                })
              }
            />

          </div>

          <button
            onClick={createCampaign}
            disabled={actionLoading === "create"}
            className="flex items-center gap-2 px-8 py-4 mt-6 font-semibold transition-all duration-300 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-105"
          >
            <Rocket size={18} />

            {actionLoading === "create"
              ? "Creating..."
              : "Launch Campaign"}
          </button>

        </div>

        {/* ================================================= */}
        {/* FILTER */}
        {/* ================================================= */}

        <div className="flex flex-col gap-4 p-5 mb-8 border lg:flex-row lg:items-center lg:justify-between rounded-[32px] border-white/10 bg-white/5 backdrop-blur-xl">

          <div>
            <h2 className="text-2xl font-bold">
              Campaign Management
            </h2>

            <p className="text-sm text-gray-400">
              Monitor and manage all campaign activities.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">

            <div className="relative">

              <Search
                size={18}
                className="absolute text-gray-400 -translate-y-1/2 left-4 top-1/2"
              />

              <input
                className="w-full py-4 pl-12 pr-4 text-white border outline-none md:w-72 rounded-2xl border-white/10 bg-[#0B1120]"
                placeholder="Search campaign..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            <select
              className="px-5 py-4 border outline-none rounded-2xl border-white/10 bg-[#0B1120]"
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
            >
              <option value="all">
                All Campaigns
              </option>

              <option value="email">
                Email
              </option>

              <option value="whatsapp">
                WhatsApp
              </option>

            </select>

          </div>

        </div>

        {/* ================================================= */}
        {/* TABLE */}
        {/* ================================================= */}

        <div className="overflow-hidden border rounded-[32px] border-white/10 bg-white/5 backdrop-blur-xl">

          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold">
              Active Campaigns
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Enterprise campaign control center
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400">
              Loading campaigns...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">

              <Megaphone
                size={60}
                className="mb-4 text-gray-500"
              />

              <h3 className="text-2xl font-bold">
                No Campaigns Found
              </h3>

              <p className="mt-2 text-gray-400">
                Create your first premium campaign.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px]">

                <thead className="border-b border-white/10 bg-white/5">

                  <tr className="text-left text-gray-400">

                    <th className="px-6 py-4">
                      Campaign
                    </th>

                    <th className="px-6 py-4">
                      Type
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Performance
                    </th>

                    <th className="px-6 py-4 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filtered.map((c) => (
                    <tr
                      key={c._id}
                      className="border-b border-white/5 hover:bg-white/[0.03]"
                    >

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-4">

                          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">

                            {c.type === "email" ? (
                              <Mail
                                className="text-cyan-300"
                                size={20}
                              />
                            ) : (
                              <MessageSquare
                                className="text-green-300"
                                size={20}
                              />
                            )}

                          </div>

                          <div>
                            <h3 className="font-semibold">
                              {c.name}
                            </h3>

                            <p className="max-w-md mt-1 text-sm text-gray-400 line-clamp-1">
                              {c.subject ||
                                "Marketing automation campaign"}
                            </p>
                          </div>

                        </div>

                      </td>

                      <td className="px-6 py-5">

                        <div className="inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-xl border-cyan-500/20 bg-cyan-500/10 text-cyan-300">

                          {c.type === "email" ? (
                            <Mail size={16} />
                          ) : (
                            <MessageSquare size={16} />
                          )}

                          {c.type}

                        </div>

                      </td>

                      <td className="px-6 py-5">

                        <div className="inline-flex items-center gap-2 px-4 py-2 text-sm text-green-300 border rounded-xl border-green-500/20 bg-green-500/10">

                          <CheckCircle2 size={15} />

                          {c.status || "Draft"}

                        </div>

                      </td>

                      <td className="px-6 py-5">

                        <div>

                          <div className="flex items-center gap-2 mb-2 text-sm text-green-400">
                            <TrendingUp size={14} />
                            High engagement
                          </div>

                          <div className="w-40 h-2 overflow-hidden rounded-full bg-white/10">

                            <div className="w-[80%] h-full bg-gradient-to-r from-cyan-400 to-blue-500" />

                          </div>

                        </div>

                      </td>

                      <td className="px-6 py-5">

                        <div className="flex items-center justify-end gap-3">

                          <button
                            disabled={
                              actionLoading === c._id
                            }
                            onClick={() =>
                              sendCampaign(c._id)
                            }
                            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-300 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105"
                          >
                            <Send size={16} />

                            {actionLoading === c._id
                              ? "Sending..."
                              : "Send"}

                          </button>

                          <button
                            onClick={() =>
                              openEdit(c)
                            }
                            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-blue-300 transition-all duration-300 border rounded-2xl bg-blue-500/20 border-blue-500/20 hover:scale-105"
                          >
                            <Pencil size={16} />
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              setDeleteConfirm(c._id)
                            }
                            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-300 transition-all duration-300 border rounded-2xl bg-red-500/20 border-red-500/20 hover:scale-105"
                          >
                            <Trash2 size={16} />
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

      {/* ================================================= */}
      {/* EDIT MODAL */}
      {/* ================================================= */}

      {isEditOpen && (
        <Modal
          title="Edit Campaign"
          onClose={() => setIsEditOpen(false)}
        >

          <div className="space-y-5">

            <Input
              placeholder="Campaign Name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  name: e.target.value,
                })
              }
            />

            <Input
              placeholder="Subject"
              value={editForm.subject}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  subject: e.target.value,
                })
              }
            />

            <textarea
              rows={7}
              className="w-full p-5 text-white border outline-none resize-none rounded-2xl border-white/10 bg-[#0B1120]"
              value={editForm.content}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  content: e.target.value,
                })
              }
            />

            <div className="flex justify-end gap-3 pt-4">

              <button
                onClick={() =>
                  setIsEditOpen(false)
                }
                className="px-5 py-3 rounded-2xl bg-white/10"
              >
                Cancel
              </button>

              <button
                onClick={updateCampaign}
                className="px-6 py-3 font-semibold rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {actionLoading === "update"
                  ? "Updating..."
                  : "Save Changes"}
              </button>

            </div>

          </div>

        </Modal>
      )}

      {/* ================================================= */}
      {/* DELETE MODAL */}
      {/* ================================================= */}

      {deleteConfirm && (
        <Modal
          title="Delete Campaign"
          onClose={() =>
            setDeleteConfirm(null)
          }
        >

          <div className="text-center">

            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-5 rounded-full bg-red-500/10">
              <Trash2
                className="text-red-400"
                size={30}
              />
            </div>

            <h3 className="text-2xl font-bold">
              Delete Campaign?
            </h3>

            <p className="mt-2 text-gray-400">
              This action cannot be undone.
            </p>

            <div className="flex justify-center gap-4 mt-8">

              <button
                onClick={() =>
                  setDeleteConfirm(null)
                }
                className="px-6 py-3 rounded-2xl bg-white/10"
              >
                Cancel
              </button>

              <button
                onClick={deleteCampaign}
                className="px-6 py-3 font-semibold rounded-2xl bg-gradient-to-r from-red-500 to-red-700"
              >
                {actionLoading === "delete"
                  ? "Deleting..."
                  : "Delete Campaign"}
              </button>

            </div>

          </div>

        </Modal>
      )}

    </div>
  );
}

/* ===================================================== */
/* INPUT */
/* ===================================================== */

const Input = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`w-full px-5 py-4 text-white border outline-none rounded-2xl border-white/10 bg-[#0B1120] placeholder-gray-500 focus:border-cyan-400 ${className}`}
  />
);

/* ===================================================== */
/* FEATURE CARD */
/* ===================================================== */

function FeatureCard({
  icon,
  title,
  text,
}) {
  return (
    <div className="flex gap-4 p-4 border rounded-2xl border-white/10 bg-black/20">

      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-300">
        {icon}
      </div>

      <div>
        <h4 className="font-semibold">
          {title}
        </h4>

        <p className="mt-1 text-sm leading-6 text-gray-400">
          {text}
        </p>
      </div>

    </div>
  );
}

/* ===================================================== */
/* STAT CARD */
/* ===================================================== */

function StatCard({
  icon,
  title,
  value,
  sub,
}) {
  return (
    <div className="relative overflow-hidden border rounded-[28px] border-white/10 bg-white/5 backdrop-blur-xl">

      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative p-6">

        <div className="flex items-center justify-between mb-5">

          <div>
            <p className="mb-2 text-sm text-gray-400">
              {title}
            </p>

            <h2 className="text-4xl font-black">
              {value}
            </h2>
          </div>

          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-300">
            {icon}
          </div>

        </div>

        <div className="text-sm text-gray-400">
          {sub}
        </div>

      </div>

    </div>
  );
}

/* ===================================================== */
/* MODAL */
/* ===================================================== */

function Modal({
  children,
  title,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-sm">

      <div className="w-full max-w-2xl border shadow-2xl rounded-[32px] border-white/10 bg-[#0B1020]">

        <div className="flex items-center justify-between p-6 border-b border-white/10">

          <div>
            <h2 className="text-2xl font-bold">
              {title}
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              ReadyTechSolutions Campaign Suite
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20"
          >
            <X size={18} />
          </button>

        </div>

        <div className="p-6">
          {children}
        </div>

      </div>

    </div>
  );
}