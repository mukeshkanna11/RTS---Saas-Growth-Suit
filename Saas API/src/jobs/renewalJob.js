"use strict";

// ======================================================
// jobs/renewalJob.js
// Daily subscription renewal processing via BullMQ + Redis
//
// Redis is OPTIONAL.
// If REDIS_URL / REDIS_HOST is not set the job is skipped
// silently and the rest of the application boots normally.
//
// Env vars:
//   REDIS_URL      — full Redis URL (takes priority)
//   REDIS_HOST     — hostname (default: not set → job skipped)
//   REDIS_PORT     — port     (default: 6379)
//   REDIS_PASSWORD — optional auth
// ======================================================

// All heavy imports (ioredis, bullmq) are lazy-loaded inside
// startRenewalJob() so a missing / offline Redis server never
// crashes the module at require() time.

const Subscription = require("../modules/subscription/subscription.model");
const PaymentTransaction = require("../modules/billing/models/paymentTransaction.model");
const tokenBilling = require("../services/tokenBilling.service");
const events = require("../modules/subscription/subscription.events");

const QUEUE_NAME = "subscription-renewals";

// ── Module-level references (populated only if Redis is available) ────────────
let _queue  = null;
let _worker = null;

// ── Process a single renewal ──────────────────────────────────────────────────
const processRenewal = async (subscriptionId) => {
  const sub = await Subscription.findById(subscriptionId);
  if (!sub) {
    console.warn(`[RenewalJob] Subscription ${subscriptionId} not found — skipping`);
    return;
  }

  if (sub.status !== "active") {
    console.log(`[RenewalJob] Sub ${subscriptionId} not active (${sub.status}) — skipping`);
    return;
  }

  const now = new Date();
  const DAYS_PER_CYCLE = { monthly: 30, yearly: 365 };
  const daysToAdd = DAYS_PER_CYCLE[sub.billingCycle] || 30;
  const renewalDate = new Date(now);
  renewalDate.setDate(renewalDate.getDate() + daysToAdd);

  sub.renewalDate = renewalDate;
  sub.lastPaymentDate = now;
  await sub.save();

  await tokenBilling.resetMonthlyTokens(sub._id);

  await PaymentTransaction.create({
    subscriptionId: sub._id,
    companyId:      sub.companyId,
    type:           "subscription_renewal",
    gateway:        sub.paymentGateway || "manual",
    plan:           sub.plan,
    billingCycle:   sub.billingCycle,
    amount:         sub.amount,
    currency:       sub.currency,
    paypalSubscriptionId: sub.paypalSubscriptionId || undefined,
    status:         "completed",
    processedAt:    now,
  });

  events.emit("subscription.renewed", {
    subscriptionId: sub._id,
    plan:           sub.plan,
    renewalDate,
    clientEmail:    sub.clientEmail,
    clientName:     sub.clientName,
  });

  console.log(
    `[RenewalJob] Renewed ${subscriptionId} → next renewal ${renewalDate.toISOString()}`
  );
};

// ── Queue due renewals ────────────────────────────────────────────────────────
const checkAndQueueDueRenewals = async () => {
  if (!_queue) return;

  const now    = new Date();
  const buffer = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 h window

  const dueSubs = await Subscription.find({
    status:         "active",
    autoRenew:      true,
    renewalDate:    { $lte: buffer },
    paymentGateway: { $ne: "paypal" }, // PayPal recurring handled by webhooks
    isDeleted:      false,
  }).select("_id");

  console.log(`[RenewalJob] ${dueSubs.length} subscription(s) due for renewal`);

  for (const sub of dueSubs) {
    await _queue.add(
      "process-renewal",
      { subscriptionId: sub._id.toString() },
      { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
    );
  }
};

// ── Start the renewal job ─────────────────────────────────────────────────────
const startRenewalJob = async () => {
  // ── Guard: only start if Redis is explicitly configured ──────────────────────
  const redisUrl  = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;

  if (!redisUrl && !redisHost) {
    console.warn(
      "[RenewalJob] Redis not configured (REDIS_URL / REDIS_HOST not set). " +
      "Subscription auto-renewal is disabled — manual renewals still work."
    );
    return;
  }

  let connection;

  try {
    // Lazy-load ioredis and bullmq only when Redis is actually configured.
    // This prevents ECONNREFUSED errors at module load time.
    const IORedis       = require("ioredis");
    const { Queue, Worker } = require("bullmq");

    // Build connection options
    const baseOpts = {
      maxRetriesPerRequest: null, // required by BullMQ
      // Stop retrying after 3 attempts so logs don't flood on transient failures.
      retryStrategy: (times) => (times < 3 ? Math.min(times * 1000, 3000) : null),
      enableOfflineQueue: false,
    };

    connection = redisUrl
      ? new IORedis(redisUrl, baseOpts)
      : new IORedis({
          host:     redisHost,
          port:     parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          ...baseOpts,
        });

    // Attach error handler BEFORE the connectivity test so the error
    // event doesn't become an unhandled exception.
    connection.on("error", (err) => {
      console.error("[RenewalJob] Redis error:", err.code || err.message);
    });

    // Verify connectivity (throws immediately if Redis is unreachable)
    await connection.ping();

    // ── Queue setup ──────────────────────────────────────────────────────────
    _queue = new Queue(QUEUE_NAME, { connection });

    // Schedule daily check at midnight UTC
    await _queue.add(
      "check-renewals",
      {},
      {
        repeat:   { pattern: "0 0 * * *" },
        attempts: 3,
        backoff:  { type: "exponential", delay: 10000 },
      }
    );

    // ── Worker setup ─────────────────────────────────────────────────────────
    _worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        if (job.name === "check-renewals") {
          await checkAndQueueDueRenewals();
        } else if (job.name === "process-renewal") {
          await processRenewal(job.data.subscriptionId);
        }
      },
      { connection, concurrency: 3 }
    );

    _worker.on("completed", (job) =>
      console.log(`[RenewalJob] Job ${job.id} (${job.name}) completed`)
    );
    _worker.on("failed", (job, err) =>
      console.error(`[RenewalJob] Job ${job?.id} (${job?.name}) failed: ${err.message}`)
    );

    console.log("[RenewalJob] Subscription renewal job started (daily 00:00 UTC) ✓");
  } catch (err) {
    // Non-fatal — the app runs without auto-renewal.
    // Manual renewals and PayPal webhook renewals are unaffected.
    console.warn(`[RenewalJob] Cannot connect to Redis: ${err.message}`);
    console.warn("[RenewalJob] Auto-renewal disabled. App will continue without it.");

    // Disconnect cleanly so the error handler stops firing
    if (connection) {
      try { connection.disconnect(false); } catch (_) {}
    }
    _queue  = null;
    _worker = null;
  }
};

module.exports = { startRenewalJob, processRenewal };
