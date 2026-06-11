const axios = require("axios");

class WhatsAppProvider {
  constructor() {
    this.baseURL = "https://graph.facebook.com/v25.0";
  }

  /*
  ========================================
  HEADERS
  ========================================
  */
  getHeaders(accessToken) {
    return {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  }

  /*
  ========================================
  NORMALIZE PHONE NUMBER
  ========================================
  IMPORTANT FIX (MOST COMMON ISSUE)
  ========================================
  */
  formatPhone(to) {
    if (!to) return null;

    // remove spaces, +, dashes
    let cleaned = to.toString().replace(/[^\d]/g, "");

    // ensure India format example
    if (cleaned.length === 10) {
      cleaned = "91" + cleaned;
    }

    return cleaned;
  }

  /*
  ========================================
  ERROR HANDLER (IMPROVED)
  ========================================
  */
  getError(error) {
    return (
      error?.response?.data?.error?.message ||
      error?.response?.data?.error?.error_user_msg ||
      error?.response?.data?.message ||
      error.message ||
      "WhatsApp API Error"
    );
  }

  /*
  ========================================
  SEND TEXT MESSAGE
  ========================================
  */
  async sendMessage({
    accessToken,
    phoneNumberId,
    to,
    message,
  }) {
    try {
      const formattedTo = this.formatPhone(to);

      if (!formattedTo) {
        throw new Error("Invalid phone number");
      }

      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedTo,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      };

      const response = await axios.post(
        `${this.baseURL}/${phoneNumberId}/messages`,
        payload,
        {
          headers: this.getHeaders(accessToken),
          timeout: 20000,
        }
      );

      return {
        success: true,
        provider: "whatsapp",
        delivered: true,
        data: response.data,
      };
    } catch (error) {
      console.error("WhatsApp Send Error:", error?.response?.data || error.message);

      throw new Error(this.getError(error));
    }
  }

  /*
  ========================================
  SEND TEMPLATE MESSAGE
  ========================================
  */
  async sendTemplate({
    accessToken,
    phoneNumberId,
    to,
    templateName = "hello_world",
    language = "en_US",
  }) {
    try {
      const formattedTo = this.formatPhone(to);

      const response = await axios.post(
        `${this.baseURL}/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: formattedTo,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: language,
            },
          },
        },
        {
          headers: this.getHeaders(accessToken),
        }
      );

      return {
        success: true,
        provider: "whatsapp",
        data: response.data,
      };
    } catch (error) {
      throw new Error(this.getError(error));
    }
  }

  /*
  ========================================
  SEND IMAGE
  ========================================
  */
  async sendImage({
    accessToken,
    phoneNumberId,
    to,
    imageUrl,
    caption = "",
  }) {
    try {
      const formattedTo = this.formatPhone(to);

      const response = await axios.post(
        `${this.baseURL}/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: formattedTo,
          type: "image",
          image: {
            link: imageUrl,
            caption,
          },
        },
        {
          headers: this.getHeaders(accessToken),
        }
      );

      return {
        success: true,
        provider: "whatsapp",
        data: response.data,
      };
    } catch (error) {
      throw new Error(this.getError(error));
    }
  }

  /*
  ========================================
  SEND DOCUMENT
  ========================================
  */
  async sendDocument({
    accessToken,
    phoneNumberId,
    to,
    documentUrl,
    filename = "document.pdf",
  }) {
    try {
      const formattedTo = this.formatPhone(to);

      const response = await axios.post(
        `${this.baseURL}/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: formattedTo,
          type: "document",
          document: {
            link: documentUrl,
            filename,
          },
        },
        {
          headers: this.getHeaders(accessToken),
        }
      );

      return {
        success: true,
        provider: "whatsapp",
        data: response.data,
      };
    } catch (error) {
      throw new Error(this.getError(error));
    }
  }

  /*
  ========================================
  TEST CONNECTION
  ========================================
  */
  async testConnection({ accessToken, phoneNumberId }) {
    try {
      const response = await axios.get(
        `${this.baseURL}/${phoneNumberId}`,
        {
          headers: this.getHeaders(accessToken),
        }
      );

      return {
        success: true,
        connected: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        connected: false,
        message: this.getError(error),
      };
    }
  }
}

module.exports = new WhatsAppProvider();