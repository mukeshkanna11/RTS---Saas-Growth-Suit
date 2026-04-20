import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { Bell, Search, ChevronDown } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800 bg-gray-950 backdrop-blur">

      {/* LEFT */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center font-bold text-white shadow-lg w-9 h-9 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
          RTS
        </div>
        <h1 className="hidden text-lg font-semibold text-white md:block">
          Growth Suite
        </h1>
      </div>

      {/* SEARCH */}
      <div className="hidden md:flex items-center w-1/3 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full ml-2 text-sm text-white bg-transparent outline-none"
        />
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        {/* NOTIFICATION */}
        <div className="relative cursor-pointer">
          <Bell className="text-gray-400 hover:text-white" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        </div>

        {/* USER */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 transition"
          >
            <div className="flex items-center justify-center w-8 h-8 font-semibold text-white rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              {user?.name?.charAt(0) || "U"}
            </div>

            <span className="hidden text-sm text-white md:block">
              {user?.name || "User"}
            </span>

            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 mt-3 overflow-hidden bg-gray-900 border border-gray-800 shadow-xl w-52 rounded-xl">

              <div className="px-4 py-3 border-b border-gray-800">
                <p className="text-sm font-medium text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-400">
                  {user?.email}
                </p>
              </div>

              <button className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800">
                Profile
              </button>

              <button className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800">
                Settings
              </button>

              <button
                onClick={logout}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}