import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate as authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/actions');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

// GET all actions
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { plant, status, priority } = req.query;

    const where: Record<string, unknown> = {};
    if (plant) where.plant = plant;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const actions = await prisma.action.findMany({
      where,
      include: {
        actionFiles: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(actions);
  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

// GET single action
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const action = await prisma.action.findUnique({
      where: { id },
      include: {
        actionFiles: true,
      },
    });

    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    res.json(action);
  } catch (error) {
    console.error('Error fetching action:', error);
    res.status(500).json({ error: 'Failed to fetch action' });
  }
});

// CREATE new action
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      plant,
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
    } = req.body;

    // Validation
    if (!plant || !title) {
      return res.status(400).json({ error: 'Plant and title are required' });
    }

    const validPlants = ['T208', 'T207', 'T700', 'T46'];
    if (!validPlants.includes(plant)) {
      return res.status(400).json({ error: 'Invalid plant' });
    }

    const authReq = req as AuthRequest;
    const action = await prisma.action.create({
      data: {
        plant,
        title,
        description,
        status: status || 'OPEN',
        priority: priority || 'MEDIUM',
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: authReq.user?.email || 'Unknown',
      },
      include: {
        actionFiles: true,
      },
    });

    res.status(201).json(action);
  } catch (error) {
    console.error('Error creating action:', error);
    res.status(500).json({ error: 'Failed to create action' });
  }
});

// UPDATE action
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      plant,
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
    } = req.body;

    const existingAction = await prisma.action.findUnique({
      where: { id },
    });

    if (!existingAction) {
      return res.status(404).json({ error: 'Action not found' });
    }

    const updateData: Record<string, unknown> = {};
    if (plant !== undefined) updateData.plant = plant;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    // Set completedAt when status changes to COMPLETED
    if (status === 'COMPLETED' && existingAction.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (status !== 'COMPLETED' && existingAction.status === 'COMPLETED') {
      updateData.completedAt = null;
    }

    const action = await prisma.action.update({
      where: { id },
      data: updateData,
      include: {
        actionFiles: true,
      },
    });

    res.json(action);
  } catch (error) {
    console.error('Error updating action:', error);
    res.status(500).json({ error: 'Failed to update action' });
  }
});

// DELETE action
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingAction = await prisma.action.findUnique({
      where: { id },
      include: {
        actionFiles: true,
      },
    });

    if (!existingAction) {
      return res.status(404).json({ error: 'Action not found' });
    }

    // Delete all associated files from filesystem
    for (const file of existingAction.actionFiles) {
      const filePath = path.join(uploadsDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete action (cascade will delete ActionFiles from DB)
    await prisma.action.delete({
      where: { id },
    });

    res.json({ message: 'Action deleted successfully' });
  } catch (error) {
    console.error('Error deleting action:', error);
    res.status(500).json({ error: 'Failed to delete action' });
  }
});

// UPLOAD files to action
router.post(
  '/:id/files',
  authenticateToken,
  upload.array('files', 10), // Max 10 files at once
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const action = await prisma.action.findUnique({
        where: { id },
      });

      if (!action) {
        // Clean up uploaded files
        files.forEach(file => {
          const filePath = path.join(uploadsDir, file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
        return res.status(404).json({ error: 'Action not found' });
      }

      // Determine if files are photos based on MIME type
      const isPhoto = (mimeType: string) => mimeType.startsWith('image/');

      const authReq = req as AuthRequest;
      
      // Create database records for each file
      const fileRecords = await Promise.all(
        files.map(file =>
          prisma.actionFile.create({
            data: {
              actionId: id,
              filename: file.filename,
              originalName: file.originalname,
              fileType: file.mimetype,
              fileSize: file.size,
              filePath: `uploads/actions/${file.filename}`,
              isPhoto: isPhoto(file.mimetype),
              uploadedBy: authReq.user?.email || 'Unknown',
            },
          })
        )
      );

      res.status(201).json(fileRecords);
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ error: 'Failed to upload files' });
    }
  }
);

// DELETE single file from action
router.delete(
  '/:actionId/files/:fileId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { actionId, fileId } = req.params;

      const file = await prisma.actionFile.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (file.actionId !== actionId) {
        return res.status(400).json({ error: 'File does not belong to this action' });
      }

      // Delete file from filesystem
      const filePath = path.join(uploadsDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database
      await prisma.actionFile.delete({
        where: { id: fileId },
      });

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }
);

// GET file (serve uploaded file)
router.get(
  '/files/:filename',
  authenticateToken,
  (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(uploadsDir, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.sendFile(filePath);
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ error: 'Failed to serve file' });
    }
  }
);

export default router;
