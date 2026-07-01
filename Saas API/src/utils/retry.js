// Retryable HTTP status codes from Anthropic (transient failures only)
const RETRYABLE_STATUSES = new Set([500, 503, 529]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs `fn` up to `maxAttempts` times with exponential backoff.
 * Only retries on transient errors — 401/400/429 are not retried.
 */
async function withRetry(fn, { maxAttempts = 3, baseDelayMs = 1000 } = {}) {
  let lastErr;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;

      const isTransient =
        RETRYABLE_STATUSES.has(err.status) ||
        err.code === "ECONNRESET" ||
        err.code === "ETIMEDOUT" ||
        err.message?.includes("network") ||
        err.message?.includes("timeout");

      if (!isTransient || attempt === maxAttempts) throw err;

      // Exponential backoff: 1s, 2s, 4s + jitter
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.warn(`[Retry] Attempt ${attempt} failed (${err.status || err.code}). Retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }

  throw lastErr;
}

module.exports = { withRetry };
