// src/services/whatsapp.service.js

const axios = require("axios");

/**
 * =========================================================
 * RTS SaaS - WhatsApp Service
 * Production-ready reusable WhatsApp notification system
 *
 * Supports:
 * - Subscription lead alerts
 * - Helpdesk ticket alerts
 * - Customer confirmations
 * - Admin notifications
 *
 * Uses WhatsApp Cloud API / Meta API
 * =========================================================
 */

class WhatsAppService {
  constructor() {
    this.token = process.env.WHATSAPP_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_ID;
    this.defaultRecipient = process.env.WHATSAPP_ADMIN_NUMBER;

    if (!this.token || !this.phoneNumberId) {
      console.warn(
        "⚠ WhatsApp service disabled: missing WHATSAPP_TOKEN / WHATSAPP_PHONE_ID"
      );
    } else {
      console.log("✅ WhatsApp service initialized");
    }
  }

  // ======================================================
  // CORE SEND METHOD
  // ======================================================
  async sendMessage(to, message) {
    try {
      if (!this.token || !this.phoneNumberId) {
        throw new Error("WhatsApp service not configured");
      }

      const url = `https://graph.facebook.com/v22.0/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: message,
        },
      };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        "❌ WhatsApp send failed:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  // ======================================================
  // SUBSCRIPTION ALERT
  // ======================================================
  async sendSubscriptionAlert({
    name,
    email,
    address,
    plan,
    billingCycle,
  }) {
    const message = `🚀 New Subscription Request

Name: ${name}
Email: ${email}
Address: ${address}
Plan: ${plan}
Billing: ${billingCycle}

Submitted from RTS SaaS Dashboard.`;

    return this.sendMessage(this.defaultRecipient, message);
  }

  // ======================================================
  // HELPDESK ALERT
  // ======================================================
  async sendHelpdeskAlert({
    name,
    email,
    issueType,
    subjectLine,
  }) {
    const message = `🛠 New Helpdesk Ticket

Name: ${name}
Email: ${email}
Issue: ${issueType}
Subject: ${subjectLine}

Check dashboard for full details.`;

    return this.sendMessage(this.defaultRecipient, message);
  }

  // ======================================================
  // CUSTOMER CONFIRMATION
  // ======================================================
  async sendCustomerConfirmation({ phone, name, plan }) {
    const message = `Hello ${name},

Your request for the ${plan} plan has been received successfully.

Our team will contact you shortly.

- RTS SaaS Team`;

    return this.sendMessage(phone, message);
  }

  // ======================================================
  // GENERIC ADMIN ALERT
  // ======================================================
  async sendAdminNotification(title, body) {
    const message = `📢 ${title}

${body}`;

    return this.sendMessage(this.defaultRecipient, message);
  }
}

module.exports = new WhatsAppService();