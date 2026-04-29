const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
    this.ready = false;
    this.init();
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
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user, pass },

        // IMPORTANT FIX FOR RENDER
        tls: {
          rejectUnauthorized: false,
        },

        pool: true,
        maxConnections: 1,
        maxMessages: 5,
        rateLimit: 5,
      });

      await this.transporter.verify();

      this.ready = true;
      console.log("✅ Email service READY");
    } catch (err) {
      console.error("❌ Email init failed:", err.message);
      this.ready = false;
    }
  }

  async sendMail({ to, subject, html }) {
    if (!this.ready) {
      console.log("⚠ Email not ready");
      return { success: false };
    }

    try {
      const result = await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
      });

      console.log("📩 SENT →", to);
      return { success: true, messageId: result.messageId };
    } catch (err) {
      console.error("❌ EMAIL ERROR:", err.message);
      return { success: false, error: err.message };
    }
  }

  async sendSubscriptionLead(data) {
    return this.sendMail({
      to: process.env.COMPANY_MAIL,
      subject: `New Upgrade Request - ${data.plan}`,
      html: `
        <h2>New Lead</h2>
        <p>Name: ${data.name}</p>
        <p>Email: ${data.email}</p>
        <p>Phone: ${data.phone}</p>
        <p>Company: ${data.company}</p>
        <p>Address: ${data.address}</p>
        <p>Notes: ${data.notes}</p>
        <p>Plan: ${data.plan}</p>
      `,
    });
  }

  async sendCustomerConfirmation({ email, name, plan }) {
    return this.sendMail({
      to: email,
      subject: "Request Received",
      html: `
        <h2>Hello ${name}</h2>
        <p>Your request for <b>${plan}</b> is received.</p>
      `,
    });
  }
}

module.exports = new EmailService();