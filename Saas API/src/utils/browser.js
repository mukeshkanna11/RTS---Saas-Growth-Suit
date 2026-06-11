const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const getBrowser = async () => {
  const isProd = process.env.NODE_ENV === "production";

  return await puppeteer.launch({
    args: isProd ? chromium.args : [],
    executablePath: isProd
      ? await chromium.executablePath   // ❗ IMPORTANT: no ()
      : undefined,
    headless: true,
  });
};

module.exports = { getBrowser };