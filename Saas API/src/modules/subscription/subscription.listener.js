const events = require("./subscription.events");
const EmailService = require("../services/email.service");
const Subscription = require("./subscription.model");

// ============================
// PAYMENT SUCCESS FLOW
// ============================
events.on("payment.success", async (sub) => {
  try {
    await EmailService.sendPaymentSuccess({
      email: sub.clientEmail,
      name: sub.clientName,
      plan: sub.plan,
      amount: sub.amount,
    });

    if (sub.invoiceId) {
      await EmailService.sendInvoiceMail({
        email: sub.clientEmail,
        name: sub.clientName,
        invoiceId: sub.invoiceId,
      });
    }
  } catch (err) {
    console.error("[Listener] payment.success error:", err.message);
  }
});

// ============================
// PAYPAL PAYMENT SUCCESS
// ============================
events.on("paypal.payment.success", async (data) => {
  try {
    await EmailService.sendPaymentSuccess({
      email: data.clientEmail,
      name: data.clientName,
      plan: data.plan,
      amount: data.amount,
    });

    if (data.invoiceId) {
      await EmailService.sendInvoiceMail({
        email: data.clientEmail,
        name: data.clientName,
        invoiceId: data.invoiceId,
      });
    }
  } catch (err) {
    console.error("[Listener] paypal.payment.success error:", err.message);
  }
});

// ============================
// SUBSCRIPTION RENEWED
// ============================
events.on("subscription.renewed", async (data) => {
  try {
    await EmailService.sendPaymentSuccess({
      email: data.clientEmail,
      name: data.clientName,
      plan: data.plan,
      amount: null,
    });
  } catch (err) {
    console.error("[Listener] subscription.renewed error:", err.message);
  }
});

// ============================
// SUBSCRIPTION CANCELLED
// ============================
events.on("subscription.cancelled", async (data) => {
  try {
    // No-op for now — add cancellation email when EmailService supports it
    console.log(
      `[Listener] Subscription ${data.subscriptionId} cancelled for ${data.clientEmail}`
    );
  } catch (err) {
    console.error("[Listener] subscription.cancelled error:", err.message);
  }
});