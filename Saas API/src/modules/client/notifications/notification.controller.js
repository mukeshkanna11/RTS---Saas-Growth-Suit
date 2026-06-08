const notificationService =
  require(
    "./notification.service"
  );

exports.createNotification =
  async (req, res) => {
    try {
      const notification =
        await notificationService.createNotification(
          {
            ...req.body,
            tenantId:
              req.user
                .tenantId,
            createdBy:
              req.user.id,
          }
        );

      return res.status(201).json({
        success: true,
        message:
          "Notification created successfully",
        data: notification,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

exports.getNotifications =
  async (req, res) => {
    try {
      const result =
        await notificationService.getNotifications(
          req.user
            .tenantId,
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

exports.getUnreadCount =
  async (req, res) => {
    try {
      const count =
        await notificationService.getUnreadCount(
          req.user
            .tenantId
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

exports.markAsRead =
  async (req, res) => {
    try {
      const notification =
        await notificationService.markAsRead(
          req.user
            .tenantId,
          req.params.id
        );

      return res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

exports.markAllRead =
  async (req, res) => {
    try {
      await notificationService.markAllRead(
        req.user
          .tenantId
      );

      return res.status(200).json({
        success: true,
        message:
          "All notifications marked as read",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

exports.deleteNotification =
  async (req, res) => {
    try {
      await notificationService.deleteNotification(
        req.user
          .tenantId,
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
        message:
          error.message,
      });
    }
  };