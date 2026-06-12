const nodemailer = require("nodemailer");

const transporter =
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,

    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

exports.sendSupportEmail =
  async ({
    subject,
    message,
    clientName,
  }) => {
    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,

      to:
        process.env.SUPPORT_EMAIL,

      subject,

      html: `
      <h3>New Support Ticket</h3>

      <p><b>Client:</b> ${clientName}</p>

      <p>${message}</p>
      `,
    });
  };