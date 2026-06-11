const { Resend } = require("resend");

class EmailProvider {
  async sendEmail({
    apiKey,
    from,
    to,
    subject,
    html,
  }) {
    try {
      const resend = new Resend(apiKey);

      const response =
        await resend.emails.send({
          from,
          to,
          subject,
          html,
        });

      return response;
    } catch (error) {
      throw new Error(
        error.message || "Email send failed"
      );
    }
  }

  async testConnection(apiKey) {
    try {
      const resend = new Resend(apiKey);

      return {
        success: true,
        message: "Resend connected",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

module.exports = new EmailProvider();