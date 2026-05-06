const Lead = require("./lead.model");
const LeadActivity = require("./leadActivity.model");

/* ================================
   🧠 SAFE USER PARSER
================================ */
const safeUser = (user) => {
  if (!user) {
    return { id: null, role: "employee", tenantId: null };
  }

  return {
    id: user.id || null,
    role: user.role || "employee",
    tenantId: user.tenantId || null,
  };
};

/* ================================
   🔐 TENANT VALIDATION
================================ */
const requireTenant = (tenantId) => {
  if (!tenantId) {
    throw new Error("Tenant missing - invalid auth context");
  }
};

/* ================================
   👤 USER VALIDATION
================================ */
const requireUser = (user) => {
  if (!user?.id) {
    throw new Error("User missing - auth middleware not working");
  }
};

/* ================================
   🧠 SAFETY: NOTES NORMALIZER
   (FIX YOUR MONGOOSE ERROR)
================================ */
const normalizeNotes = (data, userId) => {
  if (!data.notes) return;

  // string → object array
  if (typeof data.notes === "string") {
    data.notes = [
      {
        text: data.notes,
        createdAt: new Date(),
        createdBy: userId,
      },
    ];
  }
};

/* ================================
   🔐 BUILD FILTER (SAAS SAFE)
================================ */
const buildFilter = (tenantId, user) => {
  const safe = safeUser(user);

  const base = {
    tenantId,
    isDeleted: false,
  };

  if (safe.role === "admin") return base;

  if (safe.role === "manager") {
    return { ...base, managerId: safe.id };
  }

  return { ...base, assignedTo: safe.id };
};

/* ================================
   🟢 CREATE LEAD
================================ */
exports.createLead = async (data, tenantId, user) => {
  const safe = safeUser(user);

  requireTenant(tenantId);
  requireUser(safe);

  // 🔥 FIX MONGOOSE NOTES ISSUE
  normalizeNotes(data, safe.id);

  const lead = await Lead.create({
    ...data,
    tenantId,
    createdBy: safe.id,
  });

  await LeadActivity.create({
    leadId: lead._id,
    type: "system",
    description: "Lead created",
    tenantId,
    createdBy: safe.id,
  });

  return lead;
};

/* ================================
   📥 GET LEADS
================================ */
exports.getLeads = async (query, tenantId, user) => {
  const safe = safeUser(user);

  requireTenant(tenantId);

  const {
    page = 1,
    limit = 10,
    status,
    search,
    assignedTo,
    source,
    fromDate,
    toDate,
  } = query;

  const filter = buildFilter(tenantId, safe);

  if (status && status !== "all") filter.status = status;
  if (source) filter.source = source;

  if (assignedTo && safe.role === "admin") {
    filter.assignedTo = assignedTo;
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  if (search) {
    const safeSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      { name: new RegExp(safeSearch, "i") },
      { email: new RegExp(safeSearch, "i") },
      { phone: new RegExp(safeSearch, "i") },
    ];
  }

  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),

    Lead.countDocuments(filter),
  ]);

  return {
    leads,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit),
    },
  };
};

/* ================================
   🔍 GET LEAD BY ID
================================ */
exports.getLeadById = async (id, tenantId, user) => {
  const safe = safeUser(user);

  requireTenant(tenantId);

  const filter = buildFilter(tenantId, safe);

  const lead = await Lead.findOne({
    _id: id,
    ...filter,
  })
    .populate("assignedTo", "name email role")
    .lean();

  if (!lead) return null;

  const activities = await LeadActivity.find({
    leadId: id,
    tenantId,
  }).sort({ createdAt: -1 });

  return { ...lead, activities };
};

/* ================================
   ✏️ UPDATE LEAD
================================ */
exports.updateLead = async (id, data, tenantId, user) => {
  if (!tenantId) throw new Error("Tenant missing");

  const lead = await Lead.findOne({
    _id: id,
    tenantId,
    isDeleted: false,
  });

  if (!lead) {
    throw new Error("Lead not found (check tenant or permissions)");
  }

  Object.assign(lead, data);

  await lead.save();

  await LeadActivity.create({
    leadId: id,
    type: "update",
    description: "Lead updated",
    tenantId,
    createdBy: user.id,
  });

  return lead;
};

/* ================================
   👤 ASSIGN LEAD
================================ */
exports.assignLead = async (id, userId, tenantId, user) => {
  const safe = safeUser(user);

  requireTenant(tenantId);

  const filter = buildFilter(tenantId, safe);

  const lead = await Lead.findOneAndUpdate(
    { _id: id, ...filter },
    {
      assignedTo: userId,
      assignedAt: new Date(),
    },
    { new: true }
  );

  if (!lead) throw new Error("Lead not found or no access");

  await LeadActivity.create({
    leadId: id,
    type: "assignment",
    description: "Lead assigned",
    tenantId,
    createdBy: safe.id,
  });

  return lead;
};

/* ================================
   🔄 STATUS UPDATE
================================ */
exports.updateStatus = async (id, status, tenantId, user) => {
  const safe = safeUser(user);

  requireTenant(tenantId);

  const filter = buildFilter(tenantId, safe);

  const lead = await Lead.findOneAndUpdate(
    { _id: id, ...filter },
    { status, lastContactedAt: new Date() },
    { new: true }
  );

  if (!lead) throw new Error("Lead not found or no access");

  await LeadActivity.create({
    leadId: id,
    type: "status",
    description: `Status → ${status}`,
    tenantId,
    createdBy: safe.id,
  });

  return lead;
};


/* ================================
   📊 PIPELINE STATS
================================ */
exports.getPipelineStats = async (tenantId) => {
  requireTenant(tenantId);

  return Lead.aggregate([
    {
      $match: {
        tenantId,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalValue: { $sum: "$dealValue" },
      },
    },
  ]);
};

/* ================================
   🔔 ADD FOLLOW UP (MISSING FIX)
================================ */
exports.addFollowUp = async (id, followUpDate, nextAction, tenantId, user) => {
  const safe = user || {};

  const lead = await Lead.findOne({
    _id: id,
    tenantId,
    isDeleted: false,
  });

  if (!lead) {
    throw new Error("Lead not found or no access");
  }

  lead.followUpDate = followUpDate;
  lead.nextAction = nextAction;

  await lead.save();

  await LeadActivity.create({
    leadId: id,
    type: "followup",
    description: `Follow-up set for ${followUpDate}`,
    tenantId,
    createdBy: safe.id,
  });

  return lead;
};

exports.addNote = async (id, text, tenantId, user) => {
  const lead = await Lead.findOne({
    _id: id,
    tenantId,
    isDeleted: false,
  });

  if (!lead) throw new Error("Lead not found or no access");

  if (!lead.notes) {
    lead.notes = [];
  }

  lead.notes.push({
    text,
    createdAt: new Date(),
    createdBy: user.id,
  });

  await lead.save();

  await LeadActivity.create({
    leadId: id,
    type: "note",
    description: "Note added",
    tenantId,
    createdBy: user.id,
  });

  return lead;
};

exports.addActivity = async (id, type, note, tenantId, user) => {
  const lead = await Lead.findOne({
    _id: id,
    tenantId,
    isDeleted: false,
  });

  if (!lead) throw new Error("Lead not found or no access");

  await LeadActivity.create({
    leadId: id,
    type,
    description: note,
    tenantId,
    createdBy: user.id,
  });

  return true;
};

exports.convertLead = async (id, tenantId, user) => {
  const lead = await Lead.findOne({
    _id: id,
    tenantId,
    isDeleted: false,
  });

  if (!lead) throw new Error("Lead not found or no access");

  lead.status = "converted";
  lead.convertedAt = new Date();

  await lead.save();

  await LeadActivity.create({
    leadId: id,
    type: "conversion",
    description: "Lead converted to customer",
    tenantId,
    createdBy: user.id,
  });

  return lead;
};

exports.getTodayFollowUps = async (tenantId) => {
  if (!tenantId) {
    throw new Error("Tenant missing");
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const leads = await Lead.find({
    tenantId,
    isDeleted: false,
    followUpDate: {
      $gte: start,
      $lte: end,
    },
  })
    .populate("assignedTo", "name email role")
    .sort({ followUpDate: 1 });

  return leads;
};

/* ================================
   ❌ DELETE LEAD
================================ */
exports.deleteLead = async (id, tenantId, user) => {
  const safe = safeUser(user);

  if (!safe.id) {
    throw new Error("User missing from auth middleware");
  }

  if (!tenantId) {
    throw new Error("Tenant missing");
  }

  const lead = await Lead.findOne({
    _id: id,
    tenantId,
  });

  if (!lead) {
    return {
      success: false,
      statusCode: 404,
      message: "Lead not found",
    };
  }

  if (lead.isDeleted) {
    return {
      success: false,
      statusCode: 200,
      message: "Lead already deleted",
    };
  }

  await Lead.updateOne(
    { _id: id },
    { $set: { isDeleted: true } }
  );

  await LeadActivity.create({
    leadId: id,
    type: "system",
    description: "Lead deleted",
    tenantId,
    createdBy: safe.id,
  });

  return {
    success: true,
    message: "Lead deleted successfully",
  };
};