// src/utils/logger.js - Centralized logging utility
import winston from 'winston';
import { config } from '../config/environment.js';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]`;
    
    if (requestId) {
      logMessage += ` [${requestId}]`;
    }
    
    logMessage += `: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` | ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for production logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Create logs directory if it doesn't exist
import { existsSync, mkdirSync } from 'fs';
if (!existsSync('logs')) {
  mkdirSync('logs');
}

// Helper functions for structured logging
export const logWithContext = (level, message, context = {}) => {
  logger[level](message, context);
};

export const logRequest = (requestId, method, url, userContext = {}) => {
  logger.info('API Request', {
    requestId,
    method,
    url,
    userId: userContext.userId,
    timestamp: new Date().toISOString()
  });
};

export const logResponse = (requestId, statusCode, executionTime) => {
  logger.info('API Response', {
    requestId,
    statusCode,
    executionTime: `${executionTime}ms`,
    timestamp: new Date().toISOString()
  });
};

export const logError = (error, context = {}) => {
  logger.error('Application Error', {
    error: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString()
  });
};

export const logSecurityEvent = (event, details = {}) => {
  logger.warn('Security Event', {
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Performance monitoring helpers
export const createPerformanceTimer = (operation) => {
  const startTime = Date.now();
  
  return {
    end: (additionalInfo = {}) => {
      const executionTime = Date.now() - startTime;
      logger.debug('Performance Metric', {
        operation,
        executionTime: `${executionTime}ms`,
        ...additionalInfo
      });
      return executionTime;
    }
  };
};

// Export default logger
export default logger;