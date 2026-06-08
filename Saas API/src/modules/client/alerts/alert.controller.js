const alertService = require(
  "./alert.service"
);

/* ==========================================
   CREATE ALERT
========================================== */

exports.createAlert = async (
  req,
  res
) => {
  try {
    const alert =
      await alertService.createAlert({
        ...req.body,
        tenantId:
          req.user.tenantId,
        createdBy:
          req.user.id,
      });

    return res.status(201).json({
      success: true,
      message:
        "Alert created successfully",
      data: alert,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

/* ==========================================
   GET ALERTS
========================================== */

exports.getAlerts = async (
  req,
  res
) => {
  try {
    const result =
      await alertService.getAlerts(
        req.user.tenantId,
        req.query
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

/* ==========================================
   UNREAD COUNT
========================================== */

exports.getUnreadCount =
  async (req, res) => {
    try {
      const count =
        await alertService.getUnreadCount(
          req.user.tenantId
        );

      return res.status(200).json({
        success: true,
        unreadCount:
          count,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

/* ==========================================
   MARK AS READ
========================================== */

exports.markAsRead =
  async (req, res) => {
    try {
      const alert =
        await alertService.markAsRead(
          req.user.tenantId,
          req.params.id
        );

      return res.status(200).json({
        success: true,
        data: alert,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

/* ==========================================
   MARK ALL READ
========================================== */

exports.markAllRead =
  async (req, res) => {
    try {
      await alertService.markAllRead(
        req.user.tenantId
      );

      return res.status(200).json({
        success: true,
        message:
          "All alerts marked as read",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

/* ==========================================
   GENERATE SYSTEM ALERTS
========================================== */

exports.generateAlerts =
  async (req, res) => {
    try {
      await alertService.generateSystemAlerts(
        req.user.tenantId
      );

      return res.status(200).json({
        success: true,
        message:
          "System alerts generated",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

/* ==========================================
   DELETE ALERT
========================================== */

exports.deleteAlert =
  async (req, res) => {
    try {
      await alertService.deleteAlert(
        req.user.tenantId,
        req.params.id
      );

      return res.status(200).json({
        success: true,
        message:
          "Alert deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };