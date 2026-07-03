"use strict";

// ============================================================
// src/services/invoice.service.js
// Enterprise-Grade Invoice Generator — html-pdf-node edition
//
// Public API (backward compatible):
//   generateInvoice(data, options)  → { success, message, invoice }
//   streamInvoice(filePath, res, fileName)
//   calculateTotals(data)
// ============================================================

const htmlPdf = require("html-pdf-node");
const fs      = require("fs");
const path    = require("path");

const InvoiceCounter = require("../modules/models/invoiceCounter.model");

// ── Safe number helpers (ZERO-NaN guarantee) ──────────────────────────────────
const safeNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const round2  = (v) => Math.round((safeNum(v) + Number.EPSILON) * 100) / 100;

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = (amount, currency = "INR") => {
  const n = round2(safeNum(amount));
  if (currency === "USD") return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `&#8377;${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (d) => {
  if (!d) return "&#8212;";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "&#8212;";
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const esc = (s) => String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

// ── html-pdf-node options ─────────────────────────────────────────────────────
const PDF_OPTIONS = {
  format: "A4",
  printBackground: true,
  margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
};

// =============================================================================
class InvoiceService {

  _ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }

  async _nextId() {
    try { return await InvoiceCounter.getNextInvoiceNumber(); }
    catch (_) { return `INV-${Date.now()}`; }
  }

  // ── Input normalisation ───────────────────────────────────────────────────
  // Accepts BOTH caller formats:
  //   Flat:   { cgst:9, sgst:9, igst:0, discount:5 }
  //   Nested: { tax:{cgst:9,sgst:9}, discount:{type:"percent",value:5} }
  _normalise(data) {
    const tax     = data.tax || {};
    const cgstPct = safeNum(data.cgst  ?? tax.cgst  ?? 9);
    const sgstPct = safeNum(data.sgst  ?? tax.sgst  ?? 9);
    const igstPct = safeNum(data.igst  ?? tax.igst  ?? 0);
    const taxType = data.taxType || tax.type || (igstPct > 0 ? "inter" : "intra");

    // Discount — supports three calling conventions:
    //   discount: 5                              → 5 % off
    //   discount: { type: "percent", value: 5 }  → 5 % off
    //   discount: { type: "fixed",   value: 500 } → ₹500 fixed deduction
    let discountPct   = 0;
    let discountFixed = 0;
    let discountType  = "percent";

    if (typeof data.discount === "number") {
      discountPct  = safeNum(data.discount);
    } else if (data.discount?.type === "fixed") {
      discountFixed = safeNum(data.discount.value);
      discountType  = "fixed";
    } else if (data.discount?.value !== undefined) {
      discountPct  = safeNum(data.discount.value);
    }

    const items = (data.items || []).map(i => ({
      name:        esc(i.name || i.description || "Service"),
      description: (i.description && i.description !== i.name) ? esc(i.description) : "",
      qty:         safeNum(i.qty   || 1),
      price:       safeNum(i.price || 0),
      hsn:         i.hsn || "998314",
    }));

    const customer = {
      name:    esc(data.customer?.name    || data.clientName    || "Customer"),
      company: esc(data.customer?.company || data.clientCompany || ""),
      email:   esc(data.customer?.email   || data.clientEmail   || ""),
      phone:   esc(data.customer?.phone   || data.clientPhone   || ""),
      address: esc(data.customer?.address || data.clientAddress || "India"),
      state:   esc(data.customer?.state   || "Tamil Nadu"),
      country: esc(data.customer?.country || "India"),
      gstin:   esc(data.customer?.gstin   || data.clientGstin   || ""),
    };

    const company = {
      name:    esc(data.company?.name    || process.env.COMPANY_NAME    || "ReadyTechSolutions Pvt Ltd"),
      address: esc(data.company?.address || process.env.COMPANY_ADDRESS || "Coimbatore, Tamil Nadu, India"),
      email:   esc(data.company?.email   || process.env.COMPANY_MAIL    || "info@readytechsolutions.in"),
      phone:   esc(data.company?.phone   || process.env.COMPANY_PHONE   || "70107 97721"),
      website: esc(data.company?.website || process.env.COMPANY_WEBSITE || "https://readytechsolutions.in/"),
      gstin:   esc(data.company?.gstin   || process.env.COMPANY_GSTIN   || "33ABCDE1234F1Z5"),
      pan:     esc(data.company?.pan     || process.env.COMPANY_PAN     || ""),
      cin:     esc(data.company?.cin     || process.env.COMPANY_CIN     || ""),
    };

    return { cgstPct, sgstPct, igstPct, taxType, discountPct, discountFixed, discountType, items, customer, company };
  }

  // ── Core totals (no NaN possible) ────────────────────────────────────────
  _calcTotals(norm) {
    const { cgstPct, sgstPct, igstPct, discountPct, discountFixed, discountType, items } = norm;
    const subtotal    = round2(items.reduce((acc, i) => acc + i.qty * i.price, 0));

    // Discount: fixed amount (capped at subtotal) or percentage
    const discountAmt = discountType === "fixed"
      ? round2(Math.min(safeNum(discountFixed), subtotal))
      : round2((subtotal * discountPct) / 100);

    const taxable  = round2(subtotal - discountAmt);
    const cgstAmt  = round2((taxable * cgstPct)  / 100);
    const sgstAmt  = round2((taxable * sgstPct)  / 100);
    const igstAmt  = round2((taxable * igstPct)  / 100);
    const taxTotal = round2(cgstAmt + sgstAmt + igstAmt);
    return {
      subtotal,
      discountAmount:  discountAmt,
      discountPercent: discountType === "percent" ? discountPct : 0,
      discountFixed:   discountType === "fixed"   ? discountAmt : 0,
      discountType,
      taxable,
      cgst: cgstAmt, cgstPercent: cgstPct,
      sgst: sgstAmt, sgstPercent: sgstPct,
      igst: igstAmt, igstPercent: igstPct,
      taxTotal,
      total: round2(taxable + taxTotal),
    };
  }

  // ── Public: calculateTotals ───────────────────────────────────────────────
  calculateTotals(data) {
    return this._calcTotals(this._normalise(data));
  }

  // ── Enterprise HTML template ──────────────────────────────────────────────
  _buildHTML(data, norm, totals, invoiceId, currency) {
    const { cgstPct, sgstPct, igstPct, taxType, discountPct, discountType, items, customer, company } = norm;

    const now         = new Date();
    const issueDate   = data.issueDate   ? new Date(data.issueDate)   : now;
    const orderDate   = data.orderDate   ? new Date(data.orderDate)   : now;
    const dueDate     = data.dueDate     ? new Date(data.dueDate)     : new Date(now.getTime() + 30 * 864e5);
    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : null;

    const payStatus   = (data.paymentStatus || "PENDING").toUpperCase();
    const sColor      = payStatus === "PAID" ? "#16a34a" : payStatus === "FAILED" ? "#dc2626" : "#d97706";
    const sIcon       = payStatus === "PAID" ? "&#10003;&nbsp;PAID" : payStatus === "FAILED" ? "&#10007;&nbsp;FAILED" : "&#9679;&nbsp;PENDING";

    const sub      = data.subscription     || null;
    const paypal   = data.paypalTransaction || null;
    const tokens   = data.tokenUsage       || null;
    const aiList   = data.aiCharges        || [];

    // Dual-currency conversion card — rendered only when gateway ≠ INR
    const paymentCurrency = data.paymentCurrency || null;
    const paymentAmt      = data.paymentAmount   != null ? (parseFloat(data.paymentAmount)   || 0) : null;
    const exchRate        = data.exchangeRate    != null ? (parseFloat(data.exchangeRate)    || 0) : null;
    const showConv        = paymentCurrency && paymentCurrency !== "INR" && paymentAmt !== null && exchRate;

    // Items rows
    const itemRows = items.map((item, i) => `
      <tr>
        <td style="text-align:center;color:#94a3b8;font-weight:600;font-size:11px">${i + 1}</td>
        <td>
          <div style="font-weight:700;color:#0f172a">${item.name}</div>
          ${item.description ? `<div style="font-size:9.5px;color:#64748b;margin-top:2px">${item.description}</div>` : ""}
        </td>
        <td style="text-align:center;color:#64748b;font-family:monospace;font-size:9.5px">${item.hsn}</td>
        <td style="text-align:center;font-weight:600">${item.qty}</td>
        <td style="text-align:right">${fmt(item.price, currency)}</td>
        <td style="text-align:right;font-weight:700;color:#1a3c5e">${fmt(item.qty * item.price, currency)}</td>
      </tr>`).join("");

    const aiRows = aiList.length ? `
      <tr style="background:#dbeafe">
        <td colspan="5" style="padding:8px 12px;font-size:9.5px;font-weight:700;color:#1d4ed8;letter-spacing:1px;text-transform:uppercase">AI Usage Charges</td>
        <td></td>
      </tr>
      ${aiList.map(c => `<tr style="background:#eff6ff">
        <td></td>
        <td colspan="3" style="font-size:10.5px">${esc(c.description || "AI Generation")}${c.tokens ? ` <span style="color:#94a3b8;font-size:9px">(${safeNum(c.tokens).toLocaleString()} tokens)</span>` : ""}</td>
        <td></td>
        <td style="text-align:right;font-weight:700;color:#1a3c5e">${fmt(c.amount || 0, currency)}</td>
      </tr>`).join("")}` : "";

    const modTags = sub?.modules
      ? Object.entries(sub.modules).map(([k, on]) =>
          `<span style="display:inline-block;margin:2px;padding:3px 9px;border-radius:12px;font-size:8.5px;font-weight:${on ? "700" : "400"};background:${on ? "#6366f1" : "#e2e8f0"};color:${on ? "#fff" : "#94a3b8"}">${k.toUpperCase()}</span>`
        ).join("")
      : "";

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
.kv-mono{font-family:"Courier New",monospace;font-size:9px}

.sub-box{background:linear-gradient(135deg,#eef2ff,#f8f9ff);border:1px solid #c7d2fe;border-radius:10px;padding:14px 16px;margin-bottom:18px}
.sub-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:10px}
.sub-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#6366f1;margin-bottom:3px}
.sub-val{font-size:12px;font-weight:800;color:#1e1b4b}
.mod-row{padding-top:10px;border-top:1px solid #c7d2fe}

.tbl-wrap{border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:18px}
.inv-tbl{width:100%;border-collapse:collapse}
.inv-tbl thead tr{background:linear-gradient(135deg,#1a3c5e,#1e40af)}
.inv-tbl thead th{padding:10px 12px;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.9);text-align:left}
.inv-tbl thead th.r{text-align:right}
.inv-tbl thead th.c{text-align:center}
.inv-tbl tbody tr:nth-child(even){background:#f8fafc}
.inv-tbl tbody td{padding:10px 12px;font-size:11px;border-bottom:1px solid #e2e8f0;vertical-align:middle}
.inv-tbl tbody tr:last-child td{border-bottom:none}

.totals-layout{display:flex;gap:20px;margin-bottom:18px;align-items:flex-start}
.totals-side{flex:1;min-width:0}
.totals-box{width:288px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;flex-shrink:0}
.t-row{display:flex;justify-content:space-between;align-items:center;padding:9px 16px;border-bottom:1px solid #e2e8f0;background:#fff}
.t-lbl{font-size:11px;color:#64748b}
.t-val{font-size:11px;font-weight:600;color:#0f172a}
.t-discount .t-val{color:#dc2626}
.t-taxable{background:#f8fafc!important}
.t-taxable .t-lbl,.t-taxable .t-val{font-weight:700;color:#334155}
.t-grand{background:linear-gradient(135deg,#1a3c5e,#1e40af);padding:15px 16px;display:flex;justify-content:space-between;align-items:center}
.t-grand-lbl{font-size:13px;font-weight:700;color:rgba(255,255,255,.85)}
.t-grand-val{font-size:21px;font-weight:800;color:#fff;letter-spacing:-.5px}

.pp-card{background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;margin-bottom:14px}
.pp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pp-lbl{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#92400e;margin-bottom:2px}
.pp-val{font-size:10px;font-weight:600;color:#1c1917;font-family:"Courier New",monospace;word-break:break-all}
.pp-val-plain{font-family:inherit}

.tok-card{background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:14px 16px;margin-bottom:14px}
.tok-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.tok-lbl{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#0369a1;margin-bottom:4px}
.tok-val{font-size:16px;font-weight:800;color:#0c4a6e}

.conv-card{background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px 16px;margin-bottom:14px}
.conv-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:8px}
.conv-lbl{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#166534;margin-bottom:2px}
.conv-val{font-size:11px;font-weight:700;color:#14532d;font-family:"Courier New",monospace}
.conv-note{font-size:9px;color:#166534;font-style:italic;border-top:1px solid #86efac;padding-top:7px;margin-top:4px}

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
</style>
</head>
<body>
<div class="page">
${payStatus !== "PAID" ? `<div class="wm">${payStatus}</div>` : ""}

<!-- HEADER -->
<div class="hdr">
  <div class="hdr-inner">
    <div>
      <div class="co-name">${company.name}</div>
      <div class="co-info">${company.address}<br>${company.email} &bull; ${company.phone}<br>${company.website}</div>
      <div class="co-badge">GSTIN: ${company.gstin}${company.pan ? " &nbsp;|&nbsp; PAN: " + company.pan : ""}</div>
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
      <div class="kv"><span class="kv-l">Invoice Date</span><span class="kv-v">${fmtDate(issueDate)}</span></div>
      <div class="kv"><span class="kv-l">Order Date</span><span class="kv-v">${fmtDate(orderDate)}</span></div>
      <div class="kv"><span class="kv-l">Due Date</span><span class="kv-v">${fmtDate(dueDate)}</span></div>
      ${paymentDate ? `<div class="kv"><span class="kv-l">Payment Date</span><span class="kv-v">${fmtDate(paymentDate)}</span></div>` : ""}
      <div class="kv"><span class="kv-l">Payment Method</span><span class="kv-v">${paypal ? "PayPal" : esc(data.paymentGateway || "Online")}</span></div>
      ${paypal?.captureId ? `<div class="kv"><span class="kv-l">Transaction ID</span><span class="kv-v kv-mono">${paypal.captureId}</span></div>` : ""}
      <div class="kv" style="margin-top:6px;padding-top:6px;border-top:1px solid #f1f5f9">
        <span class="kv-l">Payment Status</span>
        <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:9px;font-weight:800;background:${sColor};color:#fff">${payStatus}</span>
      </div>
    </div>

    <div class="card">
      <div class="ctitle">Billed To</div>
      <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:8px">${customer.name}</div>
      ${customer.company ? `<div class="kv"><span class="kv-l">Company</span><span class="kv-v">${customer.company}</span></div>` : ""}
      ${customer.gstin   ? `<div class="kv"><span class="kv-l">GSTIN</span><span class="kv-v kv-mono">${customer.gstin}</span></div>` : ""}
      <div class="kv"><span class="kv-l">Email</span><span class="kv-v">${customer.email || "&#8212;"}</span></div>
      ${customer.phone   ? `<div class="kv"><span class="kv-l">Phone</span><span class="kv-v">${customer.phone}</span></div>` : ""}
      <div class="kv"><span class="kv-l">Address</span><span class="kv-v">${customer.address}</span></div>
      <div class="kv"><span class="kv-l">State / Country</span><span class="kv-v">${customer.state}, ${customer.country}</span></div>
    </div>
  </div>

  <!-- Subscription Details -->
  ${sub ? `
  <div class="sub-box">
    <div class="ctitle" style="color:#4338ca;border-color:#c7d2fe">Subscription Details</div>
    <div class="sub-grid">
      <div><div class="sub-lbl">Plan</div><div class="sub-val">${esc((sub.plan || "").toUpperCase())}</div></div>
      <div><div class="sub-lbl">Billing Cycle</div><div class="sub-val">${esc(sub.billingCycle || "Monthly")}</div></div>
      <div><div class="sub-lbl">Status</div><div class="sub-val" style="color:${sub.status === "active" ? "#16a34a" : "#d97706"}">${esc((sub.status || "").toUpperCase())}</div></div>
      ${sub.renewalDate ? `<div><div class="sub-lbl">Next Renewal</div><div class="sub-val" style="font-size:10.5px">${fmtDate(sub.renewalDate)}</div></div>` : ""}
    </div>
    ${modTags ? `<div class="mod-row">${modTags}</div>` : ""}
  </div>` : ""}

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
      <tbody>
        ${itemRows}
        ${aiRows}
      </tbody>
    </table>
  </div>

  <!-- Totals + Side Panels -->
  <div class="totals-layout">
    <div class="totals-side">

      ${paypal ? `
      <div class="pp-card">
        <div class="ctitle" style="color:#92400e;border-color:#fde68a">PayPal Transaction Details</div>
        <div class="pp-grid">
          ${paypal.captureId  ? `<div><div class="pp-lbl">Capture ID</div><div class="pp-val">${esc(paypal.captureId)}</div></div>` : ""}
          ${paypal.orderId    ? `<div><div class="pp-lbl">Order ID</div><div class="pp-val">${esc(paypal.orderId)}</div></div>` : ""}
          ${paypal.payerEmail ? `<div><div class="pp-lbl">Payer Email</div><div class="pp-val pp-val-plain">${esc(paypal.payerEmail)}</div></div>` : ""}
          ${paypal.capturedAt ? `<div><div class="pp-lbl">Captured At</div><div class="pp-val pp-val-plain">${fmtDate(paypal.capturedAt)}</div></div>` : ""}
        </div>
      </div>` : ""}

      ${showConv ? `
      <div class="conv-card">
        <div class="ctitle" style="color:#166534;border-color:#86efac">Payment Details</div>
        <div class="conv-grid">
          <div>
            <div class="conv-lbl">Paid via PayPal</div>
            <div class="conv-val">$${paymentAmt.toFixed(2)} ${paymentCurrency}</div>
          </div>
          <div>
            <div class="conv-lbl">Exchange Rate (indicative)</div>
            <div class="conv-val">1 ${paymentCurrency} = &#8377;${exchRate ? exchRate.toFixed(2) : "—"}</div>
          </div>
          <div>
            <div class="conv-lbl">Invoice Amount (INR)</div>
            <div class="conv-val">&#8377;${fmt(totals.subtotal, "INR").replace("&#8377;", "")}</div>
          </div>
          <div>
            <div class="conv-lbl">Invoice Currency</div>
            <div class="conv-val" style="font-family:inherit">Indian Rupee (INR)</div>
          </div>
        </div>
        <div class="conv-note">GST invoice is issued in INR at the plan&#39;s listed price. Payment was processed in ${paymentCurrency} via PayPal.</div>
      </div>` : ""}

      ${tokens ? `
      <div class="tok-card">
        <div class="ctitle" style="color:#0369a1;border-color:#bae6fd">AI Token Usage &mdash; ${esc(tokens.month || "")}</div>
        <div class="tok-grid">
          <div><div class="tok-lbl">Plan</div><div class="tok-val" style="font-size:13px">${esc((tokens.plan || "").toUpperCase())}</div></div>
          <div><div class="tok-lbl">Allocated</div><div class="tok-val">${tokens.unlimited ? "&#8734;" : safeNum(tokens.allocated).toLocaleString()}</div></div>
          <div><div class="tok-lbl">Used</div><div class="tok-val">${safeNum(tokens.used).toLocaleString()}</div></div>
          <div><div class="tok-lbl">Remaining</div><div class="tok-val">${tokens.unlimited ? "&#8734;" : safeNum(tokens.remaining).toLocaleString()}</div></div>
        </div>
      </div>` : `<div style="flex:1"></div>`}

    </div>

    <!-- Grand Totals -->
    <div class="totals-box">
      <div class="t-row"><span class="t-lbl">Subtotal</span><span class="t-val">${fmt(totals.subtotal, currency)}</span></div>
      ${totals.discountAmount > 0 ? `
      <div class="t-row t-discount">
        <span class="t-lbl">Discount${discountType === "fixed" ? " (Fixed)" : ` (${discountPct}%)`}</span>
        <span class="t-val">&minus;&nbsp;${fmt(totals.discountAmount, currency)}</span>
      </div>
      <div class="t-row t-taxable"><span class="t-lbl">Taxable Value</span><span class="t-val">${fmt(totals.taxable, currency)}</span></div>` : ""}
      ${taxType === "inter" && igstPct > 0
        ? `<div class="t-row"><span class="t-lbl">IGST (${igstPct}%)</span><span class="t-val">${fmt(totals.igst, currency)}</span></div>`
        : `${cgstPct > 0 ? `<div class="t-row"><span class="t-lbl">CGST (${cgstPct}%)</span><span class="t-val">${fmt(totals.cgst, currency)}</span></div>` : ""}
           ${sgstPct > 0 ? `<div class="t-row"><span class="t-lbl">SGST (${sgstPct}%)</span><span class="t-val">${fmt(totals.sgst, currency)}</span></div>` : ""}`}
      <div class="t-grand">
        <span class="t-grand-lbl">Grand Total</span>
        <span class="t-grand-val">${fmt(totals.total, currency)}</span>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer-stripe"></div>
  <div class="footer">
    <div class="fqr">
      <img src="${qrSrc}" alt="QR" onerror="this.style.display='none'">
      <div class="fqr-lbl">Scan to verify</div>
    </div>
    <div class="fmid">
      <div class="fthank">Thank you for choosing ${company.name}!</div>
      <div class="fcontact">Support: ${company.email} &bull; ${company.phone}<br>Website: ${company.website}</div>
      <div class="flegal">
        Invoice: ${invoiceId} &bull; Generated: ${fmtDate(now)}${company.gstin ? ` &bull; GSTIN: ${company.gstin}` : ""}${company.cin ? ` &bull; CIN: ${company.cin}` : ""}<br>
        This is a computer-generated invoice and does not require a physical signature.
      </div>
    </div>
    <div class="fsig">
      <div class="sig-line">Authorised Signatory<br>${company.name}</div>
    </div>
  </div>

</div>
</div>
</body>
</html>`;
  }

  // ── Public API: generateInvoice ───────────────────────────────────────────
  async generateInvoice(data, options = {}) {
    const { filePath: customPath = null, res = null, autoDownload = false } = options;

    try {
      const invoiceId = data.invoiceId || (await this._nextId());
      const currency  = data.currency || process.env.PAYPAL_CURRENCY || "INR";

      const norm   = this._normalise(data);
      const totals = this._calcTotals(norm);
      const html   = this._buildHTML(data, norm, totals, invoiceId, currency);

      const invoicesDir = path.join(process.cwd(), "uploads", "invoices");
      this._ensureDir(invoicesDir);

      const fileName  = `${invoiceId}.pdf`;
      const finalPath = customPath || path.join(invoicesDir, fileName);

      const buffer = await htmlPdf.generatePdf({ content: html }, PDF_OPTIONS);

      if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error("html-pdf-node returned an invalid buffer");
      }

      fs.writeFileSync(finalPath, buffer);

      if (autoDownload && res) {
        return this.streamInvoice(finalPath, res, fileName);
      }

      return {
        success: true,
        message: "Invoice generated successfully",
        invoice: { invoiceId, fileName, filePath: finalPath, totals },
      };
    } catch (err) {
      console.error("[Invoice] generateInvoice failed:", err.message);
      throw err;
    }
  }

  // ── Public API: streamInvoice ─────────────────────────────────────────────
  async streamInvoice(filePath, res, fileName = "invoice.pdf") {
    try {
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: "Invoice file not found" });
      }
      res.writeHead(200, {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });
      const stream = fs.createReadStream(filePath);
      stream.on("error", (err) => {
        console.error("[Invoice] Stream error:", err.message);
        if (!res.headersSent) res.status(500).end();
        else res.end();
      });
      stream.pipe(res);
    } catch (err) {
      console.error("[Invoice] streamInvoice failed:", err.message);
      if (res && !res.headersSent) res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new InvoiceService();
