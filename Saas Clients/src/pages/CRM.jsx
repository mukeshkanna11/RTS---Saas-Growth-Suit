// src/pages/CRM.jsx

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  DollarSign,
  User2,
  Briefcase,
} from "lucide-react";

import API from "../api";
import { useAuthStore } from "../store/authStore";

import Button from "../components/Button";
import Input from "../components/Input";
import { Card, CardContent } from "../components/Card";

export default function CRM() {
  const user = useAuthStore((s) => s.user);

  // =====================================================
  // STATES
  // =====================================================

  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notes, setNotes] = useState([]);

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
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
  // FETCH CRM DATA
  // =====================================================

  const fetchCRM = async () => {
    try {
      setLoading(true);

      let contactsRes;
      let dealsRes;

      // =========================================
      // ADMIN
      // =========================================

      if (user?.role === "admin") {
        [contactsRes, dealsRes] = await Promise.all([
          API.get("/crm/contacts"),
          API.get("/crm/deals"),
        ]);
      }

      // =========================================
      // MANAGER
      // =========================================

      else if (user?.role === "manager") {
        [contactsRes, dealsRes] = await Promise.all([
          API.get("/crm/contacts/team"),
          API.get("/crm/deals/team"),
        ]);
      }

      // =========================================
      // EMPLOYEE
      // =========================================

      else {
        [contactsRes, dealsRes] = await Promise.all([
          API.get("/crm/contacts/my"),
          API.get("/crm/deals/my"),
        ]);
      }

      setContacts(contactsRes?.data?.data || []);
      setDeals(dealsRes?.data?.data || []);

      setActivities([]);
      setNotes([]);
    } catch (err) {
      console.log(err);

      setError("Failed to load CRM data");
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
        return setError("Name required");
      }

      if (editId) {
        await API.put(`/crm/contacts/${editId}`, form);
      } else {
        await API.post("/crm/contacts", form);
      }

      setForm({
        name: "",
        email: "",
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
  // EDIT CONTACT
  // =====================================================

  const edit = (c) => {
    setForm({
      name: c?.name || "",
      email: c?.email || "",
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
      setError("Deal stage update failed");
    }
  };

  // =====================================================
  // GROUP DEALS
  // =====================================================

  const groupedDeals = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage] = (deals || []).filter((d) => d?.stage === stage);

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
  // UI
  // =====================================================

  return (
    <div className="min-h-screen text-white">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            CRM Workspace
          </h1>

          <p className="mt-1 text-sm text-gray-400 capitalize">
            {user?.role} CRM Management
          </p>
        </div>

        <div className="flex gap-3">

          <div className="px-4 py-3 border bg-white/5 border-white/10 rounded-2xl">
            <p className="text-xs text-gray-400">
              Contacts
            </p>

            <h3 className="text-xl font-bold">
              {contacts.length}
            </h3>
          </div>

          <div className="px-4 py-3 border bg-white/5 border-white/10 rounded-2xl">
            <p className="text-xs text-gray-400">
              Deals
            </p>

            <h3 className="text-xl font-bold">
              {deals.length}
            </h3>
          </div>

          <div className="px-4 py-3 border bg-white/5 border-white/10 rounded-2xl">
            <p className="text-xs text-gray-400">
              Revenue
            </p>

            <h3 className="text-xl font-bold text-green-400">
              ₹ {totalRevenue.toLocaleString()}
            </h3>
          </div>

        </div>
      </div>

      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (
        <div className="p-3 mb-5 text-sm text-red-300 border border-red-500 rounded-xl bg-red-500/10">
          {error}
        </div>
      )}

      {/* ================================================= */}
      {/* SEARCH + FORM */}
      {/* ================================================= */}

      <div className="grid gap-3 p-4 mb-8 border md:grid-cols-4 bg-white/5 border-white/10 rounded-2xl">

        <div className="relative">
          <Search
            size={16}
            className="absolute text-gray-500 left-3 top-3"
          />

          <Input
            placeholder="Search contact..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Input
          placeholder="Contact Name"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
        />

        <Input
          placeholder="Email Address"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value,
            })
          }
        />

        <Button onClick={saveContact}>
          <Plus size={16} />
          {editId ? "Update" : "Create"}
        </Button>

      </div>

      {/* ================================================= */}
      {/* CONTACTS */}
      {/* ================================================= */}

      <div className="mb-10">

        <div className="flex items-center gap-2 mb-4">
          <User2 size={18} />
          <h2 className="text-xl font-semibold">
            Contacts
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">

          {loading ? (
            <p className="text-gray-400">
              Loading...
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-500">
              No contacts found
            </p>
          ) : (
            filtered.map((c) => (
              <motion.div
                key={c?._id}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="border border-white/10 bg-white/5 rounded-2xl">

                  <CardContent className="p-5">

                    <div className="flex items-center justify-between">

                      <div>
                        <h3 className="font-semibold">
                          {c?.name}
                        </h3>

                        <p className="mt-1 text-sm text-gray-400">
                          {c?.email}
                        </p>
                      </div>

                      <div className="flex gap-2">

                        <button
                          onClick={() => edit(c)}
                          className="p-2 rounded-lg hover:bg-blue-500/20"
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
                          className="p-2 rounded-lg hover:bg-red-500/20"
                        >
                          <Trash2
                            size={16}
                            className="text-red-400"
                          />
                        </button>

                      </div>
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* ================================================= */}
      {/* DEAL PIPELINE */}
      {/* ================================================= */}

      <div>

        <div className="flex items-center gap-2 mb-5">
          <Briefcase size={18} />
          <h2 className="text-xl font-semibold">
            Deal Pipeline
          </h2>
        </div>

        <div className="flex gap-4 pb-3 overflow-x-auto">

          {stages.map((stage) => {
            const dealsInStage =
              groupedDeals[stage] || [];

            const totalValue = dealsInStage.reduce(
              (sum, d) =>
                sum + Number(d?.value || 0),
              0
            );

            return (
              <div
                key={stage}
                className="min-w-[300px] bg-[#0F172A] border border-white/10 rounded-2xl"
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

                <div className="p-4 border-b border-white/10">

                  <div className="flex items-center justify-between">

                    <h3 className="text-sm font-bold tracking-wide uppercase">
                      {stage}
                    </h3>

                    <span className="px-2 py-1 text-xs rounded-full bg-white/10">
                      {dealsInStage.length}
                    </span>

                  </div>

                  <div className="flex items-center gap-1 mt-2 text-green-400">

                    <DollarSign size={14} />

                    <span className="text-sm">
                      ₹ {totalValue.toLocaleString()}
                    </span>

                  </div>
                </div>

                {/* DEALS */}

                <div className="p-3 space-y-3 min-h-[500px]">

                  {dealsInStage.map((d) => (
                    <motion.div
                      key={d?._id}
                      draggable
                      whileHover={{ scale: 1.02 }}
                      className="p-4 border cursor-grab border-white/10 rounded-xl bg-white/5"
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          "dealId",
                          d?._id
                        );
                      }}
                    >

                      <h4 className="font-medium">
                        {d?.title}
                      </h4>

                      <div className="flex items-center justify-between mt-3">

                        <p className="text-sm text-gray-300">
                          ₹{" "}
                          {Number(
                            d?.value || 0
                          ).toLocaleString()}
                        </p>

                        <span className="px-2 py-1 text-xs border rounded-full border-white/10 bg-black/30">
                          {d?.probability || 0}%
                        </span>

                      </div>

                    </motion.div>
                  ))}

                  {dealsInStage.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-sm text-gray-500 border border-dashed rounded-xl border-white/10">
                      No Deals
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}