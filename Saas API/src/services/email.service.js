const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
    this.ready = false;
    this.initPromise = this.init(); // important
  }

  async init() {
    try {
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!user || !pass) {
        console.warn("⚠ SMTP missing");
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,

        auth: { user, pass },

        tls: {
          rejectUnauthorized: false,
        },

        pool: true,
        maxConnections: 3,
        maxMessages: 100,
      });

      await this.transporter.verify();

      this.ready = true;
      console.log("✅ Email service READY");
    } catch (err) {
      console.error("❌ Email init failed:", err.message);
      this.ready = false;
    }
  }

  async ensureReady() {
    await this.initPromise; // 🔥 guarantees init completed
  }

  async sendMail({ to, subject, html }) {
    await this.ensureReady();

    // 🔥 NEVER block API even if email fails
    if (!this.ready) {
      console.log("⚠ Email skipped (not ready)");
      return { success: false, error: "not ready" };
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
      });

      console.log("📩 EMAIL SENT →", to);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error("❌ EMAIL ERROR:", err.message);
      return { success: false, error: err.message };
    }
  }

  async sendSubscriptionLead(data) {
    return this.sendMail({
      to: process.env.COMPANY_MAIL,
      subject: `🚀 New Upgrade Request - ${data.plan}`,
      html: `
        <h2>New Subscription Lead</h2>
        <p><b>Name:</b> ${data.name}</p>
        <p><b>Email:</b> ${data.email}</p>
        <p><b>Phone:</b> ${data.phone}</p>
        <p><b>Company:</b> ${data.company}</p>
        <p><b>Address:</b> ${data.address}</p>
        <p><b>Notes:</b> ${data.notes || "N/A"}</p>
        <p><b>Plan:</b> ${data.plan}</p>
        <p><b>Billing:</b> ${data.billingCycle}</p>
      `,
    });
  }

  async sendCustomerConfirmation({ email, name, plan }) {
    return this.sendMail({
      to: email,
      subject: "✅ Request Received",
      html: `
        <h2>Hello ${name}</h2>
        <p>Your request for <b>${plan}</b> is received.</p>
        <p>Our team will contact you shortly.</p>
      `,
    });
  }
}

module.exports = new EmailService();