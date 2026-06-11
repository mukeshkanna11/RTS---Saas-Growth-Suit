const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const INVOICE_DIR = path.join(process.cwd(), "uploads", "invoices");

const ensureDirectory = async () => {
  if (!fs.existsSync(INVOICE_DIR)) {
    await fs.promises.mkdir(INVOICE_DIR, { recursive: true });
  }
};

const generate = async (html, invoiceId) => {
  let browser;

  try {
    if (!html) throw new Error("HTML required");
    if (!invoiceId) throw new Error("Invoice ID required");

    await ensureDirectory();

    const filePath = path.join(INVOICE_DIR, `${invoiceId}.pdf`);

    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

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
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = { generate };