class InvoiceTemplate {
  // ======================================================
  // SAFE NUMBER (PREVENT NaN COMPLETELY)
  // ======================================================
  num(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  round(v) {
    return Math.round((this.num(v) + Number.EPSILON) * 100) / 100;
  }

  // ======================================================
  // TAX ENGINE
  // ======================================================
  calculateTax(amount, tax) {
    const type = tax?.type || "intra";

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (type === "intra") {
      cgst = this.round((amount * this.num(tax.cgst)) / 100);
      sgst = this.round((amount * this.num(tax.sgst)) / 100);
    } else {
      igst = this.round((amount * this.num(tax.igst)) / 100);
    }

    return {
      cgst,
      sgst,
      igst,
      total: this.round(cgst + sgst + igst),
    };
  }

  // ======================================================
  // DISCOUNT ENGINE
  // ======================================================
  applyDiscount(amount, discount) {
    if (!discount) {
      return { discountAmount: 0, finalAmount: amount };
    }

    let discountAmount = 0;

    if (discount.type === "percent") {
      discountAmount = (amount * this.num(discount.value)) / 100;
    } else {
      discountAmount = this.num(discount.value);
    }

    return {
      discountAmount: this.round(discountAmount),
      finalAmount: this.round(amount - discountAmount),
    };
  }

  // ======================================================
  // MAIN INVOICE BUILDER
  // ======================================================
  build(data) {
    const now = new Date();

    const {
      company,
      customer,
      items = [],
      manualCharges = [],
      discount = { type: "percent", value: 0 },
      tax = { type: "intra", cgst: 0, sgst: 0, igst: 0 },

      plan = null,

      // IMPORTANT SAAS FLOW DATES
      orderDate = now,
      paymentDate = null,
      purchaseDate = paymentDate || now,

      invoiceId = `INV-${Date.now()}`,
      currency = "INR",
    } = data;

    // ======================================================
    // ITEM TOTAL
    // ======================================================
    const itemTotal = items.reduce((sum, item) => {
      return sum + this.round(this.num(item.qty) * this.num(item.price));
    }, 0);

    const manualTotal = manualCharges.reduce(
      (sum, c) => sum + this.num(c.amount),
      0
    );

    const subTotal = this.round(itemTotal + manualTotal);

    // ======================================================
    // DISCOUNT
    // ======================================================
    const discountResult = this.applyDiscount(subTotal, discount);
    const taxable = discountResult.finalAmount;

    // ======================================================
    // TAX
    // ======================================================
    const taxResult = this.calculateTax(taxable, tax);

    // ======================================================
    // GRAND TOTAL
    // ======================================================
    const grandTotal = this.round(
      taxable + taxResult.cgst + taxResult.sgst + taxResult.igst
    );

    return {
      invoice: {
        invoiceId,
        currency,

        orderDate: new Date(orderDate).toISOString(),
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : null,
        purchaseDate: new Date(purchaseDate).toISOString(),

        createdAt: now.toISOString(),
      },

      company,
      customer,

      plan: plan
        ? {
            id: plan.id,
            name: plan.name,
            billingCycle: plan.billingCycle,
          }
        : null,

      items: items.map((item, i) => ({
        id: i + 1,
        name: item.name,
        qty: this.num(item.qty),
        price: this.num(item.price),
        total: this.round(this.num(item.qty) * this.num(item.price)),
      })),

      summary: {
        subTotal,
        discount: discountResult.discountAmount,
        taxable,
        cgst: taxResult.cgst,
        sgst: taxResult.sgst,
        igst: taxResult.igst,
        taxTotal: taxResult.total,
        grandTotal,
      },

      meta: {
        version: "4.0",
        system: "RTS SaaS Invoice Engine",
      },
    };
  }

  // ======================================================
  // PDF READY HTML
  // ======================================================
  toHTML(inv) {
    return `
    <div style="font-family:Arial;padding:30px;max-width:800px">

      <h2>${inv.company.name}</h2>
      <p>${inv.company.address}</p>

      <hr/>

      <h3>INVOICE: ${inv.invoice.invoiceId}</h3>
      <p>Order Date: ${inv.invoice.orderDate}</p>
      <p>Purchase Date: ${inv.invoice.purchaseDate}</p>

      <hr/>

      <h4>Customer: ${inv.customer.name}</h4>

      <table border="1" width="100%" cellpadding="10">
        <tr>
          <th>Item</th><th>Qty</th><th>Price</th><th>Total</th>
        </tr>

        ${inv.items
          .map(
            (i) => `
          <tr>
            <td>${i.name}</td>
            <td>${i.qty}</td>
            <td>₹${i.price}</td>
            <td>₹${i.total}</td>
          </tr>`
          )
          .join("")}
      </table>

      <h3>Total: ₹${inv.summary.grandTotal}</h3>
    </div>
    `;
  }

  // ======================================================
  // WHATSAPP MESSAGE
  // ======================================================
  toWhatsApp(inv) {
    return `
🧾 INVOICE

ID: ${inv.invoice.invoiceId}
Customer: ${inv.customer.name}

Subtotal: ₹${inv.summary.subTotal}
Tax: ₹${inv.summary.taxTotal}
TOTAL: ₹${inv.summary.grandTotal}
    `.trim();
  }
}

module.exports = new InvoiceTemplate();