const Lead = require("./lead.model");
const leadService = require("./lead.service");

// 🔥 MARKETING AUTOMATION
const { runLeadAutomation } = require("../marketing/automation.engine");

// ---------------- COMMON RESPONSE ----------------
const success = (res, data, message = "Success") =>
  res.json({ success: true, message, data });

const fail = (res, message = "Error", code = 500) =>
  res.status(code).json({ success: false, message });

// -------------------------------
// 🟢 CREATE LEAD
// -------------------------------
exports.createLead = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    if (!req.body.name) {
      return fail(res, "Name is required", 400);
    }

    const lead = await leadService.createLead(req.body, tenantId);

    // 🔥 Trigger automation (NON-BLOCKING)
    setImmediate(() => {
      runLeadAutomation(
        { ...lead.toObject(), trigger: "lead_created" },
        req.user
      ).catch((err) =>
        console.error("Automation Error:", err.message)
      );
    });

    success(res, lead, "Lead created");
  } catch (err) {
    next(err);
  }
};

// -------------------------------
// 📥 GET ALL LEADS (WITH PAGINATION)
// -------------------------------
exports.getLeads = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const result = await leadService.getLeads(req.query, tenantId);

    success(res, result);
  } catch (err) {
    fail(res, err.message);
  }
};

// -------------------------------
// 🔍 GET SINGLE LEAD
// -------------------------------
exports.getLeadById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const lead = await leadService.getLeadById(req.params.id, tenantId);

    if (!lead) return fail(res, "Lead not found", 404);

    success(res, lead);
  } catch (err) {
    fail(res, err.message);
  }
};

// -------------------------------
// 👤 ASSIGN LEAD
// -------------------------------
exports.assignLead = async (req, res) => {
  try {
    const { userId } = req.body;
    const tenantId = req.user.tenantId;

    if (!userId) return fail(res, "UserId required", 400);

    const lead = await leadService.assignLead(
      req.params.id,
      userId,
      tenantId,
      req.user.id
    );

    success(res, lead, "Lead assigned");
  } catch (err) {
    fail(res, err.message);
  }
};

// -------------------------------
// ✏️ UPDATE LEAD
// -------------------------------
exports.updateLead = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const lead = await leadService.updateLead(
      req.params.id,
      req.body,
      tenantId,
      req.user.id
    );

    if (!lead) return fail(res, "Lead not found", 404);

    success(res, lead, "Lead updated");
  } catch (err) {
    fail(res, err.message);
  }
};

// -------------------------------
// 🔄 UPDATE STATUS + AUTOMATION
// -------------------------------
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const tenantId = req.user.tenantId;

    if (!status) return fail(res, "Status required", 400);

    const lead = await leadService.updateStatus(
      req.params.id,
      status,
      tenantId,
      req.user.id
    );

    // 🔥 Trigger automation (status-based)
    setImmediate(() => {
      runLeadAutomation(
        { ...lead.toObject(), trigger: "status_changed", status },
        req.user
      ).catch((err) =>
        console.error("Automation Error:", err.message)
      );
    });

    success(res, lead, "Status updated");
  } catch (err) {
    fail(res, err.message);
  }
};

// -------------------------------
// 🔔 ADD FOLLOW-UP
// -------------------------------
exports.addFollowUp = async (req, res) => {
  try {
    const { followUpDate, nextAction } = req.body;
    const tenantId = req.user.tenantId;

    const lead = await leadService.addFollowUp(
      req.params.id,
      followUpDate,
      nextAction,
      tenantId,
      req.user.id
    );

    success(res, lead, "Follow-up scheduled");
  } catch (err) {
    fail(res, err.message);
  }
};

// -------------------------------
// 📝 ADD NOTE
// -------------------------------
exports.addNote = async (req, res) => {
  try {
    const { text } = req.body;
    const tenantId = req.user.tenantId;

    if (!text) return fail(res, "Note text required", 400);

    const lead = await leadService.addNote(
      req.params.id,
      text,
      tenantId,
      req.user.id
    );

    success(res, lead, "Note added");
  } catch (err) {
    fail(res, err.message);
  }
};

// -------------------------------
// 📜 ADD ACTIVITY (CALL / EMAIL / MEETING)
// -------------------------------
exports.addActivity = async (req, res) => {
  try {
    const { type, note } = req.body;
    const tenantId = req.user.tenantId;

    const lead = await leadService.addActivity(
      req.params.id,
      type,
      note,
      tenantId,
      req.user.id
    );

    success(res, lead, "Activity logged");
  } catch (err) {
    fail(res, err.message);
  }
};

// -------------------------------
// 🔥 CONVERT LEAD → CUSTOMER
// -------------------------------
exports.convertLead = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const lead = await leadService.convertLead(
      req.params.id,
      tenantId,
      req.user.id
    );

    // 🔥 Trigger conversion automation
    setImmediate(() => {
      runLeadAutomation(
        { ...lead.toObject(), trigger: "lead_converted" },
        req.user
      ).catch(() => {});
    });

    success(res, lead, "Lead converted 🎉");
  } catch (err) {
    fail(res, err.message);
  }
};

// -------------------------------
// ❌ DELETE LEAD (SOFT)
// -------------------------------
exports.deleteLead = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    await leadService.deleteLead(req.params.id, tenantId);

    success(res, null, "Lead deleted");
  } catch (err) {
    fail(res, err.message);
  }
};

// -------------------------------
// 📊 PIPELINE STATS
// -------------------------------
exports.getPipelineStats = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const stats = await leadService.getPipelineStats(tenantId);

    success(res, stats);
  } catch (err) {
    fail(res, err.message);
  }
};

// -------------------------------
// 📅 TODAY FOLLOW-UPS
// -------------------------------
exports.getTodayFollowUps = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const leads = await leadService.getTodayFollowUps(tenantId);

    success(res, leads);
  } catch (err) {
    fail(res, err.message);
  }
};

// -------------------------------
// 📂 CSV IMPORT + AUTOMATION
// -------------------------------
exports.importCSV = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    if (!req.file) return fail(res, "CSV file required", 400);

    const leads = await leadService.importCSV(req.file.path, tenantId);

    // 🔥 Bulk automation (non-blocking)
    setImmediate(() => {
      leads.forEach((lead) => {
        runLeadAutomation(
          { ...lead.toObject(), trigger: "lead_imported" },
          req.user
        ).catch(() => {});
      });
    });

    success(res, { count: leads.length }, "CSV imported");
  } catch (err) {
    fail(res, err.message);
  }
};