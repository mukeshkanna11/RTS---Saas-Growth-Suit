const ClientNotification = require("./client-notification.model");

// CREATE
exports.createNotification = async (req, res) => {
  try {
    const notification =
      await ClientNotification.create({
        ...req.body,
        tenantId: req.user.tenantId,
      });

    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET
exports.getNotifications = async (req, res) => {
  try {
    const notifications =
      await ClientNotification.find({
        tenantId: req.user.tenantId,
      }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// READ
exports.markAsRead = async (req, res) => {
  try {
    const notification =
      await ClientNotification.findByIdAndUpdate(
        req.params.id,
        {
          isRead: true,
        },
        { new: true }
      );

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE
exports.deleteNotification = async (
  req,
  res
) => {
  try {
    await ClientNotification.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Notification deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};