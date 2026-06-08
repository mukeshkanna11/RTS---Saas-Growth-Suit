const ClientNotification = require(
  "./client-notification.model"
);

/* ==========================================
   CREATE
========================================== */

exports.createNotification =
  async ({
    tenantId,
    title,
    message,
    type = "system",
    priority = "medium",
    actionUrl = null,
    metadata = {},
    createdBy = null,
  }) => {
    return await ClientNotification.create({
      tenantId,
      title,
      message,
      type,
      priority,
      actionUrl,
      metadata,
      createdBy,
    });
  };

/* ==========================================
   GET ALL
========================================== */

exports.getNotifications =
  async (
    tenantId,
    {
      page = 1,
      limit = 20,
      type,
      isRead,
    } = {}
  ) => {
    const filter = {
      tenantId,
      isArchived: false,
    };

    if (type)
      filter.type = type;

    if (
      typeof isRead !==
      "undefined"
    ) {
      filter.isRead =
        isRead === "true";
    }

    const notifications =
      await ClientNotification.find(
        filter
      )
        .sort({
          createdAt: -1,
        })
        .skip(
          (page - 1) * limit
        )
        .limit(Number(limit))
        .lean();

    const total =
      await ClientNotification.countDocuments(
        filter
      );

    return {
      notifications,
      pagination: {
        page:
          Number(page),
        limit:
          Number(limit),
        total,
        pages:
          Math.ceil(
            total / limit
          ),
      },
    };
  };

/* ==========================================
   UNREAD COUNT
========================================== */

exports.getUnreadCount =
  async (tenantId) => {
    return await ClientNotification.countDocuments(
      {
        tenantId,
        isRead: false,
      }
    );
  };

/* ==========================================
   MARK READ
========================================== */

exports.markAsRead =
  async (
    tenantId,
    notificationId
  ) => {
    return await ClientNotification.findOneAndUpdate(
      {
        _id:
          notificationId,
        tenantId,
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    );
  };

/* ==========================================
   MARK ALL READ
========================================== */

exports.markAllRead =
  async (tenantId) => {
    return await ClientNotification.updateMany(
      {
        tenantId,
        isRead: false,
      },
      {
        isRead: true,
      }
    );
  };

/* ==========================================
   DELETE
========================================== */

exports.deleteNotification =
  async (
    tenantId,
    notificationId
  ) => {
    return await ClientNotification.findOneAndDelete(
      {
        _id:
          notificationId,
        tenantId,
      }
    );
  };

/* ==========================================
   DASHBOARD NOTIFICATIONS
========================================== */

exports.getDashboardNotifications =
  async (tenantId) => {
    return await ClientNotification.find(
      {
        tenantId,
      }
    )
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .lean();
  };