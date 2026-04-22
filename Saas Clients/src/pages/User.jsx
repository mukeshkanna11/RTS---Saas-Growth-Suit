// src/pages/Users.jsx
import { useEffect, useMemo, useState } from "react";
import API from "../api";
import { motion } from "framer-motion";

import Input from "../components/Input";
import Button from "../components/Button";
import { Card, CardContent } from "../components/Card";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "sales",
    status: "active",
  });

  const [editId, setEditId] = useState(null);

  // ---------------- FETCH USERS ----------------
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/crm/users"); // 🔥 backend route required
      setUsers(res.data?.data || []);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ---------------- SAVE USER ----------------
  const saveUser = async () => {
    if (!form.name || !form.email) {
      return setError("Name & Email required");
    }

    try {
      setError("");

      if (editId) {
        await API.put(`/crm/users/${editId}`, form);
      } else {
        await API.post("/crm/users", form);
      }

      setForm({
        name: "",
        email: "",
        role: "sales",
        status: "active",
      });

      setEditId(null);
      fetchUsers();
    } catch {
      setError("Save failed");
    }
  };

  // ---------------- DELETE ----------------
  const deleteUser = async (id) => {
    try {
      await API.delete(`/crm/users/${id}`);
      fetchUsers();
    } catch {
      setError("Delete failed");
    }
  };

  // ---------------- EDIT ----------------
  const editUser = (u) => {
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
    });
    setEditId(u._id);
  };

  // ---------------- FILTER ----------------
  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  return (
    <div className="min-h-screen p-6 text-white bg-gradient-to-br from-black via-gray-900 to-gray-950">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">👥 Users Management</h1>
        <span className="text-gray-400">{users.length} Users</span>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-2 mb-4 text-red-400 border border-red-600 rounded">
          {error}
        </div>
      )}

      {/* FORM */}
      <Card className="mb-6">
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">

            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <select
              className="p-2 text-sm bg-gray-800 border border-gray-700 rounded"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="sales">Sales</option>
            </select>

            <select
              className="p-2 text-sm bg-gray-800 border border-gray-700 rounded"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <Button onClick={saveUser}>
              {editId ? "Update" : "Add"}
            </Button>

          </div>
        </CardContent>
      </Card>

      {/* SEARCH */}
      <div className="mb-4">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <Card>
        <CardContent>

          {loading ? (
            <p className="text-gray-400">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-gray-500">No users found</p>
          ) : (
            <div className="overflow-auto">

              <table className="w-full text-sm">
                <thead className="text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Role</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u) => (
                    <motion.tr
                      key={u._id}
                      whileHover={{ backgroundColor: "#1f2937" }}
                      className="border-b border-gray-800"
                    >
                      <td className="p-2">{u.name}</td>
                      <td className="p-2">{u.email}</td>

                      <td className="p-2">
                        <span className="px-2 py-1 text-xs rounded bg-blue-500/20">
                          {u.role}
                        </span>
                      </td>

                      <td className="p-2">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            u.status === "active"
                              ? "bg-green-500/20 text-green-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="p-2 space-x-2 text-right">
                        <button
                          onClick={() => editUser(u)}
                          className="text-blue-400"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteUser(u._id)}
                          className="text-red-400"
                        >
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}