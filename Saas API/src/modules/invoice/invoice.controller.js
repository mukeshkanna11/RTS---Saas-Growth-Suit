const InvoiceService = require("./invoice.service");

// =========================
// SAFE HELPERS
// =========================
const success = (res, message, data = null) => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};

const fail = (res, message, code = 500) => {
  return res.status(code).json({
    success: false,
    message,
  });
};

// =========================
// VALIDATION (basic SaaS level)
// =========================
const validateInvoiceRequest = (body) => {
  if (!body) return "Request body is required";

  if (!body.company) return "Company details required";

  if (!body.customer) return "Customer details required";

  if (!Array.isArray(body.items)) {
    return "Items must be an array";
  }

  if (body.items.length === 0) {
    return "At least one item is required";
  }

  return null;
};

exports.downloadInvoice = async (req, res) => {
  try {
    const result = await InvoiceService.download(req.params.invoiceId, res);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


exports.generateInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;

    const error = validateInvoiceRequest(invoiceData);
    if (error) {
      return fail(res, error, 400);
    }

    invoiceData.invoiceId =
      invoiceData.invoiceId ||
      `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await InvoiceService.generateInvoice(invoiceData);

    // SEND PDF DIRECTLY (BEST PRACTICE)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${invoiceData.invoiceId}.pdf`
    );

    return res.send(result.pdf);

  } catch (err) {
    console.error("🔥 CONTROLLER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};