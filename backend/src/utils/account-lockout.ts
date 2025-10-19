import { PrismaClient } from '@prisma/client';
import { securityLogger } from '../utils/logger';

const prisma = new PrismaClient();

const MAX_LOGIN_ATTEMPTS = 10;
const LOCKOUT_DURATION_MINUTES = 30;

export const accountLockout = {
  /**
   * Check if account is locked
   */
  async isLocked(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { lockedUntil: true },
    });

    if (!user || !user.lockedUntil) {
      return false;
    }

    // Check if lockout period has expired
    if (user.lockedUntil < new Date()) {
      // Reset lockout
      await this.resetAttempts(email);
      return false;
    }

    return true;
  },

  /**
   * Record failed login attempt
   */
  async recordFailedAttempt(email: string, ip?: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { loginAttempts: true, lockedUntil: true },
    });

    if (!user) {
      return; // Don't leak user existence
    }

    const attempts = user.loginAttempts + 1;
    const now = new Date();

    // Lock account if max attempts reached
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(
        now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000
      );

      await prisma.user.update({
        where: { email },
        data: {
          loginAttempts: attempts,
          lockedUntil,
          lastLoginAttempt: now,
        },
      });

      securityLogger.loginFailed(
        email,
        `Account locked after ${MAX_LOGIN_ATTEMPTS} failed attempts`,
        ip
      );
    } else {
      await prisma.user.update({
        where: { email },
        data: {
          loginAttempts: attempts,
          lastLoginAttempt: now,
        },
      });
    }
  },

  /**
   * Reset login attempts on successful login
   */
  async resetAttempts(email: string): Promise<void> {
    await prisma.user.update({
      where: { email },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAttempt: new Date(),
      },
    });
  },

  /**
   * Get remaining attempts before lockout
   */
  async getRemainingAttempts(email: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { loginAttempts: true },
    });

    if (!user) {
      return MAX_LOGIN_ATTEMPTS;
    }

    return Math.max(0, MAX_LOGIN_ATTEMPTS - user.loginAttempts);
  },

  /**
   * Manually unlock account (admin function)
   */
  async unlockAccount(email: string): Promise<void> {
    await prisma.user.update({
      where: { email },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
      },
    });

    securityLogger.loginSuccess(
      email,
      'Account manually unlocked by admin',
      'admin'
    );
  },
};
