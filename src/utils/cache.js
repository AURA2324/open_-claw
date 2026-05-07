// Caching service for token optimization
import NodeCache from 'node-cache';
import config from './config.js';
import logger from './logger.js';

class CacheService {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: config.cacheTtl,
      checkperiod: 600,
      maxKeys: config.maxCacheSize,
    });

    // Monitor cache stats
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Get value from cache
   */
  get(key) {
    const value = this.cache.get(key);
    if (value) {
      this.stats.hits++;
      logger.debug(`Cache HIT: ${key}`);
      return value;
    }
    this.stats.misses++;
    logger.debug(`Cache MISS: ${key}`);
    return null;
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = null) {
    this.stats.sets++;
    if (ttl) {
      this.cache.set(key, value, ttl);
    } else {
      this.cache.set(key, value);
    }
    logger.debug(`Cache SET: ${key}`);
  }

  /**
   * Delete from cache
   */
  delete(key) {
    this.stats.deletes++;
    this.cache.del(key);
    logger.debug(`Cache DEL: ${key}`);
  }

  /**
   * Clear all cache
   */
  flush() {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : '0.00';
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.keys().length,
      keys: this.cache.keys(),
    };
  }
}

export const cacheService = new CacheService();
export default cacheService;
