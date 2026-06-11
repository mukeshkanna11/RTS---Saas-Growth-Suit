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


// =========================
// GENERATE INVOICE CONTROLLER
// =========================
exports.generateInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;

    // =========================
    // VALIDATION
    // =========================
    const error = validateInvoiceRequest(invoiceData);
    if (error) {
      return fail(res, error, 400);
    }

    // =========================
    // SAFE INVOICE ID (fallback only)
    // =========================
    invoiceData.invoiceId =
      invoiceData.invoiceId ||
      `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // =========================
    // CALL SERVICE
    // =========================
    const result = await InvoiceService.generateInvoice(invoiceData);

    // =========================
    // SERVICE FAILURE HANDLING
    // =========================
    if (!result?.success) {
      return fail(res, result?.message || "Invoice generation failed", 500);
    }

    // =========================
    // SUCCESS RESPONSE (CLEAN)
    // =========================
    return success(res, "Invoice generated successfully", result);
  } catch (err) {
    console.error("INVOICE CONTROLLER ERROR:", err);

    return fail(
      res,
      err.message || "Internal server error while generating invoice"
    );
  }
};