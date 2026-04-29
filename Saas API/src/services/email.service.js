const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
    this.ready = false;

    // IMPORTANT: initialize async but safe
    this.init();
  }

  // ======================================================
  // INIT TRANSPORTER (Render-safe)
  // ======================================================
  async init() {
    try {
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!user || !pass) {
        console.warn("⚠ SMTP credentials missing → Email disabled");
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 587),
        secure: false, // IMPORTANT for Gmail + Render

        auth: {
          user,
          pass,
        },

        // REMOVE pooling (causes Render issues)
        connectionTimeout: 15000,
        socketTimeout: 20000,
      });

      await this.transporter.verify();

      this.ready = true;
      console.log("✅ Email service ready (SMTP verified)");
    } catch (err) {
      console.error("❌ Email init failed:", err.message);
      this.ready = false;
    }
  }

  // ======================================================
  // SAFE HTML
  // ======================================================
  escape(text = "") {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ======================================================
  // CORE SEND (NON-BLOCKING SAFE)
  // ======================================================
  async sendEmail({ to, subject, html }, retry = 1) {
    try {
      if (!this.transporter || !this.ready) {
        console.warn("⚠ Email skipped (not ready)");
        return { success: false };
      }

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
      });

      console.log("📩 EMAIL SENT →", to);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error("❌ Email failed:", err.message);

      if (retry > 0) {
        console.log("🔁 retrying email...");
        return this.sendEmail({ to, subject, html }, retry - 1);
      }

      return { success: false, error: err.message };
    }
  }

  // ======================================================
  // SUBSCRIPTION LEAD (ADMIN MAIL)
  // ======================================================
  async sendSubscriptionLead(data) {
    const html = `
      <h2>New Upgrade Request 🚀</h2>
      <p><b>Name:</b> ${this.escape(data.name)}</p>
      <p><b>Email:</b> ${this.escape(data.email)}</p>
      <p><b>Phone:</b> ${this.escape(data.phone || "-")}</p>
      <p><b>Company:</b> ${this.escape(data.company || "-")}</p>
      <p><b>Address:</b> ${this.escape(data.address || "-")}</p>
      <p><b>Notes:</b> ${this.escape(data.notes || "-")}</p>
      <p><b>Plan:</b> ${this.escape(data.plan)}</p>
      <p><b>Billing:</b> ${this.escape(data.billingCycle)}</p>
    `;

    return this.sendEmail({
      to: process.env.COMPANY_MAIL,
      subject: `New Upgrade Request - ${data.plan}`,
      html,
    });
  }

  // ======================================================
  // CUSTOMER CONFIRMATION MAIL
  // ======================================================
  async sendCustomerConfirmation({ email, name, plan }) {
    const html = `
      <h2>Hello ${this.escape(name)}</h2>
      <p>Your request for <b>${this.escape(plan)}</b> plan is received.</p>
      <p>We will contact you shortly.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: "Request Received",
      html,
    });
  }

  // ======================================================
  // HELP DESK MAIL
  // ======================================================
  async sendHelpdeskRequest(data) {
    const html = `
      <h2>Helpdesk Ticket</h2>
      <p><b>Name:</b> ${this.escape(data.name)}</p>
      <p><b>Email:</b> ${this.escape(data.email)}</p>
      <p><b>Issue:</b> ${this.escape(data.issueType)}</p>
      <p><b>Message:</b> ${this.escape(data.description)}</p>
    `;

    return this.sendEmail({
      to: process.env.COMPANY_MAIL,
      subject: "Helpdesk Request",
      html,
    });
  }
}

module.exports = new EmailService();