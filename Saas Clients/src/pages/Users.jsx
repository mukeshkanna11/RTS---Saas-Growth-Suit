// =======================================================
// src/pages/Users.jsx
// READYTECH SOLUTIONS - PREMIUM ENTERPRISE USERS MANAGEMENT
// ULTRA MODERN SAAS EXPERIENCE
// =======================================================

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import API from "../api/axios";

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
  Sparkles,
  Activity,
  TrendingUp,
  Building2,
  Layers3,
  ChevronRight,
  ShieldCheck,
  Globe2,
  Clock3,
  CheckCircle2,
  UserPlus,
  BadgeCheck,
} from "lucide-react";

export default function Users() {
  // =====================================================
  // STATES
  // =====================================================

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

  // =====================================================
  // FETCH USERS
  // =====================================================

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await API.get("/users");

      setUsers(res?.data?.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // =====================================================
  // AUTO CLEAR
  // =====================================================

  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3500);

      return () => clearTimeout(t);
    }
  }, [error, success]);

  // =====================================================
  // SAVE USER
  // =====================================================

  const saveUser = async () => {
    try {
      setSaving(true);

      setError("");
      setSuccess("");

      if (!form.name || !form.email) {
        return setError("Name & Email required");
      }

      if (!editId && !form.password) {
        return setError("Password required");
      }

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
      setError(
        err?.response?.data?.message ||
          "Save failed"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE USER
  // =====================================================

  const deleteUser = async (id) => {
    const ok = window.confirm(
      "Delete this user permanently?"
    );

    if (!ok) return;

    try {
      await API.delete(`/users/${id}`);

      setUsers((prev) =>
        prev.filter((u) => u._id !== id)
      );

      setSuccess("User deleted");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Delete failed"
      );
    }
  };

  // =====================================================
  // EDIT USER
  // =====================================================

  const editUser = (u) => {
    setForm({
      name: u?.name || "",
      email: u?.email || "",
      password: "",
      role: u?.role || "employee",
      status: u?.status || "active",
    });

    setEditId(u?._id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // CANCEL EDIT
  // =====================================================

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

  // =====================================================
  // FILTER USERS
  // =====================================================

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      `${u?.name} ${u?.email} ${u?.role}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [users, search]);

  // =====================================================
  // STATS
  // =====================================================

  const stats = useMemo(() => {
    return {
      total: users.length,

      admins: users.filter(
        (u) => u.role === "admin"
      ).length,

      managers: users.filter(
        (u) => u.role === "manager"
      ).length,

      employees: users.filter(
        (u) => u.role === "employee"
      ).length,

      active: users.filter(
        (u) => u.status === "active"
      ).length,
    };
  }, [users]);

  // =====================================================
  // ROLE BADGE
  // =====================================================

  const roleUI = (role) => {
    switch (role) {
      case "admin":
        return {
          icon: Crown,
          color:
            "bg-violet-500/15 text-violet-300 border-violet-500/20",
        };

      case "manager":
        return {
          icon: Briefcase,
          color:
            "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
        };

      default:
        return {
          icon: User,
          color:
            "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
        };
    }
  };

  // =====================================================
  // STATUS BADGE
  // =====================================================

  const statusBadge = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20";

      case "inactive":
        return "bg-red-500/15 text-red-300 border border-red-500/20";

      default:
        return "bg-slate-500/15 text-slate-300 border border-slate-500/20";
    }
  };

  // =====================================================
  // KPI CARDS
  // =====================================================

  const cards = [
    {
      title: "Total Workforce",
      value: stats.total,
      icon: UsersIcon,
      color:
        "from-cyan-500/20 to-blue-500/10 border-cyan-500/20",
    },

    {
      title: "System Admins",
      value: stats.admins,
      icon: Crown,
      color:
        "from-violet-500/20 to-fuchsia-500/10 border-violet-500/20",
    },

    {
      title: "Department Managers",
      value: stats.managers,
      icon: Briefcase,
      color:
        "from-orange-500/20 to-amber-500/10 border-orange-500/20",
    },

    {
      title: "Active Users",
      value: stats.active,
      icon: ShieldCheck,
      color:
        "from-emerald-500/20 to-teal-500/10 border-emerald-500/20",
    },
  ];

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen overflow-hidden bg-[#030712] text-white">

      {/* ================================================= */}
      {/* BACKGROUND */}
      {/* ================================================= */}

      <div className="fixed inset-0 -z-10">

        <div className="absolute top-0 left-0 w-[450px] h-[450px] bg-cyan-500/10 blur-[140px]" />

        <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-violet-500/10 blur-[140px]" />

      </div>

      <div className="p-4 md:p-6">

        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <div className="relative overflow-hidden border shadow-2xl mb-7 rounded-[32px] border-white/10 bg-white/[0.04] backdrop-blur-2xl">

          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[120px]" />

          <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/10 blur-[120px]" />

          <div className="relative z-10 p-7 md:p-10">

            <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">

              {/* LEFT */}

              <div className="max-w-3xl">

                <div className="inline-flex items-center gap-2 px-4 py-2 mb-5 text-sm border rounded-full bg-cyan-500/10 border-cyan-400/20 text-cyan-300">

                  <Sparkles size={15} />

                  ReadyTech Solutions Enterprise Access Control

                </div>

                <h1 className="text-4xl font-black leading-tight md:text-4xl">

                  Workforce &
                  <span className="block mt-2 text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text">
                    User Management
                  </span>

                </h1>

                <p className="max-w-2xl mt-5 text-base leading-8 text-slate-300">

                  Centralized enterprise workforce administration
                  platform for managing employees, admins,
                  department managers, access permissions,
                  productivity tracking and organizational
                  operations inside the ReadyTech SaaS ecosystem.

                </p>

                <div className="flex flex-wrap gap-3 mt-8">

                  <Feature
                    icon={Shield}
                    title="Enterprise Security"
                    color="text-cyan-400"
                  />

                  <Feature
                    icon={Activity}
                    title="Real-time Workforce Insights"
                    color="text-violet-400"
                  />

                  <Feature
                    icon={Globe2}
                    title="Multi Department Access"
                    color="text-emerald-400"
                  />

                </div>

              </div>

              {/* RIGHT */}

              <div className="grid grid-cols-2 gap-4 min-w-[320px]">

                {cards.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: index * 0.08,
                    }}
                    className={`rounded-3xl border bg-gradient-to-br ${item.color} p-5 backdrop-blur-xl`}
                  >

                    <div className="flex items-center justify-between">

                      <div className="p-3 rounded-2xl bg-black/30">
                        <item.icon size={22} />
                      </div>

                      <TrendingUp
                        size={18}
                        className="text-emerald-400"
                      />

                    </div>

                    <h2 className="mt-5 text-3xl font-black">
                      {item.value}
                    </h2>

                    <p className="mt-1 text-sm text-slate-300">
                      {item.title}
                    </p>

                  </motion.div>
                ))}

              </div>

            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* ALERTS */}
        {/* ================================================= */}

        <AnimatePresence>

          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
              className="flex items-center gap-2 p-4 mb-5 text-sm text-red-300 border rounded-2xl bg-red-500/10 border-red-500/20"
            >

              <AlertTriangle size={18} />

              {error}

            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{
                opacity: 0,
                y: -10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
              className="flex items-center gap-2 p-4 mb-5 text-sm border rounded-2xl bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
            >

              <CheckCircle2 size={18} />

              {success}

            </motion.div>
          )}

        </AnimatePresence>

        {/* ================================================= */}
        {/* EDIT MODE */}
        {/* ================================================= */}

        {editId && (
          <div className="flex items-center justify-between p-4 mb-6 border rounded-2xl border-yellow-500/20 bg-yellow-500/10">

            <div className="flex items-center gap-2 text-yellow-300">

              <Pencil size={16} />

              Editing existing user profile

            </div>

            <button
              onClick={cancelEdit}
              className="text-sm underline"
            >
              Cancel
            </button>

          </div>
        )}

        {/* ================================================= */}
        {/* FORM */}
        {/* ================================================= */}

        <div className="grid gap-6 mb-8 xl:grid-cols-4">

          {/* LEFT */}

          <div className="xl:col-span-3">

            <div className="border shadow-2xl rounded-[30px] border-white/10 bg-white/[0.04] backdrop-blur-2xl">

              <div className="p-6 border-b border-white/10">

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="text-2xl font-black">
                      {editId
                        ? "Update User"
                        : "Create New User"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Manage workforce onboarding and
                      enterprise access control.
                    </p>

                  </div>

                  <div className="p-3 rounded-2xl bg-cyan-500/10">
                    <UserPlus
                      size={24}
                      className="text-cyan-400"
                    />
                  </div>

                </div>
              </div>

              <div className="grid gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">

                {/* NAME */}

                <InputBox
                  icon={User}
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                />

                {/* EMAIL */}

                <InputBox
                  icon={Mail}
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                />

                {/* PASSWORD */}

                <InputBox
                  icon={KeyRound}
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                />

                {/* ROLE */}

                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value,
                    })
                  }
                  className="h-14 px-4 border outline-none rounded-2xl border-white/10 bg-[#0f172a] focus:border-cyan-400"
                >
                  <option value="admin">
                    👑 Admin
                  </option>

                  <option value="manager">
                    💼 Manager
                  </option>

                  <option value="employee">
                    👨‍💻 Employee
                  </option>

                  <option value="client">
                    👨‍💼 Client 
                  </option>

                </select>

                {/* STATUS */}

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value,
                    })
                  }
                  className="h-14 px-4 border outline-none rounded-2xl border-white/10 bg-[#0f172a] focus:border-cyan-400"
                >
                  <option value="active">
                    ✅ Active
                  </option>

                  <option value="inactive">
                    ❌ Inactive
                  </option>

                </select>

                {/* BUTTON */}

                <button
                  onClick={saveUser}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 h-14 px-5 font-semibold transition-all duration-300 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 hover:scale-[1.02]"
                >

                  <Plus size={18} />

                  {saving
                    ? "Saving..."
                    : editId
                    ? "Update User"
                    : "Create User"}

                </button>

              </div>

            </div>
          </div>

          {/* RIGHT */}

          <div className="space-y-5">

            <SideCard
              icon={Building2}
              title="Organization"
              value="ReadyTech Solutions"
              desc="Enterprise SaaS Workforce System"
            />

            <SideCard
              icon={ShieldCheck}
              title="Security"
              value="Role Based Access"
              desc="Enterprise permission control"
            />

            <SideCard
              icon={Layers3}
              title="Departments"
              value="Multi Team Architecture"
              desc="Managers, Admins & Employees"
            />

          </div>

        </div>

        {/* ================================================= */}
        {/* SEARCH */}
        {/* ================================================= */}

        <div className="flex flex-col gap-4 p-5 mb-6 border lg:flex-row lg:items-center lg:justify-between rounded-[26px] border-white/10 bg-white/[0.04] backdrop-blur-xl">

          <div>

            <h2 className="text-2xl font-black">
              Enterprise Workforce Directory
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Search, manage, monitor, and organize your
              company workforce.
            </p>

          </div>

          <div className="relative w-full lg:w-[340px]">

            <Search
              size={18}
              className="absolute text-slate-500 left-4 top-4"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search users..."
              className="w-full h-14 pl-12 pr-4 border outline-none rounded-2xl border-white/10 bg-[#0f172a] focus:border-cyan-400"
            />

          </div>

        </div>

        {/* ================================================= */}
        {/* USERS GRID */}
        {/* ================================================= */}

        {loading ? (
          <div className="p-10 text-center text-slate-400">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center border border-dashed rounded-3xl border-white/10 bg-white/[0.03] text-slate-400">
            No users found
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {filteredUsers.map((u, index) => {
              const roleData = roleUI(u?.role);

              return (
                <motion.div
                  key={u?._id}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: index * 0.05,
                  }}
                  whileHover={{
                    y: -4,
                  }}
                  className="relative overflow-hidden border shadow-2xl rounded-[28px] border-white/10 bg-white/[0.05] backdrop-blur-xl"
                >

                  <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 blur-3xl" />

                  <div className="relative p-5">

                    {/* TOP */}

                    <div className="flex items-start justify-between">

                      <div className="flex items-center gap-4">

                        <div className="flex items-center justify-center w-16 h-16 text-xl font-black rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600">

                          {u?.name?.charAt(0)}

                        </div>

                        <div>

                          <h3 className="text-lg font-bold">
                            {u?.name}
                          </h3>

                          <p className="mt-1 text-sm text-slate-400">
                            ReadyTech Workforce
                          </p>

                        </div>

                      </div>

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            editUser(u)
                          }
                          className="p-2 transition rounded-xl bg-blue-500/10 hover:bg-blue-500/20"
                        >

                          <Pencil
                            size={16}
                            className="text-blue-400"
                          />

                        </button>

                        <button
                          onClick={() =>
                            deleteUser(u?._id)
                          }
                          className="p-2 transition rounded-xl bg-red-500/10 hover:bg-red-500/20"
                        >

                          <Trash2
                            size={16}
                            className="text-red-400"
                          />

                        </button>

                      </div>

                    </div>

                    {/* INFO */}

                    <div className="mt-6 space-y-3">

                      <div className="flex items-center gap-3 text-sm text-slate-300">

                        <Mail
                          size={16}
                          className="text-cyan-400"
                        />

                        {u?.email}

                      </div>

                      <div
                        className={`inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl ${roleData.color}`}
                      >

                        <roleData.icon size={15} />

                        {u?.role}

                      </div>

                      <div
                        className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-xl ${statusBadge(
                          u?.status
                        )}`}
                      >

                        <BadgeCheck size={15} />

                        {u?.status}

                      </div>

                    </div>

                    {/* FOOTER */}

                    <div className="flex items-center justify-between pt-5 mt-6 border-t border-white/10">

                      <div className="flex items-center gap-2 text-sm text-emerald-400">

                        <Clock3 size={15} />

                        Enterprise Access

                      </div>

                      <div className="flex items-center gap-1 text-xs text-slate-400">

                        View Profile

                        <ChevronRight size={14} />

                      </div>

                    </div>

                  </div>
                </motion.div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}

// =======================================================
// INPUT BOX
// =======================================================

function InputBox({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
}) {
  return (
    <div className="relative">

      <Icon
        size={18}
        className="absolute text-slate-500 left-4 top-4"
      />

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full h-14 pl-12 pr-4 border outline-none rounded-2xl border-white/10 bg-[#0f172a] focus:border-cyan-400"
      />

    </div>
  );
}

// =======================================================
// FEATURE
// =======================================================

function Feature({
  icon: Icon,
  title,
  color,
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border rounded-2xl border-white/10 bg-white/[0.05]">

      <Icon size={18} className={color} />

      <span className="text-sm">
        {title}
      </span>

    </div>
  );
}

// =======================================================
// SIDE CARD
// =======================================================

function SideCard({
  icon: Icon,
  title,
  value,
  desc,
}) {
  return (
    <div className="p-5 border shadow-xl rounded-[26px] border-white/10 bg-white/[0.05] backdrop-blur-xl">

      <div className="flex items-center justify-between">

        <div className="p-3 rounded-2xl bg-cyan-500/10">

          <Icon
            size={20}
            className="text-cyan-400"
          />

        </div>

        <Activity
          size={18}
          className="text-emerald-400"
        />

      </div>

      <h3 className="mt-5 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm text-white">
        {value}
      </p>

      <p className="mt-2 text-xs leading-6 text-slate-400">
        {desc}
      </p>

    </div>
  );
}