const service = require("./contact.service");

// ===============================
exports.create = async (req, res) => {
  try {
    const data = await service.create(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Contact created 🚀",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
exports.getAll = async (req, res) => {
  try {
    const result = await service.getAll(req.user, req.query);

    res.json({
      success: true,
      count: result.data.length,
      data: result.data,
      suggestions: result.suggestions,
      pagination: result.pagination,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
exports.update = async (req, res) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    res.json({
      success: true,
      message: "Contact updated 🚀",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
exports.remove = async (req, res) => {
  try {
    const data = await service.delete(req.params.id, req.user);

    res.json({
      success: true,
      message: "Contact deleted 🗑️",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};