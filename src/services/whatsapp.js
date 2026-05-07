// WhatsApp Business API Service
import axios from 'axios';
import config from '../utils/config.js';
import logger from '../utils/logger.js';

const API_URL = `https://graph.instagram.com/${config.whatsappApiVersion}`;

class WhatsAppService {
  constructor() {
    this.token = config.whatsappApiToken;
    this.phoneNumberId = config.whatsappPhoneNumberId;
    this.businessAccountId = config.whatsappBusinessAccountId;
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(recipientPhoneNumber, message, type = 'text') {
    if (!this.token || !this.phoneNumberId) {
      logger.error('WhatsApp credentials not configured');
      return { success: false, error: 'WhatsApp not configured' };
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhoneNumber,
      };

      if (type === 'text') {
        payload.type = 'text';
        payload.text = { preview_url: false, body: message };
      } else if (type === 'template') {
        payload.type = 'template';
        payload.template = message;
      }

      const response = await axios.post(
        `${API_URL}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('WhatsApp message sent', {
        to: recipientPhoneNumber,
        messageId: response.data.messages?.[0]?.id,
      });

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
        timestamp: response.data.messages?.[0]?.timestamp,
      };
    } catch (error) {
      logger.error('Failed to send WhatsApp message', {
        to: recipientPhoneNumber,
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send group message
   */
  async sendGroupMessage(groupId, message) {
    if (!this.token || !this.phoneNumberId) {
      logger.error('WhatsApp credentials not configured');
      return { success: false, error: 'WhatsApp not configured' };
    }

    try {
      const response = await axios.post(
        `${API_URL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: groupId,
          type: 'text',
          text: { preview_url: false, body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('WhatsApp group message sent', {
        groupId,
        messageId: response.data.messages?.[0]?.id,
      });

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
      };
    } catch (error) {
      logger.error('Failed to send group message', {
        groupId,
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId) {
    if (!this.token || !this.phoneNumberId) {
      return { success: false };
    }

    try {
      await axios.post(
        `${API_URL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return { success: true };
    } catch (error) {
      logger.warn('Failed to mark message as read', { error: error.message });
      return { success: false };
    }
  }

  /**
   * Get media information
   */
  async getMediaInfo(mediaId) {
    if (!this.token) {
      return null;
    }

    try {
      const response = await axios.get(
        `${API_URL}/${mediaId}`,
        {
          params: {
            fields: 'id,media_product_type,mime_type,sha256,file_size,url',
            access_token: this.token,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.warn('Failed to get media info', { error: error.message });
      return null;
    }
  }

  /**
   * Validate webhook token
   */
  validateToken(token) {
    return token === config.whatsappVerifyToken;
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
