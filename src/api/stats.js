// Statistics and Health Check Routes
import express from 'express';
import logger from '../utils/logger.js';
import cacheService from '../utils/cache.js';

const router = express.Router();

const systemStats = {
  startTime: Date.now(),
  messagesProcessed: 0,
  ordersMatched: 0,
  errorsCount: 0,
};

/**
 * GET /api/stats
 * Get system statistics
 */
router.get('/stats', (req, res) => {
  try {
    const uptime = Date.now() - systemStats.startTime;
    const cacheStats = cacheService.getStats();

    res.json({
      success: true,
      system: {
        uptime: `${(uptime / 1000 / 60).toFixed(2)} minutes`,
        messagesProcessed: systemStats.messagesProcessed,
        ordersMatched: systemStats.ordersMatched,
        errors: systemStats.errorsCount,
      },
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - systemStats.startTime,
  });
});

/**
 * POST /api/stats/increment
 * Increment statistics (internal use)
 */
router.post('/stats/increment', (req, res) => {
  try {
    const { metric } = req.body;

    if (metric === 'messages') {
      systemStats.messagesProcessed++;
    } else if (metric === 'matches') {
      systemStats.ordersMatched++;
    } else if (metric === 'errors') {
      systemStats.errorsCount++;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
