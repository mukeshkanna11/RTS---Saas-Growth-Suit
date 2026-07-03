// src/pages/PaymentSuccess.jsx
// Landing page for PayPal return_url after successful payment.
// PayPal appends ?token=ORDER_ID&PayerID=... — `token` is the orderId.

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  LayoutDashboard,
  Receipt,
} from "lucide-react";
import { capturePayPalOrder } from "../api/subscription";
import { useAuthStore } from "../store/authStore";

function readPending() {
  try {
    return JSON.parse(sessionStorage.getItem("paypal_pending") || "{}");
  } catch {
    return {};
  }
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const authToken = useAuthStore((s) => s.token);

  const [phase, setPhase] = useState("loading"); // "loading" | "success" | "error"
  const [captureData, setCaptureData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const captured = useRef(false);

  useEffect(() => {
    if (!authToken) {
      navigate("/login", { replace: true });
      return;
    }

    // Prevent duplicate capture on React StrictMode double-invoke
    if (captured.current) return;
    captured.current = true;

    const orderId = searchParams.get("token"); // PayPal orderId
    if (!orderId) {
      setErrorMsg("No payment reference found. Please contact support.");
      setPhase("error");
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const res = await capturePayPalOrder(orderId, controller.signal);
        setCaptureData(res?.data?.data ?? {});
        sessionStorage.removeItem("paypal_pending");
        setPhase("success");
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        setErrorMsg(
          err?.response?.data?.message ||
          err?.message ||
          "Payment capture failed. Please contact support if you were charged."
        );
        setPhase("error");
      }
    })();

    return () => controller.abort();
  }, [authToken, navigate, searchParams]);

  const pending = readPending();
  const planLabel = capitalize(captureData?.plan ?? pending?.plan ?? "");
  const cycleLabel = capitalize(captureData?.billingCycle ?? pending?.billingCycle ?? "");

  if (phase === "loading") {
    return (
      <Screen>
        <Loader2 className="mx-auto text-cyan-400 animate-spin" size={48} />
        <h1 className="text-2xl font-bold text-white">Confirming your payment…</h1>
        <p className="text-slate-400 text-sm">Please wait. Do not close this tab.</p>
      </Screen>
    );
  }

  if (phase === "success") {
    return (
      <Screen>
        <IconBadge color="green">
          <CheckCircle2 className="text-green-400" size={48} />
        </IconBadge>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">Payment Successful!</h1>
          {planLabel && cycleLabel && (
            <p className="text-slate-400">
              Your <span className="text-white font-semibold">{planLabel}</span> plan
              ({cycleLabel}) is now active.
            </p>
          )}
        </div>

        {captureData?.invoiceId && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Receipt size={14} />
            Invoice:&nbsp;
            <span className="text-cyan-300 font-mono">{captureData.invoiceId}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate("/admin/subscription")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition-colors"
          >
            View Subscription
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <IconBadge color="red">
        <XCircle className="text-red-400" size={48} />
      </IconBadge>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-white">Payment Failed</h1>
        <p className="text-slate-400 max-w-sm">{errorMsg}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button
          onClick={() => navigate("/admin/subscription")}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition-colors"
        >
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
    </Screen>
  );
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function Screen({ children }) {
  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center gap-6 max-w-md w-full">
        {children}
      </div>
    </div>
  );
}

function IconBadge({ color, children }) {
  const cls = {
    green: "bg-green-500/10 border-green-500/20",
    red:   "bg-red-500/10   border-red-500/20",
    amber: "bg-amber-500/10 border-amber-500/20",
  }[color] ?? "bg-cyan-500/10 border-cyan-500/20";
  return (
    <div className={`p-6 rounded-full border inline-flex ${cls}`}>
      {children}
    </div>
  );
}
