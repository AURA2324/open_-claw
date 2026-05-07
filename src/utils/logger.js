// Logger utility for consistent logging
import fs from 'fs';
import path from 'path';

const LOG_DIR = './logs';

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const getTimestamp = () => {
  return new Date().toISOString();
};

const log = (level, message, data = null) => {
  const timestamp = getTimestamp();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data }),
  };

  const logMessage = `[${timestamp}] [${level}] ${message}${data ? ` - ${JSON.stringify(data)}` : ''}`;
  
  // Console output
  if (level === 'ERROR') {
    console.error(logMessage);
  } else if (level === 'WARN') {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }

  // File logging
  try {
    const logFile = path.join(LOG_DIR, `${level.toLowerCase()}.log`);
    fs.appendFileSync(logFile, logMessage + '\n');
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
};

export const logger = {
  info: (message, data) => log('INFO', message, data),
  warn: (message, data) => log('WARN', message, data),
  error: (message, data) => log('ERROR', message, data),
  debug: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      log('DEBUG', message, data);
    }
  },
};

export default logger;
