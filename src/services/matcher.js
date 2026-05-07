// Order Matching Engine with Priority Rules
import stringSimilarity from 'string-similarity';
import logger from '../utils/logger.js';
import { validators } from '../utils/validators.js';
import orderSystemService from './orderSystem.js';

const SIMILARITY_THRESHOLD = 0.6; // 60% similarity threshold
const MAX_FUZZY_RESULTS = 2; // Max results for fuzzy matching

class OrderMatcher {
  /**
   * Match order with priority rules
   * Priority 1: Phone number
   * Priority 2: Customer name (fuzzy)
   */
  async matchOrder(senderPhone, customerName = null) {
    logger.info('Starting order match', { senderPhone, customerName });

    // Priority 1: Try phone number matching
    if (senderPhone) {
      const phoneOrder = await this._matchByPhoneNumber(senderPhone);
      if (phoneOrder) {
        return {
          matchType: 'EXACT_PHONE',
          orders: [phoneOrder],
          confidence: 100,
          message: this._formatExactMatchMessage(phoneOrder),
        };
      }
    }

    // Priority 2: Try fuzzy name matching
    if (customerName) {
      const fuzzyMatches = await this._matchByCustomerName(customerName);
      if (fuzzyMatches && fuzzyMatches.length > 0) {
        return {
          matchType: 'FUZZY_NAME',
          orders: fuzzyMatches,
          confidence: fuzzyMatches[0].similarity,
          message: this._formatFuzzyMatchMessage(fuzzyMatches),
        };
      }
    }

    // No match found
    return {
      matchType: 'NO_MATCH',
      orders: [],
      confidence: 0,
      message: this._formatNoMatchMessage(),
    };
  }

  /**
   * Match by phone number (Priority 1)
   */
  async _matchByPhoneNumber(phoneNumber) {
    if (!validators.isValidPhoneNumber(phoneNumber)) {
      logger.warn('Invalid phone number format', { phoneNumber });
      return null;
    }

    try {
      const order = await orderSystemService.getOrderByPhoneNumber(phoneNumber);
      
      if (order) {
        logger.info('Exact match found by phone number', {
          orderId: order.id,
          customerName: order.customerName,
        });
        return {
          id: order.id,
          customerName: order.customerName,
          imei: order.imei,
          phoneNumber: order.phoneNumber,
          matchedBy: 'phone',
          similarity: 100,
        };
      }

      return null;
    } catch (error) {
      logger.error('Phone number matching failed', { error: error.message });
      return null;
    }
  }

  /**
   * Match by customer name (Priority 2) - Fuzzy matching
   */
  async _matchByCustomerName(customerName) {
    if (!validators.validateCustomerName(customerName)) {
      logger.warn('Invalid customer name', { customerName });
      return [];
    }

    try {
      const sanitized = validators.sanitizeInput(customerName);
      const orders = await orderSystemService.getOrderByCustomerName(sanitized);

      if (!orders || (Array.isArray(orders) && orders.length === 0)) {
        logger.info('No orders found for customer name', { customerName: sanitized });
        return [];
      }

      // Ensure orders is an array
      const ordersList = Array.isArray(orders) ? orders : [orders];

      // Calculate similarity for each order
      const scoredOrders = ordersList.map(order => ({
        id: order.id,
        customerName: order.customerName,
        imei: order.imei,
        phoneNumber: order.phoneNumber,
        matchedBy: 'name',
        similarity: stringSimilarity.compareTwoStrings(
          sanitized.toLowerCase(),
          String(order.customerName).toLowerCase()
        ) * 100, // Convert to percentage
      }));

      // Filter by threshold and sort by similarity
      const filtered = scoredOrders
        .filter(order => order.similarity >= SIMILARITY_THRESHOLD)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, MAX_FUZZY_RESULTS);

      if (filtered.length > 0) {
        logger.info('Fuzzy matches found', {
          customerName: sanitized,
          matchCount: filtered.length,
          topSimilarity: filtered[0].similarity,
        });
      }

      return filtered;
    } catch (error) {
      logger.error('Customer name matching failed', { error: error.message });
      return [];
    }
  }

  /**
   * Format message for exact match (Scenario 1)
   */
  _formatExactMatchMessage(order) {
    const message = `✅ *Order Found*

👤 *Customer Name:* ${order.customerName}
📱 *IMEI:* ${order.imei}

Order has been matched successfully!`;

    return message;
  }

  /**
   * Format message for fuzzy match (Scenario 2)
   */
  _formatFuzzyMatchMessage(orders) {
    let message = `🔍 *Multiple Orders Found*\n\nPlease confirm which order is correct:\n\n`;

    orders.forEach((order, index) => {
      const confidence = order.similarity.toFixed(1);
      message += `*Option ${index + 1}* (${confidence}% match)\n`;
      message += `👤 Name: ${order.customerName}\n`;
      message += `📱 IMEI: ${order.imei}\n\n`;
    });

    message += '⚠️ Please reply with the correct option number to confirm.';

    return message;
  }

  /**
   * Format message for no match (Scenario 3)
   */
  _formatNoMatchMessage() {
    return `❌ *Order Not Found*

The system fails to match the order. Please recheck the customer name or customer phone number.

If you need assistance, please contact support.`;
  }
}

export const orderMatcher = new OrderMatcher();
export default orderMatcher;
