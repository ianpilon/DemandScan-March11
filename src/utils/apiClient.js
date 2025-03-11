import OpenAI from 'openai';
import { CacheManager } from './cacheManager';
import { RateLimiter } from './rateLimiter';

export class APIClient {
  constructor(apiKey) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    this.cache = new CacheManager();
    this.rateLimiter = new RateLimiter();
    this.retryCount = 3;
    this.retryDelay = 1000;
  }

  /**
   * Execute an API call with caching, rate limiting, and error handling
   */
  async executeWithRetry(agentType, params, skipCache = false) {
    const cacheKey = this.cache.generateKey(agentType, params);
    
    // Check cache first
    if (!skipCache) {
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    let lastError = null;
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        // Acquire rate limiting token
        await this.rateLimiter.acquireToken();

        // Make API call
        const result = await this.openai.chat.completions.create(params);
        
        // Cache successful result
        if (result) {
          this.cache.set(cacheKey, result);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Handle different types of errors
        if (error.status === 429) { // Rate limit exceeded
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
          continue;
        }
        
        if (error.status >= 500) { // Server errors
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
          continue;
        }
        
        // Client errors (4xx) should fail immediately except for rate limits
        if (error.status >= 400 && error.status !== 429) {
          throw error;
        }
      }
    }
    
    // If we've exhausted retries, throw the last error
    throw lastError;
  }

  /**
   * Process multiple items in batch with progress tracking
   */
  async processBatch(items, processor, batchSize = 5, onProgress) {
    const results = [];
    const total = items.length;
    let processed = 0;

    // Process items in batches
    for (let i = 0; i < total; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(item => processor(item));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        processed += batch.length;
        if (onProgress) {
          onProgress({
            processed,
            total,
            percentComplete: (processed / total) * 100
          });
        }
      } catch (error) {
        console.error('Batch processing error:', error);
        throw error;
      }
    }

    return results;
  }
}
