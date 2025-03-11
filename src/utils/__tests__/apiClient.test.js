import { APIClient } from '../apiClient';
import { CacheManager } from '../cacheManager';
import { RateLimiter } from '../rateLimiter';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  };
});

describe('APIClient', () => {
  let apiClient;
  let mockOpenAI;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Initialize client
    apiClient = new APIClient('test-key');
    mockOpenAI = apiClient.openai.chat.completions.create;
  });

  describe('executeWithRetry', () => {
    it('should return cached result if available', async () => {
      const cachedResult = { content: 'cached' };
      jest.spyOn(apiClient.cache, 'get').mockReturnValue(cachedResult);
      
      const result = await apiClient.executeWithRetry('test', {});
      
      expect(result).toBe(cachedResult);
      expect(mockOpenAI).not.toHaveBeenCalled();
    });

    it('should retry on rate limit errors', async () => {
      const error429 = new Error('Rate limit');
      error429.status = 429;
      
      const successResult = { content: 'success' };
      mockOpenAI
        .mockRejectedValueOnce(error429)
        .mockResolvedValueOnce(successResult);

      const result = await apiClient.executeWithRetry('test', {});
      
      expect(result).toBe(successResult);
      expect(mockOpenAI).toHaveBeenCalledTimes(2);
    });

    it('should cache successful results', async () => {
      const successResult = { content: 'success' };
      mockOpenAI.mockResolvedValueOnce(successResult);
      
      jest.spyOn(apiClient.cache, 'set');
      
      await apiClient.executeWithRetry('test', {});
      
      expect(apiClient.cache.set).toHaveBeenCalledWith(
        expect.any(String),
        successResult
      );
    });
  });

  describe('processBatch', () => {
    it('should process items in batches with progress', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = jest.fn(x => Promise.resolve(x * 2));
      const onProgress = jest.fn();

      const results = await apiClient.processBatch(
        items,
        processor,
        2,
        onProgress
      );

      expect(results).toEqual([2, 4, 6, 8, 10]);
      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenLastCalledWith({
        processed: 5,
        total: 5,
        percentComplete: 100
      });
    });

    it('should handle errors in batch processing', async () => {
      const items = [1, 2, 3];
      const processor = jest.fn()
        .mockResolvedValueOnce(2)
        .mockRejectedValueOnce(new Error('Processing error'))
        .mockResolvedValueOnce(6);

      await expect(
        apiClient.processBatch(items, processor, 1)
      ).rejects.toThrow('Processing error');
    });
  });
});
