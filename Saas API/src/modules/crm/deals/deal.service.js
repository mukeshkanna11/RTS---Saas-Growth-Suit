const Deal = require("./deal.model");

// ===============================
// ➕ CREATE DEAL
// ===============================
exports.create = async (data, user) => {
  return await Deal.create({
    title: data.title,
    value: data.value || 0,
    currency: data.currency || "INR",
    stage: data.stage || "new",

    tenantId: user.tenantId,
    owner: user._id,
    assignedTo: data.assignedTo || user._id,

    contactId: data.contactId,
    leadId: data.leadId,

    expectedCloseDate: data.expectedCloseDate,

    probability: 10,

    stageHistory: [
      {
        stage: "new",
        changedAt: new Date(),
        changedBy: user._id,
      },
    ],
  });
};

// ===============================
// 📥 GET ALL DEALS
// ===============================
exports.getAll = async (user, query) => {
  const filter = {
    tenantId: user.tenantId,
    isDeleted: false,
  };

  if (query.stage) filter.stage = query.stage;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;

  if (query.search) {
    filter.$or = [
      { title: new RegExp(query.search, "i") },
    ];
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const [deals, total] = await Promise.all([
    Deal.find(filter)
      .populate("contactId")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Deal.countDocuments(filter),
  ]);

  return {
    data: deals,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
};

// ===============================
// 🔄 UPDATE STAGE (CRM ENGINE)
// ===============================
exports.updateStage = async (id, stage, user) => {
  const deal = await Deal.findOne({
    _id: id,
    tenantId: user.tenantId,
    isDeleted: false,
  });

  if (!deal) throw new Error("Deal not found");

  deal.stage = stage;

  const stageMap = {
    new: 10,
    contacted: 25,
    qualified: 50,
    proposal: 70,
    negotiation: 85,
    won: 100,
    lost: 0,
  };

  deal.probability = stageMap[stage] || 0;

  deal.stageHistory.push({
    stage,
    changedAt: new Date(),
    changedBy: user._id,
  });

  if (stage !== "lost") deal.lostReason = null;

  await deal.save();
  return deal;
};