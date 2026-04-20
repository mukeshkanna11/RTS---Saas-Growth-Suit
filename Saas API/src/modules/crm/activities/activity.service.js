const Activity = require("./activity.model");

// ===============================
// ➕ CREATE ACTIVITY
// ===============================
exports.create = async (data, user) => {
  return await Activity.create({
    type: data.type,
    title: data.title,
    description: data.description,

    priority: data.priority || "medium",
    status: data.status || "pending",

    tenantId: user.tenantId,
    createdBy: user._id,
    assignedTo: data.assignedTo || user._id,

    contactId: data.contactId,
    leadId: data.leadId,
    dealId: data.dealId,

    dueDate: data.dueDate,
  });
};

// ===============================
// 📥 GET ALL ACTIVITIES
// ===============================
exports.getAll = async (user, query) => {
  const filter = {
    tenantId: user.tenantId,
    isDeleted: false,
  };

  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;

  if (query.overdue === "true") {
    filter.dueDate = { $lt: new Date() };
    filter.status = "pending";
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .populate("contactId")
      .populate("dealId")
      .populate("leadId")
      .populate("assignedTo", "name email role")
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Activity.countDocuments(filter),
  ]);

  return {
    data: activities,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
};

// ===============================
// ✏️ UPDATE ACTIVITY
// ===============================
exports.update = async (id, data, user) => {
  const activity = await Activity.findOne({
    _id: id,
    tenantId: user.tenantId,
    isDeleted: false,
  });

  if (!activity) throw new Error("Activity not found");

  Object.assign(activity, data);

  // auto complete logic
  if (data.status === "completed") {
    activity.completedAt = new Date();
  }

  // overdue detection
  if (activity.dueDate && activity.dueDate < new Date() && activity.status !== "completed") {
    activity.isOverdue = true;
  }

  await activity.save();
  return activity;
};

// ===============================
// 🗑 SOFT DELETE
// ===============================
exports.delete = async (id, user) => {
  return await Activity.findOneAndUpdate(
    {
      _id: id,
      tenantId: user.tenantId,
    },
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    { new: true }
  );
};