const { Worker } = require("bullmq");
const Redis = require("ioredis");

const { sendEmail } = require("../modules/marketing/email.service");
const { sendWhatsApp } = require("../modules/marketing/whatsapp.service");
const MarketingActivity = require("../modules/marketing/activity.model");

const connection = new Redis();

const worker = new Worker(
  "automation",
  async (job) => {
    const { type, data } = job.data;

    if (type === "email") {
      await sendEmail(data);

      await MarketingActivity.create({
        type: "email_sent",
        leadId: data.leadId,
        status: "success",
      });
    }

    if (type === "whatsapp") {
      await sendWhatsApp(data);

      await MarketingActivity.create({
        type: "whatsapp_sent",
        leadId: data.leadId,
        status: "success",
      });
    }
  },
  { connection }
);

worker.on("failed", (job, err) => {
  console.error("Job failed:", err.message);
});