const axios = require("axios");

/**
 * =========================================================
 * RTS SAAS - WHATSAPP SERVICE (PRODUCTION GRADE)
 * Meta Cloud API based messaging system
 * =========================================================
 */

class WhatsAppService {
  constructor() {
    this.token = process.env.WHATSAPP_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_ID;
    this.defaultRecipient = process.env.WHATSAPP_ADMIN_NUMBER;

    this.baseURL = `https://graph.facebook.com/v22.0/${this.phoneNumberId}/messages`;

    // 🔥 retry config (SaaS stability)
    this.maxRetries = 2;

    if (!this.token || !this.phoneNumberId) {
      console.warn(
        "⚠ WhatsApp service disabled: missing credentials"
      );
      this.enabled = false;
    } else {
      console.log("✅ WhatsApp service initialized");
      this.enabled = true;
    }
  }

  // ======================================================
  // VALIDATION
  // ======================================================
  isReady() {
    return this.enabled && this.token && this.phoneNumberId;
  }

  // ======================================================
  // CORE SEND METHOD (WITH RETRY + TIMEOUT)
  // ======================================================
  async sendMessage(to, message, attempt = 1) {
    try {
      if (!this.isReady()) {
        throw new Error("WhatsApp service not configured");
      }

      const payload = {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: message,
        },
      };

      const response = await axios.post(this.baseURL, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 🔥 prevents hanging requests
      });

      console.log(`📲 WhatsApp SENT → ${to}`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        `❌ WhatsApp failed (attempt ${attempt}):`,
        error.response?.data || error.message
      );

      // 🔥 retry mechanism
      if (attempt < this.maxRetries) {
        console.log("🔁 Retrying WhatsApp message...");
        return this.sendMessage(to, message, attempt + 1);
      }

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  // ======================================================
  // SUBSCRIPTION ALERT (ADMIN)
  // ======================================================
  async sendSubscriptionAlert(data) {
    return this.sendMessage(
      this.defaultRecipient,
      this.templates.subscriptionAlert(data)
    );
  }

  // ======================================================
  // HELPDESK ALERT
  // ======================================================
  async sendHelpdeskAlert(data) {
    return this.sendMessage(
      this.defaultRecipient,
      this.templates.helpdeskAlert(data)
    );
  }

  // ======================================================
  // CUSTOMER CONFIRMATION
  // ======================================================
  async sendCustomerConfirmation({ phone, name, plan }) {
    return this.sendMessage(
      phone,
      this.templates.customerConfirmation({ name, plan })
    );
  }

  // ======================================================
  // ADMIN NOTIFICATION
  // ======================================================
  async sendAdminNotification(title, body) {
    return this.sendMessage(
      this.defaultRecipient,
      this.templates.adminNotification(title, body)
    );
  }

  // ======================================================
  // MESSAGE TEMPLATES (SAAS CLEAN DESIGN)
  // ======================================================
  templates = {
    subscriptionAlert: ({ name, email, address, plan, billingCycle }) => `
🚀 NEW SUBSCRIPTION REQUEST

👤 Name: ${name}
📧 Email: ${email}
📍 Address: ${address}
💎 Plan: ${plan}
⏳ Billing: ${billingCycle}

🔔 RTS SaaS Dashboard Alert
    `,

    helpdeskAlert: ({ name, email, issueType, subjectLine }) => `
🛠 NEW HELPDESK TICKET

👤 Name: ${name}
📧 Email: ${email}
⚠ Issue: ${issueType}
📝 Subject: ${subjectLine}

🔔 Check admin panel for details
    `,

    customerConfirmation: ({ name, plan }) => `
Hello ${name} 👋

Your request for *${plan}* plan has been received successfully.

Our team will contact you shortly.

— RTS SaaS Team
    `,

    adminNotification: (title, body) => `
📢 ${title}

${body}
    `,
  };

  // ======================================================
  // HEALTH CHECK (MONITORING)
  // ======================================================
  getStatus() {
    return {
      enabled: this.enabled,
      configured: this.isReady(),
      hasToken: !!this.token,
      hasPhoneId: !!this.phoneNumberId,
    };
  }
}

module.exports = new WhatsAppService();