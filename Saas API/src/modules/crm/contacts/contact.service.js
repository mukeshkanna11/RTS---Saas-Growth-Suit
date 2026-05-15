// ======================================================
// CONTACT SERVICE — ENTERPRISE SAAS READY
// ======================================================

const mongoose = require("mongoose");
const Contact = require("./contact.model");

// ======================================================
// 🧠 CRM LEAD SCORING ENGINE
// ======================================================
const calculateScore = (data = {}) => {
  let score = 0;

  // ====================================================
  // BASIC INFO SCORE
  // ====================================================
  if (data.name) score += 10;
  if (data.email) score += 20;
  if (data.phone) score += 20;
  if (data.company) score += 10;
  if (data.website) score += 10;

  // ====================================================
  // SOURCE BASED SCORING
  // ====================================================
  switch (data.source) {
    case "website":
      score += 25;
      break;

    case "facebook":
    case "instagram":
      score += 15;
      break;

    case "linkedin":
      score += 20;
      break;

    case "referral":
      score += 30;
      break;

    case "campaign":
      score += 18;
      break;

    default:
      score += 5;
  }

  // ====================================================
  // PRIORITY ENGINE
  // ====================================================
  let priority = "low";
  let nextAction = "follow_up";

  if (score >= 70) {
    priority = "urgent";
    nextAction = "call_immediately";
  } else if (score >= 50) {
    priority = "high";
    nextAction = "schedule_demo";
  } else if (score >= 30) {
    priority = "medium";
    nextAction = "send_whatsapp";
  }

  return {
    score,
    priority,
    nextAction,
  };
};

// ======================================================
// ➕ CREATE CONTACT
// ======================================================
exports.create = async (data, user) => {
  // ====================================================
  // USER VALIDATION
  // ====================================================
  if (!user) {
    throw new Error("Unauthorized access");
  }

  const userId = user._id || user.id;

  if (!userId) {
    throw new Error("User id missing");
  }

  if (!user.tenantId) {
    throw new Error("Tenant id missing");
  }

  // ====================================================
  // DUPLICATE CHECK
  // ====================================================
  const existingContact = await Contact.findOne({
    tenantId: user.tenantId,
    isDeleted: false,
    $or: [
      ...(data.email ? [{ email: data.email }] : []),
      ...(data.phone ? [{ phone: data.phone }] : []),
    ],
  });

  if (existingContact) {
    throw new Error("Contact already exists");
  }

  // ====================================================
  // CRM AI SCORING
  // ====================================================
  const crm = calculateScore(data);

  // ====================================================
  // CREATE CONTACT
  // ====================================================
  const contact = await Contact.create({
    // BASIC INFO
    name: data.name,
    email: data.email || "",
    phone: data.phone || "",
    alternatePhone: data.alternatePhone || "",
    company: data.company || "",
    designation: data.designation || "",
    website: data.website || "",

    // ADDRESS
    address: data.address || "",
    city: data.city || "",
    state: data.state || "",
    country: data.country || "",
    postalCode: data.postalCode || "",

    // MULTI TENANT
    tenantId: user.tenantId,

    // OWNERSHIP
    owner: userId,
    createdBy: userId,
    updatedBy: userId,
    assignedTo: data.assignedTo || userId,

    // CRM PIPELINE
    status: data.status || "new",
    source: data.source || "manual",

    // CRM INTELLIGENCE
    score: crm.score,
    priority: crm.priority,
    nextAction: crm.nextAction,
    probability: data.probability || 0,
    estimatedValue: data.estimatedValue || 0,

    // FOLLOWUPS
    nextActionDate:
      data.nextActionDate ||
      new Date(Date.now() + 24 * 60 * 60 * 1000),

    // TAGS & NOTES
    tags: data.tags || [],
    notes: data.notes || "",

    // CUSTOM FIELDS
    customFields: data.customFields || {},

    // SOFT DELETE
    isDeleted: false,
  });

  return contact;
};

// ======================================================
// 📥 GET ALL CONTACTS
// ======================================================
exports.getAll = async (user, query = {}) => {
  // ====================================================
  // FILTERS
  // ====================================================
  const filter = {
    tenantId: user.tenantId,
    isDeleted: false,
  };

  // STATUS
  if (query.status) {
    filter.status = query.status;
  }

  // SOURCE
  if (query.source) {
    filter.source = query.source;
  }

  // PRIORITY
  if (query.priority) {
    filter.priority = query.priority;
  }

  // ASSIGNED USER
  if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }

  // SEARCH
  if (query.search) {
    filter.$or = [
      { name: new RegExp(query.search, "i") },
      { email: new RegExp(query.search, "i") },
      { phone: new RegExp(query.search, "i") },
      { company: new RegExp(query.search, "i") },
    ];
  }

  // ====================================================
  // PAGINATION
  // ====================================================
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(Number(query.limit) || 20, 100);

  const skip = (page - 1) * limit;

  // ====================================================
  // SORTING
  // ====================================================
  const sort = {
    score: -1,
    createdAt: -1,
  };

  // ====================================================
  // FETCH DATA
  // ====================================================
  const [contacts, total] = await Promise.all([
    Contact.find(filter)
      .populate("owner", "name email role")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    Contact.countDocuments(filter),
  ]);

  // ====================================================
  // SMART INSIGHTS
  // ====================================================
  const hotLeads = contacts.filter(
    (c) => c.priority === "high" || c.priority === "urgent"
  );

  const followUps = contacts.filter(
    (c) => c.nextAction === "call_immediately"
  );

  // ====================================================
  // RESPONSE
  // ====================================================
  return {
    data: contacts,

    suggestions: {
      hotLeads,
      followUps,
    },

    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

// ======================================================
// ✏️ UPDATE CONTACT
// ======================================================
exports.update = async (id, data, user) => {
  // ====================================================
  // VALIDATION
  // ====================================================
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid contact id");
  }

  // ====================================================
  // RECALCULATE CRM SCORE
  // ====================================================
  const crm = calculateScore(data);

  // ====================================================
  // UPDATE CONTACT
  // ====================================================
  const updatedContact = await Contact.findOneAndUpdate(
    {
      _id: id,
      tenantId: user.tenantId,
      isDeleted: false,
    },
    {
      $set: {
        ...data,

        score: crm.score,
        priority: crm.priority,
        nextAction: crm.nextAction,

        updatedBy: user._id || user.id,
        updatedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("owner", "name email role")
    .populate("assignedTo", "name email role");

  return updatedContact;
};

// ======================================================
// 🗑️ SOFT DELETE CONTACT
// ======================================================
exports.delete = async (id, user) => {
  // ====================================================
  // VALIDATION
  // ====================================================
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid contact id");
  }

  // ====================================================
  // SOFT DELETE
  // ====================================================
  const deletedContact = await Contact.findOneAndUpdate(
    {
      _id: id,
      tenantId: user.tenantId,
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user._id || user.id,
      },
    },
    {
      new: true,
    }
  );

  return deletedContact;
};