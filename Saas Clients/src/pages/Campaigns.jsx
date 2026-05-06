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

  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({
    name: "",
    type: "email",
    subject: "",
    content: "",
  });

  /* ================= SAFE API CALL ================= */
  const safeCall = async (fn, label) => {
    try {
      return await fn();
    } catch (err) {
      console.error(label, err);

      if (err.response) {
        alert(err.response.data?.message || "Server error");
      } else {
        alert("⚠️ Backend not reachable (Render sleeping)");
      }
      throw err;
    }
  };

  /* ================= FETCH ================= */
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

  /* ================= CREATE ================= */
  const createCampaign = async () => {
    if (!form.name || !form.content) {
      return alert("Name & Content required");
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

      // ✅ instant UI update
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

  /* ================= SEND ================= */
  const sendCampaign = async (id) => {
    try {
      setActionLoading(id);

      await safeCall(
        () => API.post(`/marketing/campaign/${id}/send`),
        "SEND"
      );

      alert("Campaign Sent 🚀");

      fetchCampaigns();
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= EDIT ================= */
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
        type: editForm.type.toLowerCase(),
      };

      await safeCall(
        () => API.put(`/marketing/campaign/${editForm._id}`, payload),
        "UPDATE"
      );

      // ✅ instant UI update
      setCampaigns((prev) =>
        prev.map((c) =>
          c._id === editForm._id ? { ...c, ...payload } : c
        )
      );

      setIsEditOpen(false);
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= DELETE ================= */
  const deleteCampaign = async () => {
    try {
      setActionLoading("delete");

      await safeCall(
        () => API.delete(`/marketing/campaign/${deleteConfirm}`),
        "DELETE"
      );

      // ✅ instant remove
      setCampaigns((prev) =>
        prev.filter((c) => c._id !== deleteConfirm)
      );

      setDeleteConfirm(null);
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    return campaigns.filter(
      (c) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) &&
        (filter === "all" || c.type === filter)
    );
  }, [campaigns, search, filter]);

  return (
    <div className="min-h-screen p-6 text-white bg-gradient-to-br from-black via-gray-950 to-black">

      {/* HEADER */}
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">📢 Campaign Center</h1>
          <p className="text-gray-400">Marketing Automation Suite</p>
        </div>

        <div className="flex gap-3">
          <input
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>

      {/* CREATE */}
      <div className="p-6 mb-8 bg-gray-900 border border-gray-800 rounded-3xl">
        <h2 className="mb-4 text-xl font-semibold">Create Campaign</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Campaign Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <select
            className="p-3 bg-gray-800 border border-gray-700 rounded-xl"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>

          <Input
            className="md:col-span-2"
            placeholder="Subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />

          <textarea
            className="p-3 bg-gray-800 border border-gray-700 rounded-xl md:col-span-2"
            rows={4}
            placeholder="Write content..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </div>

        <button
          onClick={createCampaign}
          disabled={actionLoading === "create"}
          className="px-6 py-2 mt-4 bg-blue-600 rounded-xl"
        >
          {actionLoading === "create" ? "Creating..." : "🚀 Launch"}
        </button>
      </div>

      {/* TABLE */}
      <div className="border border-gray-800 rounded-3xl">
        {loading ? (
          <p className="p-6">Loading...</p>
        ) : (
          <table className="w-full">
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id} className="border-b border-gray-800">
                  <td className="p-4">{c.name}</td>
                  <td>{c.type}</td>
                  <td>{c.status}</td>

                  <td className="flex gap-2 p-4">
                    <Btn
                      disabled={actionLoading === c._id}
                      onClick={() => sendCampaign(c._id)}
                      color="green"
                    >
                      {actionLoading === c._id ? "..." : "Send"}
                    </Btn>

                    <Btn onClick={() => openEdit(c)} color="blue">
                      Edit
                    </Btn>

                    <Btn onClick={() => setDeleteConfirm(c._id)} color="red">
                      Delete
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

     {/* ================= EDIT MODAL ================= */}
{/* ================= EDIT MODAL ================= */}
{/* ================= EDIT MODAL ================= */}
{isEditOpen && (
  <Modal onClose={() => setIsEditOpen(false)}>
    <div className="flex flex-col gap-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">✏️ Edit Campaign</h2>
          <p className="text-sm text-gray-400">
            Update campaign details and content
          </p>
        </div>
      </div>

      {/* FORM GRID */}
      <div className="grid grid-cols-2 gap-5">

        {/* NAME */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Campaign Name</label>
          <Input
            value={editForm.name}
            onChange={(e) =>
              setEditForm({ ...editForm, name: e.target.value })
            }
          />
        </div>

        {/* SUBJECT */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Subject</label>
          <Input
            value={editForm.subject}
            onChange={(e) =>
              setEditForm({ ...editForm, subject: e.target.value })
            }
          />
        </div>

        {/* CONTENT FULL WIDTH */}
        <div className="flex flex-col col-span-2 gap-1">
          <label className="text-xs text-gray-400">Content</label>
          <textarea
            rows={7}
            className="w-full p-4 text-sm bg-gray-800 border border-gray-700 outline-none resize-none rounded-xl focus:ring-2 focus:ring-blue-500"
            value={editForm.content}
            onChange={(e) =>
              setEditForm({ ...editForm, content: e.target.value })
            }
          />
        </div>

      </div>

      {/* ACTION BAR */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-800">

        <button
          onClick={() => setIsEditOpen(false)}
          className="px-5 py-2 text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700"
        >
          Cancel
        </button>

        <button
          onClick={updateCampaign}
          disabled={actionLoading === "update"}
          className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50"
        >
          {actionLoading === "update" ? "Updating..." : "Save Changes"}
        </button>

      </div>

    </div>
  </Modal>
)}

{/* ================= DELETE MODAL ================= */}
{deleteConfirm && (
  <Modal onClose={() => setDeleteConfirm(null)}>
    <div className="space-y-4 text-center">

      <div className="flex justify-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600/20">
          <span className="text-xl">⚠️</span>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Delete Campaign</h2>
        <p className="text-sm text-gray-400">
          This action cannot be undone
        </p>
      </div>

      <div className="flex justify-center gap-3 pt-2">

        <button
          onClick={() => setDeleteConfirm(null)}
          className="px-4 py-2 text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700"
        >
          Cancel
        </button>

        <button
          onClick={deleteCampaign}
          disabled={actionLoading === "delete"}
          className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
        >
          {actionLoading === "delete" ? "Deleting..." : "Delete"}
        </button>

      </div>

    </div>
  </Modal>
)}
    </div>
  );
}

/* COMPONENTS */
const Input = (props) => (
  <input {...props} className="p-3 bg-gray-800 rounded-xl" />
);

const Btn = ({ children, onClick, color, disabled }) => {
  const map = {
    green: "bg-green-600",
    blue: "bg-blue-600",
    red: "bg-red-600",
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1 rounded ${map[color]} ${disabled && "opacity-50"}`}
    >
      {children}
    </button>
  );
};

const Modal = ({ children, title, onClose }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/70">
    <div className="p-5 bg-gray-900 rounded-xl">
      <h2 className="mb-3">{title}</h2>
      {children}
      <button onClick={onClose} className="mt-3">
        Close
      </button>
    </div>
  </div>
);