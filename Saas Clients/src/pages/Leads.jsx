import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API = "http://localhost:5000/api/v1";

export default function Leads() {

  /* ================= AUTH ================= */
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  /* ================= AXIOS INSTANCE ================= */
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API,
    });

    // ✅ Attach token
    instance.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // ✅ Handle 401 globally
    instance.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          console.warn("🔐 Token expired → logout");
          logout();
        }
        return Promise.reject(err);
      }
    );

    return instance;
  }, [token, logout]);

  /* ================= STATES ================= */
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [file, setFile] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "website",
    companyName: "",
    jobTitle: "",
    tags: [],
  });

  /* ================= REFS ================= */
  const controllerRef = useRef(null);
  const debounceRef = useRef(null);
  const isFetchingRef = useRef(false);

  /* ================= FETCH LEADS ================= */
  const fetchLeads = useCallback(async () => {

    // ❗ skip if no token
    if (!token) return;

    // ❗ prevent multiple calls
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      // cancel previous request
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      controllerRef.current = new AbortController();

      setLoading(true);

      const params = {};
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await api.get("/leads", {
        params,
        signal: controllerRef.current.signal,
      });

      setLeads(res.data?.data?.leads || []);

    } catch (err) {

      if (err.code === "ERR_CANCELED" || err.name === "CanceledError") return;

      if (err.response?.status === 429) {
        console.warn("🚫 Too many requests");
        return;
      }

      console.error("Fetch error:", err);

    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }

  }, [api, search, statusFilter, token]);

  /* ================= DEBOUNCE ================= */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchLeads();
    }, 700);

    return () => clearTimeout(debounceRef.current);
  }, [search, statusFilter, fetchLeads]);

  /* ================= CREATE LEAD ================= */
  const handleCreateLead = async () => {
  try {
    // ❗ IMPORTANT
    if (!token) {
      console.warn("No token → cannot create lead");
      return;
    }

    setFormError("");

    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email?.trim() || "",
      phone: form.phone?.trim() || "",
      companyName: form.companyName?.trim() || "",
      jobTitle: form.jobTitle?.trim() || "",
      source: form.source,
      tags: Array.isArray(form.tags) ? form.tags : [],
    };

    const res = await api.post("/leads", payload);

    setLeads((prev) => [res.data.data.lead, ...prev]);

    setShowModal(false);

  } catch (err) {
    console.error(err);

    if (err.response?.status === 401) {
      setFormError("Session expired. Please login again.");
      return;
    }

    setFormError(err?.response?.data?.message || "Create failed");
  }
};

  /* ================= STATUS UPDATE ================= */
  const handleStatusChange = async (id, status) => {
    const prevLeads = [...leads];

    setLeads((p) =>
      p.map((l) => (l._id === id ? { ...l, status } : l))
    );

    try {
      await api.patch(`/leads/${id}/status`, { status });
    } catch (err) {
      setLeads(prevLeads); // rollback
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete lead?")) return;

    const prevLeads = [...leads];
    setLeads((p) => p.filter((l) => l._id !== id));

    try {
      await api.delete(`/leads/${id}`);
    } catch {
      setLeads(prevLeads); // rollback
    }
  };

  /* ================= CSV UPLOAD ================= */
  const handleCSVUpload = async () => {
    if (!file) return alert("Select file");

    const fd = new FormData();
    fd.append("file", file);

    try {
      await api.post("/leads/import", fd);
      fetchLeads(); // one safe refresh
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= HELPERS ================= */
  const getNotesText = (notes) => {
    if (!notes) return "—";
    if (typeof notes === "string") return notes;
    if (Array.isArray(notes)) return notes.length;
    if (typeof notes === "object") return notes.text || "1 note";
    return "—";
  };

  const getScoreTag = (score = 0) => {
    if (score > 70) return "🔥 Hot";
    if (score > 40) return "⚡ Warm";
    return "❄ Cold";
  };

  const badge = (s) =>
    ({
      new: "text-blue-400",
      contacted: "text-purple-400",
      qualified: "text-yellow-400",
      converted: "text-green-400",
      lost: "text-red-400",
    }[s] || "text-gray-400");

 const stats = useMemo(() => ({
  total: leads?.length || 0,

  new: leads?.filter((l) => l && l.status === "new").length,

  qualified: leads?.filter((l) => l && l.status === "qualified").length,

  converted: leads?.filter((l) => l && l.status === "converted").length,

}), [leads]);


  /* ================= UI ================= */
  return (
    <div className="min-h-screen text-white bg-black">

       {/* ================= TOP BAR (PREMIUM SAAS STYLE) ================= */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/60 backdrop-blur">
        <div>
          <h1 className="text-lg font-bold tracking-wide">
            🚀 CRM Studio
          </h1>
          <p className="text-xs text-gray-400">Leads • Pipeline • Growth</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="px-3 py-1 text-sm bg-gray-900 border rounded-lg border-white/10"
          />

          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1 text-sm bg-blue-600 rounded-lg hover:bg-blue-500"
          >
            + Lead
          </button>

          <button
            onClick={logout}
            className="px-3 py-1 text-sm bg-red-600 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

   {/* ================= PREMIUM STATS ================= */}
<div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">

  {/* TOTAL */}
  <div className="relative p-4 overflow-hidden border rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-900/10 border-blue-500/20">
    <div className="absolute inset-0 bg-white/5 blur-2xl"></div>

    <div className="relative flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400">Total Leads</p>
        <h2 className="text-2xl font-bold">{stats.total}</h2>
      </div>
      <span className="text-2xl">📊</span>
    </div>

    <div className="w-full h-1 mt-3 rounded-full bg-white/10">
      <div className="w-2/3 h-full bg-blue-400 rounded-full"></div>
    </div>
  </div>

  {/* NEW */}
  <div className="relative p-4 overflow-hidden border rounded-xl bg-gradient-to-br from-cyan-600/20 to-cyan-900/10 border-cyan-500/20">
    <div className="absolute inset-0 bg-white/5 blur-2xl"></div>

    <div className="relative flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400">New Leads</p>
        <h2 className="text-2xl font-bold">{stats.new}</h2>
      </div>
      <span className="text-2xl">🆕</span>
    </div>

    <div className="w-full h-1 mt-3 rounded-full bg-white/10">
      <div className="w-1/2 h-full rounded-full bg-cyan-400"></div>
    </div>
  </div>

  {/* QUALIFIED */}
  <div className="relative p-4 overflow-hidden border rounded-xl bg-gradient-to-br from-yellow-600/20 to-yellow-900/10 border-yellow-500/20">
    <div className="absolute inset-0 bg-white/5 blur-2xl"></div>

    <div className="relative flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400">Qualified</p>
        <h2 className="text-2xl font-bold">{stats.qualified}</h2>
      </div>
      <span className="text-2xl">⚡</span>
    </div>

    <div className="w-full h-1 mt-3 rounded-full bg-white/10">
      <div className="w-1/3 h-full bg-yellow-400 rounded-full"></div>
    </div>
  </div>

  {/* CONVERTED */}
  <div className="relative p-4 overflow-hidden border rounded-xl bg-gradient-to-br from-green-600/20 to-green-900/10 border-green-500/20">
    <div className="absolute inset-0 bg-white/5 blur-2xl"></div>

    <div className="relative flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400">Converted</p>
        <h2 className="text-2xl font-bold">{stats.converted}</h2>
      </div>
      <span className="text-2xl">🎯</span>
    </div>

    <div className="w-full h-1 mt-3 rounded-full bg-white/10">
      <div className="w-1/4 h-full bg-green-400 rounded-full"></div>
    </div>
  </div>

</div>

     {/* ================= PREMIUM FILTER BAR ================= */}
<div className="flex flex-wrap items-center gap-3 p-4 mx-4 mb-4 border bg-black/40 backdrop-blur border-white/10 rounded-xl">

  {/* SEARCH */}
  <div className="relative flex-1 min-w-[200px]">
    <span className="absolute text-gray-500 -translate-y-1/2 left-3 top-1/2">
      🔎
    </span>

    <input
      className="w-full py-2 pr-3 text-sm text-white bg-gray-900 border rounded-lg pl-9 border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Search leads, email, company..."
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>

  {/* STATUS FILTER */}
  <select
    className="px-3 py-2 text-sm text-white bg-gray-900 border rounded-lg border-white/10 focus:ring-2 focus:ring-blue-500"
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="all">All Status</option>
    <option value="new">🆕 New</option>
    <option value="contacted">📞 Contacted</option>
    <option value="qualified">⚡ Qualified</option>
    <option value="converted">🎯 Converted</option>
  </select>

  {/* FILE UPLOAD */}
  <div className="relative">
    <input
      type="file"
      onChange={(e) => setFile(e.target.files[0])}
      className="text-xs text-gray-400 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-gray-800 file:text-white hover:file:bg-gray-700"
    />
  </div>

  {/* IMPORT BUTTON */}
  <button
    onClick={handleCSVUpload}
    className="px-4 py-2 text-sm font-medium text-white transition bg-green-600 rounded-lg hover:bg-green-500 active:scale-95"
  >
    ⬆ Import Leads
  </button>

</div>

{/* Table */}

      
<div className="p-4 overflow-auto">

  {loading ? (
    <div className="py-10 text-center text-gray-400">
      Loading leads...
    </div>
  ) : (
    <div className="overflow-hidden border border-white/10 rounded-xl bg-black/30 backdrop-blur">

      <table className="w-full text-sm">

        {/* HEADER */}
        <thead className="sticky top-0 text-xs text-gray-400 uppercase bg-black/60 backdrop-blur">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Score</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Tags</th>
            <th className="p-3 text-left">Notes</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody>

          {leads.map((l) => (
            <tr
              key={l._id}
              className="transition border-t border-white/5 hover:bg-white/5"
            >

              {/* NAME */}
              <td className="p-3 font-medium text-white">
                {l.name}
              </td>

              {/* EMAIL */}
              <td className="p-3 text-gray-400">
                {l.email}
              </td>

              {/* SCORE */}
              <td className="p-3">
                <span className="px-2 py-1 text-xs font-semibold text-blue-300 rounded-lg bg-blue-500/10">
                  {getScoreTag(l.score)}
                </span>
              </td>

              {/* STATUS */}
              <td className="p-3">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${badge(l.status)}`}>
                  {l.status}
                </span>
              </td>

              {/* TAGS */}
              <td className="p-3">
                <div className="flex flex-wrap gap-1">
                  {(l.tags || []).map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs text-gray-300 bg-gray-800 border rounded-md border-white/10"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </td>

              {/* NOTES */}
              <td className="p-3 text-xs text-gray-400 max-w-[200px] truncate">
                {getNotesText(l.notes)}
              </td>

              {/* ACTIONS */}
              <td className="p-3">
                <div className="flex items-center gap-2">

                  <select
                    value={l.status}
                    onChange={(e) =>
                      handleStatusChange(l._id, e.target.value)
                    }
                    className="px-2 py-1 text-xs text-white bg-gray-900 border rounded-lg border-white/10"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>

                  <button
                    onClick={() => handleDelete(l._id)}
                    className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-500"
                  >
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
         <div className="w-[560px] p-6 bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 rounded-2xl shadow-2xl">

  {/* HEADER */}
  <div className="flex items-start justify-between mb-5">
    <div>
      <h2 className="text-xl font-bold">✨ Create New Lead</h2>
      <p className="text-xs text-gray-400">Fill details to add into pipeline</p>
    </div>

    <button
      onClick={() => setShowModal(false)}
      className="px-3 py-1 text-sm bg-gray-800 rounded hover:bg-gray-700"
    >
      ← Back
    </button>
  </div>

  {/* ERROR DISPLAY (NO ALERTS) */}
  {formError && (
    <div className="p-2 mb-3 text-sm text-red-300 border rounded-lg bg-red-900/30 border-red-500/30">
      {formError}
    </div>
  )}

  {/* FORM GRID */}
  <div className="grid grid-cols-2 gap-3">

    {/* NAME */}
    <input
      placeholder="Full Name *"
      className="col-span-2 p-3 bg-gray-800 border border-gray-700 rounded-lg"
      value={form.name}
      onChange={(e) => setForm({ ...form, name: e.target.value })}
    />

    {/* EMAIL */}
    <input
      placeholder="Email"
      className="p-3 bg-gray-800 border border-gray-700 rounded-lg"
      value={form.email}
      onChange={(e) => setForm({ ...form, email: e.target.value })}
    />

    {/* PHONE */}
    <input
      placeholder="Phone"
      className="p-3 bg-gray-800 border border-gray-700 rounded-lg"
      value={form.phone}
      onChange={(e) => setForm({ ...form, phone: e.target.value })}
    />

    {/* COMPANY */}
    <input
      placeholder="Company Name"
      className="p-3 bg-gray-800 border border-gray-700 rounded-lg"
      value={form.companyName}
      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
    />

    {/* JOB TITLE DROPDOWN */}
    <select
      className="p-3 bg-gray-800 border border-gray-700 rounded-lg"
      value={form.jobTitle}
      onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
    >
      <option value="">🎯 Select Job Title</option>
      <option value="Founder">Founder</option>
      <option value="CEO">CEO</option>
      <option value="Manager">Manager</option>
      <option value="Marketing">Marketing</option>
      <option value="Developer">Developer</option>
      <option value="Sales">Sales</option>
      <option value="HR">HR</option>
    </select>

    {/* SOURCE */}
    <select
      className="p-3 bg-gray-800 border border-gray-700 rounded-lg"
      value={form.source}
      onChange={(e) => setForm({ ...form, source: e.target.value })}
    >
      <option value="website">🌐 Website</option>
      <option value="facebook">📘 Facebook</option>
      <option value="linkedin">💼 LinkedIn</option>
      <option value="google">🔎 Google</option>
      <option value="referral">🤝 Referral</option>
    </select>

    {/* TAGS MULTI SELECT STYLE */}
    <div className="col-span-2">
      <label className="text-xs text-gray-400">Tags</label>

      <div className="grid grid-cols-4 gap-2 mt-2">
        {["hot", "warm", "cold", "priority", "vip", "new"].map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => {
              const exists = form.tags.includes(tag);

              setForm({
                ...form,
                tags: exists
                  ? form.tags.filter((t) => t !== tag)
                  : [...form.tags, tag],
              });
            }}
            className={`p-2 text-xs rounded-lg border ${
              form.tags.includes(tag)
                ? "bg-blue-600 border-blue-500"
                : "bg-gray-800 border-gray-700"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  </div>

  {/* ACTIONS */}
  <div className="flex justify-end gap-3 mt-6">

    <button
      onClick={() => setShowModal(false)}
      className="px-4 py-2 text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700"
    >
      Cancel
    </button>

    <button
      onClick={handleCreateLead}
      className="px-5 py-2 font-semibold text-white rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90"
    >
      🚀 Create Lead
    </button>
  </div>
</div>
        </div>
      )}
    </div>
  );
}