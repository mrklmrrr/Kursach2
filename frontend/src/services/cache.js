/**
 * Simple in-memory cache with TTL support
 */
class Cache {
  constructor(defaultTtlMs = 30000) {
    this.defaultTtlMs = defaultTtlMs;
    this.store = new Map();
  }

  /**
   * Get value from cache if not expired
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Set value in cache with TTL
   * @param {string} key 
   * @param {any} value 
   * @param {number|null} ttlMs - TTL in milliseconds, null uses default
   */
  set(key, value, ttlMs = null) {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Invalidate cache entry
   * @param {string} key 
   */
  delete(key) {
    this.store.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.store.clear();
  }
}

export const apiCache = new Cache(30000); // 30 seconds default TTL
