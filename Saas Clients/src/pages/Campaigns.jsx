import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [editForm, setEditForm] = useState({
    _id: "",
    name: "",
    type: "email",
    subject: "",
    content: "",
  });

  const [form, setForm] = useState({
    name: "",
    type: "email",
    subject: "",
    content: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
  });

  /* ================= FETCH ================= */
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await API.get("/marketing/campaign");
      const data = res.data?.data || [];

      setCampaigns(data);

      let success = 0;
      let failed = 0;

      data.forEach((c) => {
        success += c.stats?.success || 0;
        failed += c.stats?.failed || 0;
      });

      setStats({
        total: data.length,
        success,
        failed,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  /* ================= CREATE ================= */
  const createCampaign = async () => {
    await API.post("/marketing/campaign", form);

    setForm({
      name: "",
      type: "email",
      subject: "",
      content: "",
    });

    fetchCampaigns();
  };

  /* ================= SEND ================= */
  const sendCampaign = async (id) => {
    try {
      setActionLoading(id);
      await API.post(`/marketing/campaign/${id}/send`);
      fetchCampaigns();
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= EDIT ================= */
  const openEdit = (c) => {
    setEditForm(c);
    setIsEditOpen(true);
  };

  const updateCampaign = async () => {
    await API.put(`/marketing/campaign/${editForm._id}`, editForm);
    setIsEditOpen(false);
    fetchCampaigns();
  };

  /* ================= DELETE ================= */
  const deleteCampaign = async () => {
    await API.delete(`/marketing/campaign/${deleteConfirm}`);
    setDeleteConfirm(null);
    fetchCampaigns();
  };

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      return (
        c.name.toLowerCase().includes(search.toLowerCase()) &&
        (filter === "all" || c.type === filter)
      );
    });
  }, [campaigns, search, filter]);

  return (
    <div className="min-h-screen p-6 text-white bg-gradient-to-br from-black via-gray-950 to-black">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            📢 Campaign Center
          </h1>
          <p className="text-sm text-gray-400">
            Enterprise SaaS Marketing Module • ReadyTech CRM
          </p>
        </div>

        <div className="flex gap-3">

          <input
            className="px-4 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg outline-none focus:border-blue-500"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>

        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid gap-4 mb-6 md:grid-cols-3">

        <StatCard label="Total Campaigns" value={stats.total} />
        <StatCard label="Success Sends" value={stats.success} color="green" />
        <StatCard label="Failed Sends" value={stats.failed} color="red" />

      </div>

      {/* ================= CREATE CARD ================= */}
      <div className="p-6 mb-6 border border-gray-800 shadow-xl bg-gray-900/60 rounded-2xl">

        <h2 className="mb-4 text-lg font-semibold">Create Campaign</h2>

        <div className="grid gap-4 md:grid-cols-2">

          <Input
            placeholder="Campaign Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <select
            className="p-3 text-sm bg-gray-800 border border-gray-700 rounded-lg"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option>Email</option>
            <option>WhatsApp</option>
          </select>

          <Input
            className="md:col-span-2"
            placeholder="Subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />

          <textarea
            className="w-full p-3 text-sm bg-gray-800 border border-gray-700 rounded-lg md:col-span-2"
            rows={4}
            placeholder="Write campaign content..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />

        </div>

        <button
          onClick={createCampaign}
          className="px-5 py-2 mt-4 text-sm font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          🚀 Launch Campaign
        </button>

      </div>

      {/* ================= TABLE ================= */}
      <div className="border border-gray-800 bg-gray-900/60 rounded-2xl">

        <div className="p-4 border-b border-gray-800">
          <h2 className="font-semibold">Campaign List</h2>
        </div>

        {loading ? (
          <p className="p-6 text-gray-400 animate-pulse">Loading...</p>
        ) : (
          <table className="w-full text-sm">

            <thead className="text-gray-400">
              <tr className="border-b border-gray-800">
                <th className="p-3 text-left">Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c._id}
                  className="transition border-b border-gray-800 hover:bg-white/5"
                >

                  <td className="p-3">{c.name}</td>
                  <td className="text-gray-300">{c.type}</td>

                  <td>
                    <span className="px-2 py-1 text-xs bg-gray-800 rounded-full">
                      {c.status}
                    </span>
                  </td>

                  <td className="flex gap-2 p-3">

                    <ActionBtn
                      label="Send"
                      color="green"
                      onClick={() => sendCampaign(c._id)}
                      loading={actionLoading === c._id}
                    />

                    <ActionBtn
                      label="Edit"
                      color="blue"
                      onClick={() => openEdit(c)}
                    />

                    <ActionBtn
                      label="Delete"
                      color="red"
                      onClick={() => setDeleteConfirm(c._id)}
                    />

                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        )}

      </div>

      {/* ================= EDIT MODAL ================= */}
      {isEditOpen && (
        <Modal onClose={() => setIsEditOpen(false)} title="Edit Campaign">

          <div className="space-y-3">

            <Input
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />

            <Input
              value={editForm.subject}
              onChange={(e) =>
                setEditForm({ ...editForm, subject: e.target.value })
              }
            />

            <textarea
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
              rows={4}
              value={editForm.content}
              onChange={(e) =>
                setEditForm({ ...editForm, content: e.target.value })
              }
            />

            <button
              onClick={updateCampaign}
              className="w-full py-2 font-semibold text-white bg-blue-600 rounded-lg"
            >
              Update Campaign
            </button>

          </div>

        </Modal>
      )}

      {/* ================= DELETE MODAL ================= */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)} title="Delete Campaign">

          <p className="mb-4 text-gray-400">
            Are you sure you want to delete this campaign?
          </p>

          <div className="flex gap-2">
            <button onClick={deleteCampaign} className="btn-red">
              Delete
            </button>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="btn-gray"
            >
              Cancel
            </button>
          </div>

        </Modal>
      )}

    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({ label, value, color }) {
  const colors = {
    green: "text-green-400",
    red: "text-red-400",
  };

  return (
    <div className="p-5 border border-gray-800 bg-white/5 rounded-2xl">
      <p className="text-gray-400">{label}</p>
      <h2 className={`text-3xl font-bold ${colors[color] || ""}`}>
        {value}
      </h2>
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`p-3 text-sm bg-gray-800 border border-gray-700 rounded-lg ${props.className || ""}`}
    />
  );
}

function ActionBtn({ label, color, onClick, loading }) {
  const map = {
    green: "bg-green-600",
    blue: "bg-blue-600",
    red: "bg-red-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-3 py-1 text-xs rounded-lg text-white ${map[color]} hover:opacity-80`}
    >
      {loading ? "..." : label}
    </button>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">

      <div className="w-[420px] p-5 bg-gray-900 border border-gray-800 rounded-2xl relative">

        <button
          onClick={onClose}
          className="absolute text-gray-400 top-3 right-4"
        >
          ✕
        </button>

        <h2 className="mb-4 text-lg font-semibold">{title}</h2>

        {children}

      </div>

    </div>
  );
}

const btnRed = "px-4 py-2 bg-red-600 rounded-lg";
const btnGray = "px-4 py-2 bg-gray-600 rounded-lg";