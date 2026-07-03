const { Resend } = require("resend");

class EmailService {
  constructor() {
    if (!process.env.RESEND_API_KEY) {
      console.error(
        "❌ RESEND_API_KEY missing in .env"
      );
    }

    this.resend = new Resend(
      process.env.RESEND_API_KEY
    );
  }

  // ======================================================
  // CORE EMAIL SENDER
  // ======================================================

  async sendMail({
    to,
    subject,
    html,
  }) {
    try {
      if (!to) {
        throw new Error(
          "Recipient email missing"
        );
      }

      const result =
        await this.resend.emails.send({
          from:
            process.env.EMAIL_FROM ||
            "ReadyTech <onboarding@resend.dev>",

          to,
          subject,
          html,
        });

      console.log(
        "✅ EMAIL SENT:",
        result?.id
      );

      return {
        success: true,
        id: result?.id,
      };
    } catch (err) {
      console.error(
        "❌ EMAIL FAILED:",
        err.message
      );

      return {
        success: false,
        error: err.message,
      };
    }
  }

  // ======================================================
  // SUBSCRIPTION LEAD
  // ======================================================

  async sendSubscriptionLead(
    data
  ) {
    const adminEmail =
      process.env.ADMIN_EMAIL ||
      process.env.COMPANY_MAIL;

    if (!adminEmail) {
      return {
        success: false,
        error:
          "Admin email not configured",
      };
    }

    return this.sendMail({
      to: adminEmail,

      subject: `🚀 New Subscription Lead - ${data.plan}`,

      html:
        this.templates.upgradeLead(
          data
        ),
    });
  }

  // ======================================================
  // CUSTOMER CONFIRMATION
  // ======================================================

  async sendCustomerConfirmation({
    email,
    name,
    plan,
  }) {
    return this.sendMail({
      to: email,

      subject:
        "✅ Upgrade Request Received",

      html:
        this.templates.customerConfirmation(
          {
            name,
            plan,
          }
        ),
    });
  }

  // ======================================================
  // PAYMENT SUCCESS
  // ======================================================

  async sendPaymentSuccess({
    email,
    name,
    amount,
    plan,
  }) {
    return this.sendMail({
      to: email,

      subject:
        "💳 Payment Successful",

      html:
        this.templates.paymentSuccess(
          {
            name,
            amount,
            plan,
          }
        ),
    });
  }

  // ======================================================
  // INVOICE EMAIL
  // ======================================================

  async sendInvoiceMail({
    email,
    name,
    invoiceId,
  }) {
    return this.sendMail({
      to: email,

      subject: `📄 Invoice ${invoiceId}`,

      html:
        this.templates.invoiceMail(
          {
            name,
            invoiceId,
          }
        ),
    });
  }

  // ======================================================
  // SUPPORT REQUEST TO COMPANY
  // ======================================================

  async sendSupportRequest({
    ticketId,
    clientName,
    clientEmail,
    message,
  }) {
    const supportEmail =
      process.env.SUPPORT_EMAIL ||
      process.env.ADMIN_EMAIL ||
      process.env.COMPANY_MAIL;

    return this.sendMail({
      to: supportEmail,

      subject: `🎫 New Support Request #${ticketId}`,

      html:
        this.templates.supportRequest(
          {
            ticketId,
            clientName,
            clientEmail,
            message,
          }
        ),
    });
  }

  // ======================================================
  // CLIENT SUPPORT CONFIRMATION
  // ======================================================

  async sendSupportConfirmation({
    email,
    name,
  }) {
    return this.sendMail({
      to: email,

      subject:
        "✅ Support Request Received",

      html:
        this.templates.supportConfirmation(
          {
            name,
          }
        ),
    });
  }

  // ======================================================
  // ADMIN REPLY EMAIL
  // ======================================================

  async sendSupportReply({
    email,
    name,
    reply,
  }) {
    return this.sendMail({
      to: email,

      subject:
        "💬 Support Team Response",

      html:
        this.templates.supportReply(
          {
            name,
            reply,
          }
        ),
    });
  }

  // ======================================================
  // TEMPLATES
  // ======================================================

  templates = {
    upgradeLead: (
      data
    ) => `
      <div style="font-family:Arial;padding:20px">
        <h2>🚀 New Subscription Lead</h2>

        <p><b>Name:</b> ${data.name}</p>
        <p><b>Email:</b> ${data.email}</p>
        <p><b>Phone:</b> ${data.phone}</p>
        <p><b>Company:</b> ${data.company}</p>
        <p><b>Plan:</b> ${data.plan}</p>
        <p><b>Billing:</b> ${data.billingCycle}</p>
      </div>
    `,

    customerConfirmation: ({
      name,
      plan,
    }) => `
      <div style="font-family:Arial;padding:20px">
        <h2>Hello ${name} 👋</h2>

        <p>
          Your request for
          <b>${plan}</b>
          plan has been received.
        </p>

        <p>
          Our team will contact
          you shortly.
        </p>
      </div>
    `,

    paymentSuccess: ({
      name,
      amount,
      plan,
    }) => `
      <div style="font-family:Arial;padding:20px">
        <h2>💳 Payment Successful</h2>

        <p>Hello ${name},</p>

        <p>
          Payment received for
          <b>${plan}</b>.
        </p>

        <p>
          Amount: ₹${amount}
        </p>
      </div>
    `,

    invoiceMail: ({
      name,
      invoiceId,
    }) => `
      <div style="font-family:Arial;padding:20px">
        <h2>📄 Invoice Attached</h2>

        <p>Hello ${name},</p>

        <p>
          Invoice
          <b>${invoiceId}</b>
          generated successfully.
        </p>
      </div>
    `,

    supportRequest: ({
      ticketId,
      clientName,
      clientEmail,
      message,
    }) => `
      <div style="font-family:Arial;padding:20px">

        <h2>
          🎫 New Support Request
        </h2>

        <p>
          <b>Ticket ID:</b>
          ${ticketId}
        </p>

        <p>
          <b>Name:</b>
          ${clientName}
        </p>

        <p>
          <b>Email:</b>
          ${clientEmail}
        </p>

        <p>
          <b>Message:</b>
        </p>

        <div
          style="
          background:#f4f4f4;
          padding:15px;
          border-radius:8px;
          "
        >
          ${message}
        </div>

      </div>
    `,

    supportConfirmation: ({
      name,
    }) => `
      <div style="font-family:Arial;padding:20px">

        <h2>
          Thank You ${name} 👋
        </h2>

        <p>
          We have successfully
          received your support
          request.
        </p>

        <p>
          Our support team will
          review your request and
          contact you within
          24 hours.
        </p>

        <p>
          Thank you for choosing
          ReadyTech Solutions.
        </p>

      </div>
    `,

    supportReply: ({
      name,
      reply,
    }) => `
      <div style="font-family:Arial;padding:20px">

        <h2>
          Support Team Response
        </h2>

        <p>
          Hello ${name},
        </p>

        <p>
          Our team has replied
          to your support request.
        </p>

        <div
          style="
          background:#f4f4f4;
          padding:15px;
          border-radius:8px;
          "
        >
          ${reply}
        </div>

        <br/>

        <p>
          Thank you,
          <br/>
          ReadyTech Solutions
        </p>

      </div>
    `,
  };

  // ======================================================
  // WELCOME EMAIL WITH CREDENTIALS (new customer provisioning)
  // ======================================================

  async sendWelcomeWithCredentials({ email, name, tenantId, tempPassword, plan }) {
    return this.sendMail({
      to: email,
      subject: "🎉 Welcome to ReadyTech Solutions — Your Account is Ready",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:8px">
          <div style="background:#1a3c5e;padding:20px;border-radius:8px 8px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">ReadyTech Solutions</h1>
            <p style="color:#94b4cc;margin:4px 0 0">Enterprise SaaS Platform</p>
          </div>
          <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px">
            <h2 style="color:#1a3c5e">Welcome, ${name}! 👋</h2>
            <p>Your <strong>${plan}</strong> subscription is now active. Here are your login credentials:</p>
            <div style="background:#f0f4f8;border-left:4px solid #1a3c5e;padding:16px;border-radius:4px;margin:16px 0">
              <p style="margin:4px 0"><strong>Email:</strong> ${email}</p>
              <p style="margin:4px 0"><strong>Tenant ID:</strong> ${tenantId}</p>
              <p style="margin:4px 0"><strong>Temporary Password:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:3px">${tempPassword}</code></p>
            </div>
            <p style="color:#e53e3e;font-size:13px">⚠️ Please change your password immediately after your first login.</p>
            <p>If you have any questions, contact us at <a href="mailto:support@readytechsolutions.in">support@readytechsolutions.in</a></p>
            <p style="margin-top:24px;color:#718096;font-size:12px">Thank you for choosing ReadyTech Solutions.</p>
          </div>
        </div>
      `,
    });
  }

  // ======================================================
  // HEALTH CHECK
  // ======================================================

  getStatus() {
    return {
      provider: "resend",
      status: "active",
      apiKeyExists:
        !!process.env
          .RESEND_API_KEY,
    };
  }
}

module.exports =
  new EmailService();