import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { AppError } from '../middleware/error.middleware';
import { securityLogger } from '../utils/logger';
import { accountLockout } from '../utils/account-lockout';
import { sanitize } from '../utils/sanitize';
import type { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Strong password validation
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// Token generation helpers
const generateAccessToken = (userId: string, email: string, role: string, assignedPlant?: string | null) => {
  return jwt.sign(
    { id: userId, email, role, assignedPlant },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' } // Short-lived access token
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const getClientIp = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = registerSchema.parse(req.body);
    const ip = getClientIp(req);

    // Check if user exists - case insensitive
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: {
          equals: validated.email,
          mode: 'insensitive'
        }
      },
    });

    if (existingUser) {
      securityLogger.loginFailed(validated.email, 'User already exists', ip);
      throw new AppError('User already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 12);

    // Create user with automatic APPROVED status
    const user = await prisma.user.create({
      data: {
        ...validated,
        password: hashedPassword,
        approvalStatus: 'APPROVED',
        isActive: true, // User is active immediately
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        approvalStatus: true,
        createdAt: true,
      },
    });

    securityLogger.userCreated(user.id, user.email, 'self-registration');

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.',
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = loginSchema.parse(req.body);
    const ip = getClientIp(req);

    // Sanitize input and normalize to lowercase for case-insensitive comparison
    const email = sanitize.email(validated.email).toLowerCase();

    securityLogger.loginAttempt(email, false, ip);

    // Check if account is locked
    const isLocked = await accountLockout.isLocked(email);
    if (isLocked) {
      securityLogger.loginFailed(email, 'Account is locked', ip);
      throw new AppError(
        'Account is temporarily locked due to multiple failed login attempts. Please try again in 30 minutes.',
        423
      );
    }

    // Find user - case insensitive search
    const user = await prisma.user.findFirst({
      where: { 
        email: {
          equals: email,
          mode: 'insensitive'
        }
      },
    });

    if (!user) {
      await accountLockout.recordFailedAttempt(email, ip);
      securityLogger.loginFailed(email, 'User not found', ip);
      throw new AppError('Invalid credentials', 401);
    }

    // Check approval status
    if (user.approvalStatus === 'PENDING') {
      securityLogger.loginFailed(email, 'Account pending approval', ip);
      throw new AppError('Your account is pending administrator approval', 403);
    }

    if (user.approvalStatus === 'REJECTED') {
      securityLogger.loginFailed(email, 'Account rejected', ip);
      throw new AppError('Your account registration has been rejected', 403);
    }

    if (!user.isActive) {
      securityLogger.loginFailed(email, 'Account deactivated', ip);
      throw new AppError('Account is deactivated', 403);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
      validated.password,
      user.password
    );

    if (!isPasswordValid) {
      await accountLockout.recordFailedAttempt(email, ip);
      const remaining = await accountLockout.getRemainingAttempts(email);
      securityLogger.loginFailed(email, 'Invalid password', ip);
      
      if (remaining <= 3 && remaining > 0) {
        throw new AppError(
          `Invalid credentials. ${remaining} attempts remaining before account lockout.`,
          401
        );
      }
      
      throw new AppError('Invalid credentials', 401);
    }

    // Reset login attempts on successful login
    await accountLockout.resetAttempts(email);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role, user.assignedPlant);
    const refreshToken = generateRefreshToken();

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    securityLogger.loginSuccess(user.id, user.email, ip);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = refreshTokenSchema.parse(req.body);
    const ip = getClientIp(req);

    // Find refresh token
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: validated.refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new AppError('Refresh token expired', 401);
    }

    // Check if user is still active
    if (!storedToken.user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // Generate new access token
    const accessToken = generateAccessToken(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role
    );

    securityLogger.tokenRefreshed(storedToken.user.id, ip);

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete refresh token
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = forgotPasswordSchema.parse(req.body);
    const ip = getClientIp(req);

    // Find user - case insensitive
    const user = await prisma.user.findFirst({
      where: { 
        email: {
          equals: validated.email,
          mode: 'insensitive'
        }
      },
    });

    // Create password reset request (even if user doesn't exist for security)
    await prisma.passwordResetRequest.create({
      data: {
        email: validated.email,
        userId: user?.id,
        status: 'PENDING',
      },
    });

    if (user) {
      securityLogger.info(
        `Password reset requested for user ${user.email} (userId: ${user.id}, ip: ${ip})`
      );
    } else {
      securityLogger.warn(
        `Password reset requested for non-existent email ${validated.email} (ip: ${ip})`
      );
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account with this email exists, an administrator has been notified.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};
