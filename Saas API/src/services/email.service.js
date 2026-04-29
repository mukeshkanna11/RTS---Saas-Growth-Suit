// src/services/email.service.js

const nodemailer = require("nodemailer");

/**
 * =========================================================
 * RTS SaaS - Production Email Service
 * Reliable SMTP system for hosted environments
 * =========================================================
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.ready = false;
    this.initialize();
  }

  // ======================================================
  // INIT
  // ======================================================
  async initialize() {
    try {
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!user || !pass) {
        console.warn(
          "⚠ Email disabled: SMTP_USER / SMTP_PASS missing"
        );
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: { user, pass },

        // critical for Render / hosted env
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      });

      await this.transporter.verify();

      this.ready = true;
      console.log("✅ Email service ready");
    } catch (error) {
      console.error("❌ Email init failed:", error.message);
      this.ready = false;
    }
  }

  // ======================================================
  // UTIL
  // ======================================================
  escapeHtml(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ======================================================
  // SEND CORE
  // ======================================================
  async sendEmail({ to, subject, html, text }, retries = 2) {
    if (!this.transporter || !this.ready) {
      console.warn("⚠ Email skipped: transporter unavailable");
      return { success: false, error: "Transport unavailable" };
    }

    try {
      const info = await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          `RTS SaaS <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });

      console.log(`📩 Email sent → ${to}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(`❌ Send failed (${to}):`, error.message);

      if (retries > 0) {
        console.log(`🔁 Retrying... (${retries})`);
        return this.sendEmail({ to, subject, html, text }, retries - 1);
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ======================================================
  // SUBSCRIPTION LEAD
  // ======================================================
  async sendSubscriptionLead(data) {
    const subject = `New Subscription Upgrade Request - ${data.plan}`;

    const html = `
      <div style="font-family:Arial;padding:24px;">
        <h2>New Subscription Request</h2>
        <p><strong>Name:</strong> ${this.escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${this.escapeHtml(data.email)}</p>
        <p><strong>Phone:</strong> ${this.escapeHtml(data.phone || "N/A")}</p>
        <p><strong>Company:</strong> ${this.escapeHtml(data.company || "N/A")}</p>
        <p><strong>Address:</strong> ${this.escapeHtml(data.address || "N/A")}</p>
        <p><strong>Notes:</strong> ${this.escapeHtml(data.notes || "N/A")}</p>
        <p><strong>Plan:</strong> ${this.escapeHtml(data.plan)}</p>
        <p><strong>Billing:</strong> ${this.escapeHtml(data.billingCycle)}</p>
      </div>
    `;

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
    const subject = "Your RTS SaaS Request Was Received";

    const html = `
      <div style="font-family:Arial;padding:24px;">
        <h2>Hello ${this.escapeHtml(name)},</h2>
        <p>We received your request for the 
        <strong>${this.escapeHtml(plan)}</strong> plan.</p>
        <p>Our team will contact you soon.</p>
        <br/>
        <p>Thank you for choosing ReadyTechSolutions.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  // ======================================================
  // HELPDESK
  // ======================================================
  async sendHelpdeskRequest(data) {
    const subject = `Helpdesk Request - ${data.subjectLine}`;

    const html = `
      <div style="font-family:Arial;padding:24px;">
        <h2>Support Ticket</h2>
        <p><strong>Name:</strong> ${this.escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${this.escapeHtml(data.email)}</p>
        <p><strong>Issue:</strong> ${this.escapeHtml(data.issueType)}</p>
        <p><strong>Subject:</strong> ${this.escapeHtml(data.subjectLine)}</p>
        <p>${this.escapeHtml(data.description)}</p>
      </div>
    `;

    return this.sendEmail({
      to: process.env.COMPANY_MAIL,
      subject,
      html,
    });
  }
}

module.exports = new EmailService();