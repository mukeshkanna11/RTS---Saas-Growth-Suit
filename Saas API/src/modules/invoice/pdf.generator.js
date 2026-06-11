const pdf = require("html-pdf-node");

const generate = async (html) => {
  if (!html) throw new Error("HTML required");

  const file = { content: html };

  const options = {
    format: "A4",
    printBackground: true,
  };

  const buffer = await pdf.generatePdf(file, options);

  // safety check
  if (!buffer || buffer.length === 0) {
    throw new Error("PDF buffer empty");
  }

  return buffer;
};

module.exports = { generate };