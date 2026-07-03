"use strict";

// ======================================================
// services/paypal.service.js
// PayPal REST API v2 Integration
//
// Required env vars (all must be set explicitly in .env):
//   PAYPAL_CLIENT_ID      — from PayPal Developer Dashboard
//   PAYPAL_CLIENT_SECRET  — from PayPal Developer Dashboard
//   PAYPAL_WEBHOOK_ID     — from PayPal Webhook settings
//   PAYPAL_MODE           — "sandbox" | "live"          (default: sandbox)
//   PAYPAL_CURRENCY       — ISO-4217 currency code, e.g. "USD" or "INR"
//                           No default — must be explicit.
//                           Sandbox:    set to "USD" (sandbox merchant accounts
//                                       are US-based; INR is rejected unless the
//                                       sandbox facilitator is an India account)
//                           Production: set to "INR" (requires a PayPal India
//                                       Business account at paypal.com/in)
//   CLIENT_URL            — Frontend base URL (for return/cancel URLs)
// ======================================================

const axios = require("axios");

// ── Config ────────────────────────────────────────────────────────────────────
const MODE     = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
const BASE_URL = MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

/**
 * getPayPalCurrency — single source of truth for the currency sent to PayPal.
 *
 * Sandbox always returns "USD".
 *   US-based sandbox merchant accounts reject INR with CURRENCY_NOT_SUPPORTED.
 *   Auto-switching to USD removes the need for manual .env changes during testing
 *   and prevents the error from ever reaching the frontend.
 *
 * Live returns PAYPAL_CURRENCY from .env (default "INR").
 *   Set PAYPAL_CURRENCY=INR in .env and use a PayPal India Business account
 *   (paypal.com/in) for production rupee payments.
 */
const getPayPalCurrency = () => {
  if (MODE === "sandbox") {
    return "USD";
  }
  return process.env.PAYPAL_CURRENCY || "INR";
};

// Cached for backward-compat with code that imports the static CURRENCY export.
// MODE never changes at runtime, so this equals getPayPalCurrency() for the
// entire lifetime of the process.
const CURRENCY = getPayPalCurrency();

// Snapshot credentials at module load so we can reference them without
// re-reading process.env on every request. Also lets us detect "undefined"
// string values that some misconfigured dotenv setups can produce.
const _CLIENT_ID     = process.env.PAYPAL_CLIENT_ID;
const _CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const _WEBHOOK_ID    = process.env.PAYPAL_WEBHOOK_ID;

// A value is "present" only if it is a non-empty string that is not the
// literal text "undefined" or a placeholder template like <...>
const _isPresent = (v) =>
  typeof v === "string" &&
  v.trim().length > 0 &&
  v !== "undefined" &&
  !v.startsWith("<");

// configured = credentials present and usable. Currency is a separate concern
// reported via currencyConfigured in getConfigStatus(). Coupling them caused
// getConfigStatus().configured=false when only PAYPAL_CURRENCY was absent,
// blocking the controller pre-flight even though PayPal could be contacted.
const _CREDS_OK = _isPresent(_CLIENT_ID) && _isPresent(_CLIENT_SECRET);

// ── Startup diagnostics ───────────────────────────────────────────────────────
const _mask = (s) =>
  _isPresent(s) ? `${s.slice(0, 8)}${"*".repeat(Math.max(0, s.length - 8))}` : null;

console.log(
  `[PayPal] mode=${MODE} | currency=${getPayPalCurrency()} | ` +
  `clientId=${_mask(_CLIENT_ID) ?? "NOT SET"} | ` +
  `secret=${_isPresent(_CLIENT_SECRET) ? "SET" : "NOT SET"} | ` +
  `webhookId=${_isPresent(_WEBHOOK_ID) ? "SET" : "NOT SET"} | ` +
  `configured=${_CREDS_OK}`
);

if (!_isPresent(_CLIENT_ID) || !_isPresent(_CLIENT_SECRET)) {
  console.error(
    "[PayPal] CRITICAL: Credentials are not configured.\n" +
    "  → Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your .env file.\n" +
    "  → Get sandbox credentials at https://developer.paypal.com/dashboard/applications/sandbox\n" +
    "  → All PayPal routes will return 503 until credentials are provided."
  );
}

// Inform the developer that we are auto-switching currency for sandbox.
// This is not a warning — it is the intended behaviour.
if (MODE === "sandbox") {
  const envCurrency = process.env.PAYPAL_CURRENCY || "INR";
  if (envCurrency !== "USD") {
    console.log(
      `[PayPal] Sandbox detected. Using USD because INR is not supported in Sandbox.\n` +
      `  → PAYPAL_CURRENCY=${envCurrency} in .env is ignored in sandbox mode.\n` +
      `  → Invoices are still generated in INR using EXCHANGE_RATE_INR.\n` +
      `  → For production (live): set PAYPAL_CURRENCY=INR with a PayPal India Business account.`
    );
  }
}

// ── Token cache ───────────────────────────────────────────────────────────────
let _accessToken    = null;
let _tokenExpiresAt = 0;

// ── Error classes ─────────────────────────────────────────────────────────────
class PayPalError extends Error {
  /**
   * @param {string}   message     Human-readable description
   * @param {number}   statusCode  HTTP status to forward to caller
   * @param {string}   paypalCode  PayPal error name/code (e.g. "INVALID_CLIENT")
   * @param {string[]} details     Array of field-level PayPal error descriptions
   */
  constructor(message, statusCode = 500, paypalCode = null, details = []) {
    super(message);
    this.name       = "PayPalError";
    this.statusCode = statusCode;
    this.paypalCode = paypalCode;
    this.details    = details;
  }
}

// ── Error mapper ──────────────────────────────────────────────────────────────
const mapPayPalError = (err) => {
  const httpStatus = err.response?.status;
  const data       = err.response?.data;

  // Extract all PayPal field-level error details
  const details = (data?.details || [])
    .map((d) => [d.field, d.issue || d.description].filter(Boolean).join(": "))
    .filter(Boolean);

  let message =
    data?.message ||
    data?.error_description ||
    (data?.details?.[0]?.description) ||
    err.message ||
    "PayPal request failed";

  // Provide actionable hint for the most common failure mode
  if (httpStatus === 401) {
    message +=
      `. Verify PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are valid ` +
      `credentials for '${MODE}' mode (${BASE_URL}). ` +
      `Sandbox and live credentials are NOT interchangeable.`;
  }

  console.error("[PayPal] API error:", {
    httpStatus,
    paypalCode:  data?.name || data?.error,
    message,
    details,
    url: err.config?.url,
  });

  return new PayPalError(
    message,
    httpStatus || 500,
    data?.name || data?.error || null,
    details
  );
};

// ── OAuth2 Access Token ───────────────────────────────────────────────────────
const getAccessToken = async () => {
  // Guard: reject immediately instead of sending "undefined:undefined" to PayPal
  if (!_CREDS_OK) {
    throw new PayPalError(
      "PayPal credentials not configured — set PAYPAL_CLIENT_ID and " +
      "PAYPAL_CLIENT_SECRET in .env before using payment routes",
      503,
      "CREDENTIALS_NOT_CONFIGURED"
    );
  }

  // Reuse cached token if still valid (with 60 s buffer)
  if (_accessToken && Date.now() < _tokenExpiresAt - 60_000) {
    return _accessToken;
  }

  const credentials = Buffer.from(`${_CLIENT_ID}:${_CLIENT_SECRET}`).toString("base64");

  try {
    const { data } = await axios.post(
      `${BASE_URL}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization:  `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    _accessToken    = data.access_token;
    _tokenExpiresAt = Date.now() + data.expires_in * 1000;

    console.log(
      `[PayPal] Access token acquired — ` +
      `expires in ${data.expires_in}s | ` +
      `prefix=${_accessToken.slice(0, 8)}***`
    );

    return _accessToken;
  } catch (err) {
    // Reset cache so the next call retries
    _accessToken    = null;
    _tokenExpiresAt = 0;
    throw mapPayPalError(err);
  }
};

// ── Authenticated request factory ─────────────────────────────────────────────
// idempotencyKey: pass a stable, deterministic value for operations that must
// not be duplicated (order creation). Omit for read-only requests or operations
// where each call is intentionally a new action (e.g. capture, cancel).
const paypalRequest = async (method, path, body = null, idempotencyKey = null) => {
  const token = await getAccessToken();

  const requestId = idempotencyKey
    || `rts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const config = {
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization:       `Bearer ${token}`,
      "Content-Type":      "application/json",
      "PayPal-Request-Id": requestId,
    },
  };
  if (body) config.data = body;

  try {
    const { data } = await axios(config);
    return data;
  } catch (err) {
    throw mapPayPalError(err);
  }
};

// ══════════════════════════════════════════════════════
// ONE-TIME PAYMENT — Orders API v2
// ══════════════════════════════════════════════════════

/**
 * Create a PayPal checkout order.
 * Returns { orderId, approvalUrl } — redirect user to approvalUrl.
 */
const createOrder = async ({
  plan,
  billingCycle,
  amount,
  currency = getPayPalCurrency(),
  description,
  subscriptionId,
}) => {
  if (!currency) {
    throw new PayPalError(
      "PAYPAL_CURRENCY is not configured — set it in .env before creating orders",
      503,
      "CURRENCY_NOT_CONFIGURED"
    );
  }

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  // Validate amount to prevent sending "NaN" or "undefined" to PayPal,
  // which would result in a confusing validation error.
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new PayPalError(
      `Invalid order amount: ${amount}. Check plan pricing for currency ${currency}.`,
      422,
      "INVALID_AMOUNT"
    );
  }

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        custom_id: subscriptionId,
        description: description || `ReadyTech ${plan} Plan (${billingCycle})`,
        amount: {
          currency_code: currency,
          value: numericAmount.toFixed(2),
        },
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          // IMMEDIATE_PAYMENT_REQUIRED ensures payment is collected on checkout
          // without this, some PayPal account configurations allow deferred payment.
          payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
          brand_name:                "ReadyTech Solutions",
          locale:                    "en-IN",
          landing_page:              "LOGIN",
          shipping_preference:       "NO_SHIPPING",
          user_action:               "PAY_NOW",
          return_url:                `${clientUrl}/billing/payment-success`,
          cancel_url:                `${clientUrl}/billing/payment-cancel`,
        },
      },
    },
  };

  // Idempotency key derived from the subscription so that retrying the same
  // order creation returns the existing PayPal order rather than creating a duplicate.
  const idempotencyKey = `rts-order-${subscriptionId}`;

  const data = await paypalRequest("POST", "/v2/checkout/orders", body, idempotencyKey);

  const approvalUrl = data.links?.find((l) => l.rel === "payer-action")?.href;

  if (!approvalUrl) {
    throw new PayPalError("PayPal did not return an approval URL", 502);
  }

  return { orderId: data.id, approvalUrl, status: data.status };
};

/**
 * Capture an approved PayPal order.
 */
const captureOrder = async (orderId) => {
  const data = await paypalRequest(
    "POST",
    `/v2/checkout/orders/${orderId}/capture`,
    {}
  );

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

  if (!capture) {
    throw new PayPalError("Capture details missing in PayPal response", 502);
  }

  return {
    orderId:        data.id,
    captureId:      capture.id,
    status:         capture.status,
    amount:         capture.amount?.value,
    currency:       capture.amount?.currency_code,
    subscriptionId: data.purchase_units?.[0]?.custom_id || null,
    payerEmail:     data.payment_source?.paypal?.email_address || null,
    payerName:      data.payment_source?.paypal?.name?.given_name
      ? `${data.payment_source.paypal.name.given_name} ${data.payment_source.paypal.name.surname || ""}`.trim()
      : null,
    capturedAt: capture.create_time,
  };
};

/** Get order details. */
const getOrderDetails = async (orderId) =>
  paypalRequest("GET", `/v2/checkout/orders/${orderId}`);

// ══════════════════════════════════════════════════════
// RECURRING SUBSCRIPTIONS — Billing Subscriptions API
// ══════════════════════════════════════════════════════

const createProduct = async ({ name, description }) =>
  paypalRequest("POST", "/v1/catalogs/products", {
    name, description, type: "SERVICE", category: "SOFTWARE",
  });

const createBillingPlan = async ({
  productId, name, amount, currency = getPayPalCurrency(), intervalUnit = "MONTH",
}) =>
  paypalRequest("POST", "/v1/billing/plans", {
    product_id: productId,
    name,
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency:      { interval_unit: intervalUnit, interval_count: 1 },
        tenure_type:    "REGULAR",
        sequence:       1,
        total_cycles:   0,
        pricing_scheme: {
          fixed_price: {
            value:         String(Number(amount).toFixed(2)),
            currency_code: currency,
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding:      true,
      setup_fee_failure_action:   "CONTINUE",
      payment_failure_threshold:  3,
    },
  });

const createSubscription = async ({
  paypalPlanId, subscriberName, subscriberEmail, subscriptionId,
}) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const nameParts = subscriberName.split(" ");

  const data = await paypalRequest("POST", "/v1/billing/subscriptions", {
    plan_id:   paypalPlanId,
    custom_id: subscriptionId,
    subscriber: {
      name: {
        given_name: nameParts[0],
        surname:    nameParts.slice(1).join(" ") || "",
      },
      email_address: subscriberEmail,
    },
    application_context: {
      brand_name:          "ReadyTech Solutions",
      locale:              "en-IN",
      shipping_preference: "NO_SHIPPING",
      user_action:         "SUBSCRIBE_NOW",
      return_url:          `${clientUrl}/billing/payment-success`,
      cancel_url:          `${clientUrl}/billing/payment-cancel`,
    },
  });

  const approvalUrl = data.links?.find((l) => l.rel === "approve")?.href;

  return {
    paypalSubscriptionId: data.id,
    approvalUrl,
    status: data.status,
  };
};

const cancelSubscription = async (
  paypalSubscriptionId,
  reason = "Customer requested cancellation"
) => {
  await paypalRequest(
    "POST",
    `/v1/billing/subscriptions/${paypalSubscriptionId}/cancel`,
    { reason }
  );
  return { cancelled: true, paypalSubscriptionId };
};

const getSubscriptionDetails = async (paypalSubscriptionId) =>
  paypalRequest("GET", `/v1/billing/subscriptions/${paypalSubscriptionId}`);

// ══════════════════════════════════════════════════════
// WEBHOOK VERIFICATION
// ══════════════════════════════════════════════════════

const verifyWebhookSignature = async (headers, rawBody) => {
  const webhookId = _WEBHOOK_ID;

  if (!webhookId) {
    console.warn(
      "[PayPal] PAYPAL_WEBHOOK_ID not set — skipping signature verification. " +
      "Unsafe in production."
    );
    // Allow in dev; block in production
    return process.env.NODE_ENV !== "production";
  }

  const body = {
    auth_algo:         headers["paypal-auth-algo"],
    cert_url:          headers["paypal-cert-url"],
    transmission_id:   headers["paypal-transmission-id"],
    transmission_sig:  headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id:        webhookId,
    webhook_event:     JSON.parse(rawBody.toString()),
  };

  try {
    const data = await paypalRequest(
      "POST",
      "/v1/notifications/verify-webhook-signature",
      body
    );
    return data.verification_status === "SUCCESS";
  } catch (err) {
    console.error("[PayPal] Webhook verification failed:", err.message);
    return false;
  }
};

// ══════════════════════════════════════════════════════
// REFUNDS
// ══════════════════════════════════════════════════════

const refundCapture = async (captureId, amount = null, currency = getPayPalCurrency(), note = "") => {
  const body = {};
  if (amount) {
    body.amount = {
      value:         String(Number(amount).toFixed(2)),
      currency_code: currency,
    };
  }
  if (note) body.note_to_payer = note;

  return paypalRequest("POST", `/v2/payments/captures/${captureId}/refund`, body);
};

// ══════════════════════════════════════════════════════
// DIAGNOSTICS HELPERS
// ══════════════════════════════════════════════════════

/**
 * Return current configuration status without making any API call.
 * Safe to call from diagnostics endpoints at any time.
 */
const getConfigStatus = () => ({
  configured:          _CREDS_OK,
  mode:                MODE,
  currency:            getPayPalCurrency(),
  currencyConfigured:  true,   // always determined programmatically, never undefined
  baseUrl:             BASE_URL,
  clientIdPresent:     _isPresent(_CLIENT_ID),
  clientIdPrefix:      _isPresent(_CLIENT_ID) ? _CLIENT_ID.slice(0, 8) + "***" : null,
  clientSecretPresent: _isPresent(_CLIENT_SECRET),
  webhookIdPresent:    _isPresent(_WEBHOOK_ID),
  tokenCached:         !!(_accessToken && Date.now() < _tokenExpiresAt - 60_000),
  tokenExpiresAt:      _tokenExpiresAt > 0 ? new Date(_tokenExpiresAt).toISOString() : null,
});

/**
 * Attempt to acquire an OAuth access token and report the result.
 * Use this from the /debug/paypal endpoint to confirm credentials are valid.
 */
const testCredentials = async () => {
  if (!_CREDS_OK) {
    return {
      success: false,
      error:   "Credentials not configured",
      code:    "CREDENTIALS_NOT_CONFIGURED",
    };
  }

  try {
    const token = await getAccessToken();
    return {
      success:     true,
      tokenPrefix: token.slice(0, 8) + "***",
      mode:        MODE,
    };
  } catch (err) {
    return {
      success: false,
      error:   err.message,
      code:    err.paypalCode || "UNKNOWN",
      details: err.details || [],
    };
  }
};

// ══════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════

module.exports = {
  // Payment flows
  getAccessToken,
  createOrder,
  captureOrder,
  getOrderDetails,

  // Recurring
  createProduct,
  createBillingPlan,
  createSubscription,
  cancelSubscription,
  getSubscriptionDetails,

  // Verification
  verifyWebhookSignature,
  refundCapture,

  // Diagnostics
  getConfigStatus,
  testCredentials,

  // Currency helper — use getPayPalCurrency() for all PayPal request currency decisions.
  // CURRENCY is a backward-compat alias (same value, computed once at module load).
  getPayPalCurrency,
  PayPalError,
  MODE,
  BASE_URL,
  CURRENCY,
};
