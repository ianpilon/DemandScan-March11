/**
 * Cache manager for API responses using localStorage with TTL support
 */

const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class CacheManager {
  constructor(prefix = 'api_cache_', ttl = DEFAULT_TTL) {
    this.prefix = prefix;
    this.ttl = ttl;
  }

  /**
   * Generate a cache key for the given parameters
   */
  generateKey(agentType, input) {
    const inputHash = this.hashString(JSON.stringify(input));
    return `${this.prefix}${agentType}_${inputHash}`;
  }

  /**
   * Simple string hashing function
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Set a value in cache
   */
  set(key, value) {
    const item = {
      value,
      timestamp: Date.now(),
      ttl: this.ttl
    };
    try {
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.warn('Cache write failed:', error);
      this.cleanup(); // Try to free up space
      return false;
    }
  }

  /**
   * Get a value from cache
   */
  get(key) {
    try {
      const item = JSON.parse(localStorage.getItem(key));
      if (!item) return null;

      const now = Date.now();
      if (now - item.timestamp > item.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.warn('Cache read failed:', error);
      return null;
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanup() {
    const now = Date.now();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.prefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (now - item.timestamp > item.ttl) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    }
  }
}
