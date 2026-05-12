// ======================================================
// RTS SAAS - ENTERPRISE INVOICE TEMPLATE
// Zoho / Stripe style structured invoice builder
// ======================================================

class InvoiceTemplate {
  /**
   * MAIN INVOICE BUILDER
   */
  build(data) {
    const {
      company,
      customer,
      items = [],
      discount = 0,
      cgst = 9,
      sgst = 9,
      invoiceId,
      date = new Date(),
    } = data;

    // ======================================================
    // 1. CALCULATION ENGINE
    // ======================================================
    const subTotal = items.reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );

    const discountAmount = (subTotal * discount) / 100;
    const taxable = subTotal - discountAmount;

    const cgstAmount = (taxable * cgst) / 100;
    const sgstAmount = (taxable * sgst) / 100;

    const grandTotal = taxable + cgstAmount + sgstAmount;

    // ======================================================
    // 2. INVOICE STRUCTURE (CLEAN JSON OUTPUT)
    // ======================================================
    return {
      invoice: {
        invoiceId: invoiceId || null,
        date: date.toISOString(),
        currency: "INR",
      },

      company: {
        name: company.name,
        address: company.address,
        email: company.email,
        phone: company.phone,
        gstin: company.gstin || null,
      },

      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || null,
        address: customer.address || null,
      },

      items: items.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        total: item.qty * item.price,
      })),

      summary: {
        subTotal,
        discount: discountAmount,
        taxable,
        cgst: cgstAmount,
        sgst: sgstAmount,
        grandTotal,
      },

      tax: {
        cgstRate: cgst,
        sgstRate: sgst,
      },

      meta: {
        generatedAt: new Date(),
        version: "1.0",
        source: "rts-saas",
      },
    };
  }

  /**
   * EMAIL FRIENDLY FORMAT
   */
  toEmailHTML(invoice) {
    return `
      <div style="font-family:Arial;padding:20px">
        <h2>${invoice.company.name}</h2>
        <p>${invoice.company.address}</p>

        <hr/>

        <h3>Invoice: ${invoice.invoice.invoiceId}</h3>

        <h4>Customer</h4>
        <p>${invoice.customer.name}</p>
        <p>${invoice.customer.email}</p>

        <h4>Amount: ₹${invoice.summary.grandTotal.toFixed(2)}</h4>

        <p>Thank you for your business 🙏</p>
      </div>
    `;
  }

  /**
   * WHATSAPP MESSAGE FORMAT
   */
  toWhatsAppMessage(invoice) {
    return `🧾 INVOICE GENERATED

Invoice: ${invoice.invoice.invoiceId}

Customer: ${invoice.customer.name}

Total: ₹${invoice.summary.grandTotal.toFixed(2)}

Thank you for your business!`;
  }
}

module.exports = new InvoiceTemplate();