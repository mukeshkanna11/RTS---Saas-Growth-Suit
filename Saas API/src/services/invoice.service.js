// ======================================================
// services/invoice.service.js
// ENTERPRISE SAAS INVOICE SERVICE
// Production Ready + Stable PDF Download
// ======================================================

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const InvoiceCounter = require("../modules/models/invoiceCounter.model");

class InvoiceService {
  // ======================================================
  // ENSURE DIRECTORY
  // ======================================================

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, {
        recursive: true,
      });
    }
  }

  // ======================================================
  // GENERATE INVOICE ID
  // ======================================================

  async generateInvoiceId() {
    try {
      return await InvoiceCounter.getNextInvoiceNumber();
    } catch (err) {
      console.error(
        "Invoice counter failed:",
        err.message
      );

      return `INV-${Date.now()}`;
    }
  }

  // ======================================================
  // FORMAT CURRENCY
  // ======================================================

  formatCurrency(amount = 0) {
    return `₹${Number(amount).toFixed(2)}`;
  }

  // ======================================================
  // CALCULATE TOTALS
  // ======================================================

  calculateTotals(data) {
    const subtotal =
      data.items?.reduce((acc, item) => {
        return (
          acc +
          Number(item.qty || 0) *
            Number(item.price || 0)
        );
      }, 0) || 0;

    const discountPercent = Number(
      data.discount || 0
    );

    const discountAmount =
      (subtotal * discountPercent) / 100;

    const taxable =
      subtotal - discountAmount;

    const cgst =
      (taxable *
        Number(data.cgst || 0)) /
      100;

    const sgst =
      (taxable *
        Number(data.sgst || 0)) /
      100;

    const total =
      taxable + cgst + sgst;

    return {
      subtotal,
      discountAmount,
      taxable,
      cgst,
      sgst,
      total,
    };
  }

  // ======================================================
  // CREATE PDF
  // ======================================================

  async createPDF(
    data,
    options = {}
  ) {
    try {
      const {
        filePath = null,
      } = options;

      // ==================================================
      // INVOICE ID
      // ==================================================

      const invoiceId =
        data.invoiceId ||
        (await this.generateInvoiceId());

      // ==================================================
      // DIRECTORY
      // ==================================================

      const invoicesDir = path.join(
        process.cwd(),
        "uploads",
        "invoices"
      );

      this.ensureDirectoryExists(
        invoicesDir
      );

      // ==================================================
      // FILE
      // ==================================================

      const fileName = `${invoiceId}.pdf`;

      const finalFilePath =
        filePath ||
        path.join(
          invoicesDir,
          fileName
        );

      // ==================================================
      // TOTALS
      // ==================================================

      const totals =
        this.calculateTotals(data);

      // ==================================================
      // PDF INIT
      // ==================================================

      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
      });

      const stream =
        fs.createWriteStream(
          finalFilePath
        );

      doc.pipe(stream);

      // ==================================================
      // HEADER
      // ==================================================

      doc
        .fontSize(24)
        .text(
          data.company?.name ||
            "ReadyTech Solutions",
          {
            align: "center",
          }
        );

      doc
        .fontSize(10)
        .text(
          data.company?.address ||
            "Tamil Nadu, India",
          {
            align: "center",
          }
        );

      doc
        .fontSize(10)
        .text(
          `GSTIN: ${
            data.company?.gstin ||
            "N/A"
          }`,
          {
            align: "center",
          }
        );

      doc.moveDown(2);

      // ==================================================
      // TITLE
      // ==================================================

      doc
        .fontSize(18)
        .text(
          "TAX INVOICE",
          {
            align: "center",
            underline: true,
          }
        );

      doc.moveDown(2);

      // ==================================================
      // META
      // ==================================================

      doc.fontSize(11);

      doc.text(
        `Invoice ID : ${invoiceId}`
      );

      doc.text(
        `Invoice Date : ${new Date().toLocaleDateString()}`
      );

      doc.text(
        `Payment Status : ${
          data.paymentStatus ||
          "PAID"
        }`
      );

      doc.moveDown();

      // ==================================================
      // CUSTOMER
      // ==================================================

      doc
        .fontSize(13)
        .text("Bill To", {
          underline: true,
        });

      doc.moveDown(0.5);

      doc.fontSize(11);

      doc.text(
        data.customer?.name ||
          "Customer"
      );

      doc.text(
        data.customer?.email ||
          "N/A"
      );

      doc.text(
        data.customer?.address ||
          "N/A"
      );

      doc.moveDown(2);

      // ==================================================
      // TABLE HEADER
      // ==================================================

      const tableTop = doc.y;

      doc.fontSize(11);

      doc.text(
        "Item",
        50,
        tableTop
      );

      doc.text(
        "Qty",
        280,
        tableTop
      );

      doc.text(
        "Price",
        350,
        tableTop
      );

      doc.text(
        "Total",
        470,
        tableTop
      );

      doc
        .moveTo(
          50,
          tableTop + 20
        )
        .lineTo(
          550,
          tableTop + 20
        )
        .stroke();

      let position =
        tableTop + 35;

      // ==================================================
      // ITEMS
      // ==================================================

      data.items.forEach((item) => {
        const itemTotal =
          Number(item.qty || 0) *
          Number(item.price || 0);

        doc.text(
          item.name || "Item",
          50,
          position
        );

        doc.text(
          String(item.qty || 0),
          280,
          position
        );

        doc.text(
          this.formatCurrency(
            item.price
          ),
          350,
          position
        );

        doc.text(
          this.formatCurrency(
            itemTotal
          ),
          470,
          position
        );

        position += 25;
      });

      // ==================================================
      // TOTALS
      // ==================================================

      position += 20;

      doc
        .moveTo(300, position)
        .lineTo(550, position)
        .stroke();

      position += 15;

      doc.text(
        `Subtotal : ${this.formatCurrency(
          totals.subtotal
        )}`,
        350,
        position
      );

      position += 20;

      doc.text(
        `Discount : -${this.formatCurrency(
          totals.discountAmount
        )}`,
        350,
        position
      );

      position += 20;

      doc.text(
        `CGST : ${this.formatCurrency(
          totals.cgst
        )}`,
        350,
        position
      );

      position += 20;

      doc.text(
        `SGST : ${this.formatCurrency(
          totals.sgst
        )}`,
        350,
        position
      );

      position += 25;

      doc
        .fontSize(13)
        .text(
          `TOTAL : ${this.formatCurrency(
            totals.total
          )}`,
          350,
          position,
          {
            underline: true,
          }
        );

      // ==================================================
      // FOOTER
      // ==================================================

      doc.moveDown(5);

      doc
        .fontSize(10)
        .text(
          "Thank you for choosing ReadyTech Solutions",
          {
            align: "center",
          }
        );

      doc
        .fontSize(9)
        .text(
          "This is a system generated invoice.",
          {
            align: "center",
          }
        );

      // ==================================================
      // FINALIZE PDF
      // ==================================================

      doc.end();

      // ==================================================
      // WAIT FOR WRITE COMPLETE
      // ==================================================

      return new Promise(
        (resolve, reject) => {
          stream.on(
            "finish",
            () => {
              resolve({
                success: true,
                invoiceId,
                fileName,
                filePath:
                  finalFilePath,
                totals,
              });
            }
          );

          stream.on(
            "error",
            (err) => {
              reject(err);
            }
          );
        }
      );
    } catch (err) {
      console.error(
        "Invoice PDF creation failed:",
        err
      );

      throw err;
    }
  }

  // ======================================================
  // STREAM INVOICE
  // ======================================================

  async streamInvoice(
    filePath,
    res,
    fileName = "invoice.pdf"
  ) {
    try {
      // ==================================================
      // VALIDATE
      // ==================================================

      if (
        !res ||
        typeof res.setHeader !==
          "function"
      ) {
        throw new Error(
          "Invalid Express response object"
        );
      }

      if (
        !filePath ||
        !fs.existsSync(filePath)
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Invoice file not found",
        });
      }

      // ==================================================
      // HEADERS
      // ==================================================

      res.writeHead(200, {
        "Content-Type":
          "application/pdf",

        "Content-Disposition":
          `attachment; filename="${fileName}"`,
      });

      // ==================================================
      // STREAM
      // ==================================================

      const fileStream =
        fs.createReadStream(filePath);

      fileStream.on(
        "error",
        (err) => {
          console.error(
            "File stream error:",
            err
          );

          if (!res.headersSent) {
            return res
              .status(500)
              .json({
                success: false,
                message:
                  "Failed to read invoice file",
              });
          }

          res.end();
        }
      );

      fileStream.on(
        "end",
        () => {
          res.end();
        }
      );

      fileStream.pipe(res);

    } catch (err) {
      console.error(
        "Invoice stream error:",
        err
      );

      if (
        res &&
        !res.headersSent
      ) {
        return res.status(500).json({
          success: false,
          message:
            err.message ||
            "Invoice stream failed",
        });
      }
    }
  }

  // ======================================================
  // GENERATE INVOICE
  // ======================================================

  async generateInvoice(
    data,
    options = {}
  ) {
    try {
      const {
        filePath = null,
        res = null,
        autoDownload = false,
      } = options;

      // ==================================================
      // CREATE PDF
      // ==================================================

      const result =
        await this.createPDF(data, {
          filePath,
        });

      // ==================================================
      // DIRECT DOWNLOAD
      // ==================================================

      if (
        autoDownload &&
        res
      ) {
        await this.streamInvoice(
          result.filePath,
          res,
          result.fileName
        );

        return;
      }

      // ==================================================
      // RETURN
      // ==================================================

      return {
        success: true,
        message:
          "Invoice generated successfully",

        invoice: {
          invoiceId:
            result.invoiceId,

          fileName:
            result.fileName,

          filePath:
            result.filePath,

          totals:
            result.totals,
        },
      };

    } catch (err) {
      console.error(
        "Generate invoice failed:",
        err
      );

      throw err;
    }
  }
}

module.exports =
  new InvoiceService();