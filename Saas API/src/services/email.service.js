// ======================================================
// services/email.service.js
// SAAS-GRADE RESEND EMAIL SERVICE (PRODUCTION READY)
// ======================================================

const { Resend } = require("resend");

class EmailService {
  constructor() {
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY missing in .env");
    }

    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  // ======================================================
  // CORE EMAIL SENDER
  // ======================================================

  async sendMail({ to, subject, html }) {
    try {
      if (!to) throw new Error("Recipient email missing");

      const result = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || "ReadyTech <onboarding@resend.dev>",
        to,
        subject,
        html,
      });

      console.log("✅ EMAIL SENT:", result?.id);

      return {
        success: true,
        id: result.id,
      };

    } catch (err) {
      console.error("❌ EMAIL FAILED:", err.message);

      return {
        success: false,
        error: err.message,
      };
    }
  }

  // ======================================================
  // SUBSCRIPTION LEAD (ADMIN)
  // ======================================================

  async sendSubscriptionLead(data) {
    const adminEmail =
      process.env.ADMIN_EMAIL || process.env.COMPANY_MAIL;

    if (!adminEmail) {
      return {
        success: false,
        error: "Admin email not configured",
      };
    }

    return this.sendMail({
      to: adminEmail,
      subject: `🚀 New Subscription Lead - ${data.plan}`,
      html: this.templates.upgradeLead(data),
    });
  }

  // ======================================================
  // CUSTOMER CONFIRMATION
  // ======================================================

  async sendCustomerConfirmation({ email, name, plan }) {
    return this.sendMail({
      to: email,
      subject: "✅ Upgrade Request Received",
      html: this.templates.customerConfirmation({ name, plan }),
    });
  }

  // ======================================================
  // PAYMENT SUCCESS
  // ======================================================

  async sendPaymentSuccess({ email, name, amount, plan }) {
    return this.sendMail({
      to: email,
      subject: "💳 Payment Successful",
      html: this.templates.paymentSuccess({ name, amount, plan }),
    });
  }

  // ======================================================
  // INVOICE EMAIL
  // ======================================================

  async sendInvoiceMail({ email, name, invoiceId }) {
    return this.sendMail({
      to: email,
      subject: `📄 Invoice ${invoiceId}`,
      html: this.templates.invoiceMail({ name, invoiceId }),
    });
  }

  // ======================================================
  // TEMPLATES
  // ======================================================

  templates = {
    upgradeLead: (data) => `
      <div style="font-family: Arial; padding: 20px;">
        <h2>🚀 New Subscription Lead</h2>
        <p><b>Name:</b> ${data.name}</p>
        <p><b>Email:</b> ${data.email}</p>
        <p><b>Phone:</b> ${data.phone}</p>
        <p><b>Company:</b> ${data.company}</p>
        <p><b>Plan:</b> ${data.plan}</p>
        <p><b>Billing:</b> ${data.billingCycle}</p>
      </div>
    `,

    customerConfirmation: ({ name, plan }) => `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Hi ${name} 👋</h2>
        <p>Your request for <b>${plan}</b> plan has been received.</p>
        <p>Our team will contact you shortly.</p>
      </div>
    `,

    paymentSuccess: ({ name, amount, plan }) => `
      <div style="font-family: Arial; padding: 20px;">
        <h2>💳 Payment Successful</h2>
        <p>Hello ${name},</p>
        <p>Payment received for <b>${plan}</b>.</p>
        <p>Amount: ₹${amount}</p>
      </div>
    `,

    invoiceMail: ({ name, invoiceId }) => `
      <div style="font-family: Arial; padding: 20px;">
        <h2>📄 Invoice Attached</h2>
        <p>Hello ${name},</p>
        <p>Invoice <b>${invoiceId}</b> generated successfully.</p>
      </div>
    `,
  };

  // ======================================================
  // HEALTH CHECK
  // ======================================================

  getStatus() {
    return {
      provider: "resend",
      status: "active",
      apiKeyExists: !!process.env.RESEND_API_KEY,
    };
  }
}

module.exports = new EmailService();