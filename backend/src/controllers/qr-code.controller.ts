import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import { AppError } from '../middleware/error.middleware';
import type { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

/**
 * QR-Code Image Generator
 * 
 * Security:
 * - Nur ADMIN und MANAGER dürfen QR-Codes abrufen
 * - QR-Code enthält nur den Token, kein Passwort
 * - PNG Format, 400x400px, hohe Fehlerkorrektur (Level H)
 */
export const getUserQRCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;
    const { userId } = req.params;

    // Security: Nur ADMIN und MANAGER
    if (!authReq.user || !['ADMIN', 'MANAGER'].includes(authReq.user.role)) {
      throw new AppError('Unauthorized: Admin or Manager access required', 403);
    }

    // Hole User mit QR-Token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        qrToken: true,
        assignedPlant: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.qrToken) {
      throw new AppError('User has no QR token. Generate one first.', 400);
    }

    // QR-Code Format: Der Token alleine (Backend validiert ihn später)
    const qrData = user.qrToken;

    // Generate QR-Code als PNG Buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H', // Höchste Fehlerkorrektur
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Set Headers für PNG mit CORS
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="QR_${user.email}.png"`);
    res.setHeader('Content-Length', qrCodeBuffer.length);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Send PNG
    res.send(qrCodeBuffer);

    console.log(`[QR-CODE] Generated for ${user.email} by ${authReq.user.email}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Liste alle User mit QR-Tokens (für Admin Dashboard)
 */
export const listUsersWithQRCodes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;

    // Security: Nur ADMIN
    if (!authReq.user || authReq.user.role !== 'ADMIN') {
      throw new AppError('Unauthorized: Admin access required', 403);
    }

    const users = await prisma.user.findMany({
      where: {
        qrToken: { not: null },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        assignedPlant: true,
        qrTokenCreatedAt: true,
        qrTokenLastUsed: true,
      },
      orderBy: { email: 'asc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
