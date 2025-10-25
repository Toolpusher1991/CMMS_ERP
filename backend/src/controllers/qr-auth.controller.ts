import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { validateQRToken } from '../utils/qr-auth';
import { AppError } from '../middleware/error.middleware';
import { securityLogger } from '../utils/logger';

const qrLoginSchema = z.object({
  qrToken: z.string().min(20, 'Invalid QR token format'),
});

/**
 * QR-Code Login Endpoint
 * 
 * Sicherheit:
 * - Token wird nicht wiederverwendet (One-Time-Use möglich)
 * - Audit-Logging für jeden Login
 * - IP-Tracking
 * - Rate-Limiting (via Middleware)
 */
export const qrLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = qrLoginSchema.parse(req.body);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    console.log(`[QR-LOGIN] Attempt from IP: ${ip}`);

    // Validiere QR-Token
    const user = await validateQRToken(validated.qrToken);

    // Security Logging
    securityLogger.loginAttempt(user.email, true, ip as string);
    securityLogger.loginSuccess(user.id, user.email, ip as string);
    
    console.log(`[QR-LOGIN] ✅ Success: ${user.email} (${user.firstName} ${user.lastName})`);

    // Generate JWT tokens (same as normal login)
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        assignedPlant: user.assignedPlant,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'QR login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          assignedPlant: user.assignedPlant,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('[QR-LOGIN] ❌ Error:', error);
    
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    
    if (error instanceof Error) {
      securityLogger.loginFailed('QR-Token', error.message, req.socket.remoteAddress || 'unknown');
      return next(new AppError(error.message, 401));
    }
    
    next(error);
  }
};
