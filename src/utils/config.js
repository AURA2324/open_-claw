// Configuration manager
import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // WhatsApp
  whatsappApiToken: process.env.WHATSAPP_API_TOKEN || '',
  whatsappBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  whatsappApiVersion: 'v18.0',

  // Order System
  orderSystemApiUrl: process.env.ORDER_SYSTEM_API_URL || '',
  orderSystemApiKey: process.env.ORDER_SYSTEM_API_KEY || '',
  orderSystemDbHost: process.env.ORDER_SYSTEM_DB_HOST || 'localhost',
  orderSystemDbUser: process.env.ORDER_SYSTEM_DB_USER || '',
  orderSystemDbPassword: process.env.ORDER_SYSTEM_DB_PASSWORD || '',
  orderSystemDbName: process.env.ORDER_SYSTEM_DB_NAME || 'orders',

  // Tanzania
  tanzaniaPrefix: process.env.TANZANIA_PREFIX || '+255',

  // Cache
  cacheTtl: parseInt(process.env.CACHE_TTL || '3600'),
  maxCacheSize: parseInt(process.env.MAX_CACHE_SIZE || '1000'),

  // Feature Flags
  enableDetailedLogging: process.env.NODE_ENV === 'development',
};

export default config;
