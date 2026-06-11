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

  const watermark = inv.paymentStatus || "INVOICE";

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${inv.invoice.invoiceId}</title>

<style>

body{
  font-family: Arial, sans-serif;
  background:#eef2ff;
  padding:30px;
}

/* WATERMARK */
.watermark{
  position:fixed;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%) rotate(-30deg);
  font-size:120px;
  font-weight:900;
  color:rgba(99,102,241,0.07);
  z-index:0;
}

/* CONTAINER */
.invoice{
  background:#fff;
  padding:25px;
  border-radius:16px;
  box-shadow:0 10px 30px rgba(0,0,0,0.08);
  position:relative;
  z-index:2;
}

/* HEADER */
.header{
  width:100%;
  border-collapse:collapse;
  background:#0f172a;
  color:white;
  border-radius:12px;
  overflow:hidden;
}

/* LOGO */
.logo{
  width:90px;
  height:90px;
  background:white;
  border-radius:10px;
  padding:6px;
  object-fit:contain;
}

/* COMPANY */
.company h2{
  margin:0;
  font-size:18px;
}

.small{
  font-size:12px;
  opacity:0.85;
}

/* STATUS */
.status{
  display:inline-block;
  padding:6px 14px;
  border-radius:999px;
  background:${statusColor};
  color:white;
  font-size:12px;
  margin-top:6px;
}

/* SECTION */
.section{
  margin-top:18px;
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
  background:#4f46e5;
  color:white;
  padding:10px;
  font-size:13px;
}

td{
  padding:10px;
  border-bottom:1px solid #eee;
  font-size:13px;
}

/* SUMMARY */
.summary{
  width:350px;
  margin-left:auto;
  margin-top:20px;
  border:1px solid #e5e7eb;
  border-radius:10px;
  padding:10px;
  background:#f9fafb;
}

.total{
  font-weight:700;
  color:#4f46e5;
  font-size:16px;
}

/* BANK */
.bank{
  background:#f1f5f9;
}

/* FOOTER */
.footer{
  text-align:center;
  margin-top:30px;
  font-size:11px;
  color:#64748b;
}

</style>
</head>

<body>

<div class="watermark">${watermark}</div>

<div class="invoice">

<!-- HEADER -->
<table class="header">
<tr>

  <!-- LOGO -->
  <td style="width:120px; padding:15px;">
    ${
      inv.company.logo
        ? `<img class="logo" src="${inv.company.logo}" />`
        : `<div style="color:black;">LOGO</div>`
    }
  </td>

  <!-- COMPANY -->
  <td>
    <h2>${inv.company.name}</h2>
    <div class="small">${inv.company.address}</div>
    <div class="small">${inv.company.email}</div>
    <div class="small">${inv.company.phone}</div>
  </td>

  <!-- INVOICE INFO -->
  <td style="text-align:right; padding:15px;">
    <h3>TAX INVOICE</h3>

    <div class="small">Invoice: ${inv.invoice.invoiceId}</div>
    <div class="small">Order: ${new Date(inv.invoice.orderDate).toLocaleDateString("en-IN")}</div>
    <div class="small">Purchase: ${new Date(inv.invoice.purchaseDate).toLocaleDateString("en-IN")}</div>
    <div class="small">Due: ${new Date(inv.invoice.dueDate).toLocaleDateString("en-IN")}</div>

    <div class="status">${inv.paymentStatus}</div>
  </td>

</tr>
</table>

<!-- CUSTOMER -->
<div class="section">
<h3>Bill To</h3>
<b>${inv.customer.name}</b><br>
${inv.customer.email}<br>
${inv.customer.phone}<br>
${inv.customer.address}<br>
GSTIN: ${inv.customer.gstin || "-"}
</div>

<!-- ITEMS -->
<div class="section">
<table>
<tr>
<th>#</th><th>Item</th><th>HSN</th><th>Qty</th><th>Price</th><th>Total</th>
</tr>

${inv.items.map((i, idx)=>`
<tr>
<td>${idx+1}</td>
<td>${i.name}</td>
<td>${i.hsn || "998314"}</td>
<td>${i.qty}</td>
<td>₹${i.price}</td>
<td>₹${i.qty * i.price}</td>
</tr>
`).join("")}

</table>
</div>

<!-- SUMMARY -->
<div class="summary">
<table>
<tr><td>Subtotal</td><td>₹${inv.totals.subtotal}</td></tr>
<tr><td>Discount</td><td>₹${inv.totals.discountAmount}</td></tr>
<tr><td>CGST</td><td>₹${inv.totals.cgst}</td></tr>
<tr><td>SGST</td><td>₹${inv.totals.sgst}</td></tr>
<tr><td>IGST</td><td>₹${inv.totals.igst}</td></tr>
<tr class="total"><td>Total</td><td>₹${inv.totals.total}</td></tr>
</table>
</div>

<!-- BANK -->
<div class="section bank">
<h3>Bank Details</h3>
Account: ${inv.bank.accountName}<br>
Bank: ${inv.bank.bankName}<br>
A/C: ${inv.bank.accountNumber}<br>
IFSC: ${inv.bank.ifsc}
</div>

<!-- NOTES -->
<div class="section">
<h3>Notes</h3>
${inv.notes}
</div>

<!-- FOOTER -->
<div class="footer">
Generated by SaaS Billing Engine • ReadyTechSolutions
</div>

</div>

</body>
</html>
`;
}
}

module.exports = new InvoiceTemplate();