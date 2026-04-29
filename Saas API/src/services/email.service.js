// src/services/email.service.js

const nodemailer = require("nodemailer");

/**
 * =========================================================
 * ReadyTech Solutions - Enterprise Email Service
 * Fully Updated Production Version
 *
 * Features:
 * - Reliable SMTP transport
 * - Retry handling
 * - Safe HTML escaping
 * - Subscription / Helpdesk / Notifications
 * - Render / Cloud deployment ready
 * =========================================================
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.ready = false;
    this.initPromise = this.initialize();
  }

  // ======================================================
  // INITIALIZE TRANSPORTER
  // ======================================================
  async initialize() {
    try {
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!user || !pass) {
        console.warn("⚠ Email service disabled: missing SMTP credentials");
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: {
          user,
          pass,
        },

        // Production-safe settings
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,

        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      });

      await this.transporter.verify();

      this.ready = true;
      console.log("✅ Email service initialized and verified");
    } catch (error) {
      console.error("❌ Email initialization failed:", error.message);
      this.ready = false;
    }
  }

  // ======================================================
  // HELPERS
  // ======================================================
  async ensureReady() {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  escapeHtml(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  buildWrapper(content) {
    return `
      <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:30px;">
        <div style="max-width:700px;margin:auto;background:#ffffff;border-radius:12px;padding:30px;box-shadow:0 4px 14px rgba(0,0,0,0.08);">
          ${content}
          <hr style="margin:30px 0;" />
          <p style="font-size:12px;color:#666;">
            ReadyTech Solutions • Enterprise SaaS Platform
          </p>
        </div>
      </div>
    `;
  }

  // ======================================================
  // SEND EMAIL CORE
  // ======================================================
  async sendEmail({ to, subject, html, text }, retries = 2) {
    await this.ensureReady();

    if (!this.transporter || !this.ready) {
      console.warn("⚠ Email skipped: transporter unavailable");
      return {
        success: false,
        error: "Transport unavailable",
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          `ReadyTech Solutions <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });

      console.log(`📩 Email sent successfully → ${to}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(`❌ Email send failed (${to}):`, error.message);

      if (retries > 0) {
        console.log(`🔁 Retrying email... attempts left: ${retries}`);
        return this.sendEmail({ to, subject, html, text }, retries - 1);
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ======================================================
  // SUBSCRIPTION LEAD MAIL
  // ======================================================
  async sendSubscriptionLead(data) {
    const subject = `🚀 New Subscription Upgrade Request - ${data.plan}`;

    const html = this.buildWrapper(`
      <h2>New Subscription Request</h2>
      <p><strong>Name:</strong> ${this.escapeHtml(data.name)}</p>
      <p><strong>Email:</strong> ${this.escapeHtml(data.email)}</p>
      <p><strong>Phone:</strong> ${this.escapeHtml(data.phone || "N/A")}</p>
      <p><strong>Company:</strong> ${this.escapeHtml(data.company || "N/A")}</p>
      <p><strong>Address:</strong> ${this.escapeHtml(data.address || "N/A")}</p>
      <p><strong>Notes:</strong> ${this.escapeHtml(data.notes || "N/A")}</p>
      <p><strong>Plan:</strong> ${this.escapeHtml(data.plan)}</p>
      <p><strong>Billing Cycle:</strong> ${this.escapeHtml(data.billingCycle || "monthly")}</p>
    `);

    return this.sendEmail({
      to: process.env.COMPANY_MAIL,
      subject,
      html,
    });
  }

  // ======================================================
  // CUSTOMER CONFIRMATION
  // ======================================================
  async sendCustomerConfirmation({ email, name, plan }) {
    const subject = "Your Subscription Request Has Been Received";

    const html = this.buildWrapper(`
      <h2>Hello ${this.escapeHtml(name)},</h2>
      <p>We’ve successfully received your request for the 
      <strong>${this.escapeHtml(plan)}</strong> plan.</p>
      <p>Our team will review it and contact you shortly.</p>
      <br />
      <p>Thank you for choosing ReadyTech Solutions.</p>
    `);

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  // ======================================================
  // HELPDESK REQUEST
  // ======================================================
  async sendHelpdeskRequest(data) {
    const subject = `🛠 Helpdesk Request - ${data.subjectLine}`;

    const html = this.buildWrapper(`
      <h2>Support Ticket</h2>
      <p><strong>Name:</strong> ${this.escapeHtml(data.name)}</p>
      <p><strong>Email:</strong> ${this.escapeHtml(data.email)}</p>
      <p><strong>Issue Type:</strong> ${this.escapeHtml(data.issueType)}</p>
      <p><strong>Subject:</strong> ${this.escapeHtml(data.subjectLine)}</p>
      <p><strong>Description:</strong></p>
      <p>${this.escapeHtml(data.description)}</p>
    `);

    return this.sendEmail({
      to: process.env.COMPANY_MAIL,
      subject,
      html,
    });
  }

  // ======================================================
  // GENERIC NOTIFICATION
  // ======================================================
  async sendNotification({ to, title, message }) {
    const html = this.buildWrapper(`
      <h2>${this.escapeHtml(title)}</h2>
      <p>${this.escapeHtml(message)}</p>
    `);

    return this.sendEmail({
      to,
      subject: title,
      html,
    });
  }
}

module.exports = new EmailService();