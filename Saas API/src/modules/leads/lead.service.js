const Lead = require("./lead.model");
const LeadActivity = require("./leadActivity.model");
const fs = require("fs");
const csv = require("csv-parser");

// -------------------------------
// CREATE
// -------------------------------
exports.createLead = async (data, tenantId) => {
  const lead = await Lead.create({ ...data, tenantId });

  await LeadActivity.create({
    leadId: lead._id,
    type: "system",
    description: "Lead created",
    tenantId,
  });

  return lead;
};

// -------------------------------
// GET ALL (OPTIMIZED)
// -------------------------------
exports.getLeads = async (query, tenantId) => {
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

  const filter = { tenantId, isDeleted: false };

  if (status && status !== "all") filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (source) filter.source = source;

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { phone: new RegExp(search, "i") },
    ];
  }

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(), // 🔥 performance

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

// -------------------------------
// GET ONE (WITH ACTIVITIES)
// -------------------------------
exports.getLeadById = async (id, tenantId) => {
  const lead = await Lead.findOne({
    _id: id,
    tenantId,
    isDeleted: false,
  })
    .populate("assignedTo", "name email")
    .lean();

  if (!lead) return null;

  const activities = await LeadActivity.find({
    leadId: id,
    tenantId,
  })
    .sort({ createdAt: -1 })
    .lean();

  return { ...lead, activities };
};

// -------------------------------
// UPDATE LEAD
// -------------------------------
exports.updateLead = async (leadId, data, tenantId, actorId) => {
  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, tenantId },
    { $set: data },
    { new: true }
  );

  if (!lead) throw new Error("Lead not found");

  await LeadActivity.create({
    leadId,
    type: "update",
    description: "Lead details updated",
    createdBy: actorId,
    tenantId,
  });

  return lead;
};

// -------------------------------
// ASSIGN
// -------------------------------
exports.assignLead = async (leadId, userId, tenantId, actorId) => {
  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, tenantId },
    {
      assignedTo: userId,
      assignedAt: new Date(),
    },
    { new: true }
  );

  if (!lead) throw new Error("Lead not found");

  await LeadActivity.create({
    leadId,
    type: "assignment",
    description: "Lead assigned",
    createdBy: actorId,
    tenantId,
  });

  return lead;
};

// -------------------------------
// UPDATE STATUS
// -------------------------------
exports.updateStatus = async (leadId, status, tenantId, actorId) => {
  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, tenantId },
    { status, lastContactedAt: new Date() },
    { new: true }
  );

  if (!lead) throw new Error("Lead not found");

  await LeadActivity.create({
    leadId,
    type: "status",
    description: `Status changed to ${status}`,
    createdBy: actorId,
    tenantId,
  });

  return lead;
};

// -------------------------------
// FOLLOW-UP
// -------------------------------
exports.addFollowUp = async (
  leadId,
  followUpDate,
  nextAction,
  tenantId,
  actorId
) => {
  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, tenantId },
    { followUpDate, nextAction },
    { new: true }
  );

  if (!lead) throw new Error("Lead not found");

  await LeadActivity.create({
    leadId,
    type: "followup",
    description: `Follow-up scheduled on ${followUpDate}`,
    createdBy: actorId,
    tenantId,
  });

  return lead;
};

// -------------------------------
// TODAY FOLLOWUPS
// -------------------------------
exports.getTodayFollowUps = async (tenantId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return await Lead.find({
    tenantId,
    isDeleted: false,
    followUpDate: {
      $gte: today,
      $lt: tomorrow,
    },
  })
    .populate("assignedTo", "name email")
    .lean();
};

// -------------------------------
// ADD NOTE
// -------------------------------
exports.addNote = async (leadId, text, tenantId, actorId) => {
  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, tenantId },
    {
      $push: {
        notes: {
          text,
          createdBy: actorId,
        },
      },
    },
    { new: true }
  );

  if (!lead) throw new Error("Lead not found");

  await LeadActivity.create({
    leadId,
    type: "note",
    description: text,
    createdBy: actorId,
    tenantId,
  });

  return lead;
};

// -------------------------------
// ADD ACTIVITY
// -------------------------------
exports.addActivity = async (
  leadId,
  type,
  note,
  tenantId,
  actorId
) => {
  const lead = await Lead.findOne({ _id: leadId, tenantId });

  if (!lead) throw new Error("Lead not found");

  await LeadActivity.create({
    leadId,
    type,
    description: note,
    createdBy: actorId,
    tenantId,
  });

  return true;
};

// -------------------------------
// CONVERT LEAD
// -------------------------------
exports.convertLead = async (leadId, tenantId, actorId) => {
  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, tenantId },
    {
      status: "converted",
      convertedToCustomer: true,
      convertedAt: new Date(),
    },
    { new: true }
  );

  if (!lead) throw new Error("Lead not found");

  await LeadActivity.create({
    leadId,
    type: "conversion",
    description: "Lead converted to customer",
    createdBy: actorId,
    tenantId,
  });

  return lead;
};

// -------------------------------
// DELETE (SOFT)
// -------------------------------
exports.deleteLead = async (leadId, tenantId) => {
  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, tenantId },
    { isDeleted: true },
    { new: true }
  );

  if (!lead) throw new Error("Lead not found");

  return true;
};

// -------------------------------
// PIPELINE STATS
// -------------------------------
exports.getPipelineStats = async (tenantId) => {
  return await Lead.aggregate([
    { $match: { tenantId, isDeleted: false } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalValue: { $sum: "$dealValue" },
      },
    },
  ]);
};

// -------------------------------
// CSV IMPORT (🔥 FIXED + SAAS READY)
// -------------------------------
exports.importCSV = async (filePath, tenantId) => {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        if (!data.name) return;

        results.push({
          name: data.name,
          email: data.email,
          phone: data.phone,
          source: data.source || "other",
          tenantId,
        });
      })
      .on("end", async () => {
        let insertedLeads = [];

        if (results.length) {
          insertedLeads = await Lead.insertMany(results);
        }

        fs.unlinkSync(filePath);

        // 🔥 IMPORTANT: return full leads (for automation trigger)
        resolve(insertedLeads);
      })
      .on("error", reject);
  });
};