const Contact = require("./contact.model");

// ===============================
// 🧠 CRM SCORING ENGINE
// ===============================
function calculateScore(data) {
  let score = 0;

  if (data.email) score += 20;
  if (data.phone) score += 20;

  if (data.source === "website") score += 25;
  if (data.source === "ads") score += 15;
  if (data.source === "referral") score += 10;

  let priority = "low";
  let nextAction = "follow_up";

  if (score >= 60) {
    priority = "high";
    nextAction = "call_immediately";
  } else if (score >= 35) {
    priority = "medium";
    nextAction = "send_whatsapp";
  }

  return { score, priority, nextAction };
};

// ===============================
// ➕ CREATE CONTACT
// ===============================
exports.create = async (data, user) => {
  const crm = calculateScore(data);

  return await Contact.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company || "",

    // 🏢 SAAS ISOLATION (IMPORTANT FIX)
    tenantId: user.tenantId,

    // 👤 OWNERSHIP
    owner: user._id,
    assignedTo: data.assignedTo || user._id,

    // 🤖 CRM FIELDS
    score: crm.score,
    priority: crm.priority,
    nextAction: crm.nextAction,
    nextActionDate: new Date(Date.now() + 24 * 60 * 60 * 1000),

    status: data.status || "new",
    source: data.source || "manual",
    tags: data.tags || [],

    isDeleted: false,
  });
};

// ===============================
// 📥 GET ALL CONTACTS
// ===============================
exports.getAll = async (user, query) => {
  const filter = {
    tenantId: user.tenantId,
    isDeleted: false,
  };

  if (query.status) filter.status = query.status;
  if (query.source) filter.source = query.source;
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;

  if (query.search) {
    filter.$or = [
      { name: new RegExp(query.search, "i") },
      { email: new RegExp(query.search, "i") },
      { phone: new RegExp(query.search, "i") },
    ];
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const [contacts, total] = await Promise.all([
    Contact.find(filter)
      .populate("owner", "name email role")
      .populate("assignedTo", "name email role")
      .sort({ score: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Contact.countDocuments(filter),
  ]);

  return {
    data: contacts,
    suggestions: {
      hotLeads: contacts.filter(c => c.priority === "high"),
      followUps: contacts.filter(c => c.nextAction === "call_immediately"),
    },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
};

// ===============================
// ✏️ UPDATE CONTACT
// ===============================
exports.update = async (id, data, user) => {
  const crm = calculateScore(data);

  return await Contact.findOneAndUpdate(
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
        updatedAt: new Date(),
      },
    },
    { new: true }
  );
};

// ===============================
// 🗑️ SOFT DELETE
// ===============================
exports.delete = async (id, user) => {
  return await Contact.findOneAndUpdate(
    {
      _id: id,
      tenantId: user.tenantId,
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    },
    { new: true }
  );
};