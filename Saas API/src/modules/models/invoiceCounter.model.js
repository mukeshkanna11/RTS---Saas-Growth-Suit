const mongoose = require("mongoose");

/**
 * ======================================================
 * SAAS INVOICE COUNTER (SAFE GLOBAL SEQUENCE)
 * INV-2026-000001 STYLE
 * ======================================================
 */

const invoiceCounterSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/**
 * SAFE ATOMIC INCREMENT
 */
invoiceCounterSchema.statics.getNextInvoiceNumber = async function () {
  const year = new Date().getFullYear();

  const counter = await this.findOneAndUpdate(
    { year },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  const padded = String(counter.seq).padStart(6, "0");

  return `INV-${year}-${padded}`;
};

module.exports = mongoose.model("InvoiceCounter", invoiceCounterSchema);