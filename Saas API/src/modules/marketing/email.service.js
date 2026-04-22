const nodemailer = require("nodemailer");

let transporter;

// ===============================
// INIT EMAIL SERVICE
// ===============================
const initEmailService = () => {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // TLS (587)

    auth: {
      user: process.env.SMTP_USER,   // ✅ FIXED (was EMAIL_USER)
      pass: process.env.SMTP_PASS,   // ✅ FIXED (was EMAIL_PASS)
    },
  });

  // ===============================
  // VERIFY SMTP CONNECTION
  // ===============================
  transporter.verify((error) => {
    if (error) {
      console.error("❌ SMTP Connection Failed:", error.message);
    } else {
      console.log("✅ SMTP Ready (Email Service Active)");
    }
  });
};

// ===============================
// SEND EMAIL (PRODUCTION SAFE)
// ===============================
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!transporter) initEmailService();

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("SMTP credentials missing in .env");
    }

    if (!to) throw new Error("Recipient email missing");

    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"ReadyTech Solutions" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email Sent:", to);

    return result;
  } catch (err) {
    console.error("❌ Email Send Failed:", err.message);
    throw err;
  }
};

module.exports = {
  sendEmail,
};