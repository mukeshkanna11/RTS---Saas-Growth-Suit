const Lead = require("./lead.model");
const leadService = require("./lead.service");

// 🔥 MARKETING AUTOMATION
const { runLeadAutomation } = require("../marketing/automation.engine");

// ---------------- RESPONSE HELPERS ----------------
const success = (res, data, message = "Success") =>
  res.json({ success: true, message, data });

const fail = (res, message = "Error", code = 500) =>
  res.status(code).json({ success: false, message });

// =====================================================
// 🔐 SAFE USER EXTRACTOR (IMPORTANT FIX 🔥)
// =====================================================
const getUser = (req) => {
  if (!req.user) return null;

  return {
    id: req.user.id,
    role: req.user.role,
    tenantId: req.user.tenantId,
    name: req.user.name,
    email: req.user.email,
  };
};

// =====================================================
// 🔐 RBAC FILTER
// =====================================================
const buildAccessFilter = (user) => {
  if (!user) return null;

  const base = {
    tenantId: user.tenantId,
    isDeleted: false,
  };

  if (user.role === "admin") return base;

  if (user.role === "manager") {
    return {
      ...base,
      managerId: user.id,
    };
  }

  return {
    ...base,
    assignedTo: user.id,
  };
};

// =====================================================
// 🟢 CREATE LEAD
// =====================================================
exports.createLead = async (req, res, next) => {
  try {
    // -------------------------------
    // 🔐 SAFE USER EXTRACTION (DIRECT FROM MIDDLEWARE)
    // -------------------------------
    const user = req.user;

    if (!user || !user.id) {
      return fail(res, "Unauthorized - user missing from auth middleware", 401);
    }

    if (!user.tenantId) {
      return fail(res, "Unauthorized - tenant missing", 401);
    }

    // -------------------------------
    // 🚫 ROLE CHECK
    // -------------------------------
    if (user.role === "employee") {
      return fail(res, "Not allowed", 403);
    }

    // -------------------------------
    // 🟢 BUILD LEAD PAYLOAD (SAFELY)
    // -------------------------------
    const leadPayload = {
      ...req.body,

      tenantId: user.tenantId,

      createdBy: user.id,

      managerId:
        user.role === "manager"
          ? user.id
          : req.body.managerId || null,

      assignedTo: req.body.assignedTo || null,
    };

    // -------------------------------
    // 🟢 CREATE LEAD
    // -------------------------------
    const lead = await leadService.createLead(
      leadPayload,
      user.tenantId,
      user
    );

    // -------------------------------
    // 🔥 AUTOMATION (NON-BLOCKING)
    // -------------------------------
    setImmediate(() => {
      runLeadAutomation(
        {
          ...lead.toObject(),
          trigger: "lead_created",
        },
        user
      ).catch(() => {});
    });

    // -------------------------------
    // ✅ RESPONSE
    // -------------------------------
    return success(res, lead, "Lead created");
  } catch (err) {
    next(err);
  }
};

// =====================================================
// 📥 GET ALL LEADS
// =====================================================
exports.getLeads = async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return fail(res, "Unauthorized", 401);

    const filter = buildAccessFilter(user);

    const result = await leadService.getLeads(
      { ...req.query, accessFilter: filter },
      user.tenantId
    );

    success(res, result);
  } catch (err) {
    fail(res, err.message);
  }
};

// =====================================================
// 🔍 GET ONE LEAD
// =====================================================
exports.getLeadById = async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return fail(res, "Unauthorized", 401);

    const filter = buildAccessFilter(user);

    const lead = await Lead.findOne({
      _id: req.params.id,
      ...filter,
    });

    if (!lead) return fail(res, "Not found / No access", 404);

    success(res, lead);
  } catch (err) {
    fail(res, err.message);
  }
};

// =====================================================
// 👤 ASSIGN LEAD
// =====================================================
exports.assignLead = async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return fail(res, "Unauthorized", 401);

    if (user.role === "employee") {
      return fail(res, "Not allowed", 403);
    }

    const lead = await leadService.assignLead(
      req.params.id,
      req.body.userId,
      user.tenantId,
      user.id
    );

    success(res, lead, "Assigned");
  } catch (err) {
    fail(res, err.message);
  }
};

// =====================================================
// ✏️ UPDATE LEAD
// =====================================================
exports.updateLead = async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return fail(res, "Unauthorized", 401);

    const filter = buildAccessFilter(user);

    const lead = await Lead.findOne({
      _id: req.params.id,
      ...filter,
    });

    if (!lead) return fail(res, "No access", 403);

    const updated = await leadService.updateLead(
      req.params.id,
      req.body,
      user.tenantId,
      user.id
    );

    success(res, updated, "Updated");
  } catch (err) {
    fail(res, err.message);
  }
};

// =====================================================
// 🔄 UPDATE STATUS
// =====================================================
exports.updateStatus = async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return fail(res, "Unauthorized", 401);

    const { status } = req.body;
    if (!status) return fail(res, "Status required", 400);

    const filter = buildAccessFilter(user);

    const lead = await Lead.findOne({
      _id: req.params.id,
      ...filter,
    });

    if (!lead) return fail(res, "No access", 403);

    const updated = await leadService.updateStatus(
      req.params.id,
      status,
      user.tenantId,
      user.id
    );

    setImmediate(() => {
      runLeadAutomation(
        { ...updated.toObject(), trigger: "status_changed", status },
        user
      ).catch(() => {});
    });

    success(res, updated, "Status updated");
  } catch (err) {
    fail(res, err.message);
  }
};

// =====================================================
// 🔔 FOLLOW-UP
// =====================================================
exports.addFollowUp = async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return fail(res, "Unauthorized", 401);

    const filter = buildAccessFilter(user);

    const lead = await Lead.findOne({
      _id: req.params.id,
      ...filter,
    });

    if (!lead) return fail(res, "No access", 403);

    const updated = await leadService.addFollowUp(
      req.params.id,
      req.body.followUpDate,
      req.body.nextAction,
      user.tenantId,
      user.id
    );

    success(res, updated, "Follow-up added");
  } catch (err) {
    fail(res, err.message);
  }
};

// =====================================================
// 📝 NOTE
// =====================================================
exports.addNote = async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return fail(res, "Unauthorized", 401);

    const filter = buildAccessFilter(user);

    const lead = await Lead.findOne({
      _id: req.params.id,
      ...filter,
    });

    if (!lead) return fail(res, "No access", 403);

    const updated = await leadService.addNote(
      req.params.id,
      req.body.text,
      user.tenantId,
      user.id
    );

    success(res, updated, "Note added");
  } catch (err) {
    fail(res, err.message);
  }
};

// =====================================================
// 📜 ACTIVITY
// =====================================================
exports.addActivity = async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return fail(res, "Unauthorized", 401);

    const filter = buildAccessFilter(user);

    const lead = await Lead.findOne({
      _id: req.params.id,
      ...filter,
    });

    if (!lead) return fail(res, "No access", 403);

    await leadService.addActivity(
      req.params.id,
      req.body.type,
      req.body.note,
      user.tenantId,
      user.id
    );

    success(res, null, "Activity added");
  } catch (err) {
    fail(res, err.message);
  }
};

// =====================================================
// 🔥 CONVERT LEAD
// =====================================================
exports.convertLead = async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return fail(res, "Unauthorized", 401);

    const lead = await leadService.convertLead(
      req.params.id,
      user.tenantId,
      user.id
    );

    success(res, lead, "Converted 🎉");
  } catch (err) {
    fail(res, err.message);
  }
};

// =====================================================
// 📊 PIPELINE
// =====================================================
exports.getPipelineStats = async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return fail(res, "Unauthorized", 401);

    const stats = await leadService.getPipelineStats(user.tenantId);

    success(res, stats);
  } catch (err) {
    fail(res, err.message);
  }
};

// =====================================================
// 📅 TODAY FOLLOWUPS
// =====================================================
exports.getTodayFollowUps = async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return fail(res, "Unauthorized", 401);

    const leads = await leadService.getTodayFollowUps(user.tenantId);

    success(res, leads);
  } catch (err) {
    fail(res, err.message);
  }
};

// =====================================================
// 📂 IMPORT CSV
// =====================================================
exports.importCSV = async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return fail(res, "Unauthorized", 401);

    if (!req.file) return fail(res, "CSV required", 400);

    const leads = await leadService.importCSV(
      req.file.path,
      user.tenantId
    );

    success(res, { count: leads.length }, "Imported");
  } catch (err) {
    fail(res, err.message);
  }
};

// =====================================================
// ❌ DELETE
// =====================================================
exports.deleteLead = async (req, res, next) => {
  try {
    const result = await leadService.deleteLead(
      req.params.id,
      req.user.tenantId,
      req.user
    );

    return res.status(result.statusCode || 200).json({
      success: result.success ?? true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};