// Main Express Server
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './utils/config.js';
import logger from './utils/logger.js';

// API Routes
import webhooksRouter from './api/webhooks.js';
import ordersRouter from './api/orders.js';
import messagesRouter from './api/messages.js';
import statsRouter from './api/stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Log all requests
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, { query: req.query });
  next();
});

// API Routes
app.use('/api/webhooks', webhooksRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/messages', messagesRouter);
app.use('/api', statsRouter);

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API Documentation
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Open Claw WhatsApp Automation Agent',
    version: '1.0.0',
    description: 'WhatsApp automation agent for order matching and automatic replies',
    endpoints: {
      webhooks: {
        'GET /api/webhooks/whatsapp': 'Webhook verification',
        'POST /api/webhooks/whatsapp': 'Receive WhatsApp messages',
      },
      orders: {
        'POST /api/orders/match-by-phone': 'Match order by phone number (Priority 1)',
        'POST /api/orders/match-by-name': 'Match orders by customer name (Priority 2)',
        'POST /api/orders/match-full': 'Full order matching with priority rules',
        'GET /api/orders/:orderId': 'Get order details by ID',
        'DELETE /api/orders/:orderId/clear-cache': 'Clear cache for order',
      },
      messages: {
        'GET /api/messages': 'Get message history',
        'POST /api/messages/send': 'Send manual message',
        'POST /api/messages/send-group': 'Send group message',
        'GET /api/messages/:messageId': 'Get message details',
        'GET /api/messages/conversation/:phoneNumber': 'Get conversation history',
      },
      stats: {
        'GET /api/stats': 'Get system statistics',
        'GET /api/health': 'Health check',
      },
    },
    config: {
      port: config.port,
      environment: config.nodeEnv,
      whatsappConfigured: !!config.whatsappApiToken,
      orderSystemConfigured: !!config.orderSystemApiUrl,
    },
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Open Claw WhatsApp Automation Agent',
    status: 'running',
    version: '1.0.0',
    dashboard: 'http://localhost:' + config.port + '/dashboard',
    docs: 'http://localhost:' + config.port + '/api/docs',
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 Open Claw Server Started`, {
    port: PORT,
    environment: config.nodeEnv,
    whatsappConfigured: !!config.whatsappApiToken,
    orderSystemConfigured: !!config.orderSystemApiUrl,
  });

  logger.info(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  logger.info(`📖 API Docs: http://localhost:${PORT}/api/docs`);
});

export default app;
