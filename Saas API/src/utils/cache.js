const crypto = require("crypto");

// In-memory TTL cache — single-instance only.
// Swap the get/set calls for Redis (ioredis is already installed) for multi-instance deploys.
class TTLCache {
  constructor() {
    this._store = new Map();
    // Purge expired entries every 10 minutes
    setInterval(() => this._purge(), 10 * 60 * 1000).unref();
  }

  set(key, value, ttlMs = 60 * 60 * 1000) {
    this._store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return null;
    }
    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this._store.delete(key);
  }

  size() {
    return this._store.size;
  }

  _purge() {
    const now = Date.now();
    for (const [k, v] of this._store) {
      if (now > v.expiresAt) this._store.delete(k);
    }
  }
}

const aiCache = new TTLCache();

// Cacheable AI features and their TTLs (ms)
const CACHE_TTL = {
  seo_title: 24 * 60 * 60 * 1000,        // 24 hours
  meta_description: 24 * 60 * 60 * 1000, // 24 hours
  blog_outline: 6 * 60 * 60 * 1000,      // 6 hours
};

function buildCacheKey(feature, inputData) {
  const stable = JSON.stringify(
    Object.fromEntries(Object.entries(inputData).sort())
  );
  const hash = crypto.createHash("md5").update(`${feature}:${stable}`).digest("hex");
  return `ai:${feature}:${hash}`;
}

function isCacheable(feature) {
  return feature in CACHE_TTL;
}

module.exports = { aiCache, CACHE_TTL, buildCacheKey, isCacheable };
