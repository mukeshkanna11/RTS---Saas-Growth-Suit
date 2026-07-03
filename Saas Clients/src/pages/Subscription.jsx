// src/pages/Subscription.jsx
// Enterprise SaaS Subscription Management — Production Ready

import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  memo,
} from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Crown,
  Rocket,
  Building2,
  CreditCard,
  CalendarDays,
  Users,
  ShieldCheck,
  Activity,
  Loader2,
  RefreshCcw,
  XCircle,
  Mail,
  Phone,
  Download,
  Sparkles,
  Globe,
  Zap,
  ArrowRight,
  Clock3,
  BarChart3,
  Wallet,
  Layers3,
  CircleDollarSign,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  Receipt,
  Star,
  TrendingUp,
  BadgeCheck,
  ArrowUpCircle,
  RotateCcw,
  X,
  Wifi,
  WifiOff,
  Package,
  Database,
  Bot,
  Lock,
  Eye,
} from "lucide-react";

import {
  getMySubscription,
  createIntent,
  createPayPalOrder,
  cancelSubscription as apiCancelSubscription,
  reactivateSubscription as apiReactivateSubscription,
  getAuditLogs,
} from "../api/subscription";

import { useAuthStore } from "../store/authStore";

// ── GST constants — backend uses 9%+9% intra-state ───────────────────────────
const CGST_RATE = 0.09;
const SGST_RATE = 0.09;
const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const calcGst = (base) => {
  const cgst = round2(base * CGST_RATE);
  const sgst = round2(base * SGST_RATE);
  return { cgst, sgst, total: round2(base + cgst + sgst) };
};
const fmtINR = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ── Port of services/invoice.service.js _buildHTML ───────────────────────────
// Generates pixel-identical HTML to the backend enterprise PDF template.
// Called inside SubscriptionInvoiceModal for the inline iframe preview.
function buildSubscriptionInvoiceHTML(sub = {}) {
  const safeN = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const r2    = (v) => Math.round((safeN(v) + Number.EPSILON) * 100) / 100;
  const esc   = (s) => String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const fmt   = (a) => {
    const n = r2(safeN(a));
    return `&#8377;${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const fmtD  = (d) => {
    if (!d) return "&#8212;";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "&#8212;" : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const PRICES_INR = {
    starter:    { monthly: 2999,  yearly: 29990  },
    growth:     { monthly: 7999,  yearly: 79990  },
    enterprise: { monthly: 19999, yearly: 199990 },
  };

  const planKey   = (sub.plan || "starter").toLowerCase();
  const cycleKey  = (sub.billingCycle || "monthly").toLowerCase();
  const itemPrice = safeN(PRICES_INR[planKey]?.[cycleKey]) || safeN(sub.amount) || 0;
  const planLabel = planKey.charAt(0).toUpperCase() + planKey.slice(1);

  const subtotal    = r2(itemPrice);
  const taxable     = subtotal;
  const cgst        = r2((taxable * 9) / 100);
  const sgst        = r2((taxable * 9) / 100);
  const total       = r2(taxable + cgst + sgst);

  const now         = new Date();
  const orderDate   = sub.createdAt      ? new Date(sub.createdAt)      : now;
  const dueDate     = sub.renewalDate    ? new Date(sub.renewalDate)    : new Date(now.getTime() + 30 * 86400000);
  const payDate     = sub.lastPaymentDate ? new Date(sub.lastPaymentDate) : null;

  const payStatus = (sub.paymentStatus || "pending").toLowerCase() === "paid" ? "PAID" : "PENDING";
  const sColor    = payStatus === "PAID" ? "#16a34a" : "#d97706";
  const sIcon     = payStatus === "PAID" ? "&#10003;&nbsp;PAID" : "&#9679;&nbsp;PENDING";

  const invoiceId = sub.invoice?.invoiceId || `INV-${now.getFullYear()}-PREVIEW`;

  const co = {
    name:    "ReadyTechSolutions Pvt Ltd",
    address: "Coimbatore, Tamil Nadu, India",
    email:   "info@readytechsolutions.in",
    phone:   "70107 97721",
    website: "https://readytechsolutions.in/",
    gstin:   "33ABCDE1234F1Z5",
  };

  const qrEnc = encodeURIComponent(`Invoice:${invoiceId}|Amt:${total}|Status:${payStatus}`);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&format=png&data=${qrEnc}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${invoiceId}</title>
<style>
@page{size:A4;margin:0}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;background:#f8fafc;color:#0f172a;font-size:12px;line-height:1.5}
.page{width:210mm;min-height:297mm;background:#fff;margin:0 auto;box-shadow:0 0 20px rgba(0,0,0,.1)}
.hdr{background:linear-gradient(135deg,#1a3c5e 0%,#1e40af 55%,#0d9488 100%);padding:28px 36px 22px;color:#fff;position:relative;overflow:hidden}
.hdr::before{content:"";position:absolute;top:-70px;right:-70px;width:260px;height:260px;background:rgba(255,255,255,.04);border-radius:50%}
.hdr::after{content:"";position:absolute;bottom:-40px;left:38%;width:200px;height:200px;background:rgba(255,255,255,.03);border-radius:50%}
.hdr-inner{display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:1}
.co-name{font-size:22px;font-weight:800;letter-spacing:-.3px;margin-bottom:7px}
.co-info{font-size:10.5px;color:rgba(255,255,255,.72);line-height:1.75}
.co-badge{display:inline-block;margin-top:9px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);padding:4px 12px;border-radius:5px;font-size:9.5px;font-weight:700;letter-spacing:.5px;color:rgba(255,255,255,.88)}
.inv-label{font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:7px}
.inv-num{font-family:"Courier New",monospace;font-size:18px;font-weight:700;letter-spacing:1px;margin-bottom:12px}
.st-badge{display:inline-block;padding:5px 16px;border-radius:20px;font-size:10.5px;font-weight:800;letter-spacing:1px;background:${sColor};color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.body{padding:22px 36px 28px}
.card-row{display:flex;gap:14px;margin-bottom:18px}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;flex:1}
.ctitle{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #f1f5f9}
.kv{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px}
.kv-l{font-size:10px;color:#64748b;font-weight:500;white-space:nowrap;flex-shrink:0}
.kv-v{font-size:10px;color:#0f172a;font-weight:600;text-align:right;word-break:break-all}
.kv-m{font-family:"Courier New",monospace;font-size:9px}
.tbl-wrap{border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:18px}
.inv-tbl{width:100%;border-collapse:collapse}
.inv-tbl thead tr{background:linear-gradient(135deg,#1a3c5e,#1e40af)}
.inv-tbl thead th{padding:10px 12px;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.9);text-align:left}
.r{text-align:right}.c{text-align:center}
.inv-tbl tbody tr:nth-child(even){background:#f8fafc}
.inv-tbl tbody td{padding:10px 12px;font-size:11px;border-bottom:1px solid #e2e8f0;vertical-align:middle}
.inv-tbl tbody tr:last-child td{border-bottom:none}
.totals-layout{display:flex;gap:20px;margin-bottom:18px;align-items:flex-start}
.totals-box{width:288px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;flex-shrink:0;margin-left:auto}
.t-row{display:flex;justify-content:space-between;align-items:center;padding:9px 16px;border-bottom:1px solid #e2e8f0;background:#fff}
.t-lbl{font-size:11px;color:#64748b}.t-val{font-size:11px;font-weight:600;color:#0f172a}
.t-taxable{background:#f8fafc!important}.t-taxable .t-lbl,.t-taxable .t-val{font-weight:700;color:#334155}
.t-grand{background:linear-gradient(135deg,#1a3c5e,#1e40af);padding:15px 16px;display:flex;justify-content:space-between;align-items:center}
.t-grand-lbl{font-size:13px;font-weight:700;color:rgba(255,255,255,.85)}
.t-grand-val{font-size:21px;font-weight:800;color:#fff;letter-spacing:-.5px}
.footer-stripe{height:4px;background:linear-gradient(90deg,#1a3c5e,#6366f1,#0d9488);margin-bottom:18px;border-radius:2px}
.footer{display:flex;gap:20px;align-items:flex-start;padding-bottom:24px}
.fqr img{width:72px;height:72px;border:1px solid #e2e8f0;border-radius:8px;padding:4px;background:#fff;display:block}
.fqr-lbl{font-size:8px;color:#94a3b8;text-align:center;margin-top:4px}
.fmid{flex:1;text-align:center}
.fthank{font-size:14px;font-weight:800;color:#1a3c5e;margin-bottom:5px}
.fcontact{font-size:10px;color:#64748b;line-height:1.75}
.flegal{font-size:8.5px;color:#94a3b8;margin-top:7px;font-style:italic}
.fsig{text-align:right;min-width:120px}
.sig-line{border-top:1px dashed #cbd5e1;padding-top:6px;margin-top:48px;font-size:9px;color:#94a3b8}
${payStatus !== "PAID" ? ".wm{position:fixed;top:45%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:88px;font-weight:900;color:rgba(220,38,38,.05);letter-spacing:10px;pointer-events:none;white-space:nowrap}" : ""}
@media print{body{background:#fff}.page{width:100%;min-height:auto;box-shadow:none}}
</style>
</head>
<body>
<div class="page">
${payStatus !== "PAID" ? `<div class="wm">${payStatus}</div>` : ""}
<div class="hdr">
  <div class="hdr-inner">
    <div>
      <div class="co-name">${esc(co.name)}</div>
      <div class="co-info">${esc(co.address)}<br>${esc(co.email)} &bull; ${esc(co.phone)}<br>${esc(co.website)}</div>
      <div class="co-badge">GSTIN: ${esc(co.gstin)}</div>
    </div>
    <div style="text-align:right">
      <div class="inv-label">Tax Invoice</div>
      <div class="inv-num">${invoiceId}</div>
      <div class="st-badge">${sIcon}</div>
    </div>
  </div>
</div>
<div class="body">
  <div class="card-row">
    <div class="card">
      <div class="ctitle">Invoice Details</div>
      <div class="kv"><span class="kv-l">Invoice Number</span><span class="kv-v kv-m">${invoiceId}</span></div>
      <div class="kv"><span class="kv-l">Invoice Date</span><span class="kv-v">${fmtD(now)}</span></div>
      <div class="kv"><span class="kv-l">Order Date</span><span class="kv-v">${fmtD(orderDate)}</span></div>
      <div class="kv"><span class="kv-l">Due Date</span><span class="kv-v">${fmtD(dueDate)}</span></div>
      ${payDate ? `<div class="kv"><span class="kv-l">Payment Date</span><span class="kv-v">${fmtD(payDate)}</span></div>` : ""}
      <div class="kv"><span class="kv-l">Payment Method</span><span class="kv-v">${esc(sub.paymentGateway || "Online")}</span></div>
      ${sub.transactionId ? `<div class="kv"><span class="kv-l">Transaction ID</span><span class="kv-v kv-m">${esc(sub.transactionId)}</span></div>` : ""}
      <div class="kv" style="margin-top:6px;padding-top:6px;border-top:1px solid #f1f5f9">
        <span class="kv-l">Payment Status</span>
        <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:9px;font-weight:800;background:${sColor};color:#fff">${payStatus}</span>
      </div>
    </div>
    <div class="card">
      <div class="ctitle">Billed To</div>
      <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:8px">${esc(sub.clientName || "Customer")}</div>
      <div class="kv"><span class="kv-l">Email</span><span class="kv-v">${esc(sub.clientEmail || "&#8212;")}</span></div>
      <div class="kv"><span class="kv-l">Address</span><span class="kv-v">India</span></div>
      <div class="kv"><span class="kv-l">State / Country</span><span class="kv-v">Tamil Nadu, India</span></div>
    </div>
  </div>
  <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:8px">Items &amp; Services</div>
  <div class="tbl-wrap">
    <table class="inv-tbl">
      <thead>
        <tr>
          <th style="width:36px" class="c">#</th>
          <th>Description</th>
          <th class="c" style="width:64px">HSN/SAC</th>
          <th class="c" style="width:44px">Qty</th>
          <th class="r" style="width:110px">Unit Price</th>
          <th class="r" style="width:110px">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="c" style="color:#94a3b8;font-weight:600">1</td>
          <td>
            <div style="font-weight:700;color:#0f172a">${planLabel} Plan Subscription</div>
            <div style="font-size:9.5px;color:#64748b;margin-top:2px">Billing Cycle: ${esc(sub.billingCycle || "monthly")}</div>
          </td>
          <td class="c" style="color:#64748b;font-family:monospace;font-size:9.5px">998314</td>
          <td class="c" style="font-weight:600">1</td>
          <td class="r">${fmt(itemPrice)}</td>
          <td class="r" style="font-weight:700;color:#1a3c5e">${fmt(itemPrice)}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="totals-layout">
    <div style="flex:1"></div>
    <div class="totals-box">
      <div class="t-row"><span class="t-lbl">Subtotal</span><span class="t-val">${fmt(subtotal)}</span></div>
      <div class="t-row t-taxable"><span class="t-lbl">Taxable Value</span><span class="t-val">${fmt(taxable)}</span></div>
      <div class="t-row"><span class="t-lbl">CGST (9%)</span><span class="t-val">${fmt(cgst)}</span></div>
      <div class="t-row"><span class="t-lbl">SGST (9%)</span><span class="t-val">${fmt(sgst)}</span></div>
      <div class="t-grand">
        <span class="t-grand-lbl">Grand Total</span>
        <span class="t-grand-val">${fmt(total)}</span>
      </div>
    </div>
  </div>
  <div class="footer-stripe"></div>
  <div class="footer">
    <div class="fqr">
      <img src="${qrSrc}" alt="QR">
      <div class="fqr-lbl">Scan to verify</div>
    </div>
    <div class="fmid">
      <div class="fthank">Thank you for choosing ${esc(co.name)}!</div>
      <div class="fcontact">Support: ${esc(co.email)} &bull; ${esc(co.phone)}<br>Website: ${esc(co.website)}</div>
      <div class="flegal">
        Invoice: ${invoiceId} &bull; Generated: ${fmtD(now)} &bull; GSTIN: ${esc(co.gstin)}<br>
        This is a computer-generated invoice and does not require a physical signature.
      </div>
    </div>
    <div class="fsig">
      <div class="sig-line">Authorised Signatory<br>${esc(co.name)}</div>
    </div>
  </div>
</div>
</div>
</body>
</html>`;
}

// ── Plan metadata — visual only, prices ALWAYS come from backend ──────────────
const PLAN_META = {
  starter: {
    icon: Rocket,
    gradient: "from-cyan-500/20 via-blue-500/10 to-indigo-500/20",
    border: "border-cyan-500/20",
    accent: "cyan",
    badge: "Startup Ready",
    highlight: "Best for startups",
    description:
      "Launch and manage your SaaS operations with essential automation tools.",
    features: [
      { icon: Users,    label: "5 Team Members" },
      { icon: Package,  label: "5 Projects" },
      { icon: Database, label: "50 GB Storage" },
      { icon: Bot,      label: "150K AI Tokens/mo" },
      { icon: Activity, label: "CRM & Leads" },
      { icon: Lock,     label: "Email Support" },
    ],
  },
  growth: {
    icon: Crown,
    gradient: "from-purple-500/20 via-pink-500/10 to-fuchsia-500/20",
    border: "border-purple-500/30",
    accent: "purple",
    badge: "Most Popular",
    highlight: "Fast growing businesses",
    description:
      "Advanced AI-powered growth automation for scaling SaaS companies.",
    popular: true,
    features: [
      { icon: Users,      label: "20 Team Members" },
      { icon: Package,    label: "20 Projects" },
      { icon: Database,   label: "250 GB Storage" },
      { icon: Bot,        label: "600K AI Tokens/mo" },
      { icon: TrendingUp, label: "Analytics & Automation" },
      { icon: Zap,        label: "Campaign Builder" },
      { icon: ShieldCheck,label: "Priority Support" },
    ],
  },
  enterprise: {
    icon: Building2,
    gradient: "from-amber-500/20 via-orange-500/10 to-yellow-500/20",
    border: "border-amber-500/20",
    accent: "amber",
    badge: "Enterprise Scale",
    highlight: "Unlimited scalability",
    description:
      "Enterprise-grade infrastructure with full ERP, integrations and premium SLA.",
    features: [
      { icon: Users,       label: "Unlimited Team" },
      { icon: Package,     label: "Unlimited Projects" },
      { icon: Database,    label: "5 TB Storage" },
      { icon: Bot,         label: "Unlimited AI Tokens" },
      { icon: Layers3,     label: "Full ERP Modules" },
      { icon: ShieldCheck, label: "Dedicated Manager" },
      { icon: Lock,        label: "24/7 Premium Support" },
    ],
  },
};

// Plan prices from backend — never hardcode; these are used ONLY for display
// before backend confirms. The actual charge always comes from the backend.
const PLAN_PRICES = {
  starter:    { monthly: 2999,  yearly: 29990  },
  growth:     { monthly: 7999,  yearly: 79990  },
  enterprise: { monthly: 19999, yearly: 199990 },
};

const PLAN_ORDER = ["starter", "growth", "enterprise"];

// ── Small reusable UI atoms ───────────────────────────────────────────────────

const Pill = memo(({ children, color = "cyan" }) => {
  const cls = {
    cyan:   "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
    green:  "bg-green-500/10 border-green-500/20 text-green-300",
    red:    "bg-red-500/10 border-red-500/20 text-red-300",
    amber:  "bg-amber-500/10 border-amber-500/20 text-amber-300",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-300",
    slate:  "bg-slate-500/10 border-slate-500/20 text-slate-400",
  }[color] || "bg-cyan-500/10 border-cyan-500/20 text-cyan-300";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold border rounded-full ${cls}`}>
      {children}
    </span>
  );
});

const SkeletonBox = memo(({ className = "" }) => (
  <div className={`animate-pulse rounded-2xl bg-white/5 ${className}`} />
));

// ── Toast notification ────────────────────────────────────────────────────────
const TOAST_DURATION = 4500;

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      TOAST_DURATION
    );
  }, []);
  const remove = useCallback(
    (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    []
  );
  return { toasts, add, remove };
}

const ToastContainer = memo(({ toasts, onRemove }) => (
  <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
    <AnimatePresence>
      {toasts.map((t) => {
        const cfg = {
          success: { icon: CheckCircle,     cls: "border-green-500/30 bg-green-500/10 text-green-300" },
          error:   { icon: XCircle,         cls: "border-red-500/30 bg-red-500/10 text-red-300" },
          warning: { icon: AlertTriangle,   cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
          info:    { icon: Info,            cls: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" },
        }[t.type] || { icon: Info, cls: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" };
        const Icon = cfg.icon;
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className={`pointer-events-auto flex items-start gap-3 px-5 py-4 border rounded-2xl backdrop-blur-xl shadow-2xl max-w-sm ${cfg.cls}`}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium leading-relaxed">{t.message}</p>
            <button
              onClick={() => onRemove(t.id)}
              className="ml-2 shrink-0 opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>
));

// ── Skeleton loading states ───────────────────────────────────────────────────
const SubscriptionSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.75fr] gap-8">
      <SkeletonBox className="h-72" />
      <SkeletonBox className="h-72" />
    </div>
    <SkeletonBox className="h-48" />
    <div className="grid xl:grid-cols-3 gap-8">
      <SkeletonBox className="h-96" />
      <SkeletonBox className="h-96" />
      <SkeletonBox className="h-96" />
    </div>
  </div>
);

// ── Error boundary fallback ───────────────────────────────────────────────────
const ErrorDisplay = memo(({ error, onRetry }) => {
  const { code, message } = parseError(error);
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20">
        {code === 0 ? (
          <WifiOff className="text-red-400" size={48} />
        ) : (
          <AlertTriangle className="text-red-400" size={48} />
        )}
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white">
          {code === 0 ? "No Connection" : code === 403 ? "Access Denied" : "Something went wrong"}
        </h2>
        <p className="mt-2 text-slate-400 max-w-md">
          {code === 0
            ? "Cannot reach the server. Check your internet connection."
            : code === 403
            ? "You don't have permission to view this page."
            : message || "An unexpected error occurred."}
        </p>
        {code !== 403 && (
          <Pill color="red">Error {code || "Network"}</Pill>
        )}
      </div>
      {code !== 403 && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-8 py-4 font-semibold text-black rounded-2xl bg-cyan-400 hover:bg-cyan-300 transition-all"
        >
          <RefreshCcw size={18} />
          Try Again
        </button>
      )}
    </div>
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseError(err) {
  if (!err) return { code: 500, message: "Unknown error" };
  const code = err.status || err.response?.status || 0;
  const message =
    err.message ||
    err.response?.data?.message ||
    "An unexpected error occurred";
  return { code, message };
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusColor(status) {
  return {
    active:    "green",
    pending:   "amber",
    cancelled: "red",
    expired:   "red",
    paused:    "slate",
  }[status] || "slate";
}

function paymentColor(status) {
  return {
    paid:     "green",
    pending:  "amber",
    failed:   "red",
    refunded: "purple",
  }[status] || "slate";
}

// ── Billing toggle ────────────────────────────────────────────────────────────
const BillingToggle = memo(({ value, onChange }) => (
  <div className="flex items-center gap-3 p-1.5 border rounded-2xl border-white/10 bg-white/5 backdrop-blur-xl">
    {["monthly", "yearly"].map((cycle) => (
      <button
        key={cycle}
        onClick={() => onChange(cycle)}
        aria-pressed={value === cycle}
        className={`relative px-6 py-2.5 rounded-xl capitalize transition-all font-semibold text-sm ${
          value === cycle
            ? "bg-cyan-400 text-black shadow-lg shadow-cyan-500/20"
            : "text-slate-300 hover:bg-white/5"
        }`}
      >
        {cycle}
        {cycle === "yearly" && (
          <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded-full">
            -17%
          </span>
        )}
      </button>
    ))}
  </div>
));

// ── GST summary inline ────────────────────────────────────────────────────────
const GstLine = memo(({ base }) => {
  const { cgst, sgst, total } = calcGst(base);
  return (
    <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-400 space-y-1">
      <div className="flex justify-between">
        <span>Base price</span>
        <span className="text-white font-medium">{fmtINR(base)}</span>
      </div>
      <div className="flex justify-between">
        <span>CGST (9%)</span>
        <span>{fmtINR(cgst)}</span>
      </div>
      <div className="flex justify-between">
        <span>SGST (9%)</span>
        <span>{fmtINR(sgst)}</span>
      </div>
      <div className="flex justify-between pt-1 border-t border-white/10 font-semibold text-white">
        <span>Grand Total</span>
        <span className="text-cyan-300">{fmtINR(total)}</span>
      </div>
    </div>
  );
});

// ── Payment summary before checkout ──────────────────────────────────────────
const PaymentSummary = memo(({ plan, billingCycle, onConfirm, onCancel, loading }) => {
  const meta = PLAN_META[plan];
  const base = PLAN_PRICES[plan]?.[billingCycle] || 0;
  const { cgst, sgst, total } = calcGst(base);
  if (!meta) return null;
  const PlanIcon = meta.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400">
          <PlanIcon size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-400">Selected Plan</p>
          <h3 className="text-lg font-bold capitalize">{plan} Plan</h3>
        </div>
        <div className="ml-auto">
          <Pill color="cyan">{billingCycle}</Pill>
        </div>
      </div>

      <div className="space-y-3 p-5 rounded-2xl bg-white/5 border border-white/10">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Order Summary
        </h4>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Plan ({billingCycle})</span>
          <span className="font-medium">{fmtINR(base)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">CGST @ 9%</span>
          <span>{fmtINR(cgst)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">SGST @ 9%</span>
          <span>{fmtINR(sgst)}</span>
        </div>
        <div className="flex justify-between pt-3 border-t border-white/10">
          <span className="font-semibold">Grand Total (INR)</span>
          <span className="text-xl font-black text-cyan-300">{fmtINR(total)}</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300 flex items-start gap-3">
        <Info size={16} className="mt-0.5 shrink-0" />
        <span>
          Payment is processed via PayPal. You will be redirected to complete the payment.
          A GST invoice (INR) will be generated upon successful payment.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center justify-center gap-2 py-4 font-bold text-black transition-all rounded-2xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" />Processing...</>
          ) : (
            <><CreditCard size={18} />Pay via PayPal</>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="py-4 font-semibold transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

// ── Plan Card ─────────────────────────────────────────────────────────────────
const PlanCard = memo(({ planKey, billingCycle, activePlanKey, subscriptionStatus, onSelect, isProcessing }) => {
  const meta = PLAN_META[planKey];
  const prices = PLAN_PRICES[planKey];
  if (!meta || !prices) return null;

  const base = billingCycle === "yearly" ? prices.yearly : prices.monthly;
  const PlanIcon = meta.icon;
  const isCurrent = activePlanKey === planKey;
  const isPopular = meta.popular;

  const activeIdx = PLAN_ORDER.indexOf(activePlanKey);
  const thisIdx = PLAN_ORDER.indexOf(planKey);
  const isUpgrade = activeIdx >= 0 && thisIdx > activeIdx;
  const isDowngrade = activeIdx >= 0 && thisIdx < activeIdx;
  const isRenew = !isCurrent && (subscriptionStatus === "cancelled" || subscriptionStatus === "expired");
  const planLabel = planKey.charAt(0).toUpperCase() + planKey.slice(1);

  const yearlySaving =
    billingCycle === "yearly"
      ? round2(prices.monthly * 12 - prices.yearly)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isCurrent ? { y: -8 } : {}}
      className={`relative overflow-hidden rounded-[34px] border ${meta.border} bg-gradient-to-br ${meta.gradient} backdrop-blur-2xl p-8 flex flex-col ${
        isCurrent ? "ring-2 ring-cyan-400/40 ring-offset-2 ring-offset-transparent" : ""
      }`}
    >
      {/* Glow orb */}
      <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Badges row */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/10">
          <PlanIcon size={28} />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {isCurrent && (
            <Pill color="green"><BadgeCheck size={12} /> Current Plan</Pill>
          )}
          {isPopular && !isCurrent && (
            <Pill color="purple"><Star size={12} /> {meta.badge}</Pill>
          )}
          {!isPopular && !isCurrent && (
            <Pill color="slate">{meta.badge}</Pill>
          )}
          {yearlySaving > 0 && (
            <Pill color="green">Save {fmtINR(yearlySaving)}/yr</Pill>
          )}
        </div>
      </div>

      {/* Plan name */}
      <div className="relative z-10">
        <h3 className="text-3xl font-black capitalize">{planKey}</h3>
        <p className="mt-1 text-sm text-cyan-300">{meta.highlight}</p>
        <p className="mt-3 text-sm leading-7 text-slate-300">{meta.description}</p>
      </div>

      {/* Price */}
      <div className="relative z-10 mt-6">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-black">{fmtINR(base)}</span>
          <span className="pb-1.5 text-slate-400 text-sm">
            /{billingCycle === "monthly" ? "mo" : "yr"}
          </span>
        </div>
        <GstLine base={base} />
      </div>

      {/* Features */}
      <ul className="relative z-10 mt-6 space-y-3 flex-1">
        {meta.features.map(({ icon: FIcon, label }, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-white/5">
              <FIcon size={13} className="text-cyan-300" />
            </div>
            <span className="text-sm text-slate-200">{label}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="relative z-10 mt-8">
        {isCurrent ? (
          <div className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-sm">
            <CheckCircle2 size={16} className="text-green-400" />
            Current Plan
          </div>
        ) : (
          <button
            onClick={() => onSelect(planKey)}
            disabled={isProcessing}
            className="flex items-center justify-center w-full gap-2 py-4 font-bold text-black transition-all rounded-2xl bg-cyan-400 hover:bg-cyan-300 hover:scale-[1.02] shadow-lg shadow-cyan-500/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label={`${isUpgrade ? `Upgrade to ${planLabel}` : isDowngrade ? `Switch to ${planLabel}` : isRenew ? "Renew subscription" : `Get started with ${planLabel}`}`}
          >
            {isProcessing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isUpgrade ? (
              <ArrowUpCircle size={18} />
            ) : isRenew ? (
              <RotateCcw size={18} />
            ) : (
              <ArrowRight size={18} />
            )}
            {isProcessing
              ? "Processing..."
              : isUpgrade
              ? `Upgrade to ${planLabel}`
              : isDowngrade
              ? `Downgrade to ${planLabel}`
              : isRenew
              ? "Renew Subscription"
              : "Get Started"}
          </button>
        )}
      </div>
    </motion.div>
  );
});

// ── Full-screen invoice preview modal ────────────────────────────────────────
// SubscriptionInvoiceModal — single source: both "preview" and "save as PDF"
// render from the exact same buildSubscriptionInvoiceHTML(sub) call.
// No backend endpoint, no separate PDF template, no duplicate HTML.
function SubscriptionInvoiceModal({ sub, onClose }) {
  const html      = useMemo(() => buildSubscriptionInvoiceHTML(sub), [sub]);
  const iframeRef = useRef(null);

  // Trigger browser native print-to-PDF on the rendered iframe content.
  // This is the SAME renderer used for the preview, guaranteeing identical output.
  const handleSaveAsPDF = () => iframeRef.current?.contentWindow?.print();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <Receipt size={18} className="text-cyan-400" />
          <span className="text-white font-semibold text-sm font-mono">
            {sub.invoice?.invoiceId || "Invoice Preview"}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            sub.paymentStatus === "paid"
              ? "bg-green-500/20 text-green-400"
              : "bg-amber-500/20 text-amber-400"
          }`}>
            {(sub.paymentStatus || "pending").toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveAsPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors"
          >
            <Download size={15} />
            Save as PDF
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close invoice preview"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      {/* Preview — same HTML as Save as PDF — guaranteed identical */}
      <div className="flex-1 bg-slate-800 overflow-hidden">
        <iframe
          ref={iframeRef}
          srcDoc={html}
          title="Invoice Preview"
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-popups allow-modals"
        />
      </div>
    </div>
  );
}

// ── Current subscription dashboard card ──────────────────────────────────────
const CurrentPlanCard = memo(({ sub, onCancel, onRenew, onInvoice, onViewInvoice, loadingAction }) => {
  if (!sub) return null;

  const days = daysUntil(sub.renewalDate);
  const isExpiringSoon = days !== null && days <= 7 && sub.status === "active";
  const meta = PLAN_META[sub.plan] || PLAN_META.starter;
  const PlanIcon = meta.icon;

  const inrPrice = PLAN_PRICES[sub.plan]?.[sub.billingCycle] || sub.amount || 0;
  const gst = calcGst(inrPrice);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden border rounded-[32px] border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-slate-900 p-8"
    >
      <div className="absolute right-0 top-0 w-52 h-52 bg-cyan-400/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              <PlanIcon size={32} />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 mb-1">
                <Pill color="cyan"><Sparkles size={11} /> Active Subscription</Pill>
              </div>
              <h2 className="text-3xl font-black capitalize">{sub.plan} Plan</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill color={statusColor(sub.status)}>
              {sub.status?.toUpperCase()}
            </Pill>
            <Pill color={paymentColor(sub.paymentStatus)}>
              {sub.paymentStatus?.toUpperCase()}
            </Pill>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <MiniStat
            icon={CalendarDays}
            label="Started"
            value={fmtDate(sub.startedAt || sub.createdAt)}
          />
          <MiniStat
            icon={CalendarDays}
            label="Renews"
            value={fmtDate(sub.renewalDate)}
            urgent={isExpiringSoon}
          />
          <MiniStat
            icon={Clock3}
            label="Days Left"
            value={days !== null ? `${days}d` : "—"}
            urgent={isExpiringSoon}
          />
          <MiniStat
            icon={CreditCard}
            label="Billing"
            value={sub.billingCycle === "yearly" ? "Yearly" : "Monthly"}
          />
        </div>

        {/* Pricing breakdown */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">
              Billing Breakdown
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Plan Price</span>
                <span className="font-medium">{fmtINR(inrPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CGST (9%)</span>
                <span>{fmtINR(gst.cgst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SGST (9%)</span>
                <span>{fmtINR(gst.sgst)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 font-bold">
                <span>Grand Total</span>
                <span className="text-cyan-300">{fmtINR(gst.total)}</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">
              Plan Limits
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Team Members</span>
                <span className="font-medium">{sub.teamMembers || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Projects</span>
                <span>{sub.projectsIncluded || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gateway</span>
                <span className="capitalize">{sub.paymentGateway || "manual"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Auto Renew</span>
                <span className={sub.autoRenew ? "text-green-400" : "text-slate-400"}>
                  {sub.autoRenew ? "On" : "Off"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice number if present */}
        {sub.invoice?.invoiceId && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-white/5 border border-white/10 text-sm">
            <Receipt size={16} className="text-cyan-300 shrink-0" />
            <span className="text-slate-400">Invoice:</span>
            <span className="font-mono font-semibold text-white">{sub.invoice.invoiceId}</span>
            <span className="ml-auto text-slate-500 text-xs">{fmtDate(sub.invoice.generatedAt)}</span>
          </div>
        )}

        {/* Expiry warning */}
        {isExpiringSoon && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
            <AlertTriangle size={16} className="shrink-0" />
            Your subscription expires in {days} day{days !== 1 ? "s" : ""}. Renew now to avoid interruption.
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <ActionButton
            icon={Eye}
            label="View Invoice"
            loadingLabel="Loading..."
            loading={false}
            onClick={onViewInvoice}
            disabled={sub.paymentStatus !== "paid"}
            variant="secondary"
          />
          <ActionButton
            icon={Download}
            label="Download Invoice"
            loadingLabel="Downloading..."
            loading={loadingAction === "invoice"}
            onClick={onInvoice}
            disabled={sub.paymentStatus !== "paid"}
          />

          {(sub.status === "cancelled" || sub.status === "expired") && (
            <ActionButton
              icon={RotateCcw}
              label="Reactivate"
              loadingLabel="Reactivating..."
              loading={loadingAction === "renew"}
              onClick={onRenew}
              variant="secondary"
            />
          )}

          {sub.status === "active" && (
            <ActionButton
              icon={XCircle}
              label="Cancel Subscription"
              loadingLabel="Cancelling..."
              loading={loadingAction === "cancel"}
              onClick={onCancel}
              variant="danger"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
});

const MiniStat = memo(({ icon: Icon, label, value, urgent = false }) => (
  <div className={`p-4 rounded-2xl border ${urgent ? "bg-amber-500/10 border-amber-500/20" : "bg-white/5 border-white/10"}`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} className={urgent ? "text-amber-400" : "text-cyan-400"} />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
    <p className={`font-bold text-sm ${urgent ? "text-amber-300" : "text-white"}`}>{value}</p>
  </div>
));

const ActionButton = memo(({ icon: Icon, label, loadingLabel, loading, onClick, variant = "primary", disabled }) => {
  const cls = {
    primary:   "bg-cyan-400 hover:bg-cyan-300 text-black",
    secondary: "bg-white/10 hover:bg-white/15 border border-white/10 text-white",
    danger:    "bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all ${cls} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
      {loading ? loadingLabel : label}
    </button>
  );
});

// ── Audit / payment history table ─────────────────────────────────────────────
const PaymentHistory = memo(({ logs }) => {
  if (!logs?.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-slate-500">
        <Receipt size={36} />
        <p className="text-sm">No payment records found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 text-xs uppercase tracking-wider">
            <th className="text-left pb-4 pr-4">Date</th>
            <th className="text-left pb-4 pr-4">Event</th>
            <th className="text-left pb-4 pr-4">Plan</th>
            <th className="text-left pb-4">Details</th>
          </tr>
        </thead>
        <tbody className="space-y-2">
          {logs.map((log, i) => (
            <tr key={i} className="border-t border-white/5">
              <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">
                {fmtDate(log.timestamp || log.createdAt)}
              </td>
              <td className="py-3 pr-4 font-medium text-white capitalize">
                {(log.event || log.action || "—").replace(/_/g, " ")}
              </td>
              <td className="py-3 pr-4 capitalize text-slate-300">
                {log.plan || "—"}
              </td>
              <td className="py-3 text-slate-400 text-xs max-w-xs truncate">
                {log.details || log.note || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// ── Confirmation dialog ───────────────────────────────────────────────────────
const ConfirmDialog = memo(({ open, title, message, danger, onConfirm, onCancel, loading }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md p-8 border rounded-[32px] bg-[#0B1220] border-white/10 shadow-2xl"
        >
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 ${danger ? "bg-red-500/10 text-red-400" : "bg-cyan-500/10 text-cyan-400"}`}>
            {danger ? <AlertTriangle size={28} /> : <Info size={28} />}
          </div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">{message}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex items-center justify-center gap-2 py-3.5 font-bold rounded-2xl transition-all disabled:opacity-60 ${
                danger
                  ? "bg-red-500 hover:bg-red-400 text-white"
                  : "bg-cyan-400 hover:bg-cyan-300 text-black"
              }`}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Processing..." : "Confirm"}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="py-3.5 font-semibold border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
));

// ── Checkout modal ────────────────────────────────────────────────────────────
// Key prop from parent resets step to "summary" on every new open/plan change.
const CheckoutModal = memo(({ open, plan, billingCycle, onConfirm, onClose, loading }) => {
  const [step, setStep] = useState("summary"); // "summary" | "success"

  const handleConfirm = async () => {
    const ok = await onConfirm();
    if (ok) setStep("success");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={step === "summary" && !loading ? onClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden border rounded-[36px] bg-[#0B1220] border-white/10 shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-60 h-60 bg-cyan-500/10 blur-[120px] pointer-events-none" />

            <div className="relative z-10 p-8">
              {step === "summary" && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black capitalize">
                      {plan} Plan Checkout
                    </h2>
                    {!loading && (
                      <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-white/10 text-slate-400"
                        aria-label="Close"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  <PaymentSummary
                    plan={plan}
                    billingCycle={billingCycle}
                    onConfirm={handleConfirm}
                    onCancel={onClose}
                    loading={loading}
                  />
                </>
              )}

              {step === "success" && (
                <div className="flex flex-col items-center gap-5 py-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center"
                  >
                    <CheckCircle size={40} className="text-green-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Payment Initiated!</h2>
                    <p className="mt-2 text-slate-400">
                      Your PayPal order has been created. Complete the payment in the PayPal window.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-8 py-3.5 font-bold text-black rounded-2xl bg-cyan-400 hover:bg-cyan-300 transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ── Section card wrapper ──────────────────────────────────────────────────────
const SectionCard = memo(({ title, subtitle, icon: Icon, children, action }) => (
  <div className="relative overflow-hidden border rounded-[32px] border-white/10 bg-white/5 backdrop-blur-2xl p-8">
    <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/5 blur-[80px] pointer-events-none" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Icon size={18} />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  </div>
));

// ── No subscription empty state ───────────────────────────────────────────────
const NoSubscriptionBanner = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col sm:flex-row items-center gap-5 p-6 rounded-[28px] border border-amber-500/20 bg-amber-500/5 mb-8"
  >
    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 shrink-0">
      <Package size={28} />
    </div>
    <div>
      <h3 className="font-bold text-lg">No Active Subscription</h3>
      <p className="text-sm text-slate-400 mt-1">
        Choose a plan below to get started. Your subscription unlocks CRM, AI tools, analytics and more.
      </p>
    </div>
    <Pill color="amber">Not Subscribed</Pill>
  </motion.div>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function Subscription() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [sub, setSub] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [loadingAction, setLoadingAction] = useState("");
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const { toasts, add: toast, remove: removeToast } = useToast();
  const abortRef = useRef(null);

  // ── Prevent double-click payments ────────────────────────────────────────────
  const paymentInFlight = useRef(false);

  // ── Load subscription ─────────────────────────────────────────────────────────
  const fetchSubscription = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await getMySubscription(controller.signal);
      setSub(res?.data?.data || null);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      const { code } = parseError(err);
      if (code === 404) {
        // No subscription — not an error, just show the plans
        setSub(null);
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load audit logs on demand ─────────────────────────────────────────────────
  const fetchAuditLogs = useCallback(async () => {
    if (!sub?._id) return;
    setHistoryLoading(true);
    try {
      const res = await getAuditLogs(sub._id);
      setAuditLogs(res?.data?.data || []);
    } catch {
      setAuditLogs([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [sub?._id]);

  useEffect(() => {
    if (showHistory && sub?._id && !auditLogs.length) {
      fetchAuditLogs();
    }
  }, [showHistory, sub?._id, auditLogs.length, fetchAuditLogs]);

  // ── Auth guard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetchSubscription();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchSubscription, token]);

  // ── Select plan → open checkout ───────────────────────────────────────────────
  const handleSelectPlan = useCallback((planKey) => {
    if (sub?.status === "active" && sub?.plan === planKey) {
      toast("This is your current active plan.", "info");
      return;
    }
    setCheckoutPlan(planKey);
    setShowCheckout(true);
  }, [sub, toast]);

  // ── Full PayPal checkout flow ─────────────────────────────────────────────────
  const handleCheckoutConfirm = useCallback(async () => {
    if (paymentInFlight.current) {
      toast("A payment is already in progress.", "warning");
      return false;
    }
    if (!checkoutPlan) return false;

    // Resolve the active user. If companyId is missing from in-memory state
    // (stale pre-fix session, or init() race), silently call /auth/me which
    // will trigger the middleware to auto-create the company and return it.
    // We never hard-block here — if companyId is still null after the refresh
    // the backend resolves it from req.user.companyId and returns a clear error.
    let activeUser = user;
    if (!activeUser?.companyId) {
      activeUser = (await refreshUser()) || user;
    }

    paymentInFlight.current = true;
    setCheckoutLoading(true);

    try {
      // Step 1: Create intent — passes companyId (may be null; backend has fallback)
      const intentRes = await createIntent({
        companyId:   activeUser?.companyId,
        clientName:  activeUser?.name  || activeUser?.email,
        clientEmail: activeUser?.email,
        plan:        checkoutPlan,
        billingCycle,
      });
      const subscriptionId = intentRes?.data?.data?._id;
      if (!subscriptionId) throw new Error("Failed to create subscription intent.");

      // Step 2: Create PayPal order
      const orderRes    = await createPayPalOrder(subscriptionId);
      const orderId     = orderRes?.data?.data?.orderId;
      const approvalUrl = orderRes?.data?.data?.approvalUrl;

      if (!orderId)     throw new Error("Failed to create PayPal order.");
      if (!approvalUrl) throw new Error("No PayPal approval URL received. Please try again.");

      // Step 3: Full-page redirect to PayPal
      // Backend sets return_url/cancel_url — not compatible with popup flow.
      // Store context so /billing/payment-success can reference plan/cycle on return.
      sessionStorage.setItem(
        "paypal_pending",
        JSON.stringify({ orderId, subscriptionId, plan: checkoutPlan, billingCycle, ts: Date.now() })
      );
      window.location.href = approvalUrl;
      // paymentInFlight stays true — page is navigating away immediately
      return true;
    } catch (err) {
      const { code, message } = parseError(err);
      const displayMsg =
        code === 410
          ? message || "Checkout session expired. Please select your plan again."
          : code === 409
          ? message || "A subscription conflict occurred. Please refresh and try again."
          : code === 429
          ? "Too many requests. Please wait a moment and try again."
          : code === 422
          ? "Payment validation failed. Check your details."
          : message || "Payment failed. Please try again.";
      toast(displayMsg, "error");
      setCheckoutLoading(false);
      paymentInFlight.current = false;
      return false;
    }
  }, [checkoutPlan, billingCycle, user, refreshUser, toast]);

  // ── Cancel subscription ───────────────────────────────────────────────────────
  const openCancelDialog = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: "Cancel Subscription",
      message:
        "Your subscription will remain active until the current billing period ends. After that, access to all paid features will be revoked. This action cannot be undone.",
      danger: true,
      action: "cancel",
    });
  }, []);

  // ── Reactivate subscription ───────────────────────────────────────────────────
  const openRenewDialog = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: "Reactivate Subscription",
      message: "Your subscription will be reactivated and billing will resume from today.",
      danger: false,
      action: "renew",
    });
  }, []);

  const handleConfirmAction = useCallback(async () => {
    const action = confirmDialog.action;
    if (!sub?._id) return;

    setLoadingAction(action);
    const controller = new AbortController();

    try {
      if (action === "cancel") {
        await apiCancelSubscription(sub._id, controller.signal);
        toast("Subscription cancelled successfully.", "success");
      } else if (action === "renew") {
        await apiReactivateSubscription(sub._id, controller.signal);
        toast("Subscription reactivated successfully!", "success");
      }
      await fetchSubscription();
    } catch (err) {
      const { message } = parseError(err);
      toast(message || `${action} failed. Please try again.`, "error");
    } finally {
      setLoadingAction("");
      setConfirmDialog({ open: false });
    }
  }, [confirmDialog, sub?._id, fetchSubscription, toast]);

  // ── Invoice print-to-PDF ──────────────────────────────────────────────────────
  // Generates the same HTML as the View Invoice preview and triggers the
  // browser's native print dialog (user selects "Save as PDF"). This guarantees
  // the download is pixel-identical to the preview — no backend Puppeteer needed.
  const handleInvoiceDownload = useCallback(() => {
    if (!sub) {
      toast("No active subscription found.", "warning");
      return;
    }
    if (sub.paymentStatus !== "paid") {
      toast("Invoice is only available for paid subscriptions.", "warning");
      return;
    }

    const html = buildSubscriptionInvoiceHTML(sub);

    // Hidden off-screen iframe — avoids popup blockers, same engine as preview
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none";
    iframe.srcdoc = html;
    document.body.appendChild(iframe);

    const cleanup = () => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    };

    iframe.onload = () => {
      try {
        iframe.contentWindow.print();
      } catch {
        // ignore — print dialog may throw in some environments
      }
      setTimeout(cleanup, 3000);
    };

    // Fallback if onload doesn't fire (rare)
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        try { iframe.contentWindow.print(); } catch { /* ignore */ }
        setTimeout(cleanup, 3000);
      }
    }, 1800);
  }, [sub, toast]);

  // ── Memoized plan order ───────────────────────────────────────────────────────
  const planKeys = useMemo(() => PLAN_ORDER, []);

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white overflow-hidden">
        <div className="fixed inset-0 pointer-events-none opacity-30">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/20 blur-[140px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/20 blur-[140px] rounded-full" />
        </div>
        <div className="relative z-10 px-6 py-8 lg:px-12">
          <SubscriptionSkeleton />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#030712] text-white">
        <div className="relative z-10 px-6 py-8 lg:px-12">
          <ErrorDisplay error={error} onRetry={fetchSubscription} />
        </div>
      </div>
    );
  }

  const currentPlanKey = sub?.status === "active" ? sub.plan : null;

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/20 blur-[140px] rounded-full" />
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="relative z-10 px-6 py-8 lg:px-12 space-y-10 max-w-[1600px] mx-auto">

        {/* ── PAGE HEADER ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden border border-cyan-500/10 rounded-[36px] bg-gradient-to-br from-[#0f172a]/95 via-[#111827]/95 to-[#020617] p-8 lg:p-10 shadow-[0_0_80px_rgba(6,182,212,0.08)] backdrop-blur-3xl"
        >
          <div className="absolute top-[-60px] right-[-60px] w-72 h-72 bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-80px] left-[-80px] w-72 h-72 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Pill color="cyan"><Sparkles size={11} /> Subscription Management</Pill>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">
                Billing & Plans
              </h1>
              <p className="mt-3 text-slate-300 max-w-2xl leading-relaxed">
                Manage your subscription, upgrade your plan, download invoices, and view your billing history from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                onClick={fetchSubscription}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-3 font-semibold text-black transition-all rounded-2xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-sm"
                aria-label="Refresh"
              >
                <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
            {[
              { icon: Zap,         title: "AI Automation",       desc: "Smart Workflows" },
              { icon: ShieldCheck, title: "Enterprise Security", desc: "Protected Systems" },
              { icon: BarChart3,   title: "Real-time Analytics", desc: "Advanced Insights" },
            ].map(({ icon: FIcon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                  <FIcon size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{title}</p>
                  <p className="font-semibold text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── NO SUBSCRIPTION BANNER ─────────────────────────────────── */}
        {!sub && <NoSubscriptionBanner />}

        {/* ── CURRENT PLAN DASHBOARD ─────────────────────────────────── */}
        {sub && showInvoiceModal && (
          <SubscriptionInvoiceModal
            sub={sub}
            onClose={() => setShowInvoiceModal(false)}
          />
        )}
        {sub && (
          <CurrentPlanCard
            sub={sub}
            onCancel={openCancelDialog}
            onRenew={openRenewDialog}
            onInvoice={handleInvoiceDownload}
            onViewInvoice={() => setShowInvoiceModal(true)}
            loadingAction={loadingAction}
          />
        )}

        {/* ── PAYMENT HISTORY (collapsible) ──────────────────────────── */}
        {sub && (
          <SectionCard
            title="Payment History"
            subtitle="Audit trail for this subscription"
            icon={Receipt}
            action={
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                aria-expanded={showHistory}
              >
                {showHistory ? "Hide" : "Show"}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${showHistory ? "rotate-180" : ""}`}
                />
              </button>
            }
          >
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
                      <Loader2 size={20} className="animate-spin" />
                      Loading history...
                    </div>
                  ) : (
                    <PaymentHistory logs={auditLogs} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>
        )}

        {/* ── PLANS SECTION ──────────────────────────────────────────── */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-slate-400">Flexible Pricing Plans</p>
              <h2 className="mt-1 text-3xl font-bold">
                {sub?.status === "active" ? "Upgrade or Change Plan" : "Choose Your Plan"}
              </h2>
            </div>
            <BillingToggle value={billingCycle} onChange={setBillingCycle} />
          </div>

          <div className="grid gap-8 xl:grid-cols-3">
            {planKeys.map((key, idx) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <PlanCard
                  planKey={key}
                  billingCycle={billingCycle}
                  activePlanKey={currentPlanKey}
                  subscriptionStatus={sub?.status || null}
                  onSelect={handleSelectPlan}
                  isProcessing={checkoutLoading && checkoutPlan === key}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── ENTERPRISE FEATURE HIGHLIGHTS ──────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              icon:  Layers3,
              title: "Enterprise Integrations",
              desc:  "Connect CRM, ERP, automation tools and analytics systems seamlessly.",
            },
            {
              icon:  CircleDollarSign,
              title: "Revenue Optimization",
              desc:  "Track recurring revenue, churn and customer lifetime value with precision.",
            },
            {
              icon:  MessageSquare,
              title: "24/7 Premium Support",
              desc:  "Dedicated support engineers and onboarding specialists for enterprise customers.",
            },
          ].map(({ icon: FIcon, title, desc }) => (
            <motion.div
              key={title}
              whileHover={{ y: -8 }}
              className="relative overflow-hidden p-8 border rounded-[32px] bg-white/5 border-white/10 backdrop-blur-2xl"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/5 blur-[80px] pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-center w-14 h-14 mb-6 rounded-3xl bg-cyan-500/10 text-cyan-400">
                  <FIcon size={26} />
                </div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-3 leading-7 text-slate-400 text-sm">{desc}</p>
                <button className="flex items-center gap-2 mt-5 text-sm font-semibold text-cyan-300 hover:text-cyan-200 transition-colors">
                  Learn More <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── CHECKOUT MODAL ─────────────────────────────────────────────── */}
      <CheckoutModal
        key={showCheckout ? checkoutPlan : "closed"}
        open={showCheckout}
        plan={checkoutPlan}
        billingCycle={billingCycle}
        onConfirm={handleCheckoutConfirm}
        onClose={() => {
          if (!checkoutLoading) setShowCheckout(false);
        }}
        loading={checkoutLoading}
        user={user}
      />

      {/* ── CONFIRMATION DIALOGS ────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        danger={confirmDialog.danger}
        loading={!!loadingAction}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog({ open: false })}
      />
    </div>
  );
}
