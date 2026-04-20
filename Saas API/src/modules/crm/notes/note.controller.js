const service = require("./note.service");

// ➕ CREATE
exports.create = async (req, res) => {
  try {
    const data = await service.create(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Note created successfully 🚀",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 📥 GET ALL
exports.getAll = async (req, res) => {
  try {
    const result = await service.getAll(req.user, req.query);

    res.json({
      success: true,
      message: "Notes fetched successfully",
      count: result.data.length,
      pagination: result.pagination,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 🗑 DELETE
exports.remove = async (req, res) => {
  try {
    await service.delete(req.params.id, req.user);

    res.json({
      success: true,
      message: "Note deleted successfully 🗑️",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};