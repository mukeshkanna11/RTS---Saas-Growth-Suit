import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

export default function ManagerDashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    employees: 0,
    activeEmployees: 0,
  });

  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const token = useAuthStore.getState().token;

      const res = await axios.get(
        "http://localhost:5000/api/v1/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const users = res.data.data || [];

      const employees = users.filter((u) => u.role === "employee");

      setStats({
        totalUsers: users.length,
        employees: employees.length,
        activeEmployees: employees.filter((u) => u.isActive).length,
      });

      // latest 5 employees
      setRecentEmployees(employees.slice(0, 5));

    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-white bg-gray-950">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Manager Dashboard 📊
          </h1>
          <p className="text-gray-400">
            Welcome back, {user?.name}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium transition bg-red-600 rounded-lg hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="p-3 mb-6 text-red-400 bg-red-900 rounded-lg">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid gap-6 mb-8 md:grid-cols-3">
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Employees" value={stats.employees} />
        <StatCard
          title="Active Employees"
          value={stats.activeEmployees}
          highlight="text-green-400"
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* TEAM INSIGHTS */}
        <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
          <h2 className="mb-4 text-lg font-semibold">
            Team Insights
          </h2>

          <div className="space-y-3 text-gray-400">
            <p>
              Active Rate:{" "}
              <span className="text-white">
                {stats.employees
                  ? Math.round(
                      (stats.activeEmployees / stats.employees) * 100
                    )
                  : 0}
                %
              </span>
            </p>

            <p>
              Inactive Employees:{" "}
              <span className="text-red-400">
                {stats.employees - stats.activeEmployees}
              </span>
            </p>

            <p>
              System Health:{" "}
              <span className="text-green-400">
                Good
              </span>
            </p>
          </div>
        </div>

        {/* RECENT EMPLOYEES */}
        <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">
            Recent Employees
          </h2>

          <div className="space-y-3">

            {recentEmployees.map((emp) => (
              <div
                key={emp._id}
                className="flex items-center justify-between p-3 transition border border-gray-800 rounded-lg hover:bg-gray-800"
              >
                <div>
                  <p className="font-medium">{emp.name}</p>
                  <p className="text-sm text-gray-400">
                    {emp.email}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 text-xs rounded-full ${
                    emp.isActive
                      ? "bg-green-900 text-green-400"
                      : "bg-red-900 text-red-400"
                  }`}
                >
                  {emp.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))}

          </div>

          <button className="w-full px-4 py-2 mt-5 text-sm transition bg-blue-600 rounded-lg hover:bg-blue-700">
            View All Employees
          </button>
        </div>

      </div>

      {/* ACTION PANEL */}
      <div className="grid gap-6 mt-8 md:grid-cols-3">

        <ActionCard
          title="Manage Employees"
          desc="View and control employee accounts"
        />

        <ActionCard
          title="Assign Tasks"
          desc="Distribute work efficiently"
        />

        <ActionCard
          title="View Reports"
          desc="Analytics & performance insights"
        />

      </div>

    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({ title, value, highlight }) {
  return (
    <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
      <p className="text-sm text-gray-400">{title}</p>
      <h2 className={`mt-2 text-2xl font-bold ${highlight || ""}`}>
        {value}
      </h2>
    </div>
  );
}

function ActionCard({ title, desc }) {
  return (
    <div className="p-5 transition bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>

      <button className="mt-4 text-sm text-blue-400 hover:underline">
        Open →
      </button>
    </div>
  );
}