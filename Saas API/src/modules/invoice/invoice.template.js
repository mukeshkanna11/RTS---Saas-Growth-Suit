"use strict";

// ============================================================
// modules/invoice/invoice.template.js
// Enterprise HTML template — used by /api/v1/invoice/ routes
// ============================================================

// ── Safe helpers ─────────────────────────────────────────────────────────────
const safeNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const round2  = (v) => Math.round((safeNum(v) + Number.EPSILON) * 100) / 100;

const CURRENCY_SYMBOL = { INR: "&#8377;", USD: "$" };

const fmt = (amount, currency = "INR") => {
  const n = round2(safeNum(amount));
  // Accept both ISO codes ("INR","USD") and legacy HTML entity symbols ("&#8377;","$")
  const symbol = CURRENCY_SYMBOL[currency] ?? currency ?? "&#8377;";
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

// ── Normalise tax / discount inputs ──────────────────────────────────────────
// Accepts both flat { cgst:9, sgst:9 } and nested { tax:{ cgst:9, sgst:9 } }
const normaliseTax = (data) => {
  const t = data.tax || {};
  return {
    cgstPct:  safeNum(data.cgst ?? t.cgst ?? 9),
    sgstPct:  safeNum(data.sgst ?? t.sgst ?? 9),
    igstPct:  safeNum(data.igst ?? t.igst ?? 0),
    taxType:  data.taxType || t.type || "intra",
  };
};

const normaliseDiscount = (data) => {
  if (typeof data.discount === "number") return safeNum(data.discount);
  if (data.discount?.value !== undefined) return safeNum(data.discount.value);
  return 0;
};

// ── Calculate totals (exported for invoice.service.js) ───────────────────────
const calculateTotals = (items = [], discountArg = 0, taxArg = {}) => {
  // Legacy signature: (items, discountObj, taxObj)
  // New-style callers also accepted via the normalisation above.
  const taxData = {
    cgst: safeNum(taxArg.cgst ?? 9),
    sgst: safeNum(taxArg.sgst ?? 9),
    igst: safeNum(taxArg.igst ?? 0),
  };

  let discountPct = 0;
  if (typeof discountArg === "number") {
    discountPct = safeNum(discountArg);
  } else if (discountArg?.value !== undefined) {
    discountPct = safeNum(discountArg.value);
  }

  const subtotal    = round2(items.reduce((s, i) => s + safeNum(i.qty || 1) * safeNum(i.price || 0), 0));
  const discountAmt = round2(Math.min((subtotal * discountPct) / 100, subtotal));
  const taxable     = round2(subtotal - discountAmt);
  const cgst        = round2((taxable * taxData.cgst) / 100);
  const sgst        = round2((taxable * taxData.sgst) / 100);
  const igst        = round2((taxable * taxData.igst) / 100);
  const taxTotal    = round2(cgst + sgst + igst);
  const total       = round2(taxable + taxTotal);

  return { subtotal, discountAmount: discountAmt, discountPercent: discountPct, taxable, cgst, sgst, igst, taxTotal, total };
};

// =============================================================================
// toHTML — main entry point called by invoice.service.js
// =============================================================================
const toHTML = (data = {}) => {
  const {
    company    = {},
    customer   = {},
    items      = [],
    paymentStatus = "PENDING",
    invoiceId   = `INV-${Date.now()}`,
    logoBase64  = "",
  } = data;

  // Currency-aware formatter bound to this invoice — no hardcoded ₹ or $ anywhere
  const currency = data.currency || "INR";
  const fmtCur = (amount) => fmt(amount, currency);

  // Re-normalise to prevent NaN regardless of how totals were passed in
  const { cgstPct, sgstPct, igstPct, taxType } = normaliseTax(data);
  const discountPct = normaliseDiscount(data);

  // Use passed-in totals if they exist and are valid; otherwise recalculate
  const hasTotals = data.totals && safeNum(data.totals.subtotal) >= 0;
  const totals = hasTotals
    ? {
        subtotal:       safeNum(data.totals.subtotal),
        discountAmount: safeNum(data.totals.discountAmount),
        discountPercent:safeNum(data.totals.discountPercent ?? discountPct),
        taxable:        safeNum(data.totals.taxable),
        cgst:           safeNum(data.totals.cgst),
        sgst:           safeNum(data.totals.sgst),
        igst:           safeNum(data.totals.igst),
        taxTotal:       safeNum(data.totals.taxTotal),
        total:          safeNum(data.totals.total),
      }
    : calculateTotals(Array.isArray(items) ? items : [], discountPct, { cgst: cgstPct, sgst: sgstPct, igst: igstPct });

  // Dates
  const now         = new Date();
  const orderDate   = data.orderDate   || data.order_date   || data.createdAt || now;
  const purchaseDate= data.purchaseDate|| data.purchase_date|| data.createdAt || now;
  const paymentDate = data.paymentDate || data.payment_date || null;
  const dueDate     = data.dueDate     || data.due_date     || null;

  const payStatus   = (paymentStatus || "PENDING").toString().toUpperCase();
  const sColor      = payStatus === "PAID" ? "#16a34a" : payStatus === "FAILED" ? "#dc2626" : "#d97706";
  const sIcon       = payStatus === "PAID" ? "&#10003;&nbsp;PAID" : payStatus === "FAILED" ? "&#10007;&nbsp;FAILED" : "&#9679;&nbsp;PENDING";

  const co = {
    name:    esc(company.name    || process.env.COMPANY_NAME    || "ReadyTech Solutions Pvt Ltd"),
    address: esc(company.address || process.env.COMPANY_ADDRESS || "Coimbatore, Tamil Nadu, India"),
    email:   esc(company.email   || process.env.COMPANY_MAIL    || "support@readytechsolutions.in"),
    phone:   esc(company.phone   || process.env.COMPANY_PHONE   || "+91-9876543210"),
    website: esc(company.website || process.env.COMPANY_WEBSITE || "https://readytechsolutions.com"),
    gstin:   esc(company.gstin   || process.env.COMPANY_GSTIN   || "33ABCDE1234F1Z5"),
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
  const itemRows = safeItems.map((item, i) => `
    <tr>
      <td style="text-align:center;color:#94a3b8;font-weight:600;font-size:11px">${i + 1}</td>
      <td>
        <div style="font-weight:700;color:#0f172a">${esc(item.name || item.description || "Service")}</div>
        ${(item.description && item.description !== item.name) ? `<div style="font-size:9.5px;color:#64748b;margin-top:2px">${esc(item.description)}</div>` : ""}
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
      ${dueDate     ? `<div class="kv"><span class="kv-l">Due Date</span><span class="kv-v">${fmtDate(dueDate)}</span></div>` : ""}
      ${paymentDate ? `<div class="kv"><span class="kv-l">Payment Date</span><span class="kv-v">${fmtDate(paymentDate)}</span></div>` : ""}
      <div class="kv" style="margin-top:6px;padding-top:6px;border-top:1px solid #f1f5f9">
        <span class="kv-l">Payment Status</span>
        <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:9px;font-weight:800;background:${sColor};color:#fff">${payStatus}</span>
      </div>
    </div>

    <div class="card">
      <div class="ctitle">Billed To</div>
      <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:8px">${cu.name}</div>
      ${cu.company ? `<div class="kv"><span class="kv-l">Company</span><span class="kv-v">${cu.company}</span></div>` : ""}
      ${cu.gstin   ? `<div class="kv"><span class="kv-l">GSTIN</span><span class="kv-v kv-mono">${cu.gstin}</span></div>` : ""}
      <div class="kv"><span class="kv-l">Email</span><span class="kv-v">${cu.email || "&#8212;"}</span></div>
      ${cu.phone   ? `<div class="kv"><span class="kv-l">Phone</span><span class="kv-v">${cu.phone}</span></div>` : ""}
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

  <!-- FOOTER -->
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
};

// ── Legacy class wrapper (keeps existing callers working) ─────────────────────
class InvoiceTemplate {
  num(v)        { return safeNum(v); }
  money(v)      { return round2(safeNum(v)).toFixed(2); }
  formatDate(d) { return fmtDate(d); }
  build(data)   { return toHTML(data); }
  toHTML(data)  { return toHTML(data); }
}

module.exports = new InvoiceTemplate();
module.exports.toHTML        = toHTML;
module.exports.calculateTotals = calculateTotals;
