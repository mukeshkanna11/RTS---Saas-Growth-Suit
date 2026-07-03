// src/pages/Invoice.jsx
// Admin Invoice Management Dashboard — preview uses exact backend HTML template

import { useEffect, useMemo, useState, useCallback } from "react";
import API from "../api/axios";
import {
  Download,
  Search,
  Plus,
  FileText,
  CheckCircle,
  Clock,
  IndianRupee,
  Trash2,
  Eye,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

// ── Safe number helpers (mirror backend safeNum / round2) ────────────────────
const safeNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const round2  = (v) => Math.round((safeNum(v) + Number.EPSILON) * 100) / 100;
const fmtINR  = (n) =>
  `₹${safeNum(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Build invoice HTML — exact port of modules/invoice/invoice.template.js ───
function buildInvoiceHTML(data = {}) {
  const CURRENCY_SYMBOL = { INR: "&#8377;", USD: "$" };

  const fmt = (amount, currency = "INR") => {
    const n = round2(safeNum(amount));
    const symbol = CURRENCY_SYMBOL[currency] ?? "&#8377;";
    const locale = currency === "USD" || currency === "$" ? "en-US" : "en-IN";
    return `${symbol}${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fmtDate = (d) => {
    if (!d) return "&#8212;";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "&#8212;";
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const esc = (s) =>
    String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const normaliseTax = (d) => {
    const t = d.tax || {};
    return {
      cgstPct: safeNum(d.cgst ?? t.cgst ?? 9),
      sgstPct: safeNum(d.sgst ?? t.sgst ?? 9),
      igstPct: safeNum(d.igst ?? t.igst ?? 0),
      taxType: d.taxType || t.type || "intra",
    };
  };

  const normaliseDiscount = (d) => {
    if (typeof d.discount === "number") return safeNum(d.discount);
    if (d.discount?.value !== undefined) return safeNum(d.discount.value);
    return 0;
  };

  const calcTotals = (items = [], discountArg = 0, taxArg = {}) => {
    const tax = { cgst: safeNum(taxArg.cgst ?? 9), sgst: safeNum(taxArg.sgst ?? 9), igst: safeNum(taxArg.igst ?? 0) };
    const discPct = typeof discountArg === "number" ? safeNum(discountArg) : safeNum(discountArg?.value);
    const subtotal    = round2(items.reduce((s, i) => s + safeNum(i.qty || 1) * safeNum(i.price || 0), 0));
    const discountAmt = round2(Math.min((subtotal * discPct) / 100, subtotal));
    const taxable     = round2(subtotal - discountAmt);
    const cgst        = round2((taxable * tax.cgst) / 100);
    const sgst        = round2((taxable * tax.sgst) / 100);
    const igst        = round2((taxable * tax.igst) / 100);
    const taxTotal    = round2(cgst + sgst + igst);
    return { subtotal, discountAmount: discountAmt, discountPercent: discPct, taxable, cgst, sgst, igst, taxTotal, total: round2(taxable + taxTotal) };
  };

  const {
    company       = {},
    customer      = {},
    items         = [],
    paymentStatus = "PENDING",
    invoiceId     = `INV-${Date.now()}`,
    logoBase64    = "",
  } = data;

  const currency = data.currency || "INR";
  const fmtCur   = (amount) => fmt(amount, currency);

  const { cgstPct, sgstPct, igstPct, taxType } = normaliseTax(data);
  const discountPct = normaliseDiscount(data);

  const hasTotals = data.totals && safeNum(data.totals.subtotal) >= 0;
  const totals = hasTotals
    ? {
        subtotal:        safeNum(data.totals.subtotal),
        discountAmount:  safeNum(data.totals.discountAmount),
        discountPercent: safeNum(data.totals.discountPercent ?? discountPct),
        taxable:         safeNum(data.totals.taxable),
        cgst:            safeNum(data.totals.cgst),
        sgst:            safeNum(data.totals.sgst),
        igst:            safeNum(data.totals.igst),
        taxTotal:        safeNum(data.totals.taxTotal),
        total:           safeNum(data.totals.total),
      }
    : calcTotals(Array.isArray(items) ? items : [], discountPct, { cgst: cgstPct, sgst: sgstPct, igst: igstPct });

  const now          = new Date();
  const orderDate    = data.orderDate    || data.order_date    || data.createdAt || now;
  const purchaseDate = data.purchaseDate || data.purchase_date || data.createdAt || now;
  const paymentDate  = data.paymentDate  || data.payment_date  || null;
  const dueDate      = data.dueDate      || data.due_date      || null;

  const payStatus = (paymentStatus || "PENDING").toString().toUpperCase();
  const sColor    = payStatus === "PAID" ? "#16a34a" : payStatus === "FAILED" ? "#dc2626" : "#d97706";
  const sIcon     = payStatus === "PAID" ? "&#10003;&nbsp;PAID" : payStatus === "FAILED" ? "&#10007;&nbsp;FAILED" : "&#9679;&nbsp;PENDING";

  const co = {
    name:    esc(company.name    || "ReadyTech Solutions Pvt Ltd"),
    address: esc(company.address || "Coimbatore, Tamil Nadu, India"),
    email:   esc(company.email   || "support@readytechsolutions.in"),
    phone:   esc(company.phone   || "+91-9876543210"),
    website: esc(company.website || "https://readytechsolutions.com"),
    gstin:   esc(company.gstin   || "33ABCDE1234F1Z5"),
    pan:     esc(company.pan     || ""),
  };

  const cu = {
    name:    esc(customer.name    || "Customer"),
    company: esc(customer.company || ""),
    email:   esc(customer.email   || ""),
    phone:   esc(customer.phone   || ""),
    address: esc(customer.address || "India"),
    gstin:   esc(customer.gstin   || ""),
    state:   esc(customer.state   || "Tamil Nadu"),
    country: esc(customer.country || "India"),
  };

  const safeItems = Array.isArray(items) ? items : [];
  const itemRows  = safeItems.map((item, i) => `
    <tr>
      <td style="text-align:center;color:#94a3b8;font-weight:600;font-size:11px">${i + 1}</td>
      <td>
        <div style="font-weight:700;color:#0f172a">${esc(item.name || item.description || "Service")}</div>
        ${(item.description && item.description !== item.name)
          ? `<div style="font-size:9.5px;color:#64748b;margin-top:2px">${esc(item.description)}</div>`
          : ""}
      </td>
      <td style="text-align:center;color:#64748b;font-family:monospace;font-size:9.5px">${esc(item.hsn || "998314")}</td>
      <td style="text-align:center;font-weight:600">${safeNum(item.qty || 1)}</td>
      <td style="text-align:right">${fmtCur(item.price)}</td>
      <td style="text-align:right;font-weight:700;color:#1a3c5e">${fmtCur(safeNum(item.qty || 1) * safeNum(item.price || 0))}</td>
    </tr>`).join("");

  const qrEnc = encodeURIComponent(`Invoice:${invoiceId}|Amt:${totals.total}|Status:${payStatus}`);
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
.page{width:210mm;min-height:297mm;background:#fff;margin:0 auto}
.hdr{background:linear-gradient(135deg,#1a3c5e 0%,#1e40af 55%,#0d9488 100%);padding:28px 36px 22px;color:#fff;position:relative;overflow:hidden}
.hdr::before{content:"";position:absolute;top:-70px;right:-70px;width:260px;height:260px;background:rgba(255,255,255,.04);border-radius:50%}
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
.kv-mono{font-family:"Courier New",monospace;font-size:9px}
.tbl-wrap{border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:18px}
.inv-tbl{width:100%;border-collapse:collapse}
.inv-tbl thead tr{background:linear-gradient(135deg,#1a3c5e,#1e40af)}
.inv-tbl thead th{padding:10px 12px;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.9);text-align:left}
.inv-tbl thead th.r{text-align:right}.inv-tbl thead th.c{text-align:center}
.inv-tbl tbody tr:nth-child(even){background:#f8fafc}
.inv-tbl tbody td{padding:10px 12px;font-size:11px;border-bottom:1px solid #e2e8f0;vertical-align:middle}
.inv-tbl tbody tr:last-child td{border-bottom:none}
.totals-box{width:288px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-left:auto;margin-bottom:18px}
.t-row{display:flex;justify-content:space-between;align-items:center;padding:9px 16px;border-bottom:1px solid #e2e8f0;background:#fff}
.t-lbl{font-size:11px;color:#64748b}.t-val{font-size:11px;font-weight:600;color:#0f172a}
.t-discount .t-val{color:#dc2626}
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
@media print{body{background:#fff}.page{width:100%;min-height:auto;box-shadow:none}}
${payStatus !== "PAID" ? ".wm{position:fixed;top:45%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:88px;font-weight:900;color:rgba(220,38,38,.05);letter-spacing:10px;pointer-events:none;white-space:nowrap}" : ""}
</style>
</head>
<body>
<div class="page">
${payStatus !== "PAID" ? `<div class="wm">${payStatus}</div>` : ""}

<!-- HEADER -->
<div class="hdr">
  <div class="hdr-inner">
    <div>
      ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" style="height:40px;margin-bottom:8px;display:block" alt="logo">` : ""}
      <div class="co-name">${co.name}</div>
      <div class="co-info">${co.address}<br>${co.email} &bull; ${co.phone}<br>${co.website}</div>
      <div class="co-badge">GSTIN: ${co.gstin}${co.pan ? " &nbsp;|&nbsp; PAN: " + co.pan : ""}</div>
    </div>
    <div style="text-align:right">
      <div class="inv-label">Tax Invoice</div>
      <div class="inv-num">${invoiceId}</div>
      <div class="st-badge">${sIcon}</div>
    </div>
  </div>
</div>

<!-- BODY -->
<div class="body">

  <!-- Invoice Details + Bill To -->
  <div class="card-row">
    <div class="card">
      <div class="ctitle">Invoice Details</div>
      <div class="kv"><span class="kv-l">Invoice Number</span><span class="kv-v kv-mono">${invoiceId}</span></div>
      <div class="kv"><span class="kv-l">Order Date</span><span class="kv-v">${fmtDate(orderDate)}</span></div>
      <div class="kv"><span class="kv-l">Purchase Date</span><span class="kv-v">${fmtDate(purchaseDate)}</span></div>
      ${dueDate     ? `<div class="kv"><span class="kv-l">Due Date</span><span class="kv-v">${fmtDate(dueDate)}</span></div>`     : ""}
      ${paymentDate ? `<div class="kv"><span class="kv-l">Payment Date</span><span class="kv-v">${fmtDate(paymentDate)}</span></div>` : ""}
      <div class="kv" style="margin-top:6px;padding-top:6px;border-top:1px solid #f1f5f9">
        <span class="kv-l">Payment Status</span>
        <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:9px;font-weight:800;background:${sColor};color:#fff">${payStatus}</span>
      </div>
    </div>
    <div class="card">
      <div class="ctitle">Billed To</div>
      <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:8px">${cu.name}</div>
      ${cu.company ? `<div class="kv"><span class="kv-l">Company</span><span class="kv-v">${cu.company}</span></div>`           : ""}
      ${cu.gstin   ? `<div class="kv"><span class="kv-l">GSTIN</span><span class="kv-v kv-mono">${cu.gstin}</span></div>`       : ""}
      <div class="kv"><span class="kv-l">Email</span><span class="kv-v">${cu.email || "&#8212;"}</span></div>
      ${cu.phone   ? `<div class="kv"><span class="kv-l">Phone</span><span class="kv-v">${cu.phone}</span></div>`               : ""}
      <div class="kv"><span class="kv-l">Address</span><span class="kv-v">${cu.address}</span></div>
      <div class="kv"><span class="kv-l">State / Country</span><span class="kv-v">${cu.state}, ${cu.country}</span></div>
    </div>
  </div>

  <!-- Items Table -->
  <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:8px">Items &amp; Services</div>
  <div class="tbl-wrap">
    <table class="inv-tbl">
      <thead>
        <tr>
          <th style="width:36px;text-align:center">#</th>
          <th>Description</th>
          <th class="c" style="width:64px">HSN/SAC</th>
          <th class="c" style="width:44px">Qty</th>
          <th class="r" style="width:110px">Unit Price</th>
          <th class="r" style="width:110px">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <!-- Totals Box -->
  <div class="totals-box">
    <div class="t-row"><span class="t-lbl">Subtotal</span><span class="t-val">${fmtCur(totals.subtotal)}</span></div>
    ${totals.discountAmount > 0 ? `
    <div class="t-row t-discount"><span class="t-lbl">Discount (${totals.discountPercent}%)</span><span class="t-val">&minus;&nbsp;${fmtCur(totals.discountAmount)}</span></div>
    <div class="t-row t-taxable"><span class="t-lbl">Taxable Value</span><span class="t-val">${fmtCur(totals.taxable)}</span></div>` : ""}
    ${taxType === "inter" && igstPct > 0
      ? `<div class="t-row"><span class="t-lbl">IGST (${igstPct}%)</span><span class="t-val">${fmtCur(totals.igst)}</span></div>`
      : `${cgstPct > 0 ? `<div class="t-row"><span class="t-lbl">CGST (${cgstPct}%)</span><span class="t-val">${fmtCur(totals.cgst)}</span></div>` : ""}
         ${sgstPct > 0 ? `<div class="t-row"><span class="t-lbl">SGST (${sgstPct}%)</span><span class="t-val">${fmtCur(totals.sgst)}</span></div>` : ""}`}
    <div class="t-grand">
      <span class="t-grand-lbl">Grand Total</span>
      <span class="t-grand-val">${fmtCur(totals.total)}</span>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer-stripe"></div>
  <div class="footer">
    <div class="fqr">
      <img src="${qrSrc}" alt="QR" onerror="this.style.display='none'">
      <div class="fqr-lbl">Scan to verify</div>
    </div>
    <div class="fmid">
      <div class="fthank">Thank you for choosing ${co.name}!</div>
      <div class="fcontact">Support: ${co.email} &bull; ${co.phone}<br>Website: ${co.website}</div>
      <div class="flegal">
        Invoice: ${invoiceId} &bull; Generated: ${fmtDate(now)}${co.gstin ? ` &bull; GSTIN: ${co.gstin}` : ""}<br>
        This is a computer-generated invoice and does not require a physical signature.
      </div>
    </div>
    <div class="fsig">
      <div class="sig-line">Authorised Signatory<br>${co.name}</div>
    </div>
  </div>

</div>
</div>
</body>
</html>`;
}

// ── Invoice Preview Modal ─────────────────────────────────────────────────────
function InvoicePreviewModal({ invoiceId, onClose, onDownload }) {
  const [html,    setHtml]    = useState(null);
  const [loading, setLoading] = useState(true);  // true on mount — load immediately
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!invoiceId) return;
    let cancelled = false;

    (async () => {
      try {
        const res     = await API.get(`/invoice/${invoiceId}`);
        if (cancelled) return;
        const invoice = res?.data?.data;
        if (!invoice) throw new Error("Invoice data not found");
        setHtml(buildInvoiceHTML(invoice));
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setHtml(null);
        setError(err?.response?.data?.message || err?.message || "Failed to load invoice");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [invoiceId]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <span className="text-white font-semibold font-mono text-sm">{invoiceId}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDownload(invoiceId)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors"
          >
            <Download size={15} />
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden bg-slate-800 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 size={36} className="animate-spin text-cyan-400" />
              <span className="text-sm">Loading invoice…</span>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-red-400">
              <AlertTriangle size={36} />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        {!loading && !error && html && (
          <iframe
            srcDoc={html}
            title="Invoice Preview"
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-popups"
          />
        )}
      </div>
    </div>
  );
}

// ── Main Invoice page ─────────────────────────────────────────────────────────
export default function Invoice() {
  const [loading,    setLoading]    = useState(false);
  const [invoices,   setInvoices]   = useState([]);
  const [search,     setSearch]     = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [previewId,  setPreviewId]  = useState(null);

  const [form, setForm] = useState({
    company: {
      name:    "ReadyTechSolutions Pvt Ltd",
      address: "Coimbatore, Tamil Nadu, India",
      email:   "quries@readytechsolutions.in",
      phone:   "+91 9600364121",
      gstin:   "33ABCDE1234F1Z5",
      pan:     "ABCDE1234F",
      website: "https://www.readytechsolutions.in",
    },
    customer: { name: "", email: "", phone: "", address: "", gstin: "" },
    items:    [{ name: "", hsn: "998314", qty: 1, price: 0 }],
    discount: { type: "percent", value: 0 },
    tax:      { type: "intra", cgst: 9, sgst: 9, igst: 0 },
    paymentStatus: "pending",
    notes: "",
  });

  // ── Load ─────────────────────────────────────────────────────────────────────
  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await API.get("/invoice");
      const data = res?.data?.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.invoices)
        ? data.invoices
        : [];
      setInvoices(list);
    } catch (err) {
      console.error(err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  // ── Create ────────────────────────────────────────────────────────────────────
  const createInvoice = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const due = new Date(Date.now() + 7 * 86400000);

      const payload = {
        company:       form.company,
        customer:      form.customer,
        items:         form.items,
        orderDate:     now.toISOString(),
        purchaseDate:  now.toISOString(),
        paymentDate:   now.toISOString(),
        dueDate:       due.toISOString(),
        paymentStatus: form.paymentStatus?.toLowerCase() || "pending",
        discount:      form.discount,
        tax:           form.tax,
        notes:         form.notes || "",
      };

      const res = await API.post("/invoice/generate", payload);
      if (!res?.data?.success && !res?.data?.data) {
        throw new Error("Invalid response from server");
      }

      await loadInvoices();
      setShowCreate(false);
      setForm((f) => ({
        ...f,
        customer: { name: "", email: "", phone: "", address: "", gstin: "" },
        items:    [{ name: "", hsn: "998314", qty: 1, price: 0 }],
        discount: { type: "percent", value: 0 },
        paymentStatus: "pending",
        notes: "",
      }));
    } catch (err) {
      console.error("CREATE ERROR:", err);
      alert("Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  // ── Update status ─────────────────────────────────────────────────────────────
  const updateInvoiceStatus = async (invoiceId, paymentStatus) => {
    try {
      setInvoices((prev) =>
        prev.map((inv) => inv.invoiceId === invoiceId ? { ...inv, paymentStatus } : inv)
      );
      const res = await API.patch(`/invoice/${invoiceId}/status`, { paymentStatus });
      const updated = res?.data?.data;
      if (updated) {
        setInvoices((prev) =>
          prev.map((inv) => inv.invoiceId === invoiceId ? updated : inv)
        );
      }
    } catch (err) {
      console.error(err);
      loadInvoices();
    }
  };

  // ── Download PDF from backend ─────────────────────────────────────────────────
  const downloadInvoice = useCallback(async (id) => {
    try {
      const res  = await API.get(`/invoice/download/${id}`, { responseType: "arraybuffer" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Download failed");
    }
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const deleteInvoice = async (id) => {
    try {
      await API.delete(`/invoice/${id}`);
      setInvoices((prev) => prev.filter((i) => i.invoiceId !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Filter + stats ────────────────────────────────────────────────────────────
  const filtered = useMemo(
    () => invoices.filter(
      (i) =>
        i.invoiceId?.toLowerCase().includes(search.toLowerCase()) ||
        i.customer?.name?.toLowerCase().includes(search.toLowerCase())
    ),
    [invoices, search]
  );

  const paidCount    = invoices.filter((i) => i.paymentStatus === "paid").length;
  const pendingCount = invoices.filter((i) => i.paymentStatus === "pending").length;
  const revenue      = invoices.reduce((a, b) => a + safeNum(b?.totals?.total), 0);

  const statusStyle = (s) =>
    ({ paid: "bg-green-500/10 text-green-400 border-green-500",
       pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500",
       failed: "bg-red-500/10 text-red-400 border-red-500",
    }[s] ?? "bg-slate-500/10 text-slate-400 border-slate-500");

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6 text-white bg-slate-950">

      {/* ── Header ── */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Invoice Dashboard</h1>
          <p className="text-slate-400">Billing System</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
        >
          <Plus size={18} /> Create
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={<FileText />}     title="Total"   value={invoices.length} />
        <StatCard icon={<CheckCircle />}  title="Paid"    value={paidCount} />
        <StatCard icon={<Clock />}        title="Pending" value={pendingCount} />
        <StatCard icon={<IndianRupee />}  title="Revenue" value={fmtINR(revenue)} />
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="w-full pl-9 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="Search by invoice ID or customer name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden border shadow-2xl rounded-2xl border-slate-800 bg-slate-950">
        <table className="w-full text-sm">
          <thead className="text-xs tracking-wider text-left uppercase bg-slate-900 text-slate-400">
            <tr>
              <th className="p-4">Invoice</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  {loading ? "Loading invoices…" : "No invoices found."}
                </td>
              </tr>
            )}
            {filtered.map((i) => (
              <tr key={i.invoiceId} className="transition border-t border-slate-800 hover:bg-slate-900/50">

                <td className="p-4 font-medium text-white font-mono text-xs">
                  {i.invoiceId}
                </td>

                <td className="text-slate-300">
                  <div>{i.customer?.name || "—"}</div>
                  {i.customer?.email && (
                    <div className="text-xs text-slate-500">{i.customer.email}</div>
                  )}
                </td>

                <td className="font-semibold text-slate-200">
                  {fmtINR(i?.totals?.total)}
                </td>

                <td>
                  <span className={`px-3 py-1 rounded-full border text-xs font-medium capitalize ${statusStyle(i.paymentStatus)}`}>
                    {i.paymentStatus}
                  </span>
                </td>

                <td>
                  <div className="flex items-center justify-center gap-2 p-3">
                    {/* Preview */}
                    <button
                      onClick={() => setPreviewId(i.invoiceId)}
                      className="p-2 transition border rounded-xl border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-cyan-500"
                      title="Preview Invoice"
                    >
                      <Eye size={16} className="text-cyan-400" />
                    </button>

                    {/* Mark Paid / Pending */}
                    <button
                      onClick={() =>
                        updateInvoiceStatus(i.invoiceId, i.paymentStatus === "paid" ? "pending" : "paid")
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                        ${i.paymentStatus === "paid"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500 hover:bg-yellow-500/20"
                          : "bg-green-500/10 text-green-400 border border-green-500 hover:bg-green-500/20"
                        }`}
                    >
                      {i.paymentStatus === "paid" ? "Mark Pending" : "Mark Paid"}
                    </button>

                    {/* Download */}
                    <button
                      onClick={() => downloadInvoice(i.invoiceId)}
                      className="p-2 transition border rounded-xl border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-emerald-500"
                      title="Download PDF"
                    >
                      <Download size={16} className="text-emerald-400" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deleteInvoice(i.invoiceId)}
                      className="p-2 transition border rounded-xl border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-red-500"
                      title="Delete Invoice"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Invoice Preview Modal ── */}
      {previewId && (
        <InvoicePreviewModal
          invoiceId={previewId}
          onClose={() => setPreviewId(null)}
          onDownload={(id) => { downloadInvoice(id); }}
        />
      )}

      {/* ── Create Invoice Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl">
          <div className="w-[1050px] max-h-[95vh] overflow-y-auto rounded-3xl bg-[#0A0F1C] border border-slate-800 shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 rounded-t-3xl">
              <div>
                <h2 className="text-2xl font-bold tracking-wide text-white">Create Invoice</h2>
                <p className="text-sm text-slate-400">SaaS Billing • GST Engine • Auto Tax Calculation</p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 text-slate-200">

              {/* Customer */}
              <Section title="Customer Information">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Customer Name *"
                    onChange={(e) => setForm({ ...form, customer: { ...form.customer, name: e.target.value } })} />
                  <Input placeholder="Email *"
                    onChange={(e) => setForm({ ...form, customer: { ...form.customer, email: e.target.value } })} />
                  <Input placeholder="Phone"
                    onChange={(e) => setForm({ ...form, customer: { ...form.customer, phone: e.target.value } })} />
                  <Input placeholder="Address"
                    onChange={(e) => setForm({ ...form, customer: { ...form.customer, address: e.target.value } })} />
                </div>
              </Section>

              {/* Timeline */}
              <Section title="Invoice Timeline" accent="indigo">
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Order Date",    key: "orderDate"    },
                    { label: "Purchase Date", key: "purchaseDate" },
                    { label: "Payment Date",  key: "paymentDate"  },
                    { label: "Due Date",      key: "dueDate"      },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block mb-1 text-xs text-slate-400">{label}</label>
                      <input type="date" className="input"
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </Section>

              {/* Items */}
              <Section title="Services / Items">
                <div className="flex justify-end mb-3">
                  <button
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                    onClick={() =>
                      setForm({ ...form, items: [...form.items, { name: "", qty: 1, price: 0, hsn: "998314" }] })
                    }
                  >
                    + Add Item
                  </button>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-3 mb-3">
                    <Input
                      placeholder="Service Name"
                      value={item.name}
                      onChange={(e) => {
                        const arr = [...form.items];
                        arr[idx] = { ...arr[idx], name: e.target.value };
                        setForm({ ...form, items: arr });
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => {
                        const arr = [...form.items];
                        arr[idx] = { ...arr[idx], qty: Number(e.target.value) };
                        setForm({ ...form, items: arr });
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Unit Price (₹)"
                      value={item.price}
                      onChange={(e) => {
                        const arr = [...form.items];
                        arr[idx] = { ...arr[idx], price: Number(e.target.value) };
                        setForm({ ...form, items: arr });
                      }}
                    />
                  </div>
                ))}
              </Section>

              {/* Tax & Discount */}
              <Section title="Tax & Discount Engine">
                <div className="grid grid-cols-4 gap-4">
                  <Input type="number" placeholder="Discount %"
                    onChange={(e) => setForm({ ...form, discount: { type: "percent", value: Number(e.target.value) } })} />
                  <Input type="number" placeholder="CGST %" defaultValue={9}
                    onChange={(e) => setForm({ ...form, tax: { ...form.tax, cgst: Number(e.target.value) } })} />
                  <Input type="number" placeholder="SGST %" defaultValue={9}
                    onChange={(e) => setForm({ ...form, tax: { ...form.tax, sgst: Number(e.target.value) } })} />
                  <Input type="number" placeholder="IGST %" defaultValue={0}
                    onChange={(e) => setForm({ ...form, tax: { ...form.tax, igst: Number(e.target.value) } })} />
                </div>
              </Section>

              {/* Payment Status */}
              <Section title="Payment Status">
                <select
                  className="input"
                  value={form.paymentStatus}
                  onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </Section>

              {/* Notes */}
              <Section title="Notes">
                <textarea
                  className="h-20 input"
                  placeholder="Add invoice notes…"
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Section>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-slate-800">
                <button
                  onClick={createInvoice}
                  disabled={loading}
                  className="flex-1 py-3 font-semibold text-white transition rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-[1.01] disabled:opacity-60"
                >
                  {loading ? "Generating Invoice…" : "Generate Invoice"}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function StatCard({ icon, title, value }) {
  return (
    <div className="p-4 border rounded-xl border-slate-800 bg-slate-900">
      <div className="text-slate-400 mb-1">{icon}</div>
      <p className="text-slate-400 text-sm">{title}</p>
      <h2 className="text-xl font-bold text-white">{value}</h2>
    </div>
  );
}

function Section({ title, accent = "slate", children }) {
  const border = accent === "indigo" ? "border-indigo-500/20 bg-indigo-500/5" : "border-slate-800 bg-slate-900/40";
  const label  = accent === "indigo" ? "text-indigo-300" : "text-slate-300";
  return (
    <div className={`p-5 border rounded-2xl ${border}`}>
      <h3 className={`mb-4 text-sm font-semibold ${label}`}>{title}</h3>
      {children}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`input ${className}`}
      {...props}
    />
  );
}
