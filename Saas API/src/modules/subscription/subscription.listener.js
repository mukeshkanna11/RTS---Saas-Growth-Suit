const events = require("./subscription.events");
const EmailService = require("../services/email.service");

// ============================
// PAYMENT SUCCESS FLOW
// ============================
events.on("payment.success", async (sub) => {
  try {
    await EmailService.sendPaymentSuccessEmail({
      email: sub.clientEmail,
      name: sub.clientName,
      plan: sub.plan,
      amount: sub.amount,
      transactionId: sub.transactionId,
      invoiceId: sub.invoiceId,
    });

    await EmailService.sendInvoiceEmail({
      email: sub.clientEmail,
      invoiceId: sub.invoiceId,
      plan: sub.plan,
      amount: sub.amount,
      billingCycle: sub.billingCycle,
    });
  } catch (err) {
    console.error("Event Error:", err.message);
  }
});