import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { captureError } from '../lib/sentry';
import type { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// ── Valid status transitions ──────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT:            ['SUBMITTED', 'CANCELLED'],
  SUBMITTED:        ['TECHNICAL_REVIEW', 'REJECTED', 'CANCELLED'],
  TECHNICAL_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED:         ['QUOTED', 'REJECTED'],
  QUOTED:           ['CONTRACTED', 'REJECTED', 'CANCELLED'],
  REJECTED:         ['DRAFT'],                     // can revise
  CONTRACTED:       ['COMPLETED', 'CANCELLED'],
  COMPLETED:        [],
  CANCELLED:        ['DRAFT'],                     // can re-open
};

const ALL_STATUSES = Object.keys(VALID_TRANSITIONS);

// ── Helper: generate tender number ───────────────────────
async function generateTenderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TND-${year}-`;

  const lastTender = await prisma.tenderConfiguration.findFirst({
    where: { tenderNumber: { startsWith: prefix } },
    orderBy: { tenderNumber: 'desc' },
  });

  let seq = 1;
  if (lastTender?.tenderNumber) {
    const parts = lastTender.tenderNumber.split('-');
    seq = parseInt(parts[2], 10) + 1;
    if (isNaN(seq)) seq = 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

// ── Helper: record status change ─────────────────────────
async function recordStatusChange(
  tenderId: string,
  fromStatus: string,
  toStatus: string,
  changedBy: string,
  reason?: string,
) {
  await prisma.tenderStatusHistory.create({
    data: { tenderId, fromStatus, toStatus, changedBy, reason },
  });
}

// ── Shared include for full tender response ──────────────
const TENDER_INCLUDE = {
  createdByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
  comments: {
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  statusHistory: { orderBy: { createdAt: 'asc' as const } },
};

// ══════════════════════════════════════════════════════════
//  GET /api/tender  — list all tenders (Admins/Managers see all)
// ══════════════════════════════════════════════════════════
export const getAllTenderConfigurations = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const userRole = authReq.user?.role;
    if (!userId) throw new AppError('Unauthorized', 401);

    // Admins & Managers see every tender, others only their own
    const where =
      userRole === 'ADMIN' || userRole === 'MANAGER'
        ? {}
        : { createdBy: userId };

    const tenderConfigurations = await prisma.tenderConfiguration.findMany({
      where,
      include: TENDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: tenderConfigurations });
  } catch (error) {
    console.error('Error fetching tender configurations:', error);
    captureError(error as Error, {
      operation: 'getAllTenderConfigurations',
      userId: (req as AuthRequest).user?.id,
    });
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch tender configurations', 500);
  }
};

// ══════════════════════════════════════════════════════════
//  POST /api/tender  — create tender (DRAFT)
// ══════════════════════════════════════════════════════════
export const createTenderConfiguration = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401);

    const {
      projectName,
      clientName,
      location,
      projectDuration,
      selectedRig,
      selectedEquipment,
      totalPrice,
      notes,
      validUntil,
      technicalRisks,
      commercialNotes,
    } = req.body;

    if (!projectName || !selectedRig || totalPrice === undefined) {
      throw new AppError('Missing required fields: projectName, selectedRig, totalPrice', 400);
    }

    const tenderNumber = await generateTenderNumber();

    const tender = await prisma.tenderConfiguration.create({
      data: {
        tenderNumber,
        projectName,
        clientName,
        location,
        projectDuration,
        selectedRig,
        selectedEquipment: selectedEquipment ?? {},
        totalPrice,
        notes,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        technicalRisks: technicalRisks ?? null,
        commercialNotes: commercialNotes ?? null,
        status: 'DRAFT',
        isUnderContract: false,
        createdBy: userId,
      },
      include: TENDER_INCLUDE,
    });

    // Record initial status
    await recordStatusChange(tender.id, '', 'DRAFT', userId, 'Tender erstellt');

    res.status(201).json({
      success: true,
      data: tender,
      message: 'Tender configuration created successfully',
    });
  } catch (error) {
    console.error('Error creating tender configuration:', error);
    captureError(error as Error, {
      operation: 'createTenderConfiguration',
      userId: (req as AuthRequest).user?.id,
      projectName: req.body.projectName,
    });
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create tender configuration', 500);
  }
};

// ══════════════════════════════════════════════════════════
//  GET /api/tender/:id  — get single tender with relations
// ══════════════════════════════════════════════════════════
export const getTenderConfiguration = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const userRole = authReq.user?.role;
    const { id } = req.params;
    if (!userId) throw new AppError('Unauthorized', 401);

    const where =
      userRole === 'ADMIN' || userRole === 'MANAGER'
        ? { id }
        : { id, createdBy: userId };

    const tender = await prisma.tenderConfiguration.findFirst({
      where,
      include: TENDER_INCLUDE,
    });

    if (!tender) throw new AppError('Tender not found or access denied', 404);
    res.json({ success: true, data: tender });
  } catch (error) {
    console.error('Error fetching tender configuration:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch tender configuration', 500);
  }
};

// ══════════════════════════════════════════════════════════
//  PUT /api/tender/:id  — update tender fields
// ══════════════════════════════════════════════════════════
export const updateTenderConfiguration = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const userRole = authReq.user?.role;
    const { id } = req.params;
    if (!userId) throw new AppError('Unauthorized', 401);

    const where =
      userRole === 'ADMIN' || userRole === 'MANAGER'
        ? { id }
        : { id, createdBy: userId };

    const existing = await prisma.tenderConfiguration.findFirst({ where });
    if (!existing) throw new AppError('Tender not found or access denied', 404);

    // Strip workflow fields – those are changed via status-transition endpoint
    const {
      status: _s, submittedAt: _sa, submittedBy: _sb,
      reviewedAt: _ra, reviewedBy: _rb,
      approvedAt: _aa, approvedBy: _ab,
      rejectionReason: _rr, tenderNumber: _tn,
      ...safeData
    } = req.body;

    // Handle date fields
    if (safeData.validUntil) safeData.validUntil = new Date(safeData.validUntil);
    if (safeData.contractStartDate) safeData.contractStartDate = new Date(safeData.contractStartDate);
    if (safeData.contractEndDate) safeData.contractEndDate = new Date(safeData.contractEndDate);

    const updated = await prisma.tenderConfiguration.update({
      where: { id },
      data: safeData,
      include: TENDER_INCLUDE,
    });

    res.json({ success: true, data: updated, message: 'Tender updated' });
  } catch (error) {
    console.error('Error updating tender configuration:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update tender configuration', 500);
  }
};

// ══════════════════════════════════════════════════════════
//  PATCH /api/tender/:id/status  — workflow status transition
// ══════════════════════════════════════════════════════════
export const transitionTenderStatus = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const userRole = authReq.user?.role;
    const { id } = req.params;
    const { toStatus, reason, contractStartDate, contractEndDate } = req.body;

    if (!userId) throw new AppError('Unauthorized', 401);
    if (!toStatus || !ALL_STATUSES.includes(toStatus)) {
      throw new AppError(`Invalid status: ${toStatus}. Valid: ${ALL_STATUSES.join(', ')}`, 400);
    }

    const tender = await prisma.tenderConfiguration.findFirst({
      where:
        userRole === 'ADMIN' || userRole === 'MANAGER'
          ? { id }
          : { id, createdBy: userId },
    });
    if (!tender) throw new AppError('Tender not found or access denied', 404);

    const currentStatus = tender.status;
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new AppError(
        `Transition ${currentStatus} → ${toStatus} not allowed. Allowed: ${allowed.join(', ')}`,
        400,
      );
    }

    // Role checks for critical transitions
    if (['TECHNICAL_REVIEW', 'APPROVED', 'REJECTED'].includes(toStatus)) {
      if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        throw new AppError('Only Admins/Managers can review or approve tenders', 403);
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = { status: toStatus };

    if (toStatus === 'SUBMITTED') {
      updateData.submittedAt = new Date();
      updateData.submittedBy = userId;
    }
    if (toStatus === 'TECHNICAL_REVIEW' || toStatus === 'APPROVED') {
      updateData.reviewedAt = new Date();
      updateData.reviewedBy = userId;
    }
    if (toStatus === 'APPROVED') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = userId;
    }
    if (toStatus === 'REJECTED') {
      updateData.rejectionReason = reason || null;
    }
    if (toStatus === 'CONTRACTED') {
      updateData.isUnderContract = true;
      if (contractStartDate) updateData.contractStartDate = new Date(contractStartDate);
      if (contractEndDate) updateData.contractEndDate = new Date(contractEndDate);
    }
    if (toStatus === 'COMPLETED' || toStatus === 'CANCELLED') {
      if (toStatus === 'CANCELLED') updateData.isUnderContract = false;
    }
    if (toStatus === 'DRAFT') {
      // Re-open: clear rejection
      updateData.rejectionReason = null;
    }

    const updated = await prisma.tenderConfiguration.update({
      where: { id },
      data: updateData,
      include: TENDER_INCLUDE,
    });

    await recordStatusChange(id, currentStatus, toStatus, userId, reason);

    // Create notifications for admins/managers
    try {
      const notifMap: Record<string, { title: string; message: string }> = {
        SUBMITTED: {
          title: 'Neuer Tender zur Prüfung',
          message: `Tender "${tender.projectName}" (${tender.tenderNumber ?? ''}) wurde zur technischen Prüfung eingereicht.`,
        },
        APPROVED: {
          title: 'Tender genehmigt',
          message: `Tender "${tender.projectName}" (${tender.tenderNumber ?? ''}) wurde genehmigt.`,
        },
        REJECTED: {
          title: 'Tender abgelehnt',
          message: `Tender "${tender.projectName}" (${tender.tenderNumber ?? ''}) wurde abgelehnt. Grund: ${reason || 'Kein Grund angegeben'}`,
        },
        CONTRACTED: {
          title: 'Tender unter Vertrag',
          message: `Tender "${tender.projectName}" (${tender.tenderNumber ?? ''}) ist jetzt unter Vertrag.`,
        },
      };

      const notif = notifMap[toStatus];
      if (notif) {
        // Find all admin/manager users to notify
        const targetUsers = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'MANAGER'] } },
          select: { id: true },
        });
        // Also notify the tender creator if they aren't the one making the change
        const recipientIds = new Set(targetUsers.map(u => u.id));
        if (tender.createdBy !== userId) recipientIds.add(tender.createdBy);

        await prisma.notification.createMany({
          data: Array.from(recipientIds).map(uid => ({
            userId: uid,
            type: 'TENDER_STATUS',
            title: notif.title,
            message: notif.message,
            relatedId: id,
          })),
        });
      }
    } catch (notifError) {
      console.error('Notification error (non-blocking):', notifError);
    }

    res.json({
      success: true,
      data: updated,
      message: `Status changed: ${currentStatus} → ${toStatus}`,
    });
  } catch (error) {
    console.error('Error transitioning tender status:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to transition tender status', 500);
  }
};

// ══════════════════════════════════════════════════════════
//  PATCH /api/tender/:id/contract-status  — legacy toggle (backwards compat)
// ══════════════════════════════════════════════════════════
export const toggleContractStatus = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { id } = req.params;
    if (!userId) throw new AppError('Unauthorized', 401);

    const existing = await prisma.tenderConfiguration.findFirst({
      where: { id, createdBy: userId },
    });
    if (!existing) throw new AppError('Tender not found or access denied', 404);

    const updated = await prisma.tenderConfiguration.update({
      where: { id },
      data: { isUnderContract: !existing.isUnderContract },
    });

    res.json({
      success: true,
      data: updated,
      message: `Contract status updated to ${updated.isUnderContract ? 'under contract' : 'pending'}`,
    });
  } catch (error) {
    console.error('Error toggling contract status:', error);
    throw new AppError('Failed to update contract status', 500);
  }
};

// ══════════════════════════════════════════════════════════
//  DELETE /api/tender/:id
// ══════════════════════════════════════════════════════════
export const deleteTenderConfiguration = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const userRole = authReq.user?.role;
    const { id } = req.params;
    if (!userId) throw new AppError('Unauthorized', 401);

    const where =
      userRole === 'ADMIN' || userRole === 'MANAGER'
        ? { id }
        : { id, createdBy: userId };

    const existing = await prisma.tenderConfiguration.findFirst({ where });
    if (!existing) throw new AppError('Tender not found or access denied', 404);

    await prisma.tenderConfiguration.delete({ where: { id } });
    res.json({ success: true, message: 'Tender deleted' });
  } catch (error) {
    console.error('Error deleting tender configuration:', error);
    throw new AppError('Failed to delete tender configuration', 500);
  }
};

// ══════════════════════════════════════════════════════════
//  POST /api/tender/:id/comments  — add comment
// ══════════════════════════════════════════════════════════
export const addTenderComment = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { id } = req.params;
    const { text } = req.body;

    if (!userId) throw new AppError('Unauthorized', 401);
    if (!text?.trim()) throw new AppError('Comment text is required', 400);

    const tender = await prisma.tenderConfiguration.findFirst({ where: { id } });
    if (!tender) throw new AppError('Tender not found', 404);

    const comment = await prisma.tenderComment.create({
      data: { tenderId: id, userId, text: text.trim() },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error('Error adding tender comment:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to add comment', 500);
  }
};

// ══════════════════════════════════════════════════════════
//  GET /api/tender/:id/comments  — list comments
// ══════════════════════════════════════════════════════════
export const getTenderComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const comments = await prisma.tenderComment.findMany({
      where: { tenderId: id },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw new AppError('Failed to fetch comments', 500);
  }
};

// ══════════════════════════════════════════════════════════
//  GET /api/tender/:id/history  — status history
// ══════════════════════════════════════════════════════════
export const getTenderHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const history = await prisma.tenderStatusHistory.findMany({
      where: { tenderId: id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching status history:', error);
    throw new AppError('Failed to fetch status history', 500);
  }
};