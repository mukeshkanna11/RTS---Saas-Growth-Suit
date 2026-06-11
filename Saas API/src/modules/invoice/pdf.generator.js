const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

// ======================================================
// PDF GENERATOR
// ENTERPRISE SAAS VERSION
// PUPPETEER BASED
// ======================================================

const INVOICE_DIR = path.join(
  process.cwd(),
  "uploads",
  "invoices"
);

// ======================================================
// CREATE DIRECTORY
// ======================================================

const ensureDirectory = async () => {
  if (!fs.existsSync(INVOICE_DIR)) {
    await fs.promises.mkdir(
      INVOICE_DIR,
      { recursive: true }
    );
  }
};

// ======================================================
// GENERATE PDF
// ======================================================

const generate = async (
  html,
  invoiceId
) => {
  let browser;

  try {
    if (!html) {
      throw new Error(
        "HTML content required"
      );
    }

    if (!invoiceId) {
      throw new Error(
        "Invoice ID required"
      );
    }

    await ensureDirectory();

    const fileName =
      `${invoiceId}.pdf`;

    const filePath = path.join(
      INVOICE_DIR,
      fileName
    );

    browser =
      await puppeteer.launch({
        headless: true,

        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });

    const page =
      await browser.newPage();

    await page.setContent(
      html,
      {
        waitUntil: [
          "load",
          "networkidle0",
        ],
      }
    );

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

      displayHeaderFooter: false,
    });

    const stats =
      await fs.promises.stat(
        filePath
      );

    return {
      success: true,

      fileName,

      filePath,

      size: stats.size,

      createdAt:
        new Date(),
    };
  } catch (err) {
    console.error(
      "PDF GENERATOR ERROR:",
      err
    );

    throw new Error(
      err.message ||
        "PDF generation failed"
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// ======================================================
// DOWNLOAD PDF
// ======================================================

const download = async (
  filePath,
  res
) => {
  try {
    if (!filePath) {
      throw new Error(
        "File path missing"
      );
    }

    if (
      !fs.existsSync(filePath)
    ) {
      throw new Error(
        "PDF not found"
      );
    }

    const fileName =
      path.basename(filePath);

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    const stream =
      fs.createReadStream(
        filePath
      );

    stream.pipe(res);
  } catch (err) {
    throw err;
  }
};

// ======================================================
// DELETE PDF
// ======================================================

const remove = async (
  filePath
) => {
  try {
    if (
      filePath &&
      fs.existsSync(filePath)
    ) {
      await fs.promises.unlink(
        filePath
      );
    }

    return true;
  } catch (err) {
    console.error(
      "DELETE PDF ERROR:",
      err
    );

    return false;
  }
};

// ======================================================
// FILE EXISTS
// ======================================================

const exists = (
  filePath
) => {
  return (
    filePath &&
    fs.existsSync(filePath)
  );
};

// ======================================================
// GET FILE INFO
// ======================================================

const getInfo = async (
  filePath
) => {
  if (
    !filePath ||
    !fs.existsSync(filePath)
  ) {
    return null;
  }

  const stats =
    await fs.promises.stat(
      filePath
    );

  return {
    size: stats.size,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
  };
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  generate,
  download,
  remove,
  exists,
  getInfo,
};