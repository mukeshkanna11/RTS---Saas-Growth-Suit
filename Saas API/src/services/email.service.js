// ======================================================
// services/email.service.js
// PRODUCTION READY SAAS EMAIL SERVICE
// ======================================================

const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
    this.ready = false;

    this.initPromise = this.init();
  }

  // ======================================================
  // INIT SMTP
  // ======================================================

  // ======================================================
// INIT SMTP
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
  host: process.env.SMTP_HOST,

  port: Number(process.env.SMTP_PORT),

  secure: false,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  family: 4,

  tls: {
    rejectUnauthorized: false,
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

    await this.transporter.verify();

    this.ready = true;

    console.log("✅ EMAIL SERVICE READY");

  } catch (err) {

    this.ready = false;

    console.error(
      "❌ EMAIL INIT FAILED:",
      err.message
    );
  }
}

  // ======================================================
  // ENSURE READY
  // ======================================================

  async ensureReady() {
    await this.initPromise;
  }

  // ======================================================
  // CORE SEND MAIL
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
    console.log("=================================");
    console.log("📨 TRYING TO SEND EMAIL");
    console.log("TO:", to);
    console.log("SUBJECT:", subject);
    console.log("=================================");

    if (!this.transporter) {
      throw new Error("Transporter not initialized");
    }

    const info = await this.transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        process.env.SMTP_USER,

      to,
      subject,
      html,
      text,
      attachments,
    });

    console.log("✅ EMAIL SENT SUCCESS");
    console.log("MESSAGE ID:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };

  } catch (err) {

    console.error("❌ EMAIL SEND FAILED");
    console.error(err);

    return {
      success: false,
      error: err.message,
    };
  }
}
  // ======================================================
  // SEND SUBSCRIPTION LEAD
  // ======================================================

  async sendSubscriptionLead(data) {

    return await this.sendMail({
      to:
        process.env.COMPANY_MAIL ||
        process.env.ADMIN_EMAIL,

      subject:
        `🚀 New Subscription Lead - ${data.plan}`,

      html:
        this.templates.upgradeLead(data),
    });
  }

  // ======================================================
  // SEND CUSTOMER CONFIRMATION
  // ======================================================

  async sendCustomerConfirmation({
    email,
    name,
    plan,
  }) {

    return await this.sendMail({
      to: email,

      subject:
        "✅ Upgrade Request Received",

      html:
        this.templates.customerConfirmation({
          name,
          plan,
        }),
    });
  }

  // ======================================================
  // SEND PAYMENT SUCCESS
  // ======================================================

  async sendPaymentSuccess({
    email,
    name,
    amount,
    plan,
  }) {

    return await this.sendMail({
      to: email,

      subject:
        "💳 Payment Successful",

      html:
        this.templates.paymentSuccess({
          name,
          amount,
          plan,
        }),
    });
  }

  // ======================================================
  // SEND INVOICE MAIL
  // ======================================================

  async sendInvoiceMail({
    email,
    name,
    invoiceId,
    filePath,
  }) {

    return await this.sendMail({
      to: email,

      subject:
        `📄 Invoice ${invoiceId}`,

      html:
        this.templates.invoiceMail({
          name,
          invoiceId,
        }),

      attachments: [
        {
          filename:
            `${invoiceId}.pdf`,
          path: filePath,
        },
      ],
    });
  }

  // ======================================================
  // TEMPLATES
  // ======================================================

  templates = {

    // ==================================================
    // ADMIN LEAD
    // ==================================================

    upgradeLead: (data) => `
      <div style="
        font-family: Arial;
        padding: 20px;
        line-height: 1.8;
      ">
        <h2>
          🚀 New Subscription Lead
        </h2>

        <p>
          <b>Name:</b>
          ${data.name || "N/A"}
        </p>

        <p>
          <b>Email:</b>
          ${data.email || "N/A"}
        </p>

        <p>
          <b>Phone:</b>
          ${data.phone || "N/A"}
        </p>

        <p>
          <b>Company:</b>
          ${data.company || "N/A"}
        </p>

        <p>
          <b>Address:</b>
          ${data.address || "N/A"}
        </p>

        <p>
          <b>Notes:</b>
          ${data.notes || "N/A"}
        </p>

        <hr />

        <p>
          <b>Plan:</b>
          ${data.plan}
        </p>

        <p>
          <b>Billing:</b>
          ${data.billingCycle}
        </p>
      </div>
    `,

    // ==================================================
    // CUSTOMER CONFIRM
    // ==================================================

    customerConfirmation: ({
      name,
      plan,
    }) => `
      <div style="
        font-family: Arial;
        padding: 20px;
      ">
        <h2>
          Hi ${name} 👋
        </h2>

        <p>
          Your request for
          <b>${plan}</b>
          plan has been received.
        </p>

        <p>
          Our team will contact you shortly.
        </p>

        <hr />

        <p>
          ReadyTech Solutions 🚀
        </p>
      </div>
    `,

    // ==================================================
    // PAYMENT SUCCESS
    // ==================================================

    paymentSuccess: ({
      name,
      amount,
      plan,
    }) => `
      <div style="
        font-family: Arial;
        padding: 20px;
      ">
        <h2>
          💳 Payment Successful
        </h2>

        <p>
          Hello ${name},
        </p>

        <p>
          Payment received for
          <b>${plan}</b>.
        </p>

        <p>
          Amount:
          <b>₹${amount}</b>
        </p>
      </div>
    `,

    // ==================================================
    // INVOICE
    // ==================================================

    invoiceMail: ({
      name,
      invoiceId,
    }) => `
      <div style="
        font-family: Arial;
        padding: 20px;
      ">
        <h2>
          📄 Invoice Attached
        </h2>

        <p>
          Hello ${name},
        </p>

        <p>
          Invoice
          <b>${invoiceId}</b>
          attached with this mail.
        </p>
      </div>
    `,
  };

  // ======================================================
  // HEALTH CHECK
  // ======================================================

  getStatus() {
    return {
      ready: this.ready,
      hasTransporter:
        !!this.transporter,
    };
  }
}

module.exports =
  new EmailService();