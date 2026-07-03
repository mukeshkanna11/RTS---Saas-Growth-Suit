const mongoose = require("mongoose");

// ======================================================
// ITEM
// ======================================================

const ItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    hsn: {
      type: String,
      default: "998314",
    },

    qty: {
      type: Number,
      default: 1,
    },

    price: {
      type: Number,
      default: 0,
    },

    // Per-item discount percentage (0–100). Applied before global discount.
    discount: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

// ======================================================
// INVOICE
// ======================================================

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "generated",
        "paid",
        "overdue",
        "cancelled",
      ],
      default: "generated",
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "partial",
        "failed",
      ],
      default: "pending",
    },

    company: {
      type: Object,
      required: true,
    },

    customer: {
      type: Object,
      required: true,
    },

    items: {
      type: [ItemSchema],
      default: [],
    },

    discount: {
      type: Object,
      default: {},
    },

    tax: {
      type: Object,
      default: {},
    },

    totals: {
      subtotal: Number,
      discountAmount: Number,
      taxable: Number,
      cgst: Number,
      sgst: Number,
      igst: Number,
      taxTotal: Number,
      total: Number,
    },

   notes: {
  type: String,
  default: "",
},

terms: {
  type: [String],
  default: [],
},

    fileName: {
      type: String,
      default: "",
    },

    filePath: {
      type: String,
      default: "",
    },

    orderDate: Date,
    purchaseDate: Date,
    paymentDate: Date,
    dueDate: Date,
  },
  {
    timestamps: true,
  }
);

// ======================================================
// INDEXES
// ======================================================

InvoiceSchema.index({
  createdAt: -1,
});

InvoiceSchema.index({
  paymentStatus: 1,
});

InvoiceSchema.index({
  status: 1,
});

// ======================================================

module.exports = mongoose.model(
  "Invoice",
  InvoiceSchema
);