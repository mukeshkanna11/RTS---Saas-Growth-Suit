const Note = require("./note.model");

// ➕ CREATE NOTE
exports.create = async (data, user) => {
  return await Note.create({
    content: data.content,
    contactId: data.contactId,
    dealId: data.dealId,
    leadId: data.leadId,

    type: data.type || "general",
    isPinned: data.isPinned || false,
    isPrivate: data.isPrivate || false,

    // 🔥 SAAS FIX
    tenantId: user.tenantId,
    createdBy: user._id,
  });
};

// 📥 GET NOTES
exports.getAll = async (user, query) => {
  const filter = {
    tenantId: user.tenantId,
    isDeleted: false,
  };

  if (query.contactId) filter.contactId = query.contactId;
  if (query.dealId) filter.dealId = query.dealId;
  if (query.leadId) filter.leadId = query.leadId;
  if (query.type) filter.type = query.type;

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;

  const skip = (page - 1) * limit;

  const [notes, total] = await Promise.all([
    Note.find(filter)
      .populate("contactId")
      .populate("dealId")
      .populate("leadId")
      .populate("createdBy", "name email")
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Note.countDocuments(filter),
  ]);

  return {
    data: notes,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
};

// 🗑 DELETE
exports.delete = async (id, user) => {
  return await Note.findOneAndUpdate(
    { _id: id, tenantId: user.tenantId },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
};