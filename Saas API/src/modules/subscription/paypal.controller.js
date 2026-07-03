"use strict";

// ======================================================
// paypal.controller.js
// Handles PayPal one-time payments and recurring subscriptions
// ======================================================

const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess, sendError } = require("../../utils/apiResponse");
const paypalService = require("../../services/paypal.service");
const tokenBilling = require("../../services/tokenBilling.service");
const provisioningService = require("../../services/provisioning.service");
const Subscription = require("./subscription.model");
const { getPlan, getPriceForCurrency, getInrPrice } = require("./subscription.plans");
const PaymentTransaction = require("../billing/models/paymentTransaction.model");
const InvoiceService = require("../../services/invoice.service");
const events = require("./subscription.events");

// ── Single source of truth for currency ───────────────────────────────────────
// getPayPalCurrency() returns "USD" in sandbox (auto-switch: sandbox accounts
// reject INR) and process.env.PAYPAL_CURRENCY||"INR" in live mode.
// Never read PAYPAL_CURRENCY from process.env directly — the service owns that.
const PAYPAL_CURRENCY = paypalService.getPayPalCurrency();

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAYS_PER_CYCLE = { monthly: 30, yearly: 365 };
// getPriceForCurrency and getInrPrice are imported from subscription.plans.js —
// all price selection logic lives there, not in controllers.

// ══════════════════════════════════════════════════════
// CREATE ORDER
// POST /api/v1/subscriptions/paypal/create-order
//
// Creates a PayPal checkout order for an existing (pending) subscription.
// Returns { orderId, approvalUrl } — frontend redirects user to approvalUrl.
// ══════════════════════════════════════════════════════
exports.createOrder = asyncHandler(async (req, res) => {
  // Pre-flight: refuse immediately if PayPal is not configured rather than
  // sending "undefined:undefined" to PayPal and getting a cryptic 401 back.
  const cfg = paypalService.getConfigStatus();
  if (!cfg.configured) {
    return res.status(503).json({
      success: false,
      errorCode: "PAYPAL_NOT_CONFIGURED",
      message: "PayPal credentials are not configured on this server. Contact support.",
      hint: "Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your .env file.",
      diagnostics: process.env.NODE_ENV !== "production" ? cfg : undefined,
    });
  }

  const { subscriptionId } = req.body;

  if (!subscriptionId) {
    return sendError(res, "subscriptionId is required", 400);
  }

  // Load and verify ownership
  // `let` — may be reassigned below when stale-ID auto-redirect fires.
  let sub = await Subscription.findById(subscriptionId);
  if (!sub) return sendError(res, "Subscription not found", 404);

  const isAdmin = ["admin", "superadmin"].includes(req.user.role);
  const isOwner =
    sub.userId?.toString() === req.user.id ||
    sub.clientEmail === req.user.email;

  if (!isAdmin && !isOwner) {
    return sendError(res, "Access denied — you do not own this subscription", 403);
  }

  console.log(
    "[PayPal/createOrder] LOADED sub=%s status=%s plan=%s billingCycle=%s userId=%s companyId=%s",
    sub._id, sub.status, sub.plan, sub.billingCycle, req.user.id, sub.companyId
  );

  // ── STALE-ID AUTO-REDIRECT ────────────────────────────────────────────────────
  // If the requested subscriptionId is for an ACTIVE subscription, look for a
  // RECENT (< 15 min) pending subscription for the same company.
  //
  // WHY: the frontend always calls createIntent before createOrder (creating a
  // new pending sub), then passes the new sub's _id to createOrder. In rare
  // cases (stale sessionStorage, React state desync, race condition) it may
  // accidentally pass the OLD active sub's _id instead. Silently redirecting to
  // the most-recently-created pending sub recovers those cases without blocking
  // a valid upgrade/renewal/fresh-subscription checkout.
  //
  // DUPLICATE GUARD: if no pending sub was created recently for the company,
  // the request is a genuine duplicate-purchase attempt → block it.
  if (sub.status === "active") {
    const STALE_CUTOFF = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes
    const recentPending = await Subscription.findOne({
      companyId: sub.companyId,
      status:    "pending",
      _id:       { $ne: sub._id },
      createdAt: { $gte: STALE_CUTOFF },
    }).sort({ createdAt: -1 });

    if (recentPending) {
      const pendingIsOwned =
        isAdmin ||
        recentPending.userId?.toString() === req.user.id ||
        recentPending.clientEmail === req.user.email;

      if (pendingIsOwned) {
        console.warn(
          "[PayPal/createOrder] STALE-ID auto-redirect — active sub=%s plan=%s → pending sub=%s plan=%s billingCycle=%s companyId=%s userId=%s",
          sub._id, sub.plan,
          recentPending._id, recentPending.plan, recentPending.billingCycle,
          sub.companyId, req.user.id
        );
        sub = recentPending; // proceed with the pending subscription
      } else {
        console.warn(
          "[PayPal/createOrder] BLOCKED auto-redirect ownership mismatch — active sub=%s, pending sub=%s pendingUserId=%s requestUserId=%s",
          sub._id, recentPending._id, recentPending.userId, req.user.id
        );
      }
    }
  }

  // ── STATUS GUARD ──────────────────────────────────────────────────────────────
  // At this point `sub` is either the original pending sub (normal path) or the
  // auto-redirected pending sub (stale-ID recovery). Any other status is invalid.
  if (sub.status !== "pending") {
    if (sub.status === "active") {
      // Reaches here only when no recent pending sub exists for the company →
      // genuine duplicate-purchase attempt on an already-active subscription.
      console.warn(
        "[PayPal/createOrder] BLOCKED genuine duplicate — sub=%s status=active plan=%s billingCycle=%s userId=%s companyId=%s reason=no_recent_pending_found",
        sub._id, sub.plan, sub.billingCycle, req.user.id, sub.companyId
      );
      return sendError(
        res,
        "This subscription is already active. To upgrade or change your plan, select the new plan from the Plans section and start a fresh checkout.",
        409
      );
    }
    if (sub.status === "cancelled" || sub.status === "expired") {
      // A cancelled/expired sub ID was passed directly. For normal renewal/
      // re-subscription flows, the frontend calls createIntent first (new
      // pending sub), so this 410 only fires when someone passes a stale ID.
      console.warn(
        "[PayPal/createOrder] BLOCKED stale checkout — sub=%s status=%s plan=%s billingCycle=%s userId=%s companyId=%s reason=session_no_longer_valid",
        sub._id, sub.status, sub.plan, sub.billingCycle, req.user.id, sub.companyId
      );
      return sendError(
        res,
        "This checkout session is no longer valid — the subscription was cancelled or expired. Please select your plan again to start a new checkout.",
        410
      );
    }
    if (sub.status === "paused") {
      console.warn(
        "[PayPal/createOrder] BLOCKED paused — sub=%s plan=%s billingCycle=%s userId=%s companyId=%s reason=subscription_paused",
        sub._id, sub.plan, sub.billingCycle, req.user.id, sub.companyId
      );
      return sendError(
        res,
        "This subscription is paused. Contact support to resume it, or select a new plan to start a fresh checkout.",
        409
      );
    }
    console.warn(
      "[PayPal/createOrder] BLOCKED invalid state — sub=%s status=%s plan=%s billingCycle=%s userId=%s companyId=%s reason=not_in_payable_state",
      sub._id, sub.status, sub.plan, sub.billingCycle, req.user.id, sub.companyId
    );
    return sendError(
      res,
      `Subscription is not in a payable state (current status: '${sub.status}'). Please start a new checkout.`,
      409
    );
  }

  console.log(
    "[PayPal/createOrder] PROCEEDING sub=%s status=pending plan=%s billingCycle=%s companyId=%s",
    sub._id, sub.plan, sub.billingCycle, sub.companyId
  );

  const planConfig = getPlan(sub.plan);
  if (!planConfig) return sendError(res, `Unknown plan: ${sub.plan}`, 400);

  // PayPal wire currency — "USD" in sandbox, PAYPAL_CURRENCY in live
  const currency = PAYPAL_CURRENCY;

  // Amount sent to PayPal — in the PayPal wire currency (USD for sandbox).
  // This is NOT the invoice amount. The invoice always uses INR plan pricing.
  const paypalAmount = getPriceForCurrency(planConfig, sub.billingCycle, currency);

  // Create PayPal order — getPayPalCurrency() already auto-switches to USD in
  // sandbox, so CURRENCY_NOT_SUPPORTED should not occur. Keep the catch as a
  // safety net for unexpected live-mode misconfigurations.
  let orderId, approvalUrl, status;
  try {
    ({ orderId, approvalUrl, status } = await paypalService.createOrder({
      plan:           sub.plan,
      billingCycle:   sub.billingCycle,
      amount:         paypalAmount,
      currency,
      description:    `ReadyTech ${planConfig.name} (${sub.billingCycle})`,
      subscriptionId: sub._id.toString(),
    }));
  } catch (createErr) {
    const isUnsupported = [
      ...(createErr?.details || []),
      createErr?.paypalCode || "",
      String(createErr?.message || ""),
    ].some((s) => String(s).includes("CURRENCY_NOT_SUPPORTED"));

    if (isUnsupported) {
      return res.status(422).json({
        success: false,
        errorCode: "CURRENCY_NOT_SUPPORTED",
        message: `Your PayPal merchant account does not support ${currency}. Contact your PayPal account manager.`,
      });
    }
    throw createErr;
  }

  // Persist the PayPal order reference on the subscription.
  // CRITICAL: do NOT overwrite sub.amount or sub.currency here.
  // sub.amount was set to the INR plan price in createIntent and must stay INR
  // so that generateInvoice / downloadInvoice read the correct amount.
  // The USD PayPal charge amount is stored in PaymentTransaction below.
  sub.paypalOrderId  = orderId;
  sub.paymentGateway = "paypal";
  await sub.save();

  // Pending transaction record — stores the actual PayPal charge (USD in sandbox)
  await PaymentTransaction.create({
    subscriptionId:  sub._id,
    companyId:       sub.companyId,
    userId:          req.user.id,
    type:            "subscription_payment",
    gateway:         "paypal",
    plan:            sub.plan,
    billingCycle:    sub.billingCycle,
    amount:          paypalAmount,   // what PayPal will charge
    currency,                        // "USD" in sandbox
    paypalOrderId:   orderId,
    status:          "pending",
  });

  return sendSuccess(
    res,
    { orderId, approvalUrl, paypalStatus: status },
    "PayPal order created — redirect user to approvalUrl",
    201
  );
});

// ══════════════════════════════════════════════════════
// CAPTURE ORDER
// POST /api/v1/subscriptions/paypal/capture-order
//
// Called after user returns from PayPal approval.
// Activates the subscription and allocates AI token budget.
// ══════════════════════════════════════════════════════
exports.captureOrder = asyncHandler(async (req, res) => {
  const cfg = paypalService.getConfigStatus();
  if (!cfg.configured) {
    return res.status(503).json({
      success: false,
      errorCode: "PAYPAL_NOT_CONFIGURED",
      message: "PayPal credentials are not configured on this server. Contact support.",
      hint: "Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your .env file.",
      diagnostics: process.env.NODE_ENV !== "production" ? cfg : undefined,
    });
  }

  const { orderId } = req.body;

  if (!orderId) return sendError(res, "orderId is required", 400);

  // Look up the subscription FIRST so we can guard idempotency before hitting PayPal.
  // This avoids an unnecessary API round-trip on every duplicate request.
  const sub = await Subscription.findOne({ paypalOrderId: orderId });
  if (!sub) {
    return sendError(res, "Subscription not found for this order", 404);
  }

  // ── IDEMPOTENCY GUARD ──────────────────────────────────────────────────────────
  // If this subscription is already active and paid, a previous call already
  // completed the capture. Return the same success shape without calling PayPal again.
  // Handles: Postman retries, frontend double-submits, webhook + manual capture races.
  if (sub.status === "active" && sub.paymentStatus === "paid" && sub.transactionId) {
    return sendSuccess(res, {
      subscriptionId: sub._id,
      status:         sub.status,
      plan:           sub.plan,
      billingCycle:   sub.billingCycle,
      renewalDate:    sub.renewalDate,
      captureId:      sub.transactionId,
      invoiceId:      sub.invoice?.invoiceId || null,
    }, "Payment already captured — subscription is active");
  }

  // ── CAPTURE AT PAYPAL ──────────────────────────────────────────────────────────
  // Guard ORDER_ALREADY_CAPTURED: PayPal rejects a second capture attempt on the
  // same order even when the first succeeded. This can happen when two requests
  // arrive simultaneously (e.g. user clicks twice, frontend + webhook both fire).
  let capture;
  try {
    capture = await paypalService.captureOrder(orderId);
  } catch (paypalErr) {
    // ── DETECTION ─────────────────────────────────────────────────────────────
    // mapPayPalError() in paypal.service.js converts PayPal's response.data.details
    // array into a *string* array (each entry = "field: issue" or just "issue").
    // So paypalErr.details[0] is the string "ORDER_ALREADY_CAPTURED", NOT an
    // object — paypalErr?.details?.[0]?.issue is always undefined.
    // paypalErr.paypalCode holds the top-level name: "UNPROCESSABLE_ENTITY".
    // We must scan all three string sources to detect ORDER_ALREADY_CAPTURED.
    const isAlreadyCaptured = [
      ...(paypalErr?.details || []),        // string[] — "ORDER_ALREADY_CAPTURED" is here
      paypalErr?.paypalCode || "",           // "UNPROCESSABLE_ENTITY"
      String(paypalErr?.message || ""),      // human message (fallback)
    ].some((s) => String(s).includes("ORDER_ALREADY_CAPTURED"));

    if (!isAlreadyCaptured) {
      throw paypalErr; // unexpected error — let asyncHandler propagate it
    }

    // ── RECOVERY PATH ──────────────────────────────────────────────────────────
    // PayPal says the order was already captured, but our DB is still "pending".
    // Root cause: server crashed / timed out after PayPal collected the payment
    // but before the MongoDB write completed (network drop, deploy, OOM kill).
    //
    // Fix: call getOrderDetails() to read the existing capture record from PayPal,
    // build the same `capture` object shape as captureOrder() returns, then fall
    // through to the normal activation block — no separate code path needed.
    console.log("[PayPal] Recovery started — orderId:", orderId);
    console.log("[PayPal] Subscription Before:", sub.status, sub.paymentStatus);

    let orderDetails;
    try {
      orderDetails = await paypalService.getOrderDetails(orderId);
    } catch (detailsErr) {
      console.error("[PayPal] getOrderDetails failed during recovery:", detailsErr.message);
      return sendError(
        res,
        "Payment was already captured by PayPal but capture details could not be retrieved. Contact support.",
        502
      );
    }

    console.log("[PayPal] Order Details:", JSON.stringify(orderDetails, null, 2));

    const captureRecord = orderDetails.purchase_units?.[0]?.payments?.captures?.[0];

    console.log("[PayPal] Capture Record:", JSON.stringify(captureRecord ?? null, null, 2));

    if (!captureRecord?.id) {
      return sendError(
        res,
        "Payment was already captured by PayPal but capture ID is missing in order details. Contact support.",
        502
      );
    }

    // Build the same shape that paypalService.captureOrder() returns so the
    // activation block works identically for both fresh and recovered captures.
    capture = {
      orderId:        orderDetails.id,
      captureId:      captureRecord.id,
      status:         captureRecord.status || "COMPLETED",
      amount:         captureRecord.amount?.value,
      currency:       captureRecord.amount?.currency_code,
      subscriptionId: orderDetails.purchase_units?.[0]?.custom_id || null,
      payerEmail:     orderDetails.payment_source?.paypal?.email_address || null,
      capturedAt:     captureRecord.create_time,
    };

    console.log(`[PayPal] Recovery capture built — captureId=${capture.captureId} status=${capture.status}`);
  }

  if (capture.status !== "COMPLETED") {
    return sendError(
      res,
      `Payment not completed — PayPal status: ${capture.status}`,
      402
    );
  }

  // ── ACTIVATE SUBSCRIPTION ──────────────────────────────────────────────────────
  const now = new Date();
  const daysToAdd = DAYS_PER_CYCLE[sub.billingCycle] || 30;
  const renewalDate = new Date(now);
  renewalDate.setDate(renewalDate.getDate() + daysToAdd);

  // Step 1 — cancel all competing active/pending subscriptions for the same company
  // BEFORE activating this one. Moves them out of the partial unique-index scope so
  // that sub.save() below cannot hit E11000 { unique_active_per_company }.
  await Subscription.updateMany(
    { companyId: sub.companyId, status: { $in: ["pending", "active"] }, _id: { $ne: sub._id } },
    { $set: { status: "cancelled", cancelledAt: now, autoRenew: false } }
  );

  // Step 2 — activate (safe now that competitors are cancelled)
  console.log("[PayPal] Subscription Before activation:", sub.status, sub.paymentStatus);

  sub.status = "active";
  sub.paymentStatus = "paid";
  sub.transactionId = capture.captureId;
  sub.lastPaymentDate = now;
  sub.renewalDate = renewalDate;
  if (capture.payerEmail) sub.paypalCustomerId = capture.payerEmail;
  try {
    await sub.save();
  } catch (saveErr) {
    if (saveErr.code === 11000) {
      // Narrow race: a concurrent capture activated a different subscription
      // between the updateMany and this save
      return sendError(res, "A concurrent payment is already activating a subscription for this company. Refresh and try again.", 409);
    }
    throw saveErr;
  }

  console.log("[PayPal] Subscription After activation:", sub.status, sub.paymentStatus);

  // Allocate AI token budget for this billing period
  try {
    await tokenBilling.allocateTokens(sub._id);
  } catch (err) {
    console.error("[PayPal] Token allocation failed (non-fatal):", err.message);
  }

  // Provision / update company and user account
  try {
    await provisioningService.provisionAfterPayment(sub, req.user);
  } catch (err) {
    console.error("[PayPal] Provisioning failed (non-fatal):", err.message);
  }

  // ── Dual-currency resolution ────────────────────────────────────────────────
  // paymentCurrency / paymentAmount = what PayPal actually charged (audit trail only).
  // invoiceAmount                   = canonical INR price from the plan definition.
  //
  // IMPORTANT: never use paymentAmount as the invoice amount when it is in USD.
  // USD → INR arithmetic (paymentAmount * exchangeRate) would give a different
  // number than the plan's listed INR price because:
  //   - PayPal sandbox uses $240 for Enterprise; plan lists ₹19,999.
  //   - 240 × 86.75 = ₹20,820 ≠ ₹19,999 — wrong invoice total.
  //
  // The invoice must be based on the plan's INR price so the customer always
  // sees the agreed-upon amount in INR and GST is calculated correctly.
  const planConfig      = getPlan(sub.plan);
  const paymentCurrency = capture.currency || PAYPAL_CURRENCY;
  const paymentAmount   = Math.round((parseFloat(capture.amount || sub.amount) || 0) * 100) / 100;
  const exchRate        = paymentCurrency !== "INR"
    ? (parseFloat(process.env.EXCHANGE_RATE_INR) || null)
    : null;

  // Always pull invoice amount from the plan's INR pricing table.
  const invoiceAmount = sub.billingCycle === "yearly"
    ? (planConfig?.pricing?.yearly  || 0)
    : (planConfig?.pricing?.monthly || 0);

  // Mark transaction completed — audit record stores both payment and invoice currency
  await PaymentTransaction.findOneAndUpdate(
    { paypalOrderId: orderId, status: "pending" },
    {
      paypalCaptureId: capture.captureId,
      status:          "completed",
      processedAt:     now,
      paymentCurrency,
      paymentAmount,
      exchangeRate:    exchRate,
      invoiceCurrency: "INR",
      invoiceAmount,
    }
  );

  // Generate enterprise invoice
  let invoiceResult = null;
  try {
    // planConfig is already available from the block above
    invoiceResult = await InvoiceService.generateInvoice({
      customer: {
        name: sub.clientName,
        email: sub.clientEmail,
      },
      subscription: {
        plan: sub.plan,
        billingCycle: sub.billingCycle,
        status: "active",
        renewalDate,
      },
      paypalTransaction: {
        captureId: capture.captureId,
        orderId,
        payerEmail: capture.payerEmail,
        capturedAt: capture.capturedAt,
      },
      // Dual-currency metadata — drives the "Currency Conversion" card in the PDF
      paymentCurrency,
      paymentAmount,
      exchangeRate:   exchRate,
      currency:       "INR",        // all GST calculations in INR
      items: [
        {
          name:        `${planConfig?.name || sub.plan} Plan`,
          description: `Billing Cycle: ${sub.billingCycle}`,
          qty:         1,
          price:       invoiceAmount, // canonical INR plan price — never the USD payment amount
        },
      ],
      discount: 0,
      cgst: 9,
      sgst: 9,
      igst: 0,
    });

    if (invoiceResult?.invoice) {
      sub.invoice = {
        invoiceId: invoiceResult.invoice.invoiceId,
        url: `/uploads/invoices/${invoiceResult.invoice.fileName}`,
        generatedAt: now,
      };
      await sub.save();
    }
  } catch (err) {
    console.error("[PayPal] Invoice generation failed (non-fatal):", err.message);
  }

  // Emit event for email notifications
  events.emit("paypal.payment.success", {
    clientEmail: sub.clientEmail,
    clientName: sub.clientName,
    plan: sub.plan,
    amount: sub.amount,
    currency: sub.currency,
    transactionId: capture.captureId,
    invoiceId: invoiceResult?.invoice?.invoiceId || null,
    billingCycle: sub.billingCycle,
    renewalDate,
  });

  return sendSuccess(res, {
    subscriptionId: sub._id,
    status: sub.status,
    plan: sub.plan,
    billingCycle: sub.billingCycle,
    renewalDate,
    captureId: capture.captureId,
    invoiceId: invoiceResult?.invoice?.invoiceId || null,
  }, "Payment captured — subscription activated");
});

// ══════════════════════════════════════════════════════
// PAYPAL WEBHOOK
// POST /api/v1/subscriptions/webhook/paypal
//
// NOT wrapped in asyncHandler — must always return HTTP 200.
// PayPal retries on non-200 responses.
// ══════════════════════════════════════════════════════
exports.handleWebhook = async (req, res) => {
  // Always respond 200 immediately so PayPal stops retrying on unexpected errors
  const ack = () => res.status(200).json({ received: true });

  try {
    // Verify webhook signature using raw body Buffer
    const rawBody = req.rawBody;
    if (!rawBody) {
      console.error("[PayPal Webhook] rawBody missing — check app.js express.json verify callback");
      return ack();
    }

    const isValid = await paypalService.verifyWebhookSignature(req.headers, rawBody);
    if (!isValid) {
      console.warn("[PayPal Webhook] Invalid signature — ignoring event");
      return ack();
    }

    const event = JSON.parse(rawBody.toString());
    const eventType = event.event_type;
    const resource = event.resource || {};

    console.log(`[PayPal Webhook] Received: ${eventType}`);

    switch (eventType) {
      // ── One-time payment captured ──────────────────────
      case "PAYMENT.CAPTURE.COMPLETED": {
        const captureId = resource.id;
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          await PaymentTransaction.findOneAndUpdate(
            { paypalOrderId: orderId },
            { paypalCaptureId: captureId, status: "completed", processedAt: new Date() }
          );
        }
        break;
      }

      // ── One-time payment denied ────────────────────────
      case "PAYMENT.CAPTURE.DENIED": {
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          await PaymentTransaction.findOneAndUpdate(
            { paypalOrderId: orderId },
            { status: "failed", failureReason: "Capture denied by PayPal", processedAt: new Date() }
          );
          await Subscription.findOneAndUpdate(
            { paypalOrderId: orderId },
            { paymentStatus: "failed" }
          );
        }
        break;
      }

      // ── Recurring subscription renewed ────────────────
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.RENEWED": {
        const paypalSubId = resource.id;
        if (!paypalSubId) break;

        const sub = await Subscription.findOne({ paypalSubscriptionId: paypalSubId });
        if (!sub) break;

        const now = new Date();
        const daysToAdd = DAYS_PER_CYCLE[sub.billingCycle] || 30;
        const renewalDate = new Date(now);
        renewalDate.setDate(renewalDate.getDate() + daysToAdd);

        // Cancel competing active/pending subs before activating to avoid E11000
        await Subscription.updateMany(
          { companyId: sub.companyId, status: { $in: ["pending", "active"] }, _id: { $ne: sub._id } },
          { $set: { status: "cancelled", cancelledAt: now, autoRenew: false } }
        );

        sub.status = "active";
        sub.paymentStatus = "paid";
        sub.lastPaymentDate = now;
        sub.renewalDate = renewalDate;
        await sub.save();

        // Reset token budget for new billing period
        try {
          await tokenBilling.resetMonthlyTokens(sub._id);
        } catch (err) {
          console.error("[PayPal Webhook] Token reset failed:", err.message);
        }

        await PaymentTransaction.create({
          subscriptionId: sub._id,
          companyId: sub.companyId,
          type: "subscription_renewal",
          gateway: "paypal",
          plan: sub.plan,
          billingCycle: sub.billingCycle,
          amount: sub.amount,
          currency: sub.currency,
          paypalSubscriptionId: paypalSubId,
          status: "completed",
          processedAt: now,
          rawPayload: resource,
        });

        events.emit("subscription.renewed", {
          subscriptionId: sub._id,
          plan: sub.plan,
          renewalDate,
          clientEmail: sub.clientEmail,
          clientName: sub.clientName,
        });
        break;
      }

      // ── Recurring subscription cancelled ──────────────
      case "BILLING.SUBSCRIPTION.CANCELLED": {
        const paypalSubId = resource.id;
        if (!paypalSubId) break;

        // paymentStatus stays "paid" — cancellation ≠ refund.
        // A refund, if issued, arrives separately as PAYMENT.CAPTURE.REFUNDED.
        await Subscription.findOneAndUpdate(
          { paypalSubscriptionId: paypalSubId },
          { status: "cancelled", cancelledAt: new Date(), autoRenew: false }
        );
        break;
      }

      // ── Refund processed ──────────────────────────────
      case "PAYMENT.CAPTURE.REFUNDED": {
        const captureId = resource.id;
        // { new: true } returns the updated document, eliminating the second query.
        const linkedTx = await PaymentTransaction.findOneAndUpdate(
          { paypalCaptureId: captureId },
          { status: "refunded", processedAt: new Date() },
          { new: true }
        );
        if (linkedTx) {
          await Subscription.findByIdAndUpdate(linkedTx.subscriptionId, {
            paymentStatus: "refunded",
          });
        }
        break;
      }

      default:
        // Unhandled event types are silently ignored
        break;
    }
  } catch (err) {
    // Log but never propagate — PayPal must always get 200
    console.error("[PayPal Webhook] Processing error:", err.message);
  }

  return ack();
};

// ══════════════════════════════════════════════════════
// CANCEL PAYPAL SUBSCRIPTION
// DELETE /api/v1/subscriptions/:id/paypal-cancel
//
// Cancels an active PayPal recurring subscription.
// ══════════════════════════════════════════════════════
exports.cancelPaypalSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const sub = await Subscription.findById(id);
  if (!sub) return sendError(res, "Subscription not found", 404);

  const isAdmin = ["admin", "superadmin"].includes(req.user.role);
  const isOwner =
    sub.userId?.toString() === req.user.id ||
    sub.clientEmail === req.user.email;

  if (!isAdmin && !isOwner) {
    return sendError(res, "Access denied — you do not own this subscription", 403);
  }

  if (sub.status === "cancelled") {
    return sendError(res, "Subscription is already cancelled", 409);
  }

  // Cancel at PayPal if a recurring subscription ID exists
  if (sub.paypalSubscriptionId) {
    await paypalService.cancelSubscription(
      sub.paypalSubscriptionId,
      reason || "Customer requested cancellation"
    );
  }

  const now = new Date();
  sub.status = "cancelled";
  sub.cancelledAt = now;
  sub.autoRenew = false;
  await sub.save();

  // Audit log
  await PaymentTransaction.create({
    subscriptionId: sub._id,
    companyId: sub.companyId,
    userId: req.user.id,
    type: "manual",
    gateway: "paypal",
    plan: sub.plan,
    billingCycle: sub.billingCycle,
    amount: 0,
    currency: sub.currency,
    paypalSubscriptionId: sub.paypalSubscriptionId || undefined,
    status: "completed",
    processedAt: now,
    failureReason: "Subscription cancelled by customer",
  });

  events.emit("subscription.cancelled", {
    subscriptionId: sub._id,
    plan: sub.plan,
    clientEmail: sub.clientEmail,
    clientName: sub.clientName,
    cancelledAt: now,
  });

  return sendSuccess(res, {
    subscriptionId: sub._id,
    status: "cancelled",
    cancelledAt: now,
  }, "Subscription cancelled successfully");
});
