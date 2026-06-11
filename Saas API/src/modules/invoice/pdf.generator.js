const fs = require("fs");
const path = require("path");
const pdf = require("html-pdf-node");

const INVOICE_DIR = path.join(process.cwd(), "uploads", "invoices");

const ensureDirectory = async () => {
  if (!fs.existsSync(INVOICE_DIR)) {
    await fs.promises.mkdir(INVOICE_DIR, { recursive: true });
  }
};

const generate = async (html, invoiceId) => {
  try {
    if (!html) throw new Error("HTML required");
    if (!invoiceId) throw new Error("Invoice ID required");

    await ensureDirectory();

    const filePath = path.join(INVOICE_DIR, `${invoiceId}.pdf`);

    const file = { content: html };

    const options = {
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    };

    const pdfBuffer = await pdf.generatePdf(file, options);

    await fs.promises.writeFile(filePath, pdfBuffer);

    const stats = await fs.promises.stat(filePath);

    return {
      success: true,
      fileName: `${invoiceId}.pdf`,
      filePath,
      size: stats.size,
      createdAt: new Date(),
    };
  } catch (err) {
    console.error("PDF ERROR:", err);
    throw new Error(err.message || "PDF generation failed");
  }
};

module.exports = { generate };