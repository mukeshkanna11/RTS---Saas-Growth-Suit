import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";

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

  // ================= FETCH =================
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

  // ================= CREATE / UPDATE =================
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
      trigger: { type: "lead_created" },
      actions: [],
    });
  };

  // ================= DELETE =================
  const deleteAutomation = async (id) => {
    if (!confirm("Delete this automation?")) return;

    await API.delete(`/automation/${id}`);
    fetchAutomations();
  };

  // ================= TOGGLE =================
  const toggleAutomation = async (id) => {
    setActionLoading(id);
    await API.patch(`/automation/${id}/toggle`);
    fetchAutomations();
    setActionLoading(null);
  };

  // ================= TEST =================
  const testAutomation = async () => {
    try {
      await API.post("/automation/test", testData);
      alert("Automation tested successfully 🚀");
      setTestModal(false);
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  // ================= ACTION BUILDER =================
  const addAction = () => {
    setForm({
      ...form,
      actions: [
        ...form.actions,
        {
          type: "email",
          config: { subject: "", message: "", delay: 0 },
        },
      ],
    });
  };

  const updateAction = (index, field, value) => {
    const updated = [...form.actions];
    updated[index].config[field] = value;
    setForm({ ...form, actions: updated });
  };

  // ================= FILTER =================
  const filtered = useMemo(() => {
    return automations.filter((a) => {
      return (
        a.name.toLowerCase().includes(search.toLowerCase()) &&
        (filter === "all" || a.trigger.type === filter)
      );
    });
  }, [automations, search, filter]);

  return (
    <div className="min-h-screen p-6 text-white bg-gradient-to-br from-gray-950 via-gray-900 to-black">

      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">⚡ Automation Engine</h1>
          <p className="text-gray-400">AI Workflow Builder • SaaS Core</p>
        </div>

        <div className="flex gap-2">
          <input
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            onClick={() => setTestModal(true)}
            className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
          >
            Test
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            + Create
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400">No automations found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th>Name</th>
                <th>Trigger</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((a) => (
                <tr key={a._id} className="border-b border-gray-800">

                  <td className="py-3">{a.name}</td>

                  <td>{a.trigger?.type}</td>

                  <td>
                    <button
                      onClick={() => toggleAutomation(a._id)}
                      className={`px-2 py-1 text-xs rounded ${
                        a.isActive
                          ? "bg-green-600"
                          : "bg-gray-600"
                      }`}
                    >
                      {a.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>

                  <td className="flex gap-2 py-2">
                    <button
                      onClick={() => {
                        setForm(a);
                        setEditMode(true);
                        setIsModalOpen(true);
                      }}
                      className="px-2 py-1 bg-blue-600 rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteAutomation(a._id)}
                      className="px-2 py-1 bg-red-600 rounded"
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= CREATE / EDIT MODAL ================= */}
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>

          <h2 className="mb-4 text-lg font-semibold">
            {editMode ? "Edit Automation" : "Create Automation"}
          </h2>

          <input
            className="mb-2 input"
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <select
            className="mb-3 input"
            value={form.trigger.type}
            onChange={(e) =>
              setForm({
                ...form,
                trigger: { type: e.target.value },
              })
            }
          >
            <option value="lead_created">Lead Created</option>
            <option value="lead_updated">Lead Updated</option>
          </select>

          {/* ACTION BUILDER */}
          <div className="mb-3">
            <button
              onClick={addAction}
              className="px-3 py-1 text-sm bg-purple-600 rounded"
            >
              + Add Action
            </button>
          </div>

          {form.actions.map((a, i) => (
            <div key={i} className="p-3 mb-2 bg-gray-800 rounded">

              <select
                className="mb-2 input"
                value={a.type}
                onChange={(e) => {
                  const updated = [...form.actions];
                  updated[i].type = e.target.value;
                  setForm({ ...form, actions: updated });
                }}
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>

              <input
                className="mb-2 input"
                placeholder="Subject"
                onChange={(e) =>
                  updateAction(i, "subject", e.target.value)
                }
              />

              <textarea
                className="input"
                placeholder="Message"
                onChange={(e) =>
                  updateAction(i, "message", e.target.value)
                }
              />

            </div>
          ))}

          <button onClick={saveAutomation} className="w-full btn-blue">
            Save Automation
          </button>

        </Modal>
      )}

      {/* ================= TEST MODAL ================= */}
      {testModal && (
        <Modal onClose={() => setTestModal(false)}>

          <h2 className="mb-4 text-lg">Test Automation</h2>

          <input
            className="mb-2 input"
            placeholder="Name"
            onChange={(e) =>
              setTestData({
                ...testData,
                payload: { ...testData.payload, name: e.target.value },
              })
            }
          />

          <input
            className="mb-2 input"
            placeholder="Email"
            onChange={(e) =>
              setTestData({
                ...testData,
                payload: { ...testData.payload, email: e.target.value },
              })
            }
          />

          <input
            className="mb-2 input"
            placeholder="Phone"
            onChange={(e) =>
              setTestData({
                ...testData,
                payload: { ...testData.payload, phone: e.target.value },
              })
            }
          />

          <button onClick={testAutomation} className="w-full btn-purple">
            Run Test
          </button>

        </Modal>
      )}
    </div>
  );
}

/* ================= UI ================= */

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70">
      <div className="w-[420px] p-6 bg-gray-900 rounded-xl relative">
        <button onClick={onClose} className="absolute top-2 right-3">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}