const InvoiceService = require("./invoice.service");

// =========================
// RESPONSE HELPERS
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
// VALIDATION
// =========================
const validateInvoiceRequest = (body) => {
  if (!body) return "Request body is required";

  if (!body.company) return "Company details required";

  if (!body.customer) return "Customer details required";

  if (!Array.isArray(body.items)) return "Items must be an array";

  if (body.items.length === 0) return "At least one item is required";

  return null;
};

// =========================
// DOWNLOAD INVOICE (PDF)
// =========================
exports.downloadInvoice = async (req, res) => {
  try {
    const result = await InvoiceService.download(req.params.invoiceId, res);
    return result;
  } catch (err) {
    console.error("🔥 DOWNLOAD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// GENERATE INVOICE (FIXED VERSION)
// =========================
exports.generateInvoice = async (req, res) => {
  try {
    const body = req.body;

    // =========================
    // VALIDATE REQUEST
    // =========================
    const error = validateInvoiceRequest(body);
    if (error) return fail(res, error, 400);

    // =========================
    // SAFE DATE NORMALIZATION (🔥 IMPORTANT FIX)
    // =========================
    const invoiceData = {
      ...body,

      orderDate:
        body.orderDate || body.order_date || body.createdAt || null,

      purchaseDate:
        body.purchaseDate || body.purchase_date || body.createdAt || null,

      paymentDate:
        body.paymentDate || body.payment_date || null,

      dueDate:
        body.dueDate || body.due_date || null,
    };

    // =========================
    // SAFE INVOICE ID
    // =========================
    invoiceData.invoiceId =
      body.invoiceId ||
      `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    console.log("🔥 FINAL CONTROLLER PAYLOAD:", invoiceData);

    // =========================
    // SERVICE CALL
    // =========================
    const result = await InvoiceService.generateInvoice(invoiceData);

    if (!result || !result.pdf) {
      throw new Error("PDF generation failed in service layer");
    }

    // =========================
    // PDF RESPONSE
    // =========================
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
      message: err.message || "Internal Server Error",
    });
  }
};