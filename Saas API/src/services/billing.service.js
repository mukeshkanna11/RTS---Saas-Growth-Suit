const Subscription = require("../modules/subscription/subscription.model");
const InvoiceCounter = require("../models/invoiceCounter.model");
const InvoiceTemplate = require("../templates/invoice.template");
const pdfService = require("./pdf.service");

// ======================================================
// AUTO INVOICE ID (ZOHO STYLE)
// ======================================================
async function getInvoiceId(companyId) {
  const year = new Date().getFullYear();

  const counter = await InvoiceCounter.findOneAndUpdate(
    { companyId, year },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  const num = String(counter.sequence).padStart(4, "0");
  return `INV-${year}-${num}`;
}

// ======================================================
// MAIN BILLING GENERATOR
// ======================================================
async function generateInvoice(subscriptionId) {
  const sub = await Subscription.findById(subscriptionId).populate(
    "companyId"
  );

  if (!sub) throw new Error("Subscription not found");

  const invoiceId = await getInvoiceId(sub.companyId._id);

  // BUILD DATA
  const invoiceData = InvoiceTemplate.build({
    company: sub.companyId,
    customer: {
      name: sub.clientName,
      email: sub.clientEmail,
      phone: sub.clientPhone,
    },
    items: [
      {
        name: `${sub.plan.toUpperCase()} PLAN`,
        qty: 1,
        price: sub.amount,
      },
    ],
    discount: 0,
    cgst: 9,
    sgst: 9,
    invoiceId,
  });

  // GENERATE PDF
  const filePath = await pdfService.create(invoiceData, invoiceId);

  // SAVE TO DB
  sub.invoice = {
    invoiceId,
    url: filePath,
    generatedAt: new Date(),
  };

  sub.lastPaymentDate = new Date();
  await sub.save();

  return {
    invoiceId,
    filePath,
    grandTotal: invoiceData.summary.grandTotal,
  };
}

module.exports = {
  generateInvoice,
};