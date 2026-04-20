const service = require("./deal.service");

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