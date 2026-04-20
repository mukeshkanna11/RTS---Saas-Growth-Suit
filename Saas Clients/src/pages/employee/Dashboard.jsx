import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

export default function EmployeeDashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen p-6 text-white bg-gray-950">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Employee Dashboard 👷
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

      {/* STATS CARDS */}
      <div className="grid gap-6 mb-8 md:grid-cols-3">

        <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
          <h3 className="text-sm text-gray-400">Assigned Tasks</h3>
          <p className="mt-2 text-2xl font-bold">12</p>
        </div>

        <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
          <h3 className="text-sm text-gray-400">Completed</h3>
          <p className="mt-2 text-2xl font-bold text-green-400">8</p>
        </div>

        <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
          <h3 className="text-sm text-gray-400">Pending</h3>
          <p className="mt-2 text-2xl font-bold text-yellow-400">4</p>
        </div>

      </div>

      {/* MAIN GRID */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* PROFILE CARD */}
        <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
          <h2 className="mb-4 text-lg font-semibold">
            Profile Information
          </h2>

          <div className="space-y-3 text-gray-300">
            <p>
              <span className="text-gray-500">Name:</span> {user?.name}
            </p>
            <p>
              <span className="text-gray-500">Email:</span> {user?.email}
            </p>
            <p>
              <span className="text-gray-500">Role:</span> {user?.role}
            </p>
            <p>
              <span className="text-gray-500">Tenant:</span> {user?.tenantId}
            </p>
          </div>

          <button className="w-full px-4 py-2 mt-5 text-sm transition bg-blue-600 rounded-lg hover:bg-blue-700">
            Edit Profile
          </button>
        </div>

        {/* TASKS */}
        <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">
            Your Tasks
          </h2>

          <div className="space-y-4">

            {/* TASK ITEM */}
            {[1, 2, 3].map((task) => (
              <div
                key={task}
                className="flex items-center justify-between p-3 transition border border-gray-800 rounded-lg hover:bg-gray-800"
              >
                <div>
                  <p className="font-medium">Task #{task}</p>
                  <p className="text-sm text-gray-400">
                    Update CRM lead details
                  </p>
                </div>

                <span className="px-3 py-1 text-xs text-yellow-400 bg-yellow-900 rounded-full">
                  Pending
                </span>
              </div>
            ))}

          </div>

          <button className="w-full px-4 py-2 mt-5 text-sm transition bg-green-600 rounded-lg hover:bg-green-700">
            View All Tasks
          </button>
        </div>

      </div>

      {/* ACTIVITY SECTION */}
      <div className="p-5 mt-8 bg-gray-900 border border-gray-800 rounded-xl">
        <h2 className="mb-4 text-lg font-semibold">
          Recent Activity
        </h2>

        <ul className="space-y-3 text-gray-400">
          <li>✅ Completed Task #5</li>
          <li>📝 Updated CRM Lead</li>
          <li>📌 Assigned new Task #12</li>
        </ul>
      </div>

      {/* FUTURE FEATURES */}
      <div className="p-5 mt-8 bg-gray-900 border border-gray-800 rounded-xl">
        <h2 className="mb-3 text-lg font-semibold">
          Upcoming Features 🚀
        </h2>

        <ul className="ml-5 space-y-2 text-gray-400 list-disc">
          <li>Real-time task updates</li>
          <li>Team collaboration</li>
          <li>Notifications & reminders</li>
          <li>Performance analytics</li>
        </ul>
      </div>

    </div>
  );
}