"use strict";

/**
 * scripts/validatePricing.js
 *
 * Validates that all plan/cycle combinations produce consistent
 * pricing across INR, USD, and GST calculations.
 *
 * Run from the project root:
 *   node src/scripts/validatePricing.js
 *
 * Exit code 0 = all checks passed.
 * Exit code 1 = one or more checks failed.
 */

const { subscriptionPlans, getPriceForCurrency, getInrPrice } = require("../modules/subscription/subscription.plans");

// ── GST helpers (18% = CGST 9% + SGST 9%, tax-exclusive) ────────────────────
const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const calcGst = (base) => {
  const cgst  = round2(base * 0.09);
  const sgst  = round2(base * 0.09);
  const total = round2(base + cgst + sgst);
  return { base, cgst, sgst, total };
};

// ── Expected pricing table ────────────────────────────────────────────────────
// This is the single source of truth for test assertions.
// If a plan price changes, update ONLY subscription.plans.js — this table
// is derived from it at runtime, not hardcoded here.
const CYCLES = ["monthly", "yearly"];
const PLANS  = Object.keys(subscriptionPlans);

// ── Utilities ─────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

const ok  = (label) => { console.log(`  ✓ ${label}`); passed++; };
const err = (label, expected, actual) => {
  console.error(`  ✗ ${label}`);
  console.error(`      expected: ${expected}`);
  console.error(`      actual  : ${actual}`);
  failed++;
};

const assert = (condition, label, expected, actual) =>
  condition ? ok(label) : err(label, expected, actual);

// ── Test runner ───────────────────────────────────────────────────────────────
console.log("\n══════════════════════════════════════════════════");
console.log(" ReadyTech — Subscription Pricing Validation");
console.log("══════════════════════════════════════════════════\n");

for (const planId of PLANS) {
  const plan = subscriptionPlans[planId];
  console.log(`▶  ${plan.name} (${planId})`);

  for (const cycle of CYCLES) {
    const inrExpected = cycle === "yearly" ? plan.pricing.yearly : plan.pricing.monthly;
    const usdExpected = cycle === "yearly" ? plan.pricing.usd?.yearly : plan.pricing.usd?.monthly;

    // ── 1. INR price helper ──────────────────────────────────────────────────
    const inrActual = getInrPrice(planId, cycle);
    assert(
      inrActual === inrExpected,
      `getInrPrice("${planId}", "${cycle}") = ₹${inrExpected}`,
      inrExpected,
      inrActual
    );

    // ── 2. getPriceForCurrency INR ───────────────────────────────────────────
    const inrViaHelper = getPriceForCurrency(planId, cycle, "INR");
    assert(
      inrViaHelper === inrExpected,
      `getPriceForCurrency("${planId}", "${cycle}", "INR") = ₹${inrExpected}`,
      inrExpected,
      inrViaHelper
    );

    // ── 3. getPriceForCurrency USD ───────────────────────────────────────────
    if (usdExpected != null) {
      const usdActual = getPriceForCurrency(planId, cycle, "USD");
      assert(
        usdActual === usdExpected,
        `getPriceForCurrency("${planId}", "${cycle}", "USD") = $${usdExpected}`,
        usdExpected,
        usdActual
      );
    }

    // ── 4. INR never equals USD ──────────────────────────────────────────────
    if (usdExpected != null) {
      assert(
        inrExpected !== usdExpected,
        `INR price (${inrExpected}) ≠ USD price (${usdExpected}) — no currency confusion`,
        `${inrExpected} ≠ ${usdExpected}`,
        `${inrExpected} === ${usdExpected}`
      );
    }

    // ── 5. Monthly never equals yearly ──────────────────────────────────────
    if (cycle === "yearly") {
      const monthlyInr = getInrPrice(planId, "monthly");
      assert(
        inrExpected !== monthlyInr,
        `Yearly INR (${inrExpected}) ≠ Monthly INR (${monthlyInr}) — no cycle confusion`,
        `${inrExpected} ≠ ${monthlyInr}`,
        `${inrExpected} === ${monthlyInr}`
      );
    }

    // ── 6. GST calculation accuracy ──────────────────────────────────────────
    const gst = calcGst(inrExpected);
    const expectedTotal = round2(inrExpected * 1.18);

    assert(
      Math.abs(gst.total - expectedTotal) < 0.02,
      `GST on ₹${inrExpected}: CGST ₹${gst.cgst} + SGST ₹${gst.sgst} = Grand Total ₹${gst.total}`,
      expectedTotal,
      gst.total
    );
  }
  console.log();
}

// ── Plan-level cross-checks ───────────────────────────────────────────────────
console.log("▶  Cross-plan ordering checks");

const planIds = PLANS;
for (let i = 0; i < planIds.length - 1; i++) {
  for (const cycle of CYCLES) {
    const lower = getInrPrice(planIds[i], cycle);
    const higher = getInrPrice(planIds[i + 1], cycle);
    assert(
      higher > lower,
      `${planIds[i + 1]} ${cycle} (₹${higher}) > ${planIds[i]} ${cycle} (₹${lower})`,
      `> ${lower}`,
      higher
    );
  }
}

// ── Yearly discount check ─────────────────────────────────────────────────────
console.log("\n▶  Yearly discount vs 12× monthly");

for (const planId of PLANS) {
  const plan     = subscriptionPlans[planId];
  const monthly  = getInrPrice(planId, "monthly");
  const yearly   = getInrPrice(planId, "yearly");
  const twelveMo = monthly * 12;
  const savings  = round2(twelveMo - yearly);
  const pct      = round2((savings / twelveMo) * 100);

  assert(
    yearly < twelveMo,
    `${planId}: yearly ₹${yearly} < 12×monthly ₹${twelveMo} (saves ₹${savings} / ${pct}%)`,
    `< ${twelveMo}`,
    yearly
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n══════════════════════════════════════════════════");
console.log(` Results: ${passed} passed, ${failed} failed`);
console.log("══════════════════════════════════════════════════\n");

if (failed > 0) {
  console.error("PRICING VALIDATION FAILED — fix the errors above before deploying.\n");
  process.exit(1);
} else {
  console.log("All pricing checks passed.\n");
  process.exit(0);
}
