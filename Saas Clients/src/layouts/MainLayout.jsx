import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-gray-950">

      <Sidebar />

      <div className="flex flex-col flex-1">
        <Navbar />

        <div className="p-6">
          <Outlet /> {/* ✅ ONLY ONE RENDER */}
        </div>
      </div>

    </div>
  );
}