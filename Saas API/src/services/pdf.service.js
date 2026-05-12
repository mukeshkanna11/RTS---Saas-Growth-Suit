const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class PDFService {
  async create(invoice, invoiceId) {
    return new Promise((resolve, reject) => {
      try {
        const filePath = path.join(
          __dirname,
          `../../invoices/${invoiceId}.pdf`
        );

        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // ======================================================
        // COMPANY HEADER
        // ======================================================
        doc.fontSize(20).text(invoice.company.name, { align: "center" });
        doc
          .fontSize(10)
          .text(invoice.company.address, { align: "center" });
        doc.text(`GSTIN: ${invoice.company.gstin || "N/A"}`, {
          align: "center",
        });

        doc.moveDown();

        // ======================================================
        // INVOICE INFO
        // ======================================================
        doc.fontSize(14).text("INVOICE", { align: "center" });
        doc.moveDown();

        doc.fontSize(10);
        doc.text(`Invoice ID: ${invoice.invoice.invoiceId}`);
        doc.text(
          `Date: ${new Date(invoice.invoice.date).toDateString()}`
        );

        doc.moveDown();

        // ======================================================
        // CUSTOMER
        // ======================================================
        doc.fontSize(12).text("BILL TO");
        doc.fontSize(10);
        doc.text(invoice.customer.name);
        doc.text(invoice.customer.email);

        doc.moveDown();

        // ======================================================
        // ITEMS TABLE
        // ======================================================
        let y = 250;

        doc.text("Item", 50, y);
        doc.text("Qty", 250, y);
        doc.text("Price", 300, y);
        doc.text("Total", 400, y);

        y += 20;

        invoice.items.forEach((item) => {
          doc.text(item.name, 50, y);
          doc.text(item.qty, 250, y);
          doc.text(item.price, 300, y);
          doc.text(item.total, 400, y);
          y += 20;
        });

        // ======================================================
        // TOTAL SECTION
        // ======================================================
        y += 30;

        doc.text(
          `Subtotal: ₹${invoice.summary.subTotal}`,
          350,
          y
        );
        doc.text(
          `Discount: ₹${invoice.summary.discount}`,
          350,
          y + 15
        );
        doc.text(`CGST: ₹${invoice.summary.cgst}`, 350, y + 30);
        doc.text(`SGST: ₹${invoice.summary.sgst}`, 350, y + 45);

        doc
          .fontSize(12)
          .text(
            `TOTAL: ₹${invoice.summary.grandTotal}`,
            350,
            y + 70
          );

        doc.end();

        stream.on("finish", () => resolve(filePath));
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = new PDFService();