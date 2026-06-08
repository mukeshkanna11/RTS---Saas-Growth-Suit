import { useEffect, useState, useMemo } from "react";
import API from "../api/axios";
import {
  Plus,
  Zap,
  Activity,
  Trash2,
  Pencil,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";

export default function Automation() {

  const BASE = "/api/v1/automations";

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "lead",
    trigger: { type: "lead_created" },
    actions: [],
  });

  const [testPayload, setTestPayload] = useState({
    trigger: "lead_created",
    payload: {},
  });

  // =====================================================
  // FETCH ALL AUTOMATIONS
  // =====================================================
  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await API.get(BASE);
      setList(res.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // =====================================================
  // CREATE / UPDATE
  // =====================================================
  const save = async () => {
    if (!form.name) return alert("Name required");

    if (editMode) {
      await API.put(`${BASE}/${selected._id}`, form);
    } else {
      await API.post(BASE, form);
    }

    reset();
    fetchAll();
  };

  const reset = () => {
    setForm({
      name: "",
      description: "",
      category: "lead",
      trigger: { type: "lead_created" },
      actions: [],
    });
    setEditMode(false);
    setSelected(null);
  };

  // =====================================================
  // DELETE
  // =====================================================
  const remove = async (id) => {
    if (!confirm("Delete automation?")) return;
    await API.delete(`${BASE}/${id}`);
    fetchAll();
  };

  // =====================================================
  // TOGGLE
  // =====================================================
  const toggle = async (id) => {
    await API.patch(`${BASE}/${id}/toggle`);
    fetchAll();
  };

  // =====================================================
  // TEST EXECUTION
  // =====================================================
  const runTest = async () => {
    const res = await API.post(`${BASE}/test`, testPayload);
    alert(`Triggered: ${res.data?.data?.automationsTriggered}`);
  };

  // =====================================================
  // VIEW SINGLE (optional drill down)
  // =====================================================
  const viewOne = async (id) => {
    const res = await API.get(`${BASE}/${id}`);
    setSelected(res.data?.data);
  };

  // =====================================================
  // FILTER STATS
  // =====================================================
  const stats = useMemo(() => {
    return {
      total: list.length,
      active: list.filter(a => a.isActive).length,
      inactive: list.filter(a => !a.isActive).length,
    };
  }, [list]);

  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="min-h-screen bg-[#050816] text-white p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Automation Engine</h1>

        <button
          onClick={() => setEditMode(false)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl"
        >
          <Plus size={16} /> Create
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat title="Total" value={stats.total} />
        <Stat title="Active" value={stats.active} />
        <Stat title="Inactive" value={stats.inactive} />
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {list.map(item => (
          <div
            key={item._id}
            className="flex justify-between p-4 bg-white/10 rounded-xl"
          >

            <div>
              <h2 className="font-bold">{item.name}</h2>
              <p className="text-sm text-gray-400">{item.trigger?.type}</p>

              {/* EXECUTION STATS */}
              <div className="mt-1 text-xs text-green-400">
                Runs: {item.executionCount || 0} |
                Success: {item.successCount || 0}
              </div>
            </div>

            <div className="flex items-center gap-2">

              <button onClick={() => toggle(item._id)}>
                {item.isActive ? "Pause" : "Run"}
              </button>

              <button onClick={() => viewOne(item._id)}>
                View
              </button>

              <button onClick={() => {
                setForm(item);
                setSelected(item);
                setEditMode(true);
              }}>
                <Pencil size={14} />
              </button>

              <button onClick={() => remove(item._id)}>
                <Trash2 size={14} />
              </button>

            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT PANEL */}
      <div className="p-4 mt-6 space-y-3 bg-white/10 rounded-xl">

        <input
          placeholder="Name"
          className="w-full p-2 text-black"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Description"
          className="w-full p-2 text-black"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />

        <select
          className="w-full p-2 text-black"
          value={form.trigger.type}
          onChange={e =>
            setForm({
              ...form,
              trigger: { type: e.target.value },
            })
          }
        >
          <option value="lead_created">Lead Created</option>
          <option value="budget_threshold">Budget Alert</option>
        </select>

        <button onClick={save} className="px-4 py-2 bg-green-600 rounded">
          Save Automation
        </button>

      </div>

      {/* TEST PANEL */}
      <div className="p-4 mt-6 bg-white/10 rounded-xl">

        <h2 className="mb-2 font-bold">Test Automation</h2>

        <button
          onClick={runTest}
          className="px-4 py-2 bg-purple-600 rounded"
        >
          Run Test
        </button>

      </div>

    </div>
  );
}

// =====================================================
// SMALL CARD
// =====================================================
function Stat({ title, value }) {
  return (
    <div className="p-4 bg-white/10 rounded-xl">
      <p className="text-gray-400">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}