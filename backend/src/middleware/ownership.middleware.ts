import { Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import type { AuthRequest } from '../middleware/auth.middleware';
import { securityLogger } from '../utils/logger';

/**
 * Middleware to check if user owns the resource or is an admin
 */
export const authorizeOwnership = (resourceIdParam: string = 'id') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.params[resourceIdParam];
    const currentUser = req.user;

    if (!currentUser) {
      return next(new AppError('Unauthorized', 401));
    }

    // Admin can access all resources
    if (currentUser.role === 'ADMIN') {
      return next();
    }

    // User can only access their own resources
    if (currentUser.id !== userId) {
      securityLogger.unauthorizedAccess(
        `User ${currentUser.id} tried to access user ${userId}`,
        req.socket.remoteAddress
      );
      return next(
        new AppError('Forbidden: You can only access your own data', 403)
      );
    }

    next();
  };
};

/**
 * Middleware to prevent users from escalating their own privileges
 */
export const preventPrivilegeEscalation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const currentUser = req.user;
  const targetRole = req.body.role;

  if (!currentUser) {
    return next(new AppError('Unauthorized', 401));
  }

  // Only admins can change roles
  if (targetRole && currentUser.role !== 'ADMIN') {
    securityLogger.unauthorizedAccess(
      `User ${currentUser.id} tried to escalate privileges to ${targetRole}`,
      req.socket.remoteAddress
    );
    return next(
      new AppError('Forbidden: Only admins can change user roles', 403)
    );
  }

  // Prevent admins from demoting themselves (unless there are other admins)
  if (
    currentUser.role === 'ADMIN' &&
    targetRole !== 'ADMIN' &&
    currentUser.id === req.params.id
  ) {
    return next(
      new AppError(
        'Forbidden: Admins cannot change their own role. Ask another admin.',
        403
      )
    );
  }

  next();
};
