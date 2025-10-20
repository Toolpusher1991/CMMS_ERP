import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { securityLogger } from '../utils/logger';

const prisma = new PrismaClient();

// ============================================
// SCHEMAS
// ============================================

const approveUserSchema = z.object({
  approvalStatus: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

// ============================================
// GET PENDING USERS (Admin only)
// ============================================

export const getPendingUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        approvalStatus: 'PENDING',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: pendingUsers,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// APPROVE/REJECT USER (Admin only)
// ============================================

export const approveUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const validated = approveUserSchema.parse(req.body);
    const adminId = req.user!.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.approvalStatus !== 'PENDING') {
      throw new AppError(
        `User is already ${user.approvalStatus.toLowerCase()}`,
        400
      );
    }

    // Update user approval status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: validated.approvalStatus,
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: validated.rejectionReason,
        isActive: validated.approvalStatus === 'APPROVED',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        approvalStatus: true,
        approvedAt: true,
        isActive: true,
      },
    });

    securityLogger.info(
      `User ${validated.approvalStatus.toLowerCase()} - ID: ${id}, Email: ${
        user.email
      }, Admin: ${adminId}`
    );

    res.json({
      success: true,
      message: `User ${validated.approvalStatus.toLowerCase()} successfully`,
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

// ============================================
// CHANGE PASSWORD (Admin for any user)
// ============================================

export const changeUserPassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const validated = changePasswordSchema.parse(req.body);
    const adminId = req.user!.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        lastPasswordChange: new Date(),
      },
    });

    securityLogger.info(
      `Password changed by admin - User: ${user.email}, Admin: ${adminId}`
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

// ============================================
// CHANGE OWN PASSWORD (User self-service)
// ============================================

export const changeOwnPassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const validated = changeOwnPasswordSchema.parse(req.body);

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      validated.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      securityLogger.warn(
        `Failed password change attempt - User: ${user.email}`
      );
      throw new AppError('Current password is incorrect', 401);
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(
      validated.newPassword,
      user.password
    );

    if (isSamePassword) {
      throw new AppError(
        'New password must be different from current password',
        400
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        lastPasswordChange: new Date(),
      },
    });

    securityLogger.info(`Password changed successfully - User: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

// ============================================
// UNLOCK USER ACCOUNT (Admin only)
// ============================================

export const unlockUserAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Reset lockout fields
    await prisma.user.update({
      where: { id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAttempt: null,
      },
    });

    securityLogger.info(
      `Account unlocked - User: ${user.email}, Admin: ${adminId}`
    );

    res.json({
      success: true,
      message: 'User account unlocked successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET USER STATISTICS (Admin only)
// ============================================

export const getUserStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      rejectedUsers,
      lockedUsers,
      passwordResetRequests,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true, approvalStatus: 'APPROVED' } }),
      prisma.user.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.user.count({ where: { approvalStatus: 'REJECTED' } }),
      prisma.user.count({
        where: {
          lockedUntil: {
            gte: new Date(),
          },
        },
      }),
      prisma.passwordResetRequest.count({ where: { status: 'PENDING' } }),
    ]);

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        pendingUsers,
        rejectedUsers,
        lockedUsers,
        passwordResetRequests,
        usersByRole: usersByRole.map((item: { role: string; _count: number }) => ({
          role: item.role,
          count: item._count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET PASSWORD RESET REQUESTS (Admin only)
// ============================================

export const getPasswordResetRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const requests = await prisma.passwordResetRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// RESOLVE PASSWORD RESET REQUEST (Admin only)
// ============================================

const resolvePasswordResetSchema = z.object({
  action: z.enum(['resolve', 'cancel']),
  note: z.string().optional(),
});

export const resolvePasswordResetRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const validated = resolvePasswordResetSchema.parse(req.body);
    const adminId = req.user!.id;

    const request = await prisma.passwordResetRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new AppError('Password reset request not found', 404);
    }

    if (request.status !== 'PENDING') {
      throw new AppError('This request has already been processed', 400);
    }

    await prisma.passwordResetRequest.update({
      where: { id },
      data: {
        status: validated.action === 'resolve' ? 'RESOLVED' : 'CANCELLED',
        resolvedBy: adminId,
        resolvedAt: new Date(),
        note: validated.note,
      },
    });

    securityLogger.info(
      `Password reset request ${id} ${validated.action}d by admin ${adminId}`
    );

    res.json({
      success: true,
      message: `Password reset request ${validated.action}d successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};
