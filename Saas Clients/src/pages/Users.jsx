// src/pages/Users.jsx

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import API from "../api";

import {
  Users as UsersIcon,
  Shield,
  UserCheck,
  UserX,
  Search,
  Pencil,
  Trash2,
  Plus,
  Mail,
  Crown,
  Briefcase,
  User,
  KeyRound,
  AlertTriangle,
} from "lucide-react";

import Input from "../components/Input";
import Button from "../components/Button";
import { Card, CardContent } from "../components/Card";

export default function Users() {
  /* ================= STATES ================= */
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    status: "active",
  });

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/users");
      setUsers(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ================= AUTO CLEAR MESSAGES ================= */
  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);

      return () => clearTimeout(t);
    }
  }, [error, success]);

  /* ================= SAVE USER ================= */
  const saveUser = async () => {
    try {
      setError("");
      setSuccess("");

      if (!form.name || !form.email) {
        return setError("Name & Email required");
      }

      if (!editId && !form.password) {
        return setError("Password is required");
      }

      setSaving(true);

      if (editId) {
        await API.put(`/users/${editId}`, form);
        setSuccess("User updated successfully");
      } else {
        await API.post("/users", form);
        setSuccess("User created successfully");
      }

      setForm({
        name: "",
        email: "",
        password: "",
        role: "employee",
        status: "active",
      });

      setEditId(null);
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteUser = async (id) => {
    const ok = window.confirm("Delete this user?");
    if (!ok) return;

    try {
      await API.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setSuccess("User deleted");
    } catch (err) {
      setError(err?.response?.data?.message || "Delete failed");
    }
  };

  /* ================= EDIT ================= */
  const editUser = (u) => {
    setForm({
      name: u.name || "",
      email: u.email || "",
      password: "",
      role: u.role || "employee",
      status: u.status || "active",
    });

    setEditId(u._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({
      name: "",
      email: "",
      password: "",
      role: "employee",
      status: "active",
    });
  };

  /* ================= FILTER ================= */
  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      `${u.name} ${u.email} ${u.role}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [users, search]);

  /* ================= STATS ================= */
  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    managers: users.filter((u) => u.role === "manager").length,
    employees: users.filter((u) => u.role === "employee").length,
    active: users.filter((u) => u.status === "active").length,
  }), [users]);

  /* ================= ROLE ICON ================= */
  const roleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Crown className="text-purple-400" size={14} />;
      case "manager":
        return <Briefcase className="text-blue-400" size={14} />;
      default:
        return <User className="text-green-400" size={14} />;
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen text-white bg-[#020617]">

      {/* HEADER */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-[#020617]/80 border-b border-white/10">
        <div className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1 className="text-3xl font-bold">Users Management</h1>
            <p className="text-sm text-slate-400">
              SaaS level user control panel
            </p>
          </div>

          <div className="flex gap-3">

            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-500" size={16} />
              <input
                className="w-64 py-2 pl-10 pr-4 text-sm border bg-white/5 border-white/10 rounded-xl"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button onClick={saveUser} disabled={saving}>
              <Plus size={15} />
              {editId ? "Update" : "Create"}
            </Button>

          </div>
        </div>
      </div>

      <div className="p-6">

        {/* ALERTS */}
        <AnimatePresence>
          {error && (
            <motion.div className="flex items-center gap-2 p-3 mb-4 text-red-300 border border-red-500/20 bg-red-500/10 rounded-xl">
              <AlertTriangle size={16} />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div className="p-3 mb-4 text-green-300 border border-green-500/20 bg-green-500/10 rounded-xl">
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* EDIT MODE */}
        {editId && (
          <div className="p-3 mb-4 text-yellow-300 border border-yellow-500/20 bg-yellow-500/10 rounded-xl">
            ✏️ Editing user mode active
            <button onClick={cancelEdit} className="ml-4 text-white underline">
              Cancel
            </button>
          </div>
        )}

        {/* STATS */}
        <div className="grid gap-4 mb-6 md:grid-cols-5">
          <Stat title="Total" value={stats.total} icon={<UsersIcon />} />
          <Stat title="Admins" value={stats.admins} icon={<Crown />} />
          <Stat title="Managers" value={stats.managers} icon={<Briefcase />} />
          <Stat title="Employees" value={stats.employees} icon={<User />} />
          <Stat title="Active" value={stats.active} icon={<UserCheck />} />
        </div>

        {/* FORM */}
        <Card className="mb-6 border border-white/10 bg-white/5">
          <CardContent className="grid gap-4 p-5 lg:grid-cols-5">

            <Input placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <Input placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <Input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="px-3 py-2 border bg-white/5 border-white/10 rounded-xl"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>

            <Button onClick={saveUser} disabled={saving}>
              {saving ? "Saving..." : editId ? "Update" : "Create"}
            </Button>

          </CardContent>
        </Card>

        {/* TABLE */}
        <Card className="border border-white/10 bg-white/5">
          <CardContent className="p-0">

            {loading ? (
              <div className="p-10 text-center">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                No users found
              </div>
            ) : (
              <table className="w-full">

                <thead className="border-b border-white/10">
                  <tr className="text-left text-gray-400">
                    <th className="p-4">User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="border-b border-white/5">

                      <td className="p-4">
                        <div>
                          <p>{u.name}</p>
                          <p className="flex items-center gap-1 text-xs text-gray-400">
                            <Mail size={12} /> {u.email}
                          </p>
                        </div>
                      </td>

                      <td className="flex items-center gap-2 p-2">
                        {roleIcon(u.role)} {u.role}
                      </td>

                      <td>{u.status}</td>

                      <td className="p-4 text-right">
                        <button onClick={() => editUser(u)} className="mr-3 text-blue-400">
                          <Pencil size={14} />
                        </button>

                        <button onClick={() => deleteUser(u._id)} className="text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  );
}

/* ================= STAT ================= */
function Stat({ title, value, icon }) {
  return (
    <div className="p-4 border border-white/10 bg-white/5 rounded-xl">
      <div className="flex items-center gap-2 text-slate-400">
        {icon} {title}
      </div>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}