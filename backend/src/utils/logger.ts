import winston from 'winston';
import path from 'path';

const logDir = path.join(__dirname, '../../logs');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`
      : `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Create logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
});

// Security event logger
export const securityLogger = {
  loginAttempt: (email: string, success: boolean, ip?: string) => {
    logger.info(`Login attempt - Email: ${email}, Success: ${success}, IP: ${ip}`);
  },
  
  loginSuccess: (userId: string, email: string, ip?: string) => {
    logger.info(`Login successful - User: ${userId} (${email}), IP: ${ip}`);
  },
  
  loginFailed: (email: string, reason: string, ip?: string) => {
    logger.warn(`Login failed - Email: ${email}, Reason: ${reason}, IP: ${ip}`);
  },
  
  tokenRefreshed: (userId: string, ip?: string) => {
    logger.info(`Token refreshed - User: ${userId}, IP: ${ip}`);
  },
  
  unauthorizedAccess: (path: string, ip?: string) => {
    logger.warn(`Unauthorized access attempt - Path: ${path}, IP: ${ip}`);
  },
  
  userCreated: (userId: string, email: string, by: string) => {
    logger.info(`User created - User: ${userId} (${email}), By: ${by}`);
  },
  
  userDeleted: (userId: string, by: string) => {
    logger.info(`User deleted - User: ${userId}, By: ${by}`);
  },
};
