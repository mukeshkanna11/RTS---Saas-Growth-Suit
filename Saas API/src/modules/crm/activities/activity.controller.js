const service = require("./activity.service");

// ===============================
// ➕ CREATE ACTIVITY
// ===============================
exports.create = async (req, res) => {
  try {
    // 🧠 Debug (remove in production if not needed)
    // console.log("BODY:", req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is empty",
      });
    }

    const data = await service.create(req.body, req.user);

    return res.status(201).json({
      success: true,
      message: "Activity created 🚀",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create activity",
    });
  }
};

// ===============================
// 📥 GET ALL ACTIVITIES
// ===============================
exports.getAll = async (req, res) => {
  try {
    const result = await service.getAll(req.user, req.query);

    return res.status(200).json({
      success: true,
      count: result.data.length,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch activities",
    });
  }
};

// ===============================
// ✏️ UPDATE ACTIVITY
// ===============================
exports.update = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: "Activity ID is required",
      });
    }

    const data = await service.update(req.params.id, req.body, req.user);

    return res.status(200).json({
      success: true,
      message: "Activity updated 🚀",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update activity",
    });
  }
};

// ===============================
// 🗑 DELETE ACTIVITY (SOFT)
// ===============================
exports.remove = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: "Activity ID is required",
      });
    }

    await service.delete(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      message: "Activity deleted 🗑️",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to delete activity",
    });
  }
};