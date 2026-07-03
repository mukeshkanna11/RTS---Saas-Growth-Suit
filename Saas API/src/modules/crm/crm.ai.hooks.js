"use strict";

// ======================================================
// modules/crm/crm.ai.hooks.js
// CRM AI Hook Handlers
//
// Register all CRM-related AI hook listeners here.
// All handlers are stubs — they log the event and are
// ready to be wired to Claude API calls when needed.
//
// Call register() once at app startup (e.g. in app.js):
//   require("./modules/crm/crm.ai.hooks").register();
// ======================================================

const { aiHooks, EVENTS } = require("../../services/ai.hooks.service");

// ── Handler stubs ─────────────────────────────────────────────────────────────

// Called when a new contact is created.
// Future: auto-generate personalised outreach draft via Claude.
const onContactCreated = async ({ contact, tenantId }) => {
  console.log(`[CRM AI] contact.created — tenantId=${tenantId} id=${contact?._id}`);
  // TODO: await ClaudeService.draftOutreach({ contact });
};

// Called when a contact record is updated.
// Future: detect intent signals and suggest next action.
const onContactUpdated = async ({ contact, changes, tenantId }) => {
  console.log(`[CRM AI] contact.updated — tenantId=${tenantId} id=${contact?._id}`);
  // TODO: await ClaudeService.analyseContactChanges({ contact, changes });
};

// Called when a new deal is created.
// Future: generate deal summary and suggest related contacts.
const onDealCreated = async ({ deal, tenantId }) => {
  console.log(`[CRM AI] deal.created — tenantId=${tenantId} id=${deal?._id}`);
  // TODO: await ClaudeService.summariseDeal({ deal });
};

// Called when a deal is updated.
// Future: predict close probability based on updated data.
const onDealUpdated = async ({ deal, changes, tenantId }) => {
  console.log(`[CRM AI] deal.updated — tenantId=${tenantId} id=${deal?._id}`);
  // TODO: await ClaudeService.predictCloseProbability({ deal });
};

// Called when a deal moves to a new pipeline stage.
// Future: recommend stage-specific follow-up actions.
const onDealStageChanged = async ({ deal, from, to, tenantId }) => {
  console.log(`[CRM AI] deal.stage_changed — tenantId=${tenantId} id=${deal?._id} ${from} → ${to}`);
  // TODO: await ClaudeService.recommendFollowUp({ deal, stage: to });
};

// Called when any activity (call, email, meeting) is logged.
// Future: extract action items and key notes via Claude.
const onActivityLogged = async ({ activity, tenantId }) => {
  console.log(`[CRM AI] activity.logged — tenantId=${tenantId} type=${activity?.type}`);
  // TODO: await ClaudeService.extractActionItems({ activity });
};

// Called after a subscription is activated for a new/existing customer.
// Future: generate personalised onboarding sequence.
const onSubscriptionActivated = async ({ subscription, tenantId }) => {
  console.log(`[CRM AI] subscription.activated — tenantId=${tenantId} plan=${subscription?.plan}`);
  // TODO: await ClaudeService.buildOnboardingPlan({ subscription });
};

// ── Registration ──────────────────────────────────────────────────────────────
// Wrap each listener so one failing handler never kills the rest.

const safeHandler = (name, fn) => async (payload) => {
  try {
    await fn(payload);
  } catch (err) {
    console.error(`[CRM AI] Handler error in "${name}":`, err.message);
  }
};

const register = () => {
  aiHooks.on(EVENTS.CONTACT_CREATED,        safeHandler("onContactCreated",        onContactCreated));
  aiHooks.on(EVENTS.CONTACT_UPDATED,        safeHandler("onContactUpdated",        onContactUpdated));
  aiHooks.on(EVENTS.DEAL_CREATED,           safeHandler("onDealCreated",           onDealCreated));
  aiHooks.on(EVENTS.DEAL_UPDATED,           safeHandler("onDealUpdated",           onDealUpdated));
  aiHooks.on(EVENTS.DEAL_STAGE_CHANGED,     safeHandler("onDealStageChanged",      onDealStageChanged));
  aiHooks.on(EVENTS.ACTIVITY_LOGGED,        safeHandler("onActivityLogged",        onActivityLogged));
  aiHooks.on(EVENTS.SUBSCRIPTION_ACTIVATED, safeHandler("onSubscriptionActivated", onSubscriptionActivated));
  console.log("[CRM AI] Hook handlers registered");
};

module.exports = { register };
