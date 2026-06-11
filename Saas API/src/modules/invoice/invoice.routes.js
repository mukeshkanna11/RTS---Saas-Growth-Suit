const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const PDFGenerator = require("./pdf.generator");
const InvoiceTemplate = require("./invoice.template");
const InvoiceService = require("./invoice.service");
const { protect } = require("../../middleware/auth.middleware");
const Invoice = require("./invoice.model"); // OR correct path
// ======================================================
// GET ALL INVOICES
// ======================================================

router.get(
  "/",
  protect,
  async (req, res) => {
    try {
      const invoices =
        await InvoiceService.getInvoices();

      return res.status(200).json({
        success: true,
        count: invoices.length,
        data: invoices,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// ======================================================
// DOWNLOAD PDF  (MOVE THIS UP)
// ======================================================

router.get("/download/:invoiceId", protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      invoiceId: req.params.invoiceId,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // =========================
    // CHECK FILE EXISTS
    // =========================
    const fs = require("fs");

    if (!invoice.filePath || !fs.existsSync(invoice.filePath)) {
      return res.status(404).json({
        success: false,
        message: "PDF file not found",
      });
    }

    // =========================
    // READ FILE BUFFER
    // =========================
    const fileBuffer = fs.readFileSync(invoice.filePath);

    // =========================
    // SEND PDF
    // =========================
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${invoice.invoiceId}.pdf`
    );

    return res.end(fileBuffer);

  } catch (err) {
    console.error("🔥 DOWNLOAD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


// ======================================================
// GET SINGLE INVOICE (PREVIEW DATA)
// ======================================================

router.get(
  "/:invoiceId",
  protect,
  async (req, res) => {
    try {
      const invoice =
        await InvoiceService.getInvoiceById(
          req.params.invoiceId
        );

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// ======================================================
// GENERATE INVOICE
// ======================================================

router.post(
  "/generate",
  protect,
  async (req, res) => {
    try {
      const result =
        await InvoiceService.generateInvoice(
          req.body
        );

      return res.status(201).json({
        success: true,
        message:
          "Invoice generated successfully",
        data: result,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);



// ======================================================
// UPDATE INVOICE STATUS
// ======================================================

router.patch(
  "/:invoiceId/status",
  protect,
  async (req, res) => {
    try {
      const { invoiceId } =
        req.params;

      const {
        status,
        paymentStatus,
      } = req.body;

      const invoice =
        await InvoiceService.updateInvoiceStatus(
          invoiceId,
          status,
          paymentStatus
        );

      return res.status(200).json({
        success: true,
        message:
          "Invoice status updated successfully",
        data: invoice,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// ======================================================
// DELETE INVOICE
// ======================================================

router.delete(
  "/:invoiceId",
  protect,
  async (req, res) => {
    try {
      const result =
        await InvoiceService.deleteInvoice(
          req.params.invoiceId
        );

      return res.status(200).json({
        success: true,
        message:
          "Invoice deleted successfully",
        data: result,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// ======================================================
// HEALTH
// ======================================================

router.get(
  "/health",
  (req, res) => {
    res.json({
      success: true,
      service: "Invoice Service",
      status: "Running",
    });
  }
);

module.exports = router;