class InvoiceTemplate {
  num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  money(v) {
    return this.num(v).toFixed(2);
  }

  formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN");
  }

  build(data = {}) {
    const {
      company = {},
      customer = {},
      items = [],
      totals = {},

      invoiceId = `INV-${Date.now()}`,

      orderDate,
      purchaseDate,
      paymentDate,
      dueDate,

      paymentStatus = "PENDING",

      notes = "",
      terms = [],

      bank = {}
    } = data;

    return this.toHTML({
      company,
      customer,
      items,
      totals,
      notes,
      terms,
      bank,

      invoice: {
        invoiceId,
        orderDate,
        purchaseDate,
        paymentDate,
        dueDate
      },

      paymentStatus
    });
  }

toHTML(inv) {

  const statusColor =
    inv.paymentStatus === "PAID"
      ? "#16a34a"
      : inv.paymentStatus === "PENDING"
      ? "#f59e0b"
      : "#ef4444";

  const invoiceId = inv.invoiceId || "N/A";
  const orderDate = inv.orderDate
    ? new Date(inv.orderDate).toLocaleDateString("en-IN")
    : "-";

  const dueDate = inv.dueDate
    ? new Date(inv.dueDate).toLocaleDateString("en-IN")
    : "-";

  const items = Array.isArray(inv.items) ? inv.items : [];
  const totals = inv.totals || {};

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${invoiceId}</title>

<style>

@page {
  size: A4;
  margin: 15mm;
}

body{
  font-family: Arial, sans-serif;
  background:#f6f7fb;
  margin:0;
  padding:0;
  color:#0f172a;
}

/* MAIN CARD */
.invoice{
  background:#fff;
  padding:24px;
  border-radius:12px;
  border:1px solid #e5e7eb;
}

/* HEADER */
.header{
  width:100%;
  border-collapse:collapse;
  background:#f8fafc;
  border-radius:10px;
  overflow:hidden;
  border:1px solid #e5e7eb;
}

.company h2{
  margin:0;
  font-size:18px;
}

.small{
  font-size:12px;
  color:#64748b;
}

/* STATUS BADGE */
.status{
  display:inline-block;
  padding:5px 12px;
  border-radius:999px;
  background:${statusColor};
  color:white;
  font-size:12px;
  margin-top:6px;
}

/* SECTION */
.section{
  margin-top:14px;
  padding:14px;
  border:1px solid #e5e7eb;
  border-radius:10px;
  background:#fff;
}

/* TABLE */
table{
  width:100%;
  border-collapse:collapse;
  margin-top:10px;
}

th{
  background:#eef2ff;
  padding:10px;
  font-size:12px;
  text-align:left;
  color:#1e293b;
}

td{
  padding:10px;
  font-size:12px;
  border-bottom:1px solid #f1f5f9;
  color:#334155;
}

/* SUMMARY BOX */
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
  font-size:14px;
}

/* FOOTER */
.footer{
  text-align:center;
  margin-top:20px;
  font-size:11px;
  color:#64748b;
}

/* PDF SAFE */
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
          <h2>${inv.company?.name || "-"}</h2>
          <div class="small">${inv.company?.address || ""}</div>
          <div class="small">${inv.company?.email || ""} | ${inv.company?.phone || ""}</div>
        </div>
      </td>

      <td style="text-align:right; padding:14px;">
        <div style="font-weight:700;">TAX INVOICE</div>

        <div class="small">Invoice: ${invoiceId}</div>
        <div class="small">Order: ${orderDate}</div>
        <div class="small">Due: ${dueDate}</div>

        <div class="status">${inv.paymentStatus || "-"}</div>
      </td>

    </tr>
  </table>

  <!-- CUSTOMER -->
  <div class="section">
    <h3 style="margin:0 0 6px 0;">Bill To</h3>
    <b>${inv.customer?.name || "-"}</b><br>
    <div class="small">${inv.customer?.email || ""}</div>
    <div class="small">${inv.customer?.phone || ""}</div>
    <div class="small">${inv.customer?.address || ""}</div>
    <div class="small">GSTIN: ${inv.customer?.gstin || "-"}</div>
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

      ${items.map((i, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${i.name || "-"}</td>
          <td>${i.hsn || "998314"}</td>
          <td>${i.qty || 0}</td>
          <td>₹${i.price || 0}</td>
          <td>₹${(i.qty || 0) * (i.price || 0)}</td>
        </tr>
      `).join("")}

    </table>
  </div>

  <!-- SUMMARY -->
  <div class="summary">
    <table>
      <tr><td>Subtotal</td><td>₹${totals.subtotal || 0}</td></tr>
      <tr><td>Discount</td><td>₹${totals.discountAmount || 0}</td></tr>
      <tr><td>CGST</td><td>₹${totals.cgst || 0}</td></tr>
      <tr><td>SGST</td><td>₹${totals.sgst || 0}</td></tr>
      <tr class="total"><td>Total</td><td>₹${totals.total || 0}</td></tr>
    </table>
  </div>

  <!-- FOOTER -->
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