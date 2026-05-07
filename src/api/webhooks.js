// WhatsApp Webhook and Message Handler Routes
import express from 'express';
import logger from '../utils/logger.js';
import whatsappService from '../services/whatsapp.js';
import orderMatcher from '../services/matcher.js';
import { validators } from '../utils/validators.js';

const router = express.Router();

// Store messages in memory for demo (replace with database in production)
const messageHistory = [];

/**
 * Webhook verification (GET)
   * Required for WhatsApp webhook setup
 */
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info('Webhook verification request', { mode, token });

  if (mode === 'subscribe' && whatsappService.validateToken(token)) {
    logger.info('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    logger.warn('Invalid webhook verification attempt');
    res.status(403).json({ error: 'Forbidden' });
  }
});

/**
 * Webhook for receiving messages (POST)
 * Handles incoming WhatsApp messages
 */
router.post('/whatsapp', async (req, res) => {
  try {
    const body = req.body;

    // Acknowledge receipt immediately
    res.status(200).json({ received: true });

    if (body.object !== 'whatsapp_business_account') {
      logger.warn('Invalid webhook object type', { object: body.object });
      return;
    }

    // Process each entry in the webhook
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      
      for (const change of changes) {
        if (change.field === 'messages') {
          await _handleIncomingMessage(change.value);
        } else if (change.field === 'message_status') {
          await _handleMessageStatus(change.value);
        }
      }
    }
  } catch (error) {
    logger.error('Error processing webhook', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * Handle incoming messages
 */
async function _handleIncomingMessage(messageData) {
  try {
    const messages = messageData.messages || [];
    const contacts = messageData.contacts || [];
    const metadata = messageData.metadata;

    for (const message of messages) {
      // Mark as read
      await whatsappService.markMessageAsRead(message.id);

      // Extract message info
      const senderPhone = message.from;
      const messageId = message.id;
      const timestamp = message.timestamp;
      const type = message.type;

      let messageText = '';
      let customerName = null;

      // Extract text content
      if (type === 'text') {
        messageText = message.text?.body || '';
      } else if (type === 'interactive') {
        messageText = message.interactive?.button_reply?.title || '';
      }

      // Get sender contact info
      if (contacts && contacts.length > 0) {
        customerName = contacts[0].profile?.name;
      }

      logger.info('Incoming WhatsApp message', {
        from: senderPhone,
        type,
        hasText: !!messageText,
        timestamp,
      });

      // Store in history
      messageHistory.push({
        id: messageId,
        from: senderPhone,
        name: customerName,
        text: messageText,
        type,
        timestamp,
        processed: false,
      });

      // Process if message contains text
      if (messageText.trim()) {
        await _processAndReply(senderPhone, messageText, customerName);
      }
    }
  } catch (error) {
    logger.error('Failed to handle incoming message', { error: error.message });
  }
}

/**
 * Process message and send automatic reply
 */
async function _processAndReply(senderPhone, messageText, customerName) {
  try {
    logger.info('Processing message for order match', {
      from: senderPhone,
      hasCustomerName: !!customerName,
    });

    // Perform order matching with priority rules
    const matchResult = await orderMatcher.matchOrder(senderPhone, customerName);

    logger.info('Order match result', {
      matchType: matchResult.matchType,
      confidence: matchResult.confidence,
      ordersFound: matchResult.orders.length,
    });

    // Send automatic reply based on matching result
    const reply = matchResult.message;
    const sendResult = await whatsappService.sendMessage(senderPhone, reply);

    if (sendResult.success) {
      logger.info('Auto-reply sent', {
        to: senderPhone,
        matchType: matchResult.matchType,
      });

      // Update message history
      messageHistory[messageHistory.length - 1].processed = true;
      messageHistory[messageHistory.length - 1].matchType = matchResult.matchType;
      messageHistory[messageHistory.length - 1].ordersMatched = matchResult.orders.length;
    } else {
      logger.error('Failed to send auto-reply', {
        to: senderPhone,
        error: sendResult.error,
      });
    }
  } catch (error) {
    logger.error('Failed to process and reply', { error: error.message });
  }
}

/**
 * Handle message delivery status
 */
async function _handleMessageStatus(statusData) {
  const statuses = statusData.statuses || [];

  for (const status of statuses) {
    logger.info('Message status update', {
      messageId: status.id,
      status: status.status,
      timestamp: status.timestamp,
    });
  }
}

export default router;
