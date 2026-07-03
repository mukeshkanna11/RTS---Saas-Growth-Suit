// src/api/subscription.js
// Centralized subscription API — all calls go through the shared axios instance
// so auth headers, interceptors and base URL are handled in one place.

import API from "./axios";

// ── Current subscription ──────────────────────────────────────────────────────
export const getMySubscription = (signal) =>
  API.get("/subscription/me", { signal });

// ── Create intent (step 1 of checkout) ───────────────────────────────────────
export const createIntent = (payload, signal) =>
  API.post("/subscription/intent", payload, { signal });

// ── PayPal flow ───────────────────────────────────────────────────────────────
export const createPayPalOrder = (subscriptionId, signal) =>
  API.post("/subscription/paypal/create-order", { subscriptionId }, { signal });

export const capturePayPalOrder = (orderId, signal) =>
  API.post("/subscription/paypal/capture-order", { orderId }, { signal });

// ── Subscription lifecycle ────────────────────────────────────────────────────
export const changePlan = (id, plan, billingCycle, signal) =>
  API.patch(`/subscription/${id}/change-plan`, { plan, billingCycle }, { signal });

export const cancelSubscription = (id, signal) =>
  API.patch(`/subscription/${id}/cancel`, {}, { signal });

export const reactivateSubscription = (id, signal) =>
  API.patch(`/subscription/${id}/reactivate`, {}, { signal });

// ── Invoice ───────────────────────────────────────────────────────────────────
export const downloadInvoiceBlob = (id, signal) =>
  API.get(`/subscription/${id}/invoice`, { responseType: "blob", signal });

// ── Audit / payment history ───────────────────────────────────────────────────
export const getAuditLogs = (id, signal) =>
  API.get(`/subscription/${id}/audit`, { signal });

// ── Upgrade request (unauthenticated lead form) ───────────────────────────────
export const submitUpgradeRequest = (payload, signal) =>
  API.post("/subscription/upgrade-request", payload, { signal });
