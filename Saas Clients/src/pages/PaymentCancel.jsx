// src/pages/PaymentCancel.jsx
// Landing page for PayPal cancel_url — user clicked "Cancel" on PayPal.

import { useNavigate } from "react-router-dom";
import { XCircle, RefreshCcw, LayoutDashboard } from "lucide-react";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center gap-6 max-w-md w-full">
        <div className="p-6 rounded-full border bg-amber-500/10 border-amber-500/20 inline-flex">
          <XCircle className="text-amber-400" size={48} />
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">Payment Cancelled</h1>
          <p className="text-slate-400">
            Your payment was not completed. No charges have been made.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate("/admin/subscription")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition-colors"
          >
            <RefreshCcw size={16} />
            Try Again
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
