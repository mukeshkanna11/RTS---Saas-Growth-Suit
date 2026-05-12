const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      unique: true,
      index: true,
    },

    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },

    customer: {
      name: String,
      email: String,
      phone: String,
      address: String,
    },

    items: [
      {
        name: String,
        qty: Number,
        price: Number,
      },
    ],

    subtotal: Number,
    discount: Number,
    gst: Number,
    cgst: Number,
    sgst: Number,
    total: Number,

    pdfUrl: String,

    status: {
      type: String,
      enum: ["generated", "sent", "paid"],
      default: "generated",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);