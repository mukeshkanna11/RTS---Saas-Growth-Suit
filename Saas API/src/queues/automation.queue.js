const { Queue } = require("bullmq");
const Redis = require("ioredis");

const connection = new Redis();

const automationQueue = new Queue("automation", { connection });

module.exports = automationQueue;