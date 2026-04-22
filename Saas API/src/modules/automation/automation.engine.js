const Automation = require("./automation.model");
const { sendEmail } = require("../marketing/email.service");
const { sendWhatsApp } = require("../marketing/whatsapp.service");

// 🔁 Delay helper
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

// 🚀 MAIN ENGINE
exports.runAutomation = async (triggerType, payload, user) => {
  try {
    const automations = await Automation.find({
      tenantId: user.tenantId,
      "trigger.type": triggerType,
      isActive: true,
      isDeleted: { $ne: true },
    });

    for (const auto of automations) {
      for (const action of auto.actions) {
        try {
          // ⏱️ DELAY SUPPORT
          if (action.config?.delay) {
            await wait(action.config.delay * 60000);
          }

          // 📧 EMAIL
          if (action.type === "email" && payload.email) {
            await sendEmail({
              to: payload.email,
              subject: action.config.subject || auto.name,
              html: action.config.message,
            });
          }

          // 💬 WHATSAPP
          if (action.type === "whatsapp" && payload.phone) {
            await sendWhatsApp({
              to: payload.phone,
              message: action.config.message,
            });
          }

          // 🤖 AI READY (future)
          if (action.type === "ai_email") {
            const aiText = `AI Generated: ${payload.name}`;
            await sendEmail({
              to: payload.email,
              subject: "AI Message",
              html: aiText,
            });
          }

        } catch (err) {
          console.error("❌ Automation action failed:", err.message);
        }
      }
    }
  } catch (err) {
    console.error("❌ Automation engine error:", err.message);
  }
};