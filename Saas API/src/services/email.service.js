// ======================================================
// services/email.service.js
// PRODUCTION READY SAAS EMAIL SERVICE (FIXED)
// ======================================================

const nodemailer = require("nodemailer");
require("dns").setDefaultResultOrder("ipv4first"); // 🔥 IMPORTANT FIX FOR RENDER + GMAIL

class EmailService {
  constructor() {
    this.transporter = null;
    this.ready = false;

    this.initPromise = this.init();
  }

  // ======================================================
  // INIT SMTP (NON-BLOCKING SAFE)
  // ======================================================

  async init() {
    try {
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!user || !pass) {
        console.warn("⚠ SMTP credentials missing");
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,

        auth: {
          user,
          pass,
        },

        requireTLS: true,

        connectionTimeout: 60000,
        socketTimeout: 60000,
        greetingTimeout: 60000,
      });

      // ✅ Non-blocking verify (DO NOT BREAK APP START)
      this.transporter.verify()
        .then(() => {
          this.ready = true;
          console.log("✅ SMTP READY");
        })
        .catch((err) => {
          this.ready = false;
          console.warn("⚠ SMTP VERIFY FAILED (ignored):", err.message);
        });

    } catch (err) {
      this.ready = false;
      console.error("❌ EMAIL INIT FAILED:", err.message);
    }
  }

  // ======================================================
  // ENSURE INIT DONE
  // ======================================================

  async ensureReady() {
    await this.initPromise;
  }

  // ======================================================
  // CORE SEND MAIL (FAIL SAFE)
  // ======================================================

  async sendMail({
    to,
    subject,
    html,
    text,
    attachments = [],
  }) {
    await this.ensureReady();

    try {
      if (!this.transporter) {
        return {
          success: false,
          error: "Transporter not initialized",
        };
      }

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        text,
        attachments,
      });

      return {
        success: true,
        messageId: info.messageId,
      };

    } catch (err) {
      console.error("❌ EMAIL SEND FAILED:", err.message);

      // ❌ NEVER THROW ERROR (SAAS SAFE)
      return {
        success: false,
        error: err.message,
      };
    }
  }

  // ======================================================
  // SUBSCRIPTION LEAD EMAIL
  // ======================================================

  async sendSubscriptionLead(data) {
    return await this.sendMail({
      to: process.env.COMPANY_MAIL || process.env.ADMIN_EMAIL,
      subject: `🚀 New Subscription Lead - ${data.plan}`,
      html: this.templates.upgradeLead(data),
    });
  }

  // ======================================================
  // CUSTOMER CONFIRMATION EMAIL
  // ======================================================

  async sendCustomerConfirmation({ email, name, plan }) {
    return await this.sendMail({
      to: email,
      subject: "✅ Upgrade Request Received",
      html: this.templates.customerConfirmation({ name, plan }),
    });
  }

  // ======================================================
  // PAYMENT SUCCESS EMAIL
  // ======================================================

  async sendPaymentSuccess({ email, name, amount, plan }) {
    return await this.sendMail({
      to: email,
      subject: "💳 Payment Successful",
      html: this.templates.paymentSuccess({ name, amount, plan }),
    });
  }

  // ======================================================
  // INVOICE EMAIL
  // ======================================================

  async sendInvoiceMail({ email, name, invoiceId, filePath }) {
    return await this.sendMail({
      to: email,
      subject: `📄 Invoice ${invoiceId}`,
      html: this.templates.invoiceMail({ name, invoiceId }),
      attachments: [
        {
          filename: `${invoiceId}.pdf`,
          path: filePath,
        },
      ],
    });
  }

  // ======================================================
  // EMAIL TEMPLATES
  // ======================================================

  templates = {
    upgradeLead: (data) => `
      <div style="font-family: Arial; padding: 20px; line-height: 1.8;">
        <h2>🚀 New Subscription Lead</h2>

        <p><b>Name:</b> ${data.name || "N/A"}</p>
        <p><b>Email:</b> ${data.email || "N/A"}</p>
        <p><b>Phone:</b> ${data.phone || "N/A"}</p>
        <p><b>Company:</b> ${data.company || "N/A"}</p>
        <p><b>Address:</b> ${data.address || "N/A"}</p>
        <p><b>Notes:</b> ${data.notes || "N/A"}</p>

        <hr />

        <p><b>Plan:</b> ${data.plan}</p>
        <p><b>Billing:</b> ${data.billingCycle}</p>
      </div>
    `,

    customerConfirmation: ({ name, plan }) => `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Hi ${name} 👋</h2>

        <p>Your request for <b>${plan}</b> plan has been received.</p>

        <p>Our team will contact you shortly.</p>

        <hr />
        <p>ReadyTech Solutions 🚀</p>
      </div>
    `,

    paymentSuccess: ({ name, amount, plan }) => `
      <div style="font-family: Arial; padding: 20px;">
        <h2>💳 Payment Successful</h2>

        <p>Hello ${name},</p>
        <p>Payment received for <b>${plan}</b>.</p>
        <p>Amount: <b>₹${amount}</b></p>
      </div>
    `,

    invoiceMail: ({ name, invoiceId }) => `
      <div style="font-family: Arial; padding: 20px;">
        <h2>📄 Invoice Attached</h2>

        <p>Hello ${name},</p>

        <p>Invoice <b>${invoiceId}</b> attached.</p>
      </div>
    `,
  };

  // ======================================================
  // HEALTH CHECK
  // ======================================================

  getStatus() {
    return {
      ready: this.ready,
      hasTransporter: !!this.transporter,
    };
  }
}

module.exports = new EmailService();