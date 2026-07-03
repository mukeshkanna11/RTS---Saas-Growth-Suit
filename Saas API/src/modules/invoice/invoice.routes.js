const router   = require("express").Router();
const fs       = require("fs");
const InvoiceService = require("./invoice.service");
const { protect } = require("../../middleware/auth.middleware");
const Invoice  = require("./invoice.model");

// ======================================================
// HEALTH  (must be before /:invoiceId to avoid wildcard)
// ======================================================

router.get("/health", (req, res) => {
  res.json({ success: true, service: "Invoice Service", status: "Running" });
});

// ======================================================
// STATS  (must be before /:invoiceId)
// ======================================================

router.get("/stats", protect, async (req, res) => {
  try {
    const stats = await InvoiceService.getInvoiceStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    console.error("STATS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ======================================================
// DOWNLOAD PDF  (must be before /:invoiceId)
// ======================================================

router.get("/download/:invoiceId", protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ invoiceId: req.params.invoiceId });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    if (!invoice.filePath || !fs.existsSync(invoice.filePath)) {
      return res.status(404).json({ success: false, message: "PDF file not found" });
    }

    const fileBuffer = fs.readFileSync(invoice.filePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${invoice.invoiceId}.pdf`);
    return res.end(fileBuffer);
  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ======================================================
// GET ALL INVOICES
// ======================================================

router.get("/", protect, async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await InvoiceService.getInvoices({ page, limit, search });
    return res.status(200).json({
      success: true,
      data:       result.invoices,
      pagination: result.pagination,
    });
  } catch (err) {
    console.error("LIST ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ======================================================
// GET SINGLE INVOICE (PREVIEW DATA)
// ======================================================

router.get("/:invoiceId", protect, async (req, res) => {
  try {
    const invoice = await InvoiceService.getInvoiceById(req.params.invoiceId);
    return res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    console.error("GET ONE ERROR:", err);
    const status = err.message === "Invoice not found" ? 404 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// ======================================================
// GENERATE INVOICE
// ======================================================

router.post("/generate", protect, async (req, res) => {
  try {
    const result = await InvoiceService.generateInvoice(req.body);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(201).json({
      success: true,
      message: "Invoice generated successfully",
      data:    result.invoice,
    });
  } catch (err) {
    console.error("GENERATE ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ======================================================
// UPDATE INVOICE STATUS
// ======================================================

router.patch("/:invoiceId/status", protect, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const invoice = await InvoiceService.updateInvoiceStatus(
      req.params.invoiceId,
      status,
      paymentStatus
    );
    return res.status(200).json({
      success: true,
      message: "Invoice status updated successfully",
      data:    invoice,
    });
  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    const status = err.message === "Invoice not found" ? 404 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// ======================================================
// DELETE INVOICE
// ======================================================

router.delete("/:invoiceId", protect, async (req, res) => {
  try {
    const result = await InvoiceService.deleteInvoice(req.params.invoiceId);
    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
      data:    result,
    });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    const status = err.message === "Invoice not found" ? 404 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

module.exports = router;
