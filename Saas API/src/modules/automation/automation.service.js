const Automation = require("./automation.model");
const { sendEmail } = require("../marketing/email.service");
const { sendWhatsApp } = require("../marketing/whatsapp.service");

// ================= CREATE =================
exports.createAutomationService = async (data, user) => {
  if (!user?.tenantId) throw new Error("Tenant missing");

  return await Automation.create({
    ...data,
    tenantId: user.tenantId,
    createdBy: user._id,
  });
};

// ================= GET ALL =================
exports.getAutomationsService = async (user) => {
  return await Automation.find({
    tenantId: user.tenantId,
    isDeleted: { $ne: true },
  }).sort({ createdAt: -1 });
};

// ================= GET ONE =================
exports.getAutomationByIdService = async (id, user) => {
  const automation = await Automation.findOne({
    _id: id,
    tenantId: user.tenantId,
    isDeleted: { $ne: true },
  });

  if (!automation) throw new Error("Automation not found");

  return automation;
};

// ================= UPDATE =================
exports.updateAutomationService = async (id, data, user) => {
  return await Automation.findOneAndUpdate(
    { _id: id, tenantId: user.tenantId },
    data,
    { new: true }
  );
};

// ================= DELETE =================
exports.deleteAutomationService = async (id, user) => {
  return await Automation.findOneAndUpdate(
    { _id: id, tenantId: user.tenantId },
    { isDeleted: true },
    { new: true }
  );
};

// ================= TOGGLE ACTIVE =================
exports.toggleAutomationService = async (id, user) => {
  const automation = await Automation.findOne({
    _id: id,
    tenantId: user.tenantId,
  });

  if (!automation) throw new Error("Automation not found");

  automation.isActive = !automation.isActive;
  await automation.save();

  return automation;
};

// ================= TEST AUTOMATION =================
exports.testAutomationService = async (data, user) => {
  const { trigger, payload } = data;

  const automations = await Automation.find({
    "trigger.type": trigger,
    tenantId: user.tenantId,
    isActive: true,
    isDeleted: { $ne: true },
  });

  let executed = 0;

  for (const automation of automations) {
    for (const action of automation.actions) {
      try {
        // Replace variables {{name}} etc
        let message = action.config.message;

        if (message) {
          Object.keys(payload).forEach((key) => {
            message = message.replace(
              new RegExp(`{{${key}}}`, "g"),
              payload[key]
            );
          });
        }

        // EMAIL
        if (action.type === "email") {
          if (!payload.email) throw new Error("Email required");

          await sendEmail({
            to: payload.email,
            subject: action.config.subject || "Automation Email",
            html: message,
          });
        }

        // WHATSAPP
        if (action.type === "whatsapp") {
          if (!payload.phone) throw new Error("Phone required");

          await sendWhatsApp({
            to: payload.phone,
            message,
          });
        }

        executed++;
      } catch (err) {
        console.error("Automation action failed:", err.message);
      }
    }
  }

  return {
    automationsTriggered: automations.length,
    actionsExecuted: executed,
  };
};