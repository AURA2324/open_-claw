// Message Management API Routes
import express from 'express';
import logger from '../utils/logger.js';
import whatsappService from '../services/whatsapp.js';
import { validators } from '../utils/validators.js';

const router = express.Router();

// In-memory message store (replace with database in production)
const messages = [];

/**
 * GET /api/messages
 * Get message history
 */
router.get('/', (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const offsetNum = parseInt(offset) || 0;

    const paginated = messages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      messages: paginated,
      total: messages.length,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    logger.error('Error fetching messages', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/messages/send
 * Send manual WhatsApp message
 */
router.post('/send', async (req, res) => {
  try {
    const { phoneNumber, message, type = 'text' } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required',
      });
    }

    if (!validators.isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format',
      });
    }

    logger.info('API: Sending manual message', {
      to: phoneNumber,
      type,
    });

    const result = await whatsappService.sendMessage(
      validators.normalizePhoneNumber(phoneNumber),
      message,
      type
    );

    if (result.success) {
      // Store in message history
      messages.push({
        id: result.messageId,
        to: phoneNumber,
        text: message,
        type: 'outgoing',
        status: 'sent',
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        messageId: result.messageId,
        message: 'Message sent successfully',
      });
    }

    res.status(500).json({
      success: false,
      error: result.error || 'Failed to send message',
    });
  } catch (error) {
    logger.error('Error sending manual message', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/messages/send-group
 * Send message to WhatsApp group
 */
router.post('/send-group', async (req, res) => {
  try {
    const { groupId, message } = req.body;

    if (!groupId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Group ID and message are required',
      });
    }

    logger.info('API: Sending group message', { groupId });

    const result = await whatsappService.sendGroupMessage(groupId, message);

    if (result.success) {
      messages.push({
        id: result.messageId,
        to: groupId,
        text: message,
        type: 'group_outgoing',
        status: 'sent',
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        messageId: result.messageId,
        message: 'Group message sent successfully',
      });
    }

    res.status(500).json({
      success: false,
      error: result.error || 'Failed to send group message',
    });
  } catch (error) {
    logger.error('Error sending group message', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/messages/:messageId
 * Get specific message details
 */
router.get('/:messageId', (req, res) => {
  try {
    const { messageId } = req.params;

    const message = messages.find(m => m.id === messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    res.json({
      success: true,
      message,
    });
  } catch (error) {
    logger.error('Error fetching message', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/messages/conversation/:phoneNumber
 * Get conversation history with specific contact
 */
router.get('/conversation/:phoneNumber', (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const normalized = validators.normalizePhoneNumber(phoneNumber);

    if (!normalized) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number',
      });
    }

    const conversation = messages.filter(
      m => m.from === normalized || m.to === normalized
    );

    res.json({
      success: true,
      messages: conversation,
      total: conversation.length,
    });
  } catch (error) {
    logger.error('Error fetching conversation', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
