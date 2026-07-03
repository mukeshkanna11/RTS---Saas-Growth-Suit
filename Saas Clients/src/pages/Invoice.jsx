// ═══════════════════════════════════════════════════════════════════════════════
// src/pages/Invoice.jsx — Enterprise Invoice Management
// Premium SaaS UI · Design standard: ReadyTechSolutions
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import API from "../api/axios";
import {
  FileText, Plus, Search, Download, Trash2, Eye, X, Loader2,
  AlertTriangle, CheckCircle, Clock, AlertCircle, XCircle,
  IndianRupee, Printer, RefreshCw, Building2, User, Calendar,
  ChevronDown, Percent, BarChart3, Banknote, MinusCircle,
  PlusCircle, ReceiptText, Hash, TrendingUp, Filter, SlidersHorizontal,
} from "lucide-react";

// ─── Company defaults ──────────────────────────────────────────────────────────
const DEFAULT_CO = {
  name:    "ReadyTechSolutions Pvt Ltd",
  address: "Coimbatore, Tamil Nadu, India",
  email:   "info@readytechsolutions.in",
  phone:   "70107 97721",
  gstin:   "33ABCDE1234F1Z5",
  pan:     "ABCDE1234F",
  website: "https://readytechsolutions.in/",
};

// ─── Status config ─────────────────────────────────────────────────────────────
const S = {
  paid:      { label: "Paid",      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "#10b981" },
  pending:   { label: "Pending",   cls: "bg-amber-500/15  text-amber-400  border-amber-500/30",     dot: "#f59e0b" },
  partial:   { label: "Partial",   cls: "bg-sky-500/15    text-sky-400    border-sky-500/30",        dot: "#0ea5e9" },
  overdue:   { label: "Overdue",   cls: "bg-red-500/15    text-red-400    border-red-500/30",        dot: "#ef4444" },
  cancelled: { label: "Cancelled", cls: "bg-slate-500/15  text-slate-400  border-slate-500/30",     dot: "#64748b" },
  failed:    { label: "Failed",    cls: "bg-rose-500/15   text-rose-400   border-rose-500/30",       dot: "#f43f5e" },
  draft:     { label: "Draft",     cls: "bg-violet-500/15 text-violet-400 border-violet-500/30",    dot: "#8b5cf6" },
  generated: { label: "Generated", cls: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",    dot: "#6366f1" },
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const today7   = () => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
const mkItem   = () => ({ name: "", description: "", hsn: "998314", qty: 1, price: 0, discount: 0 });
const mkForm   = () => ({
  customer:      { name: "", email: "", phone: "", address: "", gstin: "", state: "Tamil Nadu", country: "India", company: "" },
  items:         [mkItem()],
  discount:      { type: "percent", value: 0 },
  tax:           { type: "intra", cgst: 9, sgst: 9, igst: 0 },
  paymentStatus: "pending",
  notes:         "",
  orderDate:     todayStr(),
  purchaseDate:  todayStr(),
  dueDate:       today7(),
  paymentDate:   "",
});

// ─── Utilities ─────────────────────────────────────────────────────────────────
const safeNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const round2  = (v) => Math.round((safeNum(v) + Number.EPSILON) * 100) / 100;
const fmtINR  = (n) => `₹${safeNum(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const calcTotals = (items = [], discountArg = 0, taxArg = {}) => {
  const discPct = typeof discountArg === "number" ? safeNum(discountArg) : safeNum(discountArg?.value ?? 0);
  const tax     = { cgst: safeNum(taxArg?.cgst ?? 9), sgst: safeNum(taxArg?.sgst ?? 9), igst: safeNum(taxArg?.igst ?? 0) };
  const subtotal       = round2(items.reduce((s, i) => {
    const base = safeNum(i.qty || 1) * safeNum(i.price || 0);
    return s + base * (1 - safeNum(i.discount || 0) / 100);
  }, 0));
  const discountAmount = round2(Math.min(subtotal * discPct / 100, subtotal));
  const taxable        = round2(subtotal - discountAmount);
  const cgst           = round2(taxable * tax.cgst / 100);
  const sgst           = round2(taxable * tax.sgst / 100);
  const igst           = round2(taxable * tax.igst / 100);
  const taxTotal       = round2(cgst + sgst + igst);
  const total          = round2(taxable + taxTotal);
  return { subtotal, discountAmount, discountPercent: discPct, taxable, cgst, sgst, igst, taxTotal, total, tax };
};

// ─── Invoice HTML builder (mirrors invoice.template.js exactly) ────────────────
function buildInvoiceHTML(data = {}) {
  const SYM = { INR: "&#8377;", USD: "$" };
  const fmt = (amount, cur = "INR") => {
    const n = round2(safeNum(amount));
    const sym = SYM[cur] ?? "&#8377;";
    const loc = cur === "USD" ? "en-US" : "en-IN";
    return `${sym}${n.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const fmtD = (d) => {
    if (!d) return "&#8212;";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "&#8212;" : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };
  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const normTax = (d) => {
    const t = d.tax || {};
    return { cgstPct: safeNum(d.cgst ?? t.cgst ?? 9), sgstPct: safeNum(d.sgst ?? t.sgst ?? 9), igstPct: safeNum(d.igst ?? t.igst ?? 0), taxType: d.taxType || t.type || "intra" };
  };
  const normDisc = (d) => {
    if (typeof d.discount === "number") return safeNum(d.discount);
    if (d.discount?.value !== undefined) return safeNum(d.discount.value);
    return 0;
  };

  const { company = {}, customer = {}, items = [], paymentStatus = "PENDING", invoiceId = `INV-${Date.now()}` } = data;
  const cur    = data.currency || "INR";
  const fmtC   = (a) => fmt(a, cur);
  const { cgstPct, sgstPct, igstPct, taxType } = normTax(data);
  const discPct = normDisc(data);

  const hasTotals = data.totals && safeNum(data.totals.subtotal) >= 0;
  const totals = hasTotals ? {
    subtotal:        safeNum(data.totals.subtotal),
    discountAmount:  safeNum(data.totals.discountAmount),
    discountPercent: safeNum(data.totals.discountPercent ?? discPct),
    taxable:         safeNum(data.totals.taxable),
    cgst:            safeNum(data.totals.cgst),
    sgst:            safeNum(data.totals.sgst),
    igst:            safeNum(data.totals.igst),
    taxTotal:        safeNum(data.totals.taxTotal),
    total:           safeNum(data.totals.total),
  } : calcTotals(Array.isArray(items) ? items : [], discPct, { cgst: cgstPct, sgst: sgstPct, igst: igstPct });

  const now          = new Date();
  const orderDate    = data.orderDate    || data.createdAt || now;
  const purchaseDate = data.purchaseDate || data.createdAt || now;
  const dueDate      = data.dueDate      || null;
  const paymentDate  = data.paymentDate  || null;

  const payStatus = (paymentStatus || "PENDING").toString().toUpperCase();
  const sColor    = payStatus === "PAID" ? "#16a34a" : payStatus === "FAILED" ? "#dc2626" : "#d97706";
  const sIcon     = payStatus === "PAID" ? "&#10003;&nbsp;PAID" : payStatus === "FAILED" ? "&#10007;&nbsp;FAILED" : "&#9679;&nbsp;PENDING";

  const co = {
    name:    esc(company.name    || DEFAULT_CO.name),
    address: esc(company.address || DEFAULT_CO.address),
    email:   esc(company.email   || DEFAULT_CO.email),
    phone:   esc(company.phone   || DEFAULT_CO.phone),
    website: esc(company.website || DEFAULT_CO.website),
    gstin:   esc(company.gstin   || DEFAULT_CO.gstin),
    pan:     esc(company.pan     || DEFAULT_CO.pan),
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
  const itemRows  = safeItems.map((item, i) => {
    const base    = safeNum(item.qty || 1) * safeNum(item.price || 0);
    const iDisc   = safeNum(item.discount || 0);
    const lineAmt = round2(base * (1 - iDisc / 100));
    return `
    <tr>
      <td style="text-align:center;color:#94a3b8;font-weight:600;font-size:11px">${i + 1}</td>
      <td>
        <div style="font-weight:700;color:#0f172a">${esc(item.name || item.description || "Service")}</div>
        ${(item.description && item.description !== item.name) ? `<div style="font-size:9.5px;color:#64748b;margin-top:2px">${esc(item.description)}</div>` : ""}
      </td>
      <td style="text-align:center;color:#64748b;font-family:monospace;font-size:9.5px">${esc(item.hsn || "998314")}</td>
      <td style="text-align:center;font-weight:600">${safeNum(item.qty || 1)}</td>
      <td style="text-align:right">${fmtC(item.price)}</td>
      <td style="text-align:center;font-size:10px;color:${iDisc > 0 ? "#dc2626" : "#94a3b8"};font-weight:${iDisc > 0 ? "700" : "400"}">${iDisc > 0 ? `-${iDisc}%` : "&#8212;"}</td>
      <td style="text-align:right;font-weight:700;color:#1a3c5e">${fmtC(lineAmt)}</td>
    </tr>`;
  }).join("");

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
.hdr::after{content:"";position:absolute;bottom:-50px;left:-50px;width:180px;height:180px;background:rgba(255,255,255,.03);border-radius:50%}
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
.sec-lbl{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:8px}
.tbl-wrap{border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:18px}
.inv-tbl{width:100%;border-collapse:collapse}
.inv-tbl thead tr{background:linear-gradient(135deg,#1a3c5e,#1e40af)}
.inv-tbl thead th{padding:10px 12px;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.9);text-align:left}
.inv-tbl thead th.r{text-align:right}.inv-tbl thead th.c{text-align:center}
.inv-tbl tbody tr:nth-child(even){background:#f8fafc}
.inv-tbl tbody td{padding:10px 12px;font-size:11px;border-bottom:1px solid #e2e8f0;vertical-align:middle}
.inv-tbl tbody tr:last-child td{border-bottom:none}
.totals-box{width:300px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-left:auto;margin-bottom:18px}
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

<div class="hdr">
  <div class="hdr-inner">
    <div>
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

<div class="body">
  <div class="card-row">
    <div class="card">
      <div class="ctitle">Invoice Details</div>
      <div class="kv"><span class="kv-l">Invoice Number</span><span class="kv-v kv-mono">${invoiceId}</span></div>
      <div class="kv"><span class="kv-l">Order Date</span><span class="kv-v">${fmtD(orderDate)}</span></div>
      <div class="kv"><span class="kv-l">Purchase Date</span><span class="kv-v">${fmtD(purchaseDate)}</span></div>
      ${dueDate     ? `<div class="kv"><span class="kv-l">Due Date</span><span class="kv-v">${fmtD(dueDate)}</span></div>`     : ""}
      ${paymentDate ? `<div class="kv"><span class="kv-l">Payment Date</span><span class="kv-v">${fmtD(paymentDate)}</span></div>` : ""}
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

  <div class="sec-lbl">Items &amp; Services</div>
  <div class="tbl-wrap">
    <table class="inv-tbl">
      <thead>
        <tr>
          <th style="width:30px;text-align:center">#</th>
          <th>Description</th>
          <th class="c" style="width:60px">HSN/SAC</th>
          <th class="c" style="width:40px">Qty</th>
          <th class="r" style="width:88px">Unit Price</th>
          <th class="c" style="width:62px">Discount</th>
          <th class="r" style="width:92px">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <div class="totals-box">
    <div class="t-row"><span class="t-lbl">Subtotal</span><span class="t-val">${fmtC(totals.subtotal)}</span></div>
    ${totals.discountAmount > 0 ? `
    <div class="t-row t-discount"><span class="t-lbl">Discount (${totals.discountPercent}%)</span><span class="t-val">&minus;&nbsp;${fmtC(totals.discountAmount)}</span></div>
    <div class="t-row t-taxable"><span class="t-lbl">Taxable Value</span><span class="t-val">${fmtC(totals.taxable)}</span></div>` : ""}
    ${taxType === "inter" && igstPct > 0
      ? `<div class="t-row"><span class="t-lbl">IGST (${igstPct}%)</span><span class="t-val">${fmtC(totals.igst)}</span></div>`
      : `${cgstPct > 0 ? `<div class="t-row"><span class="t-lbl">CGST (${cgstPct}%)</span><span class="t-val">${fmtC(totals.cgst)}</span></div>` : ""}
         ${sgstPct > 0 ? `<div class="t-row"><span class="t-lbl">SGST (${sgstPct}%)</span><span class="t-val">${fmtC(totals.sgst)}</span></div>` : ""}`}
    <div class="t-grand">
      <span class="t-grand-lbl">Grand Total</span>
      <span class="t-grand-val">${fmtC(totals.total)}</span>
    </div>
  </div>

  ${data.notes ? `<div style="margin-bottom:18px"><div class="sec-lbl">Notes</div><div style="font-size:10.5px;color:#475569;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px">${esc(data.notes)}</div></div>` : ""}

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
        Invoice: ${invoiceId} &bull; Generated: ${fmtD(now)}${co.gstin ? ` &bull; GSTIN: ${co.gstin}` : ""}<br>
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

// ─── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = S[status?.toLowerCase()] || S.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${s.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

// ─── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent = "slate", loading }) {
  const accents = {
    slate:   "text-slate-400 bg-slate-800/60",
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber:   "text-amber-400 bg-amber-500/10",
    red:     "text-red-400 bg-red-500/10",
    sky:     "text-sky-400 bg-sky-500/10",
    indigo:  "text-indigo-400 bg-indigo-500/10",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className={`inline-flex p-2.5 rounded-xl mb-3 ${accents[accent]}`}>
        <Icon size={18} />
      </div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      {loading ? (
        <div className="h-7 w-20 bg-slate-800 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
      )}
    </div>
  );
}

// ─── ItemRow (inside create form) ─────────────────────────────────────────────
function ItemRow({ item, index, onUpdate, onRemove, showRemove }) {
  const lineAmt = round2(safeNum(item.qty || 1) * safeNum(item.price || 0) * (1 - safeNum(item.discount || 0) / 100));
  const set = (field, value) => onUpdate(index, field, value);

  return (
    <div className="grid gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
         style={{ gridTemplateColumns: "3fr 1fr 0.6fr 1fr 0.6fr 0.9fr auto" }}>

      {/* Description */}
      <div className="space-y-1">
        <input
          className="input text-sm w-full"
          placeholder="Item / Service name *"
          value={item.name}
          onChange={(e) => set("name", e.target.value)}
        />
        <input
          className="input text-xs w-full opacity-70 focus:opacity-100 py-1.5"
          placeholder="Description (optional)"
          value={item.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      {/* HSN/SAC */}
      <input
        className="input text-sm text-center font-mono"
        placeholder="HSN/SAC"
        value={item.hsn}
        onChange={(e) => set("hsn", e.target.value)}
      />

      {/* Qty */}
      <input
        type="number" min="1" step="1"
        className="input text-sm text-center"
        placeholder="Qty"
        value={item.qty}
        onChange={(e) => set("qty", Math.max(1, Number(e.target.value) || 1))}
      />

      {/* Unit Price */}
      <input
        type="number" min="0" step="0.01"
        className="input text-sm text-right"
        placeholder="Unit Price"
        value={item.price}
        onChange={(e) => set("price", Math.max(0, Number(e.target.value) || 0))}
      />

      {/* Discount % */}
      <input
        type="number" min="0" max="100" step="0.01"
        className="input text-sm text-center"
        placeholder="Disc%"
        value={item.discount}
        onChange={(e) => set("discount", Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
      />

      {/* Amount (read-only) */}
      <div className="flex items-center justify-end px-2">
        <span className="text-sm font-bold text-indigo-300 font-mono">{fmtINR(lineAmt)}</span>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={!showRemove}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 transition-colors"
        title="Remove item"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── LiveSummaryPanel ──────────────────────────────────────────────────────────
function LiveSummaryPanel({ items, discount, tax, onGenerate, loading, customerName }) {
  const t = useMemo(() => calcTotals(items, discount, tax), [items, discount, tax]);
  const { cgst, sgst, igst, taxType } = { cgst: safeNum(tax?.cgst ?? 9), sgst: safeNum(tax?.sgst ?? 9), igst: safeNum(tax?.igst ?? 0), taxType: tax?.type || "intra" };

  return (
    <div className="sticky top-0 space-y-4">
      {/* Summary Card */}
      <div className="rounded-2xl border border-slate-700 overflow-hidden bg-slate-900">
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-900/50 to-slate-900 border-b border-slate-700">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Invoice Summary</p>
          {customerName && <p className="text-sm text-slate-400 mt-0.5 truncate">{customerName}</p>}
        </div>
        <div className="p-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Items</span>
            <span className="text-white font-medium">{items.length}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span className="text-white font-medium">{fmtINR(t.subtotal)}</span>
          </div>
          {t.discountAmount > 0 && (
            <div className="flex justify-between text-red-400">
              <span>Discount ({t.discountPercent}%)</span>
              <span className="font-medium">−{fmtINR(t.discountAmount)}</span>
            </div>
          )}
          {t.discountAmount > 0 && (
            <div className="flex justify-between text-slate-300 font-semibold border-t border-slate-800 pt-2">
              <span>Taxable Value</span>
              <span>{fmtINR(t.taxable)}</span>
            </div>
          )}
          {taxType === "inter" && igst > 0 ? (
            <div className="flex justify-between text-slate-400">
              <span>IGST ({igst}%)</span>
              <span className="text-white">{fmtINR(t.igst)}</span>
            </div>
          ) : (
            <>
              {cgst > 0 && <div className="flex justify-between text-slate-400">
                <span>CGST ({cgst}%)</span>
                <span className="text-white">{fmtINR(t.cgst)}</span>
              </div>}
              {sgst > 0 && <div className="flex justify-between text-slate-400">
                <span>SGST ({sgst}%)</span>
                <span className="text-white">{fmtINR(t.sgst)}</span>
              </div>}
            </>
          )}
          <div className="mt-3 pt-3 border-t border-slate-700 rounded-xl overflow-hidden -mx-4 px-4"
               style={{ background: "linear-gradient(135deg, #1a3c5e, #1e40af)" }}>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-bold text-white/80">Grand Total</span>
              <span className="text-xl font-extrabold text-white">{fmtINR(t.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><ReceiptText size={16} /> Generate Invoice</>}
      </button>

      {/* Tax type hint */}
      <p className="text-xs text-slate-600 text-center">
        {taxType === "inter" ? "Inter-state (IGST)" : "Intra-state (CGST + SGST)"}
        {" "}· GST Invoice
      </p>
    </div>
  );
}

// ─── Create Invoice Modal ──────────────────────────────────────────────────────
function CreateInvoiceModal({ onClose, onSuccess }) {
  const [form, setForm]   = useState(mkForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState(null);

  const setCustomer  = (field, val) => setForm(f => ({ ...f, customer: { ...f.customer, [field]: val } }));
  const setTax       = (field, val) => setForm(f => ({ ...f, tax:      { ...f.tax,      [field]: val } }));
  const setDiscount  = (val)        => setForm(f => ({ ...f, discount: { type: "percent", value: Math.max(0, Math.min(100, Number(val) || 0)) } }));

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, mkItem()] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = useCallback((i, field, val) =>
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [field]: val };
      return { ...f, items };
    }), []);

  const handleGenerate = async () => {
    if (!form.customer.name?.trim()) { setErr("Customer name is required."); return; }
    if (!form.customer.email?.trim()) { setErr("Customer email is required."); return; }
    if (form.items.some(i => !i.name?.trim())) { setErr("All item descriptions are required."); return; }
    setErr(null);
    setSaving(true);
    try {
      const payload = {
        company:       DEFAULT_CO,
        customer:      form.customer,
        items:         form.items,
        orderDate:     form.orderDate   || new Date().toISOString(),
        purchaseDate:  form.purchaseDate || new Date().toISOString(),
        paymentDate:   form.paymentDate  || null,
        dueDate:       form.dueDate      || null,
        paymentStatus: form.paymentStatus,
        discount:      form.discount,
        tax:           form.tax,
        notes:         form.notes.trim(),
      };
      const res = await API.post("/invoice/generate", payload);
      if (res?.data?.success || res?.data?.data) {
        onSuccess();
      } else {
        throw new Error(res?.data?.message || "Generation failed");
      }
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to generate invoice.");
      setSaving(false);
    }
  };

  // ── Field helpers ──────────────────────────────────────────────────────────
  const Field = ({ label, required, children }) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-400">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-3 pb-3 border-b border-slate-800 mb-4">
      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><Icon size={15} /></div>
      <div>
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm">
      {/* ── Modal Shell ── */}
      <div className="relative flex flex-col w-full max-w-6xl m-auto max-h-[96vh] rounded-3xl border border-slate-700 bg-[#0A0F1C] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 bg-gradient-to-r from-slate-950 to-[#0A0F1C] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400">
              <ReceiptText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Create New Invoice</h2>
              <p className="text-xs text-slate-500">GST Tax Invoice · ReadyTechSolutions Pvt Ltd</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body — 2 columns */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — form sections (scrollable) */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

            {/* Error */}
            {err && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertTriangle size={16} className="shrink-0" /> {err}
              </div>
            )}

            {/* Company (pre-filled, collapsed) */}
            <details className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer text-sm font-semibold text-slate-300 select-none hover:bg-slate-900/60 transition-colors">
                <Building2 size={15} className="text-teal-400" />
                <span className="flex-1">Billed From · {DEFAULT_CO.name}</span>
                <span className="text-xs text-slate-600 font-normal">GSTIN: {DEFAULT_CO.gstin}</span>
                <ChevronDown size={14} className="text-slate-500" />
              </summary>
              <div className="px-5 pb-4 grid grid-cols-2 gap-3 text-sm border-t border-slate-800 pt-4">
                {[["Name", DEFAULT_CO.name], ["GSTIN", DEFAULT_CO.gstin], ["Email", DEFAULT_CO.email], ["Phone", DEFAULT_CO.phone], ["Website", DEFAULT_CO.website], ["Address", DEFAULT_CO.address]].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-slate-500 shrink-0 w-16">{k}</span>
                    <span className="text-slate-300 font-medium truncate">{v}</span>
                  </div>
                ))}
              </div>
            </details>

            {/* Customer Details */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <SectionHeader icon={User} title="Customer Details" subtitle="Billed-to information" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Customer Name" required>
                  <input className="input text-sm w-full" placeholder="Full name or business name"
                    value={form.customer.name} onChange={e => setCustomer("name", e.target.value)} />
                </Field>
                <Field label="Email Address" required>
                  <input type="email" className="input text-sm w-full" placeholder="customer@example.com"
                    value={form.customer.email} onChange={e => setCustomer("email", e.target.value)} />
                </Field>
                <Field label="Phone Number">
                  <input className="input text-sm w-full" placeholder="+91 98765 43210"
                    value={form.customer.phone} onChange={e => setCustomer("phone", e.target.value)} />
                </Field>
                <Field label="Company / Organization">
                  <input className="input text-sm w-full" placeholder="Company name (optional)"
                    value={form.customer.company} onChange={e => setCustomer("company", e.target.value)} />
                </Field>
                <Field label="Address">
                  <input className="input text-sm w-full" placeholder="Street, City"
                    value={form.customer.address} onChange={e => setCustomer("address", e.target.value)} />
                </Field>
                <Field label="GSTIN">
                  <input className="input text-sm w-full font-mono" placeholder="29ABCDE1234F1Z5"
                    value={form.customer.gstin} onChange={e => setCustomer("gstin", e.target.value.toUpperCase())} />
                </Field>
                <Field label="State">
                  <input className="input text-sm w-full" placeholder="Tamil Nadu"
                    value={form.customer.state} onChange={e => setCustomer("state", e.target.value)} />
                </Field>
                <Field label="Country">
                  <input className="input text-sm w-full" placeholder="India"
                    value={form.customer.country} onChange={e => setCustomer("country", e.target.value)} />
                </Field>
              </div>
            </div>

            {/* Invoice Dates */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <SectionHeader icon={Calendar} title="Invoice Dates" subtitle="Timeline and payment schedule" />
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Order Date",    key: "orderDate"    },
                  { label: "Purchase Date", key: "purchaseDate" },
                  { label: "Due Date",      key: "dueDate"      },
                  { label: "Payment Date",  key: "paymentDate"  },
                ].map(({ label, key }) => (
                  <Field key={key} label={label}>
                    <input type="date" className="input text-sm w-full"
                      value={form[key] || ""}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </Field>
                ))}
              </div>
            </div>

            {/* Items */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <SectionHeader icon={FileText} title="Items & Services" subtitle="Add products or services to this invoice" />

              {/* Column labels */}
              <div className="grid gap-2 px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
                   style={{ gridTemplateColumns: "3fr 1fr 0.6fr 1fr 0.6fr 0.9fr auto" }}>
                <span>Description</span>
                <span className="text-center">HSN/SAC</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Unit Price</span>
                <span className="text-center">Disc%</span>
                <span className="text-right">Amount</span>
                <span />
              </div>

              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <ItemRow
                    key={idx}
                    item={item}
                    index={idx}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    showRemove={form.items.length > 1}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={addItem}
                className="mt-3 flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                <PlusCircle size={16} /> Add Item
              </button>
            </div>

            {/* Tax & Discount */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <SectionHeader icon={Percent} title="Tax & Discount" subtitle="Global GST rates applied to taxable value" />
              <div className="grid grid-cols-5 gap-4">
                <Field label="Discount %">
                  <input type="number" min="0" max="100" className="input text-sm w-full text-center"
                    placeholder="0" value={form.discount.value}
                    onChange={e => setDiscount(e.target.value)} />
                </Field>
                <Field label="Tax Type">
                  <select className="input text-sm w-full"
                    value={form.tax.type}
                    onChange={e => setTax("type", e.target.value)}>
                    <option value="intra">Intra-state</option>
                    <option value="inter">Inter-state</option>
                  </select>
                </Field>
                <Field label="CGST %">
                  <input type="number" min="0" max="50" className="input text-sm w-full text-center"
                    value={form.tax.cgst} onChange={e => setTax("cgst", Number(e.target.value) || 0)} />
                </Field>
                <Field label="SGST %">
                  <input type="number" min="0" max="50" className="input text-sm w-full text-center"
                    value={form.tax.sgst} onChange={e => setTax("sgst", Number(e.target.value) || 0)} />
                </Field>
                <Field label="IGST %">
                  <input type="number" min="0" max="100" className="input text-sm w-full text-center"
                    value={form.tax.igst} onChange={e => setTax("igst", Number(e.target.value) || 0)} />
                </Field>
              </div>
            </div>

            {/* Payment Status + Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <SectionHeader icon={CheckCircle} title="Payment Status" subtitle="" />
                <select className="input text-sm w-full"
                  value={form.paymentStatus}
                  onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <SectionHeader icon={ReceiptText} title="Notes" subtitle="" />
                <textarea rows={3} className="input text-sm w-full resize-none"
                  placeholder="Additional notes, payment terms, or instructions…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            {/* Cancel (bottom) */}
            <div className="flex justify-end pb-2">
              <button type="button" onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>

          {/* RIGHT — live summary (sticky) */}
          <div className="w-72 shrink-0 border-l border-slate-800 px-5 py-6 overflow-y-auto">
            <LiveSummaryPanel
              items={form.items}
              discount={form.discount}
              tax={form.tax}
              onGenerate={handleGenerate}
              loading={saving}
              customerName={form.customer.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({ invoiceId, onClose, onDownload }) {
  const [html,    setHtml]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const iframeRef             = useRef(null);

  useEffect(() => {
    if (!invoiceId) return;
    let cancelled = false;
    (async () => {
      try {
        const res     = await API.get(`/invoice/${invoiceId}`);
        if (cancelled) return;
        const invoice = res?.data?.data;
        if (!invoice) throw new Error("Invoice data not found.");
        setHtml(buildInvoiceHTML(invoice));
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load invoice.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [invoiceId]);

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-indigo-500/15"><FileText size={14} className="text-indigo-400" /></div>
          <span className="text-white font-semibold font-mono text-sm">{invoiceId}</span>
          <span className="text-slate-600 text-xs">Tax Invoice Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} disabled={!html}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-40">
            <Printer size={15} /> Print
          </button>
          <button onClick={() => onDownload(invoiceId)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors">
            <Download size={15} /> Download PDF
          </button>
          <button onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden bg-slate-800 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 size={36} className="animate-spin text-indigo-400" />
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
            ref={iframeRef}
            srcDoc={html}
            title="Invoice Preview"
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-popups allow-scripts"
          />
        )}
      </div>
    </div>
  );
}

// ─── Main Invoice Page ─────────────────────────────────────────────────────────
export default function Invoice() {
  const [invoices,     setInvoices]     = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate,   setShowCreate]   = useState(false);
  const [previewId,    setPreviewId]    = useState(null);
  const [actionBusy,   setActionBusy]   = useState({});

  // ── Load data ────────────────────────────────────────────────────────────────
  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await API.get("/invoice");
      const data = res?.data?.data;
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await API.get("/invoice/stats");
      setStats(res?.data?.data || null);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
    loadStats();
  }, [loadInvoices, loadStats]);

  // ── Download ──────────────────────────────────────────────────────────────────
  const downloadInvoice = useCallback(async (id) => {
    try {
      setActionBusy(b => ({ ...b, [id + "_dl"]: true }));
      const res  = await API.get(`/invoice/download/${id}`, { responseType: "arraybuffer" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* silent — user sees nothing change */
    } finally {
      setActionBusy(b => ({ ...b, [id + "_dl"]: false }));
    }
  }, []);

  // ── Status update ─────────────────────────────────────────────────────────────
  const updateStatus = useCallback(async (invoiceId, paymentStatus) => {
    setInvoices(prev => prev.map(i => i.invoiceId === invoiceId ? { ...i, paymentStatus } : i));
    try {
      const res = await API.patch(`/invoice/${invoiceId}/status`, { paymentStatus });
      const updated = res?.data?.data;
      if (updated) setInvoices(prev => prev.map(i => i.invoiceId === invoiceId ? updated : i));
    } catch {
      loadInvoices();
    }
  }, [loadInvoices]);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const deleteInvoice = useCallback(async (id) => {
    if (!window.confirm(`Delete invoice ${id}? This action cannot be undone.`)) return;
    setInvoices(prev => prev.filter(i => i.invoiceId !== id));
    try {
      await API.delete(`/invoice/${id}`);
      loadStats();
    } catch {
      loadInvoices();
    }
  }, [loadInvoices, loadStats]);

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || inv.invoiceId?.toLowerCase().includes(q)
      || inv.customer?.name?.toLowerCase().includes(q)
      || inv.customer?.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || inv.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  }), [invoices, search, statusFilter]);

  // ── Stat values (prefer server stats, fallback to local) ──────────────────────
  const totalInvoices  = stats?.totalInvoices   ?? invoices.length;
  const paidCount      = stats?.paidInvoices    ?? invoices.filter(i => i.paymentStatus === "paid").length;
  const pendingCount   = stats?.pendingInvoices ?? invoices.filter(i => i.paymentStatus === "pending").length;
  const overdueCount   = stats?.overdueInvoices ?? invoices.filter(i => i.status === "overdue").length;
  const cancelledCount = stats?.cancelledInvoices ?? invoices.filter(i => i.status === "cancelled").length;
  const totalRevenue   = stats?.totalRevenue    ?? invoices.filter(i => i.paymentStatus === "paid").reduce((a, b) => a + safeNum(b?.totals?.total), 0);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Page Header ── */}
      <div className="relative overflow-hidden border-b border-slate-800/60"
           style={{ background: "linear-gradient(135deg, #0f1f35 0%, #0f1a3d 55%, #0a1f2e 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full"
               style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />
          <div className="absolute bottom-[-40px] left-[-40px] w-[200px] h-[200px] rounded-full"
               style={{ background: "radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
              <ReceiptText size={24} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Invoice Management</h1>
              <p className="text-sm text-slate-400 mt-0.5">Enterprise Billing &amp; GST System · ReadyTechSolutions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { loadInvoices(); loadStats(); }}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700 transition-colors"
              title="Refresh">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/40">
              <Plus size={18} /> New Invoice
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-6 gap-4">
          <StatCard icon={FileText}    label="Total Invoices" value={totalInvoices}        accent="slate"   loading={statsLoading} />
          <StatCard icon={CheckCircle} label="Paid"           value={paidCount}             accent="emerald" loading={statsLoading} />
          <StatCard icon={Clock}       label="Pending"        value={pendingCount}          accent="amber"   loading={statsLoading} />
          <StatCard icon={AlertCircle} label="Overdue"        value={overdueCount}          accent="red"     loading={statsLoading} />
          <StatCard icon={XCircle}     label="Cancelled"      value={cancelledCount}        accent="sky"     loading={statsLoading} />
          <StatCard icon={Banknote}    label="Revenue (Paid)" value={fmtINR(totalRevenue)}  accent="indigo"  loading={statsLoading} />
        </div>

        {/* ── Search & Filter ── */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
              placeholder="Search by invoice ID, customer name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <select
              className="appearance-none pl-8 pr-8 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* ── Invoice Table ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 shadow-2xl shadow-black/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="text-left px-5 py-3.5">Invoice</th>
                <th className="text-left px-4 py-3.5">Customer</th>
                <th className="text-left px-4 py-3.5">Issue Date</th>
                <th className="text-left px-4 py-3.5">Due Date</th>
                <th className="text-right px-4 py-3.5">Amount</th>
                <th className="text-left px-4 py-3.5">Status</th>
                <th className="text-center px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Loader2 size={24} className="animate-spin text-indigo-400 mx-auto" />
                    <p className="text-slate-500 text-sm mt-3">Loading invoices…</p>
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="inline-flex flex-col items-center gap-3 text-slate-600">
                      <FileText size={36} />
                      <p className="text-sm">{search || statusFilter !== "all" ? "No invoices match your filters." : "No invoices yet. Create your first invoice."}</p>
                      {!search && statusFilter === "all" && (
                        <button onClick={() => setShowCreate(true)}
                          className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1">
                          <Plus size={14} /> Create Invoice
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filtered.map(inv => {
                const dlBusy = actionBusy[inv.invoiceId + "_dl"];
                return (
                  <tr key={inv.invoiceId}
                      className="bg-slate-950 hover:bg-slate-900/60 transition-colors group">

                    {/* Invoice # */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                        {inv.invoiceId}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white text-sm leading-none mb-1">{inv.customer?.name || "—"}</p>
                      {inv.customer?.email && (
                        <p className="text-xs text-slate-500">{inv.customer.email}</p>
                      )}
                    </td>

                    {/* Issue Date */}
                    <td className="px-4 py-4 text-slate-400 text-sm tabular-nums">
                      {fmtDate(inv.orderDate || inv.createdAt)}
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-4 text-sm tabular-nums">
                      {inv.dueDate ? (
                        <span className={new Date(inv.dueDate) < new Date() && inv.paymentStatus !== "paid" ? "text-red-400 font-medium" : "text-slate-400"}>
                          {fmtDate(inv.dueDate)}
                        </span>
                      ) : <span className="text-slate-700">—</span>}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-white">{fmtINR(inv?.totals?.total)}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <StatusBadge status={inv.paymentStatus} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Preview */}
                        <button onClick={() => setPreviewId(inv.invoiceId)}
                          className="p-2 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-colors"
                          title="Preview">
                          <Eye size={15} />
                        </button>

                        {/* Toggle paid/pending */}
                        <button
                          onClick={() => updateStatus(inv.invoiceId, inv.paymentStatus === "paid" ? "pending" : "paid")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                            inv.paymentStatus === "paid"
                              ? "text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
                              : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                          }`}
                          title={inv.paymentStatus === "paid" ? "Mark Pending" : "Mark Paid"}
                        >
                          {inv.paymentStatus === "paid" ? "Unpaid" : "Paid"}
                        </button>

                        {/* Download */}
                        <button onClick={() => downloadInvoice(inv.invoiceId)} disabled={dlBusy}
                          className="p-2 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-colors disabled:opacity-40"
                          title="Download PDF">
                          {dlBusy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                        </button>

                        {/* Delete */}
                        <button onClick={() => deleteInvoice(inv.invoiceId)}
                          className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
                          title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Table Footer */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filtered.length} of {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</span>
              {statusFilter !== "all" || search ? (
                <button onClick={() => { setSearch(""); setStatusFilter("all"); }}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <X size={11} /> Clear filters
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* ── Preview Modal ── */}
      {previewId && (
        <PreviewModal
          invoiceId={previewId}
          onClose={() => setPreviewId(null)}
          onDownload={(id) => { downloadInvoice(id); }}
        />
      )}

      {/* ── Create Invoice Modal ── */}
      {showCreate && (
        <CreateInvoiceModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            loadInvoices();
            loadStats();
          }}
        />
      )}
    </div>
  );
}
