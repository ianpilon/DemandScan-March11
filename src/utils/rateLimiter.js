/**
 * Rate limiter for API calls using token bucket algorithm
 */

export class RateLimiter {
  constructor(tokensPerInterval = 50, intervalInMs = 60000) {
    this.tokensPerInterval = tokensPerInterval;
    this.intervalInMs = intervalInMs;
    this.tokens = tokensPerInterval;
    this.lastRefill = Date.now();
    this.queue = [];
  }

  async acquireToken() {
    this.refillTokens();

    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }

    // If no tokens available, add to queue
    return new Promise((resolve) => {
      this.queue.push(resolve);
      // Set timeout to prevent indefinite waiting
      setTimeout(() => {
        const index = this.queue.indexOf(resolve);
        if (index > -1) {
          this.queue.splice(index, 1);
          resolve();
        }
      }, this.intervalInMs);
    });
  }

  refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.intervalInMs) * this.tokensPerInterval;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.tokensPerInterval, this.tokens + tokensToAdd);
      this.lastRefill = now;

      // Process queue if we have tokens
      while (this.queue.length > 0 && this.tokens > 0) {
        const resolve = this.queue.shift();
        this.tokens--;
        resolve();
      }
    }
  }
}
