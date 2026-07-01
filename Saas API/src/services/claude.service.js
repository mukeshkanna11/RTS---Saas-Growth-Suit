const Anthropic = require("@anthropic-ai/sdk");
const { withRetry } = require("../utils/retry");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  throw new Error("Missing ANTHROPIC_API_KEY in .env");
}

console.log(
  `[Claude] API key loaded — prefix: ${ANTHROPIC_API_KEY.slice(0, 14)}... length: ${ANTHROPIC_API_KEY.length}`
);

const DEFAULT_MODEL = "claude-sonnet-4-6";

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ── Error Mapping ─────────────────────────────────────────────────────────────
function handleAnthropicError(err) {
  if (err.status === 401) {
    throw Object.assign(
      new Error("Anthropic API key is invalid or revoked. Check ANTHROPIC_API_KEY in .env."),
      { code: "CLAUDE_AUTH_ERROR", status: 401 }
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

module.exports = { generateContent, generateStructuredContent };
