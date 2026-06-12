class InvoiceTemplate {

  // ================= SAFE UTIL =================
  num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  money(v) {
    return this.num(v).toFixed(2);
  }

  formatDate(date) {
    if (!date) return "-";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-IN");
  }

  resolveDate(data, key) {
    // Universal safe resolver (fixes ALL missing date issues)
    return (
      data?.[key] ||
      data?.[`${key}_date`] ||
      data?.[key.replace(/Date/, "_date")] ||
      data?.createdAt ||
      null
    );
  }

  safeDate(...dates) {
  for (const d of dates) {
    if (!d) continue;

    const date = new Date(d);
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

  // ================= BUILD =================
  build(data = {}) {

  const {
    company = {},
    customer = {},
    items = [],
    totals = {},
    discount = {},
    tax = {},
    bank = {},

    invoiceId = `INV-${Date.now()}`,
    paymentStatus = "PENDING",
    notes = "",
    terms = []
  } = data;

  // 🔥 SAFE DATE RESOLUTION (FIXED)
  const orderDate = this.safeDate(data.orderDate, data.order_date, data.createdAt);
  const purchaseDate = this.safeDate(data.purchaseDate, data.purchase_date, data.createdAt);
  const paymentDate = this.safeDate(data.paymentDate, data.payment_date);
  const dueDate = this.safeDate(data.dueDate, data.due_date);

  const invoice = {
    invoiceId,
    orderDate,
    purchaseDate,
    paymentDate,
    dueDate
  };

  return this.toHTML({
    company,
    customer,
    items,
    totals,
    discount,
    tax,
    bank,
    notes,
    terms,
    invoice,
    paymentStatus
  });
}

  // ================= HTML =================
  toHTML(data = {}) {

    const {
      company = {},
      customer = {},
      items = [],
      totals = {},
      paymentStatus = "PENDING",
      invoice = {}
    } = data;

   const {
  invoiceId,
  orderDate,
  purchaseDate,
  paymentDate,
  dueDate
} = data;

    const statusColor =
      paymentStatus === "PAID"
        ? "#16a34a"
        : paymentStatus === "PENDING"
        ? "#f59e0b"
        : "#ef4444";

    const money = (v) => this.money(v);

    const safeItems = Array.isArray(items) ? items : [];

    const rows = safeItems.map((i, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${i.name || "-"}</td>
        <td>${i.hsn || "998314"}</td>
        <td>${i.qty || 0}</td>
        <td>₹${money(i.price)}</td>
        <td>₹${money((i.qty || 0) * (i.price || 0))}</td>
      </tr>
    `).join("");

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${invoiceId || "Invoice"}</title>

<style>
@page { size: A4; margin: 15mm; }

body{
  font-family: Arial, sans-serif;
  background:#f6f7fb;
  margin:0;
  color:#0f172a;
}

.invoice{
  background:#fff;
  padding:24px;
  border-radius:12px;
  border:1px solid #e5e7eb;
}

.header{
  width:100%;
  border-collapse:collapse;
  background:#f8fafc;
  border-radius:10px;
  overflow:hidden;
  border:1px solid #e5e7eb;
}

.company h2{ margin:0; font-size:18px; }

.small{
  font-size:12px;
  color:#64748b;
}

.status{
  display:inline-block;
  padding:5px 12px;
  border-radius:999px;
  background:${statusColor};
  color:#fff;
  font-size:12px;
  margin-top:6px;
}

.section{
  margin-top:14px;
  padding:14px;
  border:1px solid #e5e7eb;
  border-radius:10px;
}

table{
  width:100%;
  border-collapse:collapse;
}

th{
  background:#eef2ff;
  padding:10px;
  font-size:12px;
  text-align:left;
}

td{
  padding:10px;
  font-size:12px;
  border-bottom:1px solid #f1f5f9;
}

.summary{
  width:320px;
  margin-left:auto;
  margin-top:18px;
  padding:12px;
  border:1px solid #e5e7eb;
  border-radius:10px;
  background:#f8fafc;
}

.total{
  font-weight:700;
  color:#4f46e5;
}

.footer{
  text-align:center;
  margin-top:20px;
  font-size:11px;
  color:#64748b;
}

*{
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
</style>
</head>

<body>

<div class="invoice">

  <!-- HEADER -->
  <table class="header">
    <tr>

      <td style="padding:14px;">
        <div class="company">
          <h2>${company?.name || "-"}</h2>
          <div class="small">${company?.address || ""}</div>
          <div class="small">${company?.email || ""} | ${company?.phone || ""}</div>
        </div>
      </td>

      <td style="text-align:right; padding:14px;">
        <div style="font-weight:700;">TAX INVOICE</div>

        <div class="small">Invoice: ${invoiceId || "-"}</div>
        <div class="small">Order Date: ${this.formatDate(orderDate)}</div>
        <div class="small">Purchase Date: ${this.formatDate(purchaseDate)}</div>
        <div class="small">Payment Date: ${this.formatDate(paymentDate)}</div>
        <div class="small">Due Date: ${this.formatDate(dueDate)}</div>

        <div class="status">${paymentStatus}</div>
      </td>

    </tr>
  </table>

  <!-- CUSTOMER -->
  <div class="section">
    <h3 style="margin:0 0 6px 0;">Bill To</h3>
    <b>${customer?.name || "-"}</b><br>
    <div class="small">${customer?.email || ""}</div>
    <div class="small">${customer?.phone || ""}</div>
    <div class="small">${customer?.address || ""}</div>
    <div class="small">GSTIN: ${customer?.gstin || "-"}</div>
  </div>

  <!-- ITEMS -->
  <div class="section">
    <table>
      <tr>
        <th>#</th>
        <th>Item</th>
        <th>HSN</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
      ${rows}
    </table>
  </div>

  <!-- SUMMARY -->
  <div class="summary">
    <table>
      <tr><td>Subtotal</td><td>₹${money(totals.subtotal)}</td></tr>
      <tr><td>Discount</td><td>₹${money(totals.discountAmount)}</td></tr>
      <tr><td>CGST</td><td>₹${money(totals.cgst)}</td></tr>
      <tr><td>SGST</td><td>₹${money(totals.sgst)}</td></tr>
      <tr class="total"><td>Total</td><td>₹${money(totals.total)}</td></tr>
    </table>
  </div>

  <div class="footer">
    Generated by ReadyTechSolutions • SaaS Billing Engine
  </div>

</div>

</body>
</html>
`;
  }
}

module.exports = new InvoiceTemplate();