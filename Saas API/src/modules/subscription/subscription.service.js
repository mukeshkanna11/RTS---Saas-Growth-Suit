// ======================================================
// src/services/email.service.js
// SEND SUCCESS EMAIL TO CLIENT + COMPANY
// ======================================================

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendSubscriptionEmails = async ({
  clientName,
  clientEmail,
  plan,
  amount,
}) => {
  // Email to client
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: clientEmail,
    subject: "Subscription Activated Successfully 🚀",
    html: `
      <h2>Hello ${clientName},</h2>
      <p>Your <b>${plan}</b> subscription has been activated successfully.</p>
      <p>Amount Paid: ₹${amount}</p>
      <p>Thank you for choosing our SaaS platform.</p>
      <br/>
      <p>Best Regards,<br/>Ready Tech Solutions</p>
    `,
  });

  // Email to company/admin
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.COMPANY_EMAIL,
    subject: "New Subscription Activated",
    html: `
      <h3>New client subscription received</h3>
      <p>Client: ${clientName}</p>
      <p>Email: ${clientEmail}</p>
      <p>Plan: ${plan}</p>
      <p>Amount: ₹${amount}</p>
    `,
  });
};