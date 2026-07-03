"use strict";

/**
 * scripts/cleanupSubscriptions.js
 *
 * One-time repair script for the subscriptions collection.
 * Run from the project root:
 *   node src/scripts/cleanupSubscriptions.js
 *
 * What this script does (in order, non-destructively):
 *   1. Soft-deletes subscriptions where companyId is null or missing.
 *   2. For every companyId that has more than one pending/active
 *      subscription, keeps the most recently updated document and
 *      soft-deletes all older duplicates.
 *   3. Prints a full report of every action taken.
 *
 * Nothing is hard-deleted. Every modified document gets
 *   isDeleted: true, deletedAt: <now>
 * so you can inspect or restore them before dropping them permanently.
 *
 * Run the script with DRY_RUN=true to preview actions without writing:
 *   DRY_RUN=true node src/scripts/cleanupSubscriptions.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const Subscription = require("../modules/subscription/subscription.model");

// ── Config ────────────────────────────────────────────────────────────────────
const DRY_RUN = process.env.DRY_RUN === "true";
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("[Cleanup] MONGO_URI is not set in .env. Aborting.");
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const log = (msg) => console.log(`[Cleanup] ${msg}`);
const warn = (msg) => console.warn(`[Cleanup][WARN] ${msg}`);

const softDelete = async (ids, reason) => {
  if (ids.length === 0) return 0;
  if (DRY_RUN) {
    log(`DRY RUN — would soft-delete ${ids.length} document(s): ${reason}`);
    return ids.length;
  }
  const result = await Subscription.collection.updateMany(
    { _id: { $in: ids } },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  );
  log(`Soft-deleted ${result.modifiedCount} document(s): ${reason}`);
  return result.modifiedCount;
};

// ── Step 0: drop bad unique index ────────────────────────────────────────────
// A previous schema deployment created { companyId: 1, status: 1 } as UNIQUE.
// That index blocks reactivation (E11000) because two documents can share
// companyId with different historical statuses (e.g. cancelled + active).
// The correct constraint is the partial unique index added in subscription.model.js.
// Mongoose never auto-drops old indexes — this step fixes that gap.
const fixBadIndex = async () => {
  log("Step 0 — checking for problematic { companyId, status } unique index …");

  const indexes = await Subscription.collection.indexes();

  // The bad index may appear under one of several names depending on how it
  // was originally created (Mongoose auto-name vs. explicit name).
  const bad = indexes.find(
    (idx) =>
      idx.unique === true &&
      idx.key &&
      Object.keys(idx.key).length === 2 &&
      idx.key.companyId !== undefined &&
      idx.key.status !== undefined
  );

  if (!bad) {
    log("Step 0 — no bad unique {companyId, status} index found. ✓");
    return;
  }

  warn(`Step 0 — found UNIQUE index "${bad.name}" on {companyId, status}.`);
  warn("         This causes E11000 on reactivation and blocks historical records.");
  warn("         It will be dropped and replaced by the partial unique index.");

  if (DRY_RUN) {
    log(`DRY RUN — would drop index "${bad.name}"`);
    return;
  }

  await Subscription.collection.dropIndex(bad.name);
  log(`Step 0 — dropped index "${bad.name}". ✓`);
  log("         Mongoose will recreate {companyId, status} as NON-UNIQUE on next server start.");
  log("         The partial unique index (unique_active_pending_per_company) enforces the");
  log("         correct constraint: only one active/pending subscription per company.");
};

// ── Step 0b: drop old partial unique index that covered pending + active ───────
// The schema previously constrained { companyId, status ∈ [active, pending] }
// to be unique. createIntent now creates a fresh pending document per checkout
// session (multiple pending docs per company are intentional), so that index
// must be replaced with one that only constrains "active".
// The new index "unique_active_per_company" is defined in the schema and created
// automatically by Mongoose. This step drops the old one so it does not conflict.
const fixOldPartialIndex = async () => {
  log("Step 0b — checking for old partial unique index (active + pending) …");

  const indexes = await Subscription.collection.indexes();
  const old = indexes.find((idx) => idx.name === "unique_active_pending_per_company");

  if (!old) {
    log("Step 0b — unique_active_pending_per_company not found. ✓");
    return;
  }

  warn("Step 0b — found old partial unique index 'unique_active_pending_per_company'.");
  warn("         It prevents multiple pending subscriptions per company.");
  warn("         Dropping it in favour of 'unique_active_per_company'.");

  if (DRY_RUN) {
    log("DRY RUN — would drop unique_active_pending_per_company");
    return;
  }

  await Subscription.collection.dropIndex("unique_active_pending_per_company");
  log("Step 0b — dropped unique_active_pending_per_company. ✓");
  log("         Mongoose will create unique_active_per_company on next server start.");
};

// ── Step 1: null companyId ────────────────────────────────────────────────────
const fixNullCompanyId = async () => {
  log("Step 1 — scanning for null/missing companyId …");

  // Bypass the pre-find isDeleted middleware by querying the raw collection.
  const nullDocs = await Subscription.collection
    .find({
      $or: [
        { companyId: null },
        { companyId: { $exists: false } },
      ],
      isDeleted: { $ne: true },
    })
    .project({ _id: 1, clientEmail: 1, plan: 1, status: 1, createdAt: 1 })
    .toArray();

  if (nullDocs.length === 0) {
    log("Step 1 — no null-companyId documents found. ✓");
    return 0;
  }

  warn(`Step 1 — found ${nullDocs.length} document(s) with null companyId:`);
  nullDocs.forEach((d) =>
    warn(`  _id=${d._id} | email=${d.clientEmail} | plan=${d.plan} | status=${d.status} | createdAt=${d.createdAt}`)
  );

  const ids = nullDocs.map((d) => d._id);
  return softDelete(ids, "null companyId");
};

// ── Step 2: duplicate pending/active per companyId ────────────────────────────
const fixDuplicates = async () => {
  log("Step 2 — scanning for duplicate pending/active subscriptions …");

  // Use the raw collection to bypass the pre-find isDeleted middleware.
  // We only look at non-deleted documents with a real companyId.
  const groups = await Subscription.collection
    .aggregate([
      {
        $match: {
          isDeleted:  { $ne: true },
          companyId:  { $ne: null, $exists: true },
          status:     { $in: ["pending", "active"] },
        },
      },
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id:      "$companyId",
          // First element after sort = most recently updated (keep this one)
          keepId:   { $first: "$_id" },
          keepStatus: { $first: "$status" },
          keepUpdatedAt: { $first: "$updatedAt" },
          allDocs:  {
            $push: {
              _id:       "$_id",
              status:    "$status",
              plan:      "$plan",
              updatedAt: "$updatedAt",
            },
          },
          count:    { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  if (groups.length === 0) {
    log("Step 2 — no duplicates found. ✓");
    return 0;
  }

  warn(`Step 2 — found ${groups.length} companyId(s) with duplicate active/pending subscriptions:`);

  let totalDeleted = 0;

  for (const group of groups) {
    const { _id: companyId, keepId, keepStatus, keepUpdatedAt, allDocs } = group;

    warn(`  companyId=${companyId} | ${group.count} docs — keeping _id=${keepId} (status=${keepStatus}, updatedAt=${keepUpdatedAt})`);

    const duplicateIds = allDocs
      .filter((d) => !d._id.equals(keepId))
      .map((d) => {
        warn(`    → soft-deleting _id=${d._id} (status=${d.status}, plan=${d.plan}, updatedAt=${d.updatedAt})`);
        return d._id;
      });

    const deleted = await softDelete(duplicateIds, `duplicate for companyId=${companyId}`);
    totalDeleted += deleted;
  }

  return totalDeleted;
};

// ── Step 3: report collection state ──────────────────────────────────────────
const reportState = async () => {
  log("Step 3 — final collection summary …");

  const [total, active, pending, cancelled, expired, deleted, withNullCompany] =
    await Promise.all([
      Subscription.collection.countDocuments({}),
      Subscription.collection.countDocuments({ status: "active",    isDeleted: { $ne: true } }),
      Subscription.collection.countDocuments({ status: "pending",   isDeleted: { $ne: true } }),
      Subscription.collection.countDocuments({ status: "cancelled", isDeleted: { $ne: true } }),
      Subscription.collection.countDocuments({ status: "expired",   isDeleted: { $ne: true } }),
      Subscription.collection.countDocuments({ isDeleted: true }),
      Subscription.collection.countDocuments({ companyId: null }),
    ]);

  log(`  Total documents  : ${total}`);
  log(`  Active           : ${active}`);
  log(`  Pending          : ${pending}`);
  log(`  Cancelled        : ${cancelled}`);
  log(`  Expired          : ${expired}`);
  log(`  Soft-deleted     : ${deleted}`);
  log(`  Null companyId   : ${withNullCompany}`);
};

// ── Main ──────────────────────────────────────────────────────────────────────
const run = async () => {
  if (DRY_RUN) {
    log("════════════════════════════════════════");
    log("DRY RUN MODE — no writes will be made");
    log("════════════════════════════════════════");
  }

  log(`Connecting to MongoDB …`);
  await mongoose.connect(MONGO_URI);
  log("Connected.");

  try {
    await fixBadIndex();
    await fixOldPartialIndex();
    const nullFixed = await fixNullCompanyId();
    const dupFixed  = await fixDuplicates();
    await reportState();

    log("════════════════════════════════════════");
    log(`Done.`);
    log(`  Null companyId cleaned : ${nullFixed}`);
    log(`  Duplicate docs cleaned : ${dupFixed}`);
    if (DRY_RUN) {
      log("Re-run without DRY_RUN=true to apply these changes.");
    } else {
      log("All soft-deleted documents can be inspected with:");
      log('  db.subscriptions.find({ isDeleted: true })');
      log("Drop them permanently only after verifying the cleanup is correct:");
      log('  db.subscriptions.deleteMany({ isDeleted: true })');
    }
    log("════════════════════════════════════════");
  } finally {
    await mongoose.disconnect();
    log("Disconnected.");
  }
};

run().catch((err) => {
  console.error("[Cleanup] Fatal error:", err.message);
  process.exit(1);
});
