// src/modules/crm/deals/deal.controller.js

const Deal = require("./deal.model");
const service = require("./deal.service");

// ======================================================
// 🟢 CREATE DEAL
// ======================================================
exports.create = async (req, res) => {
  try {
    const data = await service.create(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Deal created 🚀",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// 📥 GET ALL DEALS
// ======================================================
exports.getAll = async (req, res) => {
  try {
    const result = await service.getAll(req.user, req.query);

    res.json({
      success: true,
      count: result.data.length,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// 📄 GET SINGLE DEAL
// ======================================================
exports.getOne = async (req, res) => {
  try {
    const deal = await Deal.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
      isDeleted: false,
    })
      .populate("assignedTo", "name email role")
      .populate("owner", "name email role")
      .populate("leadId");

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    res.json({
      success: true,
      data: deal,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// ✏️ UPDATE FULL DEAL
// ======================================================
exports.updateDeal = async (req, res) => {
  try {
    const deal = await Deal.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
      isDeleted: false,
    });

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    // ✅ Update fields dynamically
    Object.keys(req.body).forEach((key) => {
      deal[key] = req.body[key];
    });

    await deal.save();

    res.json({
      success: true,
      message: "Deal updated 🚀",
      data: deal,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// 🔄 UPDATE DEAL STAGE
// ======================================================
exports.updateStage = async (req, res) => {
  try {
    const data = await service.updateStage(
      req.params.id,
      req.body.stage,
      req.user
    );

    res.json({
      success: true,
      message: "Stage updated 🚀",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// 👤 ASSIGN DEAL
// ======================================================
exports.assignDeal = async (req, res) => {
  try {
    const deal = await Deal.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
      isDeleted: false,
    });

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    // ✅ Assign employee
    deal.assignedTo = req.body.userId;

    // ✅ Save manager/admin who assigned
    if (
      req.user.role === "manager" ||
      req.user.role === "admin"
    ) {
      deal.managerId = req.user.id;
    }

    await deal.save();

    res.json({
      success: true,
      message: "Deal assigned successfully 🚀",
      data: deal,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// ❌ DELETE DEAL (SOFT DELETE)
// ======================================================
exports.deleteDeal = async (req, res) => {
  try {
    const deal = await Deal.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
      isDeleted: false,
    });

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    deal.isDeleted = true;
    deal.deletedAt = new Date();

    await deal.save();

    res.json({
      success: true,
      message: "Deal deleted successfully 🗑️",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// 👤 MY DEALS (EMPLOYEE)
// ======================================================
exports.getMyDeals = async (req, res) => {
  try {
    const deals = await Deal.find({
      assignedTo: req.user.id,
      tenantId: req.user.tenantId,
      isDeleted: false,
    })
      .populate("assignedTo", "name email")
      .populate("leadId");

    res.json({
      success: true,
      count: deals.length,
      data: deals,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// 👥 TEAM DEALS (MANAGER)
// ======================================================
exports.getTeamDeals = async (req, res) => {
  try {
    const deals = await Deal.find({
      managerId: req.user.id,
      tenantId: req.user.tenantId,
      isDeleted: false,
    })
      .populate("assignedTo", "name email")
      .populate("leadId");

    res.json({
      success: true,
      count: deals.length,
      data: deals,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};