"use strict";

// ======================================================
// provisioning.service.js
// Automatic user + company provisioning after payment.
//
// Called (non-blocking) after a successful PayPal capture.
// Responsibilities:
//   1. Sync Company.plan / Company.maxUsers with the subscription
//   2. Ensure subscription.companyId and subscription.userId are set
//   3. Create Company + admin User if this is a brand-new customer
//   4. Send welcome email to new users
// ======================================================

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../modules/user/user.model");
const Company = require("../modules/company/company.model");
const Subscription = require("../modules/subscription/subscription.model");
const { getPlan } = require("../modules/subscription/subscription.plans");
const EmailService = require("./email.service");

// ── Helpers ───────────────────────────────────────────────────────────────────

const planMaxUsers = {
  starter: 5,
  growth: 20,
  enterprise: 999,
};

// Generate a random readable password: 3-word style  e.g. "Sky#River7"
const generateTempPassword = () => {
  const words = ["Ready", "Tech", "Cloud", "Saas", "Prime", "Swift", "Nova", "Core"];
  const symbols = ["#", "@", "!", "&"];
  const w1 = words[Math.floor(Math.random() * words.length)];
  const sym = symbols[Math.floor(Math.random() * symbols.length)];
  const num = Math.floor(10 + Math.random() * 89);
  return `${w1}${sym}${num}`;
};

// ── Main provisioning function ────────────────────────────────────────────────

/**
 * Provision / sync user + company after a successful payment.
 *
 * @param {Object} sub      — Mongoose Subscription document (already activated)
 * @param {Object} reqUser  — req.user from auth middleware (may be null for webhook flows)
 */
const provisionAfterPayment = async (sub, reqUser = null) => {
  const planConfig = getPlan(sub.plan);
  if (!planConfig) {
    console.warn(`[Provisioning] Unknown plan "${sub.plan}" — skipping`);
    return;
  }

  const maxUsers = planMaxUsers[sub.plan] ?? 5;

  // ── Case 1: Subscription already has a companyId (existing user flow) ──────
  if (sub.companyId) {
    await _syncExistingCompany(sub, maxUsers, reqUser);
    return;
  }

  // ── Case 2: No companyId — look up by email, create if missing ───────────
  const email = sub.clientEmail?.toLowerCase().trim();
  if (!email) {
    console.warn("[Provisioning] No clientEmail on subscription — cannot provision");
    return;
  }

  // Try to find an existing user by email
  const existingUser = await User.findOne({ email, isDeleted: false }).select("+password");
  if (existingUser) {
    await _linkExistingUser(sub, existingUser, maxUsers);
    return;
  }

  // Brand-new customer — create company + admin user
  await _createNewCustomer(sub, email, maxUsers, planConfig);
};

// ── Sync an existing company to the new plan ─────────────────────────────────
const _syncExistingCompany = async (sub, maxUsers, reqUser) => {
  try {
    await Company.findByIdAndUpdate(sub.companyId, {
      plan: sub.plan,
      maxUsers,
      isActive: true,
    });

    // Ensure userId is stamped on subscription if we have it from req.user
    if (reqUser?.id && !sub.userId) {
      await Subscription.findByIdAndUpdate(sub._id, { userId: reqUser.id });
    }

    console.log(`[Provisioning] Synced company ${sub.companyId} → plan=${sub.plan}`);
  } catch (err) {
    console.error("[Provisioning] _syncExistingCompany failed:", err.message);
    throw err;
  }
};

// ── Link subscription to an existing user account ────────────────────────────
const _linkExistingUser = async (sub, user, maxUsers) => {
  try {
    // Update the company tied to this user's tenantId
    await Company.findOneAndUpdate(
      { tenantId: user.tenantId },
      { plan: sub.plan, maxUsers, isActive: true }
    );

    // Stamp subscription with resolved IDs
    const company = await Company.findOne({ tenantId: user.tenantId });
    if (company) {
      await Subscription.findByIdAndUpdate(sub._id, {
        companyId: company._id,
        userId: user._id,
      });
    }

    console.log(`[Provisioning] Linked subscription ${sub._id} to existing user ${user._id}`);
  } catch (err) {
    console.error("[Provisioning] _linkExistingUser failed:", err.message);
    throw err;
  }
};

// ── Create brand-new company + admin user ────────────────────────────────────
const _createNewCustomer = async (sub, email, maxUsers, planConfig) => {
  try {
    // Generate tenant ID (RTS-xxxxxx)
    const tenantId = "RTS-" + crypto.randomBytes(3).toString("hex").toUpperCase();
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const companyName = sub.clientName || email.split("@")[0];

    // Create company
    const company = await Company.create({
      name: companyName,
      tenantId,
      plan: sub.plan,
      maxUsers,
      isActive: true,
    });

    // Create admin user
    const user = await User.create({
      name: sub.clientName || companyName,
      email,
      password: hashedPassword,
      role: "admin",
      tenantId,
    });

    // Stamp subscription
    await Subscription.findByIdAndUpdate(sub._id, {
      companyId: company._id,
      userId: user._id,
    });

    console.log(`[Provisioning] Created new customer: company=${company._id} user=${user._id} tenant=${tenantId}`);

    // Send welcome email with credentials (non-fatal)
    try {
      await EmailService.sendWelcomeWithCredentials({
        email,
        name: sub.clientName || companyName,
        tenantId,
        tempPassword,
        plan: planConfig.name,
      });
    } catch (emailErr) {
      console.error("[Provisioning] Welcome email failed (non-fatal):", emailErr.message);
    }

    return { company, user, tenantId };
  } catch (err) {
    console.error("[Provisioning] _createNewCustomer failed:", err.message);
    throw err;
  }
};

module.exports = { provisionAfterPayment };
