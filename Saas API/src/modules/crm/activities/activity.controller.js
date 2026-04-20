const service = require("./activity.service");

exports.create = async (req, res) => {
  try {
    const data = await service.create(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Activity created 🚀",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

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

exports.update = async (req, res) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user);

    res.json({
      success: true,
      message: "Activity updated 🚀",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.remove = async (req, res) => {
  try {
    await service.delete(req.params.id, req.user);

    res.json({
      success: true,
      message: "Activity deleted 🗑️",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};