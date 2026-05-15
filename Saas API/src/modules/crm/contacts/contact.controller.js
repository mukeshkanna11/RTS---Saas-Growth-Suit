// ======================================================
// CONTACT CONTROLLER — ENTERPRISE SAAS READY
// ======================================================

const mongoose = require("mongoose");

const Contact = require("./contact.model");
const service = require("./contact.service");

// ======================================================
// 🛡 SAFE OBJECT ID VALIDATOR
// ======================================================
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ======================================================
// ➕ CREATE CONTACT
// ======================================================
exports.create = async (req, res) => {
  try {
    // ==================================================
    // USER VALIDATION
    // ==================================================
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const userId = req.user._id || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User id missing",
      });
    }

    if (!req.user.tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant id missing",
      });
    }

    // ==================================================
    // BUILD PAYLOAD
    // ==================================================
    const payload = {
      ...req.body,

      tenantId: req.user.tenantId,

      createdBy: userId,

      owner: userId,

      assignedTo: req.body.assignedTo || userId,

      updatedBy: userId,
    };

    // ==================================================
    // CREATE CONTACT
    // ==================================================
    const data = await service.create(payload, req.user);

    return res.status(201).json({
      success: true,
      message: "Contact created successfully 🚀",
      data,
    });
  } catch (err) {
    console.error("CREATE CONTACT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create contact",
    });
  }
};

// ======================================================
// 📥 GET ALL CONTACTS
// ======================================================
exports.getAll = async (req, res) => {
  try {
    const result = await service.getAll(req.user, req.query);

    return res.status(200).json({
      success: true,
      message: "Contacts fetched successfully",
      count: result?.data?.length || 0,

      data: result?.data || [],

      suggestions: result?.suggestions || {
        hotLeads: [],
        followUps: [],
      },

      pagination: result?.pagination || {
        total: 0,
        page: 1,
        pages: 1,
      },
    });
  } catch (err) {
    console.error("GET CONTACTS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch contacts",
    });
  }
};

// ======================================================
// 👤 GET MY CONTACTS
// ======================================================
exports.getMyContacts = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const contacts = await Contact.find({
      createdBy: userId,
      tenantId: req.user.tenantId,
      isDeleted: false,
    })
      .populate("owner", "name email role")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "My contacts fetched successfully",
      count: contacts.length,
      data: contacts,
    });
  } catch (err) {
    console.error("GET MY CONTACTS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch my contacts",
    });
  }
};

// ======================================================
// 👥 GET TEAM CONTACTS
// ======================================================
exports.getTeamContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({
      tenantId: req.user.tenantId,
      isDeleted: false,
    })
      .populate("owner", "name email role")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Team contacts fetched successfully",
      count: contacts.length,
      data: contacts,
    });
  } catch (err) {
    console.error("GET TEAM CONTACTS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch team contacts",
    });
  }
};

// ======================================================
// ✏️ UPDATE CONTACT
// ======================================================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    // ==================================================
    // VALIDATION
    // ==================================================
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact id",
      });
    }

    // ==================================================
    // UPDATE
    // ==================================================
    const data = await service.update(id, req.body, req.user);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact updated successfully 🚀",
      data,
    });
  } catch (err) {
    console.error("UPDATE CONTACT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update contact",
    });
  }
};

// ======================================================
// 🗑 DELETE CONTACT
// ======================================================
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // ==================================================
    // VALIDATION
    // ==================================================
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact id",
      });
    }

    // ==================================================
    // DELETE
    // ==================================================
    const data = await service.delete(id, req.user);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact deleted successfully 🗑️",
      data,
    });
  } catch (err) {
    console.error("DELETE CONTACT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to delete contact",
    });
  }
};