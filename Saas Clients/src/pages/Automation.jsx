import { useEffect, useState, useMemo } from "react";
import API from "../api/axios";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Automation() {

  // ✅ FIXED BASE (NO /api/v1 HERE)
  const BASE = "/automation";

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
// STATS
// =====================================================
const stats = useMemo(() => {
  const totalRuns = list.reduce(
    (sum, item) => sum + (item.executionCount || 0),
    0
  );

  const totalSuccess = list.reduce(
    (sum, item) => sum + (item.successCount || 0),
    0
  );

  const successRate =
    totalRuns > 0
      ? ((totalSuccess / totalRuns) * 100).toFixed(1)
      : "0";

  return {
    total: list.length,
    active: list.filter((a) => a?.isActive).length,
    inactive: list.filter((a) => !a?.isActive).length,
    totalRuns,
    totalSuccess,
    successRate,
  };
}, [list]);

// =====================================================
// FETCH ALL
// =====================================================
const fetchAll = async () => {
  try {
    setLoading(true);

    const res = await API.get(BASE);

    setList(
      Array.isArray(res?.data?.data)
        ? res.data.data
        : []
    );
  } catch (err) {
    console.error(
      "Fetch Error:",
      err?.response?.data || err.message
    );
    setList([]);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchAll();
}, []);

// =====================================================
// SAVE
// =====================================================
const save = async () => {
  if (!form?.name?.trim()) {
    return alert("Automation name required");
  }

  try {
    if (editMode && selected?._id) {
      await API.put(
        `${BASE}/${selected._id}`,
        form
      );
    } else {
      await API.post(BASE, form);
    }

    reset();
    fetchAll();
  } catch (err) {
    alert(
      err?.response?.data?.message ||
        "Save failed"
    );
  }
};

// =====================================================
// RESET
// =====================================================
const reset = () => {
  setForm({
    name: "",
    description: "",
    category: "lead",
    trigger: {
      type: "lead_created",
    },
    actions: [],
  });

  setEditMode(false);
  setSelected(null);
};

// =====================================================
// EDIT
// =====================================================
const handleEdit = (item) => {
  setForm({
    name: item?.name || "",
    description:
      item?.description || "",
    category:
      item?.category || "lead",
    trigger: {
      type:
        item?.trigger?.type ||
        "lead_created",
    },
    actions: Array.isArray(
      item?.actions
    )
      ? item.actions
      : [],
  });

  setSelected(item);
  setEditMode(true);
};

// =====================================================
// DELETE
// =====================================================
const remove = async (id) => {
  if (
    !window.confirm(
      "Delete this automation?"
    )
  )
    return;

  try {
    await API.delete(`${BASE}/${id}`);
    fetchAll();
  } catch (err) {
    console.error(err);
    alert(
      err?.response?.data?.message ||
        "Delete failed"
    );
  }
};

// =====================================================
// TOGGLE
// =====================================================
const toggle = async (id) => {
  try {
    await API.patch(
      `${BASE}/${id}/toggle`
    );

    fetchAll();
  } catch (err) {
    console.error(err);
    alert(
      err?.response?.data?.message ||
        "Toggle failed"
    );
  }
};

// =====================================================
// TEST
// =====================================================
const runTest = async () => {
  try {
    const res = await API.post(
      `${BASE}/test`,
      testPayload
    );

    alert(
      `Triggered ${
        res?.data?.data
          ?.automationsTriggered || 0
      } automations`
    );
  } catch (err) {
    alert(
      err?.response?.data?.message ||
        "Test failed"
    );
  }
};

// =====================================================
// VIEW ONE
// =====================================================
const viewOne = async (id) => {
  try {
    const res = await API.get(
      `${BASE}/${id}`
    );

    setSelected(
      res?.data?.data || null
    );
  } catch (err) {
    console.error(err);
  }
};
  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="min-h-screen bg-[#050816] text-white p-6">

      {/* HEADER */}
      <div className="flex flex-col gap-6 mb-10 md:flex-row md:items-center md:justify-between">
  <div>
    <span className="inline-flex items-center px-3 py-1 mb-3 text-xs font-medium text-blue-400 rounded-full bg-blue-500/20">
      READYTECH SOLUTIONS
    </span>

    <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
      Automation Center
    </h1>

    <p className="max-w-2xl mt-3 text-gray-400">
      Build, monitor and optimize intelligent workflows,
      CRM automations, campaign triggers and AI-powered processes.
    </p>
  </div>

  <button
    onClick={reset}
    className="px-6 py-3 font-semibold transition rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105"
  >
    <Plus size={18} className="inline mr-2" />
    Create Workflow
  </button>
</div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-5 mb-10 md:grid-cols-2 xl:grid-cols-5">
  <Card
    title="Automations"
    value={stats.total}
    subtitle="Total workflows"
  />

  <Card
    title="Active"
    value={stats.active}
    subtitle="Currently running"
  />

  <Card
    title="Inactive"
    value={stats.inactive}
    subtitle="Paused workflows"
  />

  <Card
    title="Executions"
    value={stats.totalRuns}
    subtitle="Total processed"
  />

  <Card
    title="Success Rate"
    value={`${stats.successRate}%`}
    subtitle="Workflow reliability"
  />
</div>

<div className="relative p-8 mb-10 overflow-hidden border rounded-3xl border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-xl">

  <h2 className="mb-3 text-2xl font-bold">
    ReadyTech Solutions Automation Engine
  </h2>

  <p className="text-gray-300">
    Centralized workflow automation platform
    powering lead management, marketing
    campaigns, CRM synchronization,
    notifications, budgeting workflows,
    AI triggers and customer lifecycle actions.
  </p>

  <div className="grid gap-4 mt-5 md:grid-cols-4">

    <MiniMetric label="Lead Automations" value="24" />
    <MiniMetric label="CRM Sync Jobs" value="12" />
    <MiniMetric label="Campaign Flows" value="18" />
    <MiniMetric label="AI Triggers" value="9" />

  </div>

</div>

<div className="flex flex-wrap gap-3 mb-8">
  {[
    "Lead Automations",
    "Campaign Workflows",
    "CRM Sync",
    "AI Triggers"
  ].map((btn) => (
    <button
      key={btn}
      className="px-4 py-2 transition border rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
    >
      {btn}
    </button>
  ))}
</div>

     {/* LIST */}
<div className="space-y-3">
  {loading ? (
    <p className="text-gray-400">Loading...</p>
  ) : (
    list.map((item) => (
      <div
        key={item._id}
        className="flex items-center justify-between p-4 bg-white/10 rounded-xl"
      >
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">
              {item.name}
            </h2>

            <span
  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
    item.isActive
      ? "border-green-500/30 bg-green-500/10 text-green-400"
      : "border-red-500/30 bg-red-500/10 text-red-400"
  }`}
>
              {item.isActive ? "Active" : "Paused"}
            </span>
          </div>

          <p className="mt-2 text-gray-400">
            Trigger: {item.trigger?.type}
          </p>

          <div className="flex gap-5 mt-3 text-sm text-gray-400">
            <span>
              Runs: {item.executionCount || 0}
            </span>

            <span>
              Success: {item.successCount || 0}
            </span>

            <span>
              Actions: {item.actions?.length || 0}
            </span>
          </div>
        </div>

       <div className="flex items-center gap-2">

  <button
    onClick={() => {
      setForm({
        name: item?.name || "",
        description: item?.description || "",
        category: item?.category || "lead",
        trigger: {
          type:
            item?.trigger?.type ||
            "lead_created",
        },
        actions: item?.actions || [],
      });

      setSelected(item);
      setEditMode(true);
    }}
    title="Edit Automation"
    className="flex items-center justify-center w-10 h-10 transition-all duration-300 border group rounded-xl border-yellow-500/20 bg-yellow-500/10 hover:bg-yellow-500/20 hover:border-yellow-500/40 hover:scale-105"
  >
    <Pencil
      size={16}
      className="text-yellow-400 transition group-hover:rotate-6"
    />
  </button>

  <button
    onClick={() => remove(item._id)}
    title="Delete Automation"
    className="flex items-center justify-center w-10 h-10 transition-all duration-300 border group rounded-xl border-red-500/20 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/40 hover:scale-105"
  >
    <Trash2
      size={16}
      className="text-red-400 transition group-hover:shake"
    />
  </button>

</div>
      </div>
    ))
  )}
</div>
      {/* AUTOMATION BUILDER */}
<div className="mt-10 overflow-hidden border shadow-2xl rounded-3xl border-white/10 bg-white/5 backdrop-blur-xl">

  {/* Header */}
  <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10">

    <h2 className="text-2xl font-bold">
      {editMode
        ? "Edit Automation Workflow"
        : "Create Automation Workflow"}
    </h2>

    <p className="mt-1 text-sm text-gray-400">
      Configure triggers, actions and workflow behavior
      for your automation engine.
    </p>

  </div>

  {/* Body */}
  <div className="grid gap-6 p-6 lg:grid-cols-2">

    {/* Name */}
    <div>
      <label className="block mb-2 text-sm font-medium text-gray-300">
        Automation Name
      </label>

      <input
        className="
          w-full
          rounded-2xl
          border
          border-white/10
          bg-[#0f172a]
          px-4
          py-3
          text-white
          placeholder:text-gray-500
          outline-none
          focus:border-blue-500
          focus:ring-2
          focus:ring-blue-500/20
        "
        placeholder="Lead Capture Workflow"
        value={form.name}
        onChange={(e) =>
          setForm({
            ...form,
            name: e.target.value,
          })
        }
      />
    </div>

    {/* Category */}
    <div>
      <label className="block mb-2 text-sm font-medium text-gray-300">
        Category
      </label>

      <select
        className="
          w-full
          rounded-2xl
          border
          border-white/10
          bg-[#0f172a]
          px-4
          py-3
          text-white
          outline-none
          focus:border-blue-500
        "
        value={form.category}
        onChange={(e) =>
          setForm({
            ...form,
            category: e.target.value,
          })
        }
      >
        <option value="lead">Lead Management</option>
        <option value="crm">CRM Sync</option>
        <option value="campaign">Campaign</option>
        <option value="notification">Notification</option>
        <option value="ai">AI Workflow</option>
      </select>
    </div>

    {/* Description */}
    <div className="lg:col-span-2">
      <label className="block mb-2 text-sm font-medium text-gray-300">
        Description
      </label>

      <textarea
        rows={4}
        className="
          w-full
          rounded-2xl
          border
          border-white/10
          bg-[#0f172a]
          px-4
          py-3
          text-white
          placeholder:text-gray-500
          outline-none
          resize-none
          focus:border-blue-500
        "
        placeholder="Describe what this automation should do..."
        value={form.description}
        onChange={(e) =>
          setForm({
            ...form,
            description: e.target.value,
          })
        }
      />
    </div>

    {/* Trigger */}
    <div>
      <label className="block mb-2 text-sm font-medium text-gray-300">
        Trigger Event
      </label>

      <select
        className="
          w-full
          rounded-2xl
          border
          border-white/10
          bg-[#0f172a]
          px-4
          py-3
          text-white
          outline-none
          focus:border-blue-500
        "
        value={form.trigger?.type || "lead_created"}
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

        <option value="budget_threshold">
          Budget Threshold
        </option>

        <option value="campaign_completed">
          Campaign Completed
        </option>

        <option value="client_registered">
          Client Registered
        </option>

        <option value="ai_trigger">
          AI Trigger
        </option>
      </select>
    </div>

    {/* Preview */}
    <div>
      <label className="block mb-2 text-sm font-medium text-gray-300">
        Workflow Preview
      </label>

      <div className="flex items-center h-[52px] rounded-2xl border border-white/10 bg-[#0f172a] px-4 text-gray-400">
        {form.trigger?.type || "No Trigger Selected"}
      </div>
    </div>

  </div>

  {/* Footer */}
  <div className="flex flex-col gap-3 px-6 py-5 border-t md:flex-row border-white/10">

    <button
      onClick={save}
      className="
        flex-1
        py-3
        rounded-2xl
        font-semibold
        bg-gradient-to-r
        from-green-500
        to-emerald-600
        hover:scale-[1.01]
        transition-all
      "
    >
      {editMode
        ? "Update Workflow"
        : "Create Workflow"}
    </button>

    <button
      onClick={reset}
      className="flex-1 py-3 transition-all border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
    >
      Reset
    </button>

  </div>

</div>

      {/* AUTOMATION TEST CENTER */}
<div className="mt-10 overflow-hidden border shadow-2xl rounded-3xl border-white/10 bg-white/5 backdrop-blur-xl">

  {/* Header */}
  <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-purple-600/10 to-pink-600/10">

    <h2 className="text-2xl font-bold">
      Automation Test Center
    </h2>

    <p className="mt-1 text-sm text-gray-400">
      Simulate workflow triggers and validate automation behavior before deployment.
    </p>

  </div>

  {/* Body */}
  <div className="grid gap-6 p-6 lg:grid-cols-2">

    {/* Trigger Selection */}
    <div>

      <label className="block mb-2 text-sm font-medium text-gray-300">
        Test Trigger
      </label>

      <select
        value={testPayload.trigger}
        onChange={(e) =>
          setTestPayload({
            ...testPayload,
            trigger: e.target.value,
          })
        }
        className="
          w-full
          rounded-2xl
          border
          border-white/10
          bg-[#0f172a]
          px-4
          py-3
          text-white
          outline-none
          focus:border-purple-500
        "
      >
        <option value="lead_created">
          Lead Created
        </option>

        <option value="budget_threshold">
          Budget Threshold
        </option>

        <option value="campaign_completed">
          Campaign Completed
        </option>

        <option value="client_registered">
          Client Registered
        </option>

        <option value="ai_trigger">
          AI Trigger
        </option>
      </select>

    </div>

    {/* Preview */}
    <div>

      <label className="block mb-2 text-sm font-medium text-gray-300">
        Simulation Preview
      </label>

      <div className="flex items-center h-[52px] rounded-2xl border border-white/10 bg-[#0f172a] px-4 text-gray-400">
        Trigger:
        <span className="ml-2 font-medium text-purple-400">
          {testPayload.trigger}
        </span>
      </div>

    </div>

  </div>

  {/* Stats */}
  <div className="grid grid-cols-1 gap-4 px-6 pb-6 md:grid-cols-3">

    <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
      <p className="text-xs text-gray-400">
        Available Workflows
      </p>
      <h3 className="mt-2 text-2xl font-bold">
        {stats.total}
      </h3>
    </div>

    <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
      <p className="text-xs text-gray-400">
        Active Workflows
      </p>
      <h3 className="mt-2 text-2xl font-bold text-green-400">
        {stats.active}
      </h3>
    </div>

    <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
      <p className="text-xs text-gray-400">
        Success Rate
      </p>
      <h3 className="mt-2 text-2xl font-bold text-blue-400">
        {stats.successRate}%
      </h3>
    </div>

  </div>

  {/* Footer */}
  <div className="flex flex-col gap-3 px-6 py-5 border-t md:flex-row border-white/10">

    <button
      onClick={runTest}
      className="
        flex-1
        py-3
        rounded-2xl
        font-semibold
        bg-gradient-to-r
        from-purple-500
        to-pink-600
        hover:scale-[1.02]
        transition-all
      "
    >
      Run Automation Test
    </button>

    <button
      onClick={() =>
        setTestPayload({
          trigger: "lead_created",
          payload: {},
        })
      }
      className="flex-1 py-3 transition-all border  rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
    >
      Reset Test
    </button>

  </div>

</div>

    </div>
  );
}

function Card({ title, value, subtitle = "" }) {
  return (
    <div className="
group
relative
overflow-hidden
rounded-3xl
border
border-white/10
bg-[#0b1220]
p-5
hover:border-blue-500/40
hover:bg-[#101a2e]
transition-all
duration-300
">
      <p className="text-sm text-gray-400">
        {title}
      </p>

      <h2 className="mt-2 text-3xl font-bold">
        {value}
      </h2>

      {subtitle && (
        <p className="mt-2 text-xs text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="p-4 border bg-white/5 border-white/10 rounded-xl">
      <p className="text-sm text-gray-400">
        {label}
      </p>

      <h3 className="mt-1 text-xl font-bold">
        {value}
      </h3>
    </div>
  );
}


function StatCard({ title, value, subtitle }) {
  return (
    <div className="p-5 border bg-white/10 border-white/10 rounded-2xl">
      <p className="text-sm text-gray-400">
        {title}
      </p>

      <h2 className="mt-2 text-3xl font-bold">
        {value}
      </h2>

      <p className="mt-2 text-xs text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}