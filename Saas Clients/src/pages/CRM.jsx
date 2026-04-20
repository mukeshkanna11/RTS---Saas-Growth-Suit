// src/pages/CRM.jsx
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import useCRM from "../hooks/useCRM";
import API from "../api";

import Button from "../components/Button";
import Input from "../components/Input";
import { Card, CardContent } from "../components/Card";

export default function CRM() {
  const { contacts, deals, activities, notes, loading, refresh } = useCRM();

  const [form, setForm] = useState({ name: "", email: "" });
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const stages = ["new", "contacted", "qualified", "proposal", "won", "lost"];

  // ---------------- FILTER ----------------
  const filtered = useMemo(() => {
    return (contacts || []).filter((c) =>
      c?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [contacts, search]);

  // ---------------- SAVE CONTACT ----------------
  const saveContact = async () => {
    if (!form.name) return setError("Name is required");

    try {
      setError("");

      if (editId) {
        await API.put(`/crm/contacts/${editId}`, form);
      } else {
        await API.post("/crm/contacts", form);
      }

      setForm({ name: "", email: "" });
      setEditId(null);
      refresh();
    } catch (err) {
      setError("Failed to save contact");
    }
  };

  // ---------------- DELETE ----------------
  const removeContact = async (id) => {
    try {
      await API.delete(`/crm/contacts/${id}`);
      refresh();
    } catch {
      setError("Delete failed");
    }
  };

  // ---------------- EDIT ----------------
  const edit = (c) => {
    setForm({ name: c?.name || "", email: c?.email || "" });
    setEditId(c?._id);
  };

  // ---------------- DRAG DROP ----------------
  const updateDealStage = async (id, stage) => {
    try {
      await API.patch(`/crm/deals/${id}/stage`, { stage });
      refresh();
    } catch {
      setError("Deal update failed");
    }
  };

  // ---------------- GROUP DEALS ----------------
  const groupedDeals = useMemo(() => {
    const safeDeals = deals || [];

    return stages.reduce((acc, stage) => {
      acc[stage] = safeDeals.filter((d) => d?.stage === stage);
      return acc;
    }, {});
  }, [deals]);

  return (
    <div className="min-h-screen p-6 text-white bg-black">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">🚀 CRM v20 Enterprise</h1>

        <div className="text-gray-400">
          Contacts: {contacts?.length || 0} | Deals: {deals?.length || 0}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-2 mb-4 text-red-400 border border-red-600 rounded">
          {error}
        </div>
      )}

      {/* SEARCH + FORM */}
      <div className="grid gap-3 mb-6 md:grid-cols-3">
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <div className="flex gap-2">
          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <Button onClick={saveContact}>
            {editId ? "Update" : "Add"}
          </Button>
        </div>
      </div>

      {/* CONTACTS */}
      <h2 className="mb-3 text-xl">👤 Contacts</h2>

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">No contacts found</p>
        ) : (
          filtered.map((c) => (
            <motion.div key={c?._id} whileHover={{ scale: 1.05 }}>
              <Card>
                <CardContent>
                  <h3>{c?.name}</h3>
                  <p className="text-gray-400">{c?.email}</p>

                  <div className="flex justify-between mt-3 text-sm">
                    <button onClick={() => edit(c)} className="text-blue-400">
                      Edit
                    </button>

                    <button
                      onClick={() => removeContact(c?._id)}
                      className="text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

     {/* PIPELINE - PREMIUM SAAS v20 */}
{/* PIPELINE - PRO MAX SAAS LEVEL */}
<h2 className="mt-10 mb-4 text-lg font-semibold text-gray-200">
  💰 Deal Pipeline
</h2>

<div className="flex gap-3 pb-4 overflow-x-auto">

  {stages.map((stage) => {
    const dealsInStage = groupedDeals[stage] || [];

    // 💰 total revenue per stage
    const totalValue = dealsInStage.reduce(
      (sum, d) => sum + (Number(d?.value) || 0),
      0
    );

    return (
      <div
        key={stage}
        className="min-w-[240px] max-w-[240px] bg-gray-900 border border-gray-800 rounded-xl flex flex-col shadow-md"
      >

        {/* HEADER */}
        <div className="sticky top-0 z-10 p-2 bg-gray-900 border-b border-gray-800">

          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-wider text-blue-300 uppercase">
              {stage}
            </h3>

            <span className="text-[10px] text-gray-400">
              {dealsInStage.length}
            </span>
          </div>

          {/* KPI */}
          <p className="text-[11px] text-green-400 mt-1">
            ₹ {totalValue.toLocaleString()}
          </p>
        </div>

        {/* BODY */}
        <div className="p-2 space-y-2 overflow-y-auto max-h-[420px]">

          {dealsInStage.map((d) => {
            // 🔥 priority logic (simple SaaS scoring)
            const value = Number(d?.value || 0);
            const priority =
              value > 100000 ? "hot" : value > 50000 ? "warm" : "cold";

            const priorityColor =
              priority === "hot"
                ? "border-red-500 text-red-300"
                : priority === "warm"
                ? "border-yellow-500 text-yellow-300"
                : "border-blue-500 text-blue-300";

            return (
              <div
                key={d?._id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("dealId", d?._id);
                  e.currentTarget.classList.add("opacity-50");
                }}
                onDragEnd={(e) => {
                  e.currentTarget.classList.remove("opacity-50");
                }}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("dealId");
                  updateDealStage(id, stage);
                }}
                onDragOver={(e) => e.preventDefault()}
                className={`p-2 rounded-lg bg-gray-800 border cursor-grab hover:scale-[1.02] transition transform ${priorityColor}`}
              >

                {/* TITLE */}
                <p className="text-sm font-medium text-white truncate">
                  {d?.title}
                </p>

                {/* META */}
                <div className="flex items-center justify-between mt-1">

                  <span className="text-xs text-gray-300">
                    ₹ {value.toLocaleString()}
                  </span>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 border border-gray-700">
                    {priority.toUpperCase()}
                  </span>

                </div>

              </div>
            );
          })}

          {/* EMPTY STATE */}
          {dealsInStage.length === 0 && (
            <div className="py-6 text-xs text-center text-gray-500 border border-gray-700 border-dashed rounded-lg">
              Drop deals here
            </div>
          )}

        </div>
      </div>
    );
  })}

</div>

      {/* ACTIVITY */}
      <h2 className="mt-10 mb-3 text-xl">📌 Activity Timeline</h2>

      <div className="space-y-3">
        {(activities || []).map((a) => (
          <Card key={a?._id}>
            <CardContent>
              <p>{a?.title}</p>
              <p className="text-xs text-gray-400">
                {a?.type} •{" "}
                {a?.createdAt
                  ? new Date(a.createdAt).toLocaleString()
                  : ""}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* NOTES */}
      <h2 className="mt-10 mb-3 text-xl">📝 Notes</h2>

      <div className="grid gap-3 md:grid-cols-3">
        {(notes || []).map((n) => (
          <Card key={n?._id}>
            <CardContent>
              <p>{n?.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}