const Anthropic = require("@anthropic-ai/sdk");
const { withRetry } = require("../utils/retry");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  throw new Error(
    "[Claude] ANTHROPIC_API_KEY is not set. Add it to your .env file or Render environment variables."
  );
}

// Validate key format at startup — catches copy-paste issues and stale env vars early
const trimmedKey = ANTHROPIC_API_KEY.trim();
if (trimmedKey !== ANTHROPIC_API_KEY) {
  console.warn("[Claude] WARNING: ANTHROPIC_API_KEY has leading/trailing whitespace — this will cause 401 errors.");
}
if (!trimmedKey.startsWith("sk-ant-api03-")) {
  console.warn(
    `[Claude] WARNING: ANTHROPIC_API_KEY has unexpected prefix "${trimmedKey.slice(0, 14)}...". ` +
    "Valid keys start with 'sk-ant-api03-'. This may cause 401 errors."
  );
} else if (trimmedKey.length < 90) {
  console.warn(
    `[Claude] WARNING: ANTHROPIC_API_KEY looks too short (${trimmedKey.length} chars). ` +
    "Valid keys are ~108 characters. This may be a truncated key."
  );
} else {
  console.log(
    `[Claude] API key loaded — prefix: ${trimmedKey.slice(0, 14)}... length: ${trimmedKey.length} — format OK`
  );
}

const DEFAULT_MODEL = "claude-sonnet-4-6";

const anthropic = new Anthropic({ apiKey: trimmedKey });

// ── Error Mapping ─────────────────────────────────────────────────────────────
function handleAnthropicError(err) {
  // Extract the detailed sub-message from the Anthropic error body
  const anthropicType = err.error?.error?.type;
  const anthropicMsg = err.error?.error?.message;

  if (process.env.NODE_ENV !== "production") {
    console.error("[Claude] API error detail:", {
      status: err.status,
      name: err.name,
      anthropicType,
      anthropicMsg,
      message: err.message,
    });
  }

  if (err.status === 401) {
    // 401 always means authentication failure — key is wrong, revoked, or from wrong workspace
    const detail = anthropicMsg ? ` (Anthropic: "${anthropicMsg}")` : "";
    throw Object.assign(
      new Error(
        `Anthropic API key is invalid or revoked.${detail} ` +
        "Go to Render Dashboard → Environment → update ANTHROPIC_API_KEY with a fresh key from console.anthropic.com/settings/keys."
      ),
      { code: "CLAUDE_AUTH_ERROR", status: 502 }
    );
  }
  if (err.status === 403) {
    // 403 = key valid but lacks permission, or the organization has been disabled/out of credits
    const detail = anthropicMsg ? ` (Anthropic: "${anthropicMsg}")` : "";
    throw Object.assign(
      new Error(
        `Anthropic API access denied.${detail} ` +
        "Possible causes: account disabled, insufficient credits, or the key lacks permission for this operation. Check console.anthropic.com."
      ),
      { code: "CLAUDE_FORBIDDEN", status: 403 }
    );
  }
  if (err.status === 429) {
    throw Object.assign(
      new Error("Anthropic rate limit reached. Reduce request frequency or upgrade your Anthropic plan."),
      { code: "CLAUDE_RATE_LIMIT", status: 429 }
    );
  }
  if (err.status === 529 || err.message?.includes("overloaded")) {
    throw Object.assign(
      new Error("Anthropic API is temporarily overloaded. Please try again in a moment."),
      { code: "CLAUDE_OVERLOADED", status: 503 }
    );
  }
  if (err.code === "ECONNRESET" || err.code === "ETIMEDOUT" || err.message?.includes("timeout")) {
    throw Object.assign(
      new Error("Anthropic API request timed out. Please try again."),
      { code: "CLAUDE_TIMEOUT", status: 504 }
    );
  }
  throw err;
}

// ── Shared response parser ────────────────────────────────────────────────────
function parseResponse(response) {
  return {
    text: response.content[0].text,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
    model: response.model,
    stopReason: response.stop_reason,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Single user-turn generation (no system prompt).
 * Returns { text, usage, model, stopReason }.
 */
const generateContent = async (prompt, options = {}) => {
  try {
    const response = await withRetry(
      () =>
        anthropic.messages.create({
          model: options.model || DEFAULT_MODEL,
          max_tokens: options.maxTokens || 2000,
          messages: [{ role: "user", content: prompt }],
        }),
      { maxAttempts: 3, baseDelayMs: 1000 }
    );
    return parseResponse(response);
  } catch (err) {
    handleAnthropicError(err);
  }
};

/**
 * Structured generation with a system prompt.
 * Returns { text, usage, model, stopReason }.
 */
const generateStructuredContent = async (systemPrompt, userPrompt, options = {}) => {
  try {
    const response = await withRetry(
      () =>
        anthropic.messages.create({
          model: options.model || DEFAULT_MODEL,
          max_tokens: options.maxTokens || 2000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      { maxAttempts: 3, baseDelayMs: 1000 }
    );
    return parseResponse(response);
  } catch (err) {
    handleAnthropicError(err);
  }
};

/**
 * Minimal test call — use via GET /api/v1/ai/health to verify the key is valid.
 * Returns { ok: true, model, inputTokens, outputTokens } or throws a mapped error.
 */
const ping = async () => {
  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 5,
      messages: [{ role: "user", content: "ping" }],
    });
    return {
      ok: true,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  } catch (err) {
    handleAnthropicError(err);
  }
};

module.exports = { generateContent, generateStructuredContent, ping };
