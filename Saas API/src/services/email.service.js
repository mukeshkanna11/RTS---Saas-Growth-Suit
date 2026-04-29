// src/services/email.service.js

const nodemailer = require("nodemailer");

/**
 * =========================================================
 * RTS SaaS - Enterprise Email Service
 * Production-ready reusable mail system
 *
 * Features:
 * - Subscription upgrade mails
 * - Helpdesk support mails
 * - Customer confirmation mails
 * - Safe startup (won’t crash app if env missing)
 * - SMTP / Gmail compatible
 * =========================================================
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  // ======================================================
  // INIT TRANSPORTER
  // ======================================================
  initialize() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn(
        "⚠ Email service disabled: SMTP_USER / SMTP_PASS missing in environment"
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user,
        pass,
      },
    });

    console.log("✅ Email service initialized");
  }

  // ======================================================
  // CORE SEND METHOD
  // ======================================================
  async sendEmail({ to, subject, html, text }) {
    try {
      if (!this.transporter) {
        throw new Error("Email transporter not configured");
      }

      const info = await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          `RTS SaaS Platform <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });

      console.log("📩 Email sent:", info.messageId);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error("❌ Email send failed:", error.message);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ======================================================
  // SUBSCRIPTION LEAD MAIL
  // ======================================================
  async sendSubscriptionLead({
    name,
    email,
    address,
    plan,
    billingCycle,
  }) {
    const subject = `🚀 New Subscription Upgrade Request - ${plan}`;

    const html = `
      <div style="font-family:Arial,sans-serif;padding:24px;">
        <h2>New SaaS Subscription Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Selected Plan:</strong> ${plan}</p>
        <p><strong>Billing Cycle:</strong> ${billingCycle}</p>
        <hr />
        <p>This request was submitted via the RTS SaaS dashboard.</p>
      </div>
    `;

    return this.sendEmail({
      to: process.env.COMPANY_MAIL,
      subject,
      html,
    });
  }

  // ======================================================
  // HELPDESK REQUEST MAIL
  // ======================================================
  async sendHelpdeskRequest({
    name,
    email,
    issueType,
    subjectLine,
    description,
  }) {
    const subject = `🛠 Helpdesk Request - ${subjectLine}`;

    const html = `
      <div style="font-family:Arial,sans-serif;padding:24px;">
        <h2>New Helpdesk Ticket</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Issue Type:</strong> ${issueType}</p>
        <p><strong>Subject:</strong> ${subjectLine}</p>
        <p><strong>Description:</strong></p>
        <p>${description}</p>
        <hr />
        <p>Submitted from RTS SaaS Helpdesk.</p>
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
    const subject = "Your RTS SaaS Request Has Been Received";

    const html = `
      <div style="font-family:Arial,sans-serif;padding:24px;">
        <h2>Hello ${name},</h2>
        <p>We’ve successfully received your request for the 
        <strong>${plan}</strong> plan.</p>
        <p>Our team will contact you shortly with the next steps.</p>
        <br />
        <p>Thank you for choosing RTS SaaS.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  // ======================================================
  // GENERIC SYSTEM NOTIFICATION
  // ======================================================
  async sendNotification({ to, title, message }) {
    const html = `
      <div style="font-family:Arial,sans-serif;padding:24px;">
        <h2>${title}</h2>
        <p>${message}</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: title,
      html,
    });
  }
}

module.exports = new EmailService();