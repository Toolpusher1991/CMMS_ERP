import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// ── GET /api/tender/:id/tasks ─────────────────────────────
export async function getTenderTasks(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const tasks = await prisma.tenderEquipmentTask.findMany({
      where: { tenderId: id },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error fetching tender tasks:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Laden der Aufgaben' });
  }
}

// ── POST /api/tender/:id/tasks ────────────────────────────
export async function createTenderTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const {
      equipmentCategory,
      title,
      description,
      priority,
      assignedTo,
      assignedToUserId,
      dueDate,
    } = req.body;

    if (!title || !equipmentCategory) {
      return res.status(400).json({
        success: false,
        message: 'Titel und Equipment-Kategorie sind erforderlich',
      });
    }

    // Verify tender exists
    const tender = await prisma.tenderConfiguration.findUnique({
      where: { id },
    });
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender nicht gefunden' });
    }

    const task = await prisma.tenderEquipmentTask.create({
      data: {
        tenderId: id,
        equipmentCategory,
        title,
        description: description || null,
        priority: priority || 'MEDIUM',
        assignedTo: assignedTo || null,
        assignedToUserId: assignedToUserId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: userId,
      },
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('Error creating tender task:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Erstellen der Aufgabe' });
  }
}

// ── PATCH /api/tender/:id/tasks/:taskId ───────────────────
export async function updateTenderTask(req: AuthRequest, res: Response) {
  try {
    const { taskId } = req.params;
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      assignedToUserId,
      dueDate,
    } = req.body;

    const existing = await prisma.tenderEquipmentTask.findUnique({
      where: { id: taskId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Aufgabe nicht gefunden' });
    }

    // Calculate completedAt
    let completedAt = existing.completedAt;
    if (status === 'DONE' && existing.status !== 'DONE') {
      completedAt = new Date();
    } else if (status && status !== 'DONE') {
      completedAt = null;
    }

    const task = await prisma.tenderEquipmentTask.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(assignedToUserId !== undefined && { assignedToUserId }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        completedAt,
      },
    });

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Error updating tender task:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Aktualisieren der Aufgabe' });
  }
}

// ── DELETE /api/tender/:id/tasks/:taskId ──────────────────
export async function deleteTenderTask(req: AuthRequest, res: Response) {
  try {
    const { taskId } = req.params;

    const existing = await prisma.tenderEquipmentTask.findUnique({
      where: { id: taskId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Aufgabe nicht gefunden' });
    }

    await prisma.tenderEquipmentTask.delete({ where: { id: taskId } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting tender task:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Löschen der Aufgabe' });
  }
}
