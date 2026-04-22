const { sendEmail } = require("./email.service");
const { sendWhatsApp } = require("./whatsapp.service");
const MarketingActivity = require("./activity.model");

// 🔥 RULES CONFIG
const rules = {
  lead_created: {
    email: true,
    whatsapp: true,
  },
  status_changed: {
    email: false,
    whatsapp: true,
  },
};

exports.runLeadAutomation = async (lead, user) => {
  const trigger = lead.trigger || "lead_created";
  const rule = rules[trigger];

  if (!rule) return;

  const tenantId = user?.tenantId;

  // 📧 EMAIL
  if (rule.email && lead.email) {
    try {
      await sendEmail({
        to: lead.email,
        subject: "Welcome 🚀",
        html: `<h2>Hello ${lead.name}</h2>`,
      });

      await MarketingActivity.create({
        type: "email_sent",
        leadId: lead._id,
        tenantId,
        meta: { email: lead.email },
        status: "success",
      });
    } catch (err) {
      await MarketingActivity.create({
        type: "email_sent",
        leadId: lead._id,
        tenantId,
        status: "failed",
        error: err.message,
      });
    }
  }

  // 📲 WHATSAPP
  if (rule.whatsapp && lead.phone) {
    try {
      await sendWhatsApp({
        to: lead.phone,
        message: `Hi ${lead.name}, thanks for connecting with us!`,
      });

      await MarketingActivity.create({
        type: "whatsapp_sent",
        leadId: lead._id,
        tenantId,
        meta: { phone: lead.phone },
        status: "success",
      });
    } catch (err) {
      await MarketingActivity.create({
        type: "whatsapp_sent",
        leadId: lead._id,
        tenantId,
        status: "failed",
        error: err.message,
      });
    }
  }
};