const fs = require("fs");
const path = require("path");
const InvoiceTemplate = require("./invoice.template");
const PDFGenerator = require("./pdf.generator");
const Invoice = require("./invoice.model");


// ======================================================
// HELPERS
// ======================================================

const safe = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const round = (v) =>
  Math.round((Number(v) + Number.EPSILON) * 100) / 100;

// ======================================================
// TOTAL CALCULATOR
// ======================================================

const calculateTotals = (
  items = [],
  discount = {},
  tax = {}
) => {
  discount = {
    type: "percent",
    value: 0,
    ...discount,
  };

  tax = {
    type: "intra",
    cgst: 9,
    sgst: 9,
    igst: 0,
    ...tax,
  };

  const subtotal = round(
    items.reduce(
      (sum, item) =>
        sum +
        safe(item.qty) *
          safe(item.price),
      0
    )
  );

  let discountAmount = 0;

  if (discount.type === "percent") {
    discountAmount =
      (subtotal *
        safe(discount.value)) /
      100;
  } else {
    discountAmount =
      safe(discount.value);
  }

  discountAmount = round(
    Math.min(
      discountAmount,
      subtotal
    )
  );

  const taxable = round(
    subtotal - discountAmount
  );

  const cgst = round(
    (taxable * safe(tax.cgst)) /
      100
  );

  const sgst = round(
    (taxable * safe(tax.sgst)) /
      100
  );

  const igst = round(
    (taxable * safe(tax.igst)) /
      100
  );

  const taxTotal = round(
    cgst + sgst + igst
  );

  const total = round(
    taxable + taxTotal
  );

  return {
    subtotal,
    discountAmount,
    taxable,
    cgst,
    sgst,
    igst,
    taxTotal,
    total,
  };
};



// ======================================================
// GENERATE INVOICE (PRODUCTION SAFE FIXED)
// ======================================================


const generateInvoice = async (invoiceData = {}) => {
  try {
    // =========================
    // VALIDATION
    // =========================
    if (!invoiceData?.company) {
      throw new Error("Company details required");
    }

    if (!invoiceData?.customer) {
      throw new Error("Customer details required");
    }

    if (!Array.isArray(invoiceData.items)) {
      invoiceData.items = [];
    }

    // =========================
    // INVOICE ID
    // =========================
    const invoiceId =
      invoiceData.invoiceId ||
      `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // =========================
    // DUPLICATE CHECK
    // =========================
    const existing = await Invoice.findOne({ invoiceId });

    if (existing) {
      throw new Error("Invoice ID already exists. Try again.");
    }

    // =========================
    // CALCULATIONS
    // =========================
    const totals = calculateTotals(
      invoiceData.items,
      invoiceData.discount,
      invoiceData.tax
    );

    // =========================
    // BUILD TEMPLATE DATA
    // =========================
    const data = {
      ...invoiceData,
      invoiceId,
      totals,
      createdAt: new Date(),
    };

    const logoPath = path.join(process.cwd(), "public", "logo.png");

let logoBase64 = "";

if (fs.existsSync(logoPath)) {
  const file = fs.readFileSync(logoPath);
  logoBase64 = file.toString("base64");
}

    // =========================
    // GENERATE HTML
    // =========================
    const html = InvoiceTemplate.toHTML(data, logoBase64);

    if (!html) {
      throw new Error("HTML generation failed from template");
    }

    console.log("HTML GENERATED LENGTH:", html.length);

    // =========================
    // CREATE UPLOAD DIR
    // =========================
    const uploadDir = path.join(process.cwd(), "uploads", "invoices");
    fs.mkdirSync(uploadDir, { recursive: true });

    // =========================
    // PDF GENERATION (IMPORTANT FIX AREA)
    // =========================
    let fileResult;

    try {
      fileResult = await PDFGenerator.generate(html, invoiceId);
    } catch (pdfErr) {
      console.error("🔥 PDF GENERATION REAL ERROR:");
      console.error(pdfErr);

      throw new Error(`PDF generation failed: ${pdfErr.message}`);
    }

    if (!fileResult?.filePath) {
      throw new Error("PDF generation returned empty filePath");
    }

    // =========================
    // SAVE IN DB
    // =========================
    const savedInvoice = await Invoice.create({
      invoiceId,
      company: invoiceData.company,
      customer: invoiceData.customer,
      items: invoiceData.items,
      discount: invoiceData.discount || {},
      tax: invoiceData.tax || {},
      totals,
      notes: invoiceData.notes || "",

      terms: Array.isArray(invoiceData.terms)
        ? invoiceData.terms
        : invoiceData.terms
        ? [invoiceData.terms]
        : [],

      fileName: fileResult.fileName,
      filePath: fileResult.filePath,

      status: "generated",
      paymentStatus: "pending",

      orderDate: invoiceData.orderDate,
      purchaseDate: invoiceData.purchaseDate,
      paymentDate: invoiceData.paymentDate,
      dueDate: invoiceData.dueDate,
    });

    // =========================
    // FINAL RESPONSE
    // =========================
    return {
      success: true,
      message: "Invoice generated successfully",
      invoice: savedInvoice,
      totals,
    };

  } catch (error) {
    console.error("🔥 INVOICE SERVICE ERROR:");
    console.error(error);

    return {
      success: false,
      message: error.message || "Invoice generation failed",
    };
  }
};

module.exports = { generateInvoice };


// ======================================================
// DOWNLOAD INVOICE (SAAS GRADE SAFE VERSION)
// ======================================================

// adjust if needed

const downloadInvoice = async (invoiceId) => {
  const invoice = await Invoice.findOne({ invoiceId });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const filePath = path.resolve(invoice.filePath);

  if (!fs.existsSync(filePath)) {
    throw new Error("Invoice file not found");
  }

  return filePath;
};

module.exports = { downloadInvoice };

// ======================================================
// GET ALL INVOICES
// ======================================================

const getInvoices = async ({
  page = 1,
  limit = 20,
  search = "",
} = {}) => {
  const pageNum =
    Number(page) || 1;

  const limitNum =
    Number(limit) || 20;

  const skip =
    (pageNum - 1) * limitNum;

  const query = {};

  if (search?.trim()) {
    query.$or = [
      {
        invoiceId: {
          $regex: search,
          $options: "i",
        },
      },
      {
        "customer.name": {
          $regex: search,
          $options: "i",
        },
      },
      {
        "customer.email": {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const [invoices, total] =
    await Promise.all([
      Invoice.find(query)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNum)
        .lean(),

      Invoice.countDocuments(
        query
      ),
    ]);

  return {
    success: true,

    invoices,

    pagination: {
      total,

      page: pageNum,

      limit: limitNum,

      pages: Math.ceil(
        total / limitNum
      ),

      hasNext:
        pageNum <
        Math.ceil(
          total / limitNum
        ),

      hasPrev:
        pageNum > 1,
    },
  };
};

// ======================================================
// GET INVOICE BY ID
// ======================================================

const getInvoiceById = async (
  invoiceId
) => {
  if (!invoiceId) {
    throw new Error(
      "Invoice ID is required"
    );
  }

  const invoice =
    await Invoice.findOne({
      invoiceId,
    }).lean();

  if (!invoice) {
    throw new Error(
      "Invoice not found"
    );
  }

  return invoice;
};

// ======================================================
// DELETE INVOICE
// ======================================================

const deleteInvoice = async (
  invoiceId
) => {
  if (!invoiceId) {
    throw new Error(
      "Invoice ID is required"
    );
  }

  const invoice =
    await Invoice.findOne({
      invoiceId,
    });

  if (!invoice) {
    throw new Error(
      "Invoice not found"
    );
  }

  // Delete PDF if exists
  if (
    invoice.filePath &&
    fs.existsSync(
      invoice.filePath
    )
  ) {
    try {
      await fs.promises.unlink(
        invoice.filePath
      );
    } catch (err) {
      console.error(
        "PDF DELETE ERROR:",
        err
      );
    }
  }

  await Invoice.deleteOne({
    invoiceId,
  });

  return {
    success: true,
    message:
      "Invoice deleted successfully",
    invoiceId,
  };
};

// ======================================================
// UPDATE STATUS
// ======================================================

const updateInvoiceStatus =
  async (
    invoiceId,
    status,
    paymentStatus
  ) => {
    if (!invoiceId) {
      throw new Error(
        "Invoice ID is required"
      );
    }

    const allowedStatus = [
      "draft",
      "generated",
      "paid",
      "overdue",
      "cancelled",
    ];

    const allowedPaymentStatus =
      [
        "pending",
        "paid",
        "partial",
        "failed",
      ];

    const updateData = {};

    if (status) {
      if (
        !allowedStatus.includes(
          status
        )
      ) {
        throw new Error(
          "Invalid invoice status"
        );
      }

      updateData.status =
        status;
    }

    if (paymentStatus) {
      if (
        !allowedPaymentStatus.includes(
          paymentStatus
        )
      ) {
        throw new Error(
          "Invalid payment status"
        );
      }

      updateData.paymentStatus =
        paymentStatus;
    }

    const invoice =
      await Invoice.findOneAndUpdate(
        { invoiceId },
        updateData,
        {
          new: true,
        }
      );

    if (!invoice) {
      throw new Error(
        "Invoice not found"
      );
    }

    return invoice;
  };

// ======================================================
// DASHBOARD STATS
// ======================================================

const getInvoiceStats =
  async () => {
    const [
      total,
      paid,
      pending,
      overdue,
      cancelled,
      revenue,
    ] = await Promise.all([
      Invoice.countDocuments(),

      Invoice.countDocuments({
        paymentStatus:
          "paid",
      }),

      Invoice.countDocuments({
        paymentStatus:
          "pending",
      }),

      Invoice.countDocuments({
        status:
          "overdue",
      }),

      Invoice.countDocuments({
        status:
          "cancelled",
      }),

      Invoice.aggregate([
        {
          $group: {
            _id: null,

            totalRevenue: {
              $sum:
                "$totals.total",
            },
          },
        },
      ]),
    ]);

    return {
      totalInvoices:
        total,

      paidInvoices:
        paid,

      pendingInvoices:
        pending,

      overdueInvoices:
        overdue,

      cancelledInvoices:
        cancelled,

      totalRevenue:
        revenue?.[0]
          ?.totalRevenue || 0,
    };
  };

module.exports = {
  generateInvoice,
  calculateTotals,
  downloadInvoice,

  getInvoices,
  getInvoiceById,
  deleteInvoice,
  updateInvoiceStatus,
  getInvoiceStats,
};