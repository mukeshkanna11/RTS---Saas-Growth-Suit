const ClientAlert = require("./client-alert.model");

// CREATE ALERT
exports.createAlert = async (req, res) => {
  try {
    const alert = await ClientAlert.create({
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Alert created successfully",
      data: alert,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// GET ALERTS
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await ClientAlert.find({
      tenantId: req.user.tenantId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// MARK READ
exports.markAsRead = async (req, res) => {
  try {
    const alert = await ClientAlert.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE
exports.deleteAlert = async (req, res) => {
  try {
    await ClientAlert.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Alert deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};