// Order System Integration Service
import axios from 'axios';
import config from '../utils/config.js';
import logger from '../utils/logger.js';
import cacheService from '../utils/cache.js';
import { validators } from '../utils/validators.js';

class OrderSystemService {
  constructor() {
    this.apiUrl = config.orderSystemApiUrl;
    this.apiKey = config.orderSystemApiKey;
  }

  /**
   * Query order by phone number (Priority 1)
   */
  async getOrderByPhoneNumber(phoneNumber) {
    if (!validators.isValidPhoneNumber(phoneNumber)) {
      logger.warn('Invalid phone number format', { phoneNumber });
      return null;
    }

    const normalizedPhone = validators.normalizePhoneNumber(phoneNumber);
    const cacheKey = `order_phone_${normalizedPhone}`;

    // Check cache first
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      logger.info('Querying order by phone number', { phoneNumber: normalizedPhone });

      // This is a template - replace with actual API call based on your system
      const response = await this._callOrderSystemAPI('/orders/by-phone', {
        phoneNumber: normalizedPhone,
      });

      if (response.success && response.data) {
        const order = response.data;
        
        // Cache the result
        cacheService.set(cacheKey, order);

        logger.info('Order found by phone number', {
          orderId: order.id,
          customerName: order.customerName,
          imei: order.imei,
        });

        return order;
      }

      return null;
    } catch (error) {
      logger.error('Failed to query order by phone number', {
        phoneNumber: normalizedPhone,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Query order by customer name (Priority 2)
   */
  async getOrderByCustomerName(customerName) {
    if (!validators.validateCustomerName(customerName)) {
      logger.warn('Invalid customer name', { customerName });
      return null;
    }

    const sanitized = validators.sanitizeInput(customerName);
    const cacheKey = `order_name_${sanitized}`;

    // Check cache first
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      logger.info('Querying orders by customer name', { customerName: sanitized });

      // This is a template - replace with actual API call
      const response = await this._callOrderSystemAPI('/orders/by-name', {
        customerName: sanitized,
      });

      if (response.success && response.data) {
        // Cache the result
        cacheService.set(cacheKey, response.data);

        logger.info('Orders found by customer name', {
          count: Array.isArray(response.data) ? response.data.length : 1,
        });

        return response.data;
      }

      return null;
    } catch (error) {
      logger.error('Failed to query order by customer name', {
        customerName: sanitized,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get order details by ID
   */
  async getOrderById(orderId) {
    if (!validators.validateOrderId(orderId)) {
      logger.warn('Invalid order ID', { orderId });
      return null;
    }

    const cacheKey = `order_${orderId}`;

    // Check cache
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      logger.info('Fetching order details', { orderId });

      // Template - replace with actual API
      const response = await this._callOrderSystemAPI(`/orders/${orderId}`, {});

      if (response.success && response.data) {
        cacheService.set(cacheKey, response.data);
        return response.data;
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch order details', {
        orderId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get multiple orders by ID list
   */
  async getOrdersByIds(orderIds) {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return [];
    }

    try {
      const orders = await Promise.all(
        orderIds.map(id => this.getOrderById(id))
      );

      return orders.filter(order => order !== null);
    } catch (error) {
      logger.error('Failed to fetch multiple orders', { error: error.message });
      return [];
    }
  }

  /**
   * Internal method to call order system API
   * Replace this with your actual integration method
   */
  async _callOrderSystemAPI(endpoint, params) {
    if (!this.apiUrl || !this.apiKey) {
      logger.error('Order system API not configured');
      return { success: false, error: 'Not configured' };
    }

    try {
      const url = `${this.apiUrl}${endpoint}`;
      const response = await axios.get(url, {
        params,
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      logger.error('Order system API call failed', {
        endpoint,
        error: error.message,
        status: error.response?.status,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clear order cache for a phone number (after order update)
   */
  clearPhoneNumberCache(phoneNumber) {
    const normalized = validators.normalizePhoneNumber(phoneNumber);
    const cacheKey = `order_phone_${normalized}`;
    cacheService.delete(cacheKey);
    logger.info('Cleared phone number cache', { phoneNumber: normalized });
  }

  /**
   * Clear order cache for a customer name
   */
  clearCustomerNameCache(customerName) {
    const sanitized = validators.sanitizeInput(customerName);
    const cacheKey = `order_name_${sanitized}`;
    cacheService.delete(cacheKey);
    logger.info('Cleared customer name cache', { customerName: sanitized });
  }
}

export const orderSystemService = new OrderSystemService();
export default orderSystemService;
