"use strict";

// ======================================================
// services/ai.hooks.service.js
// CRM / ERP AI Hooks Framework
//
// Provides an EventEmitter-based hook system so CRM, ERP,
// and other modules can fire named AI lifecycle events.
// All handlers are registered externally (e.g. crm.ai.hooks.js).
//
// Usage — emit from any module:
//   const aiHooks = require("../../services/ai.hooks.service");
//   aiHooks.emit("contact.created", { contact, tenantId });
//
// Usage — register handlers in a module's boot file:
//   aiHooks.on("contact.created", async (payload) => { ... });
//
// All event handlers run non-blocking (no await at emit site).
// ======================================================

const EventEmitter = require("events");

// ── Named event constants ─────────────────────────────────────────────────────
// Import these instead of using raw strings to avoid typos.
const EVENTS = {
  // CRM
  CONTACT_CREATED:        "contact.created",
  CONTACT_UPDATED:        "contact.updated",
  DEAL_CREATED:           "deal.created",
  DEAL_UPDATED:           "deal.updated",
  DEAL_STAGE_CHANGED:     "deal.stage_changed",
  ACTIVITY_LOGGED:        "activity.logged",
  LEAD_SCORED:            "lead.scored",

  // ERP
  INVOICE_CREATED:        "erp.invoice.created",
  PURCHASE_ORDER_CREATED: "erp.purchase_order.created",
  INVENTORY_LOW:          "erp.inventory.low",
  EXPENSE_FILED:          "erp.expense.filed",

  // Subscription / Billing
  SUBSCRIPTION_ACTIVATED: "subscription.activated",
  SUBSCRIPTION_RENEWED:   "subscription.renewed",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",
  PAYMENT_RECEIVED:       "payment.received",
  TOKEN_BUDGET_WARNING:   "token.budget.warning",

  // Marketing
  CAMPAIGN_LAUNCHED:      "marketing.campaign.launched",
  EMAIL_OPENED:           "marketing.email.opened",
  FORM_SUBMITTED:         "marketing.form.submitted",
};

// ── Emitter instance ──────────────────────────────────────────────────────────
class AIHooksEmitter extends EventEmitter {
  constructor() {
    super();
    // Raise the default listener limit to accommodate multiple module handlers
    this.setMaxListeners(50);

    // In development, log unhandled AI hook emissions to help trace missing handlers
    if (process.env.NODE_ENV !== "production") {
      this.on("newListener", (event) => {
        if (process.env.AI_HOOKS_DEBUG === "true") {
          console.log(`[AI Hooks] Handler registered: "${event}"`);
        }
      });
    }
  }

  // Convenience: fire an event asynchronously (fire-and-forget)
  // Wraps emit in setImmediate so callers never block on slow handlers.
  fire(event, payload = {}) {
    setImmediate(() => {
      try {
        this.emit(event, { ...payload, _firedAt: new Date().toISOString() });
      } catch (err) {
        console.error(`[AI Hooks] Uncaught error in handler for "${event}":`, err.message);
      }
    });
  }
}

const aiHooks = new AIHooksEmitter();

module.exports = { aiHooks, EVENTS };
