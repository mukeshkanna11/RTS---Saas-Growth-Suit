const pdf = require("html-pdf-node");
const fs = require("fs");
const path = require("path");

const generate = async (html, invoiceId) => {
  try {
    const fileName = `${invoiceId}.pdf`;
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "invoices",
      fileName
    );

    const file = { content: html };

    const options = {
      format: "A4",
      printBackground: true,
    };

    const buffer = await pdf.generatePdf(file, options);

    console.log("PDF BUFFER TYPE:", typeof buffer);
    console.log("PDF BUFFER LENGTH:", buffer?.length);

    // 🔥 STRICT VALIDATION
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error("Invalid PDF buffer generated");
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);

    return {
      fileName,
      filePath,
    };

  } catch (err) {
    console.error("🔥 PDF GENERATION ERROR:", err);
    throw err;
  }
};

module.exports = { generate };