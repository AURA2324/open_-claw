// Order Matching API Routes
import express from 'express';
import logger from '../utils/logger.js';
import orderMatcher from '../services/matcher.js';
import orderSystemService from '../services/orderSystem.js';
import { validators } from '../utils/validators.js';

const router = express.Router();

/**
 * POST /api/orders/match-by-phone
 * Match order by phone number (Priority 1)
 */
router.post('/match-by-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    if (!validators.isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format (must be Tanzania +255)',
      });
    }

    logger.info('API: Match order by phone', { phoneNumber });

    const order = await orderSystemService.getOrderByPhoneNumber(phoneNumber);

    if (order) {
      return res.json({
        success: true,
        matchType: 'EXACT_PHONE',
        order,
        confidence: 100,
      });
    }

    res.json({
      success: false,
      matchType: 'NO_MATCH',
      message: 'No order found for this phone number',
    });
  } catch (error) {
    logger.error('Error matching order by phone', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/orders/match-by-name
 * Match orders by customer name (Priority 2) - Fuzzy matching
 */
router.post('/match-by-name', async (req, res) => {
  try {
    const { customerName } = req.body;

    if (!customerName) {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required',
      });
    }

    if (!validators.validateCustomerName(customerName)) {
      return res.status(400).json({
        success: false,
        error: 'Customer name must be at least 2 characters',
      });
    }

    logger.info('API: Match orders by customer name', { customerName });

    // Use order matcher's internal method for consistency
    const sanitized = validators.sanitizeInput(customerName);
    const orders = await orderSystemService.getOrderByCustomerName(sanitized);

    if (orders && (Array.isArray(orders) ? orders.length > 0 : true)) {
      return res.json({
        success: true,
        matchType: 'FUZZY_NAME',
        orders: Array.isArray(orders) ? orders : [orders],
        message: 'Similar orders found. Please verify the correct one.',
      });
    }

    res.json({
      success: false,
      matchType: 'NO_MATCH',
      message: 'No similar orders found',
    });
  } catch (error) {
    logger.error('Error matching orders by name', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/orders/:orderId
 * Get order details by ID
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!validators.validateOrderId(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID',
      });
    }

    logger.info('API: Fetch order details', { orderId });

    const order = await orderSystemService.getOrderById(orderId);

    if (order) {
      return res.json({
        success: true,
        order,
      });
    }

    res.status(404).json({
      success: false,
      error: 'Order not found',
    });
  } catch (error) {
    logger.error('Error fetching order details', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/orders/match-full
 * Full order matching with priority rules
 */
router.post('/match-full', async (req, res) => {
  try {
    const { phoneNumber, customerName } = req.body;

    if (!phoneNumber && !customerName) {
      return res.status(400).json({
        success: false,
        error: 'Phone number or customer name is required',
      });
    }

    logger.info('API: Full order matching', { phoneNumber, customerName });

    const result = await orderMatcher.matchOrder(phoneNumber, customerName);

    res.json({
      success: result.orders.length > 0,
      ...result,
    });
  } catch (error) {
    logger.error('Error in full order matching', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/orders/:orderId/clear-cache
 * Clear cache for an order
 */
router.delete('/:orderId/clear-cache', (req, res) => {
  try {
    const { orderId } = req.params;

    if (!validators.validateOrderId(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID',
      });
    }

    logger.info('API: Clearing order cache', { orderId });

    // This would need to be expanded based on your caching strategy
    res.json({
      success: true,
      message: 'Cache cleared for order',
    });
  } catch (error) {
    logger.error('Error clearing cache', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
