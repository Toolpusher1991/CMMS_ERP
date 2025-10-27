import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate as authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { filterByAssignedPlant, validatePlantAccess } from '../middleware/plant-access.middleware';
import { sendStatusRequest } from '../controllers/status-request.controller';
import { cloudinaryUpload } from '../lib/cloudinary';

const router = express.Router();
const prisma = new PrismaClient();

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

// GET all actions
router.get('/', authenticateToken, filterByAssignedPlant, async (req: Request, res: Response) => {
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
router.get('/:id', authenticateToken, filterByAssignedPlant, async (req: Request, res: Response) => {
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

    // Check plant access
    const authReq = req as AuthRequest;
    const user = authReq.user;
    if (user?.assignedPlant && action.plant !== user.assignedPlant && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `You can only access ${user.assignedPlant} actions` 
      });
    }

    res.json(action);
  } catch (error) {
    console.error('Error fetching action:', error);
    res.status(500).json({ error: 'Failed to fetch action' });
  }
});

// CREATE new action
router.post('/', authenticateToken, validatePlantAccess, async (req: Request, res: Response) => {
  try {
    const {
      plant,
      category,
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
        category: category || 'ALLGEMEIN',
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

    // Check if action contains materials and send notification to RSC
    if (description && description.includes('--- Materialien ---')) {
      try {
        // Find RSC (Supply Coordinator) for this plant
        const rscEmail = `${plant}.RSC@maintain.com`;
        const rscUser = await prisma.user.findUnique({
          where: { email: rscEmail },
        });

        if (rscUser) {
          // Create notification for RSC
          await prisma.notification.create({
            data: {
              userId: rscUser.id,
              title: 'Neue Materialanforderung',
              message: `Materialbestellung für ${plant}: "${title}"`,
              type: 'MATERIAL_REQUEST',
              relatedId: action.id,
              isRead: false,
            },
          });

          console.log(`✅ Notification sent to RSC (${rscEmail}) for material request in action ${action.id}`);
        } else {
          console.warn(`⚠️ RSC user not found for plant ${plant}`);
        }
      } catch (notificationError) {
        console.error('Error sending RSC notification:', notificationError);
        // Don't fail the action creation if notification fails
      }
    }

    res.status(201).json(action);
  } catch (error) {
    console.error('Error creating action:', error);
    res.status(500).json({ error: 'Failed to create action' });
  }
});

// UPDATE action
router.put('/:id', authenticateToken, validatePlantAccess, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      plant,
      category,
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

    // Check plant access for existing action
    const authReq = req as AuthRequest;
    const user = authReq.user;
    if (user?.assignedPlant && existingAction.plant !== user.assignedPlant && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `You can only modify ${user.assignedPlant} actions` 
      });
    }

    const updateData: Record<string, unknown> = {};
    if (plant !== undefined) updateData.plant = plant;
    if (category !== undefined) updateData.category = category;
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

    // Check if materials were added and send notification to RSC
    if (description !== undefined && 
        description.includes('--- Materialien ---') && 
        !(existingAction.description?.includes('--- Materialien ---'))) {
      try {
        // Materials were just added - notify RSC
        const rscEmail = `${action.plant}.RSC@maintain.com`;
        const rscUser = await prisma.user.findUnique({
          where: { email: rscEmail },
        });

        if (rscUser) {
          await prisma.notification.create({
            data: {
              userId: rscUser.id,
              title: 'Neue Materialanforderung',
              message: `Materialbestellung für ${action.plant}: "${action.title}"`,
              type: 'MATERIAL_REQUEST',
              relatedId: action.id,
              isRead: false,
            },
          });

          console.log(`✅ Notification sent to RSC (${rscEmail}) for material update in action ${action.id}`);
        }
      } catch (notificationError) {
        console.error('Error sending RSC notification:', notificationError);
        // Don't fail the update if notification fails
      }
    }

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

    // Check plant access
    const authReq = req as AuthRequest;
    const user = authReq.user;
    if (user?.assignedPlant && existingAction.plant !== user.assignedPlant && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `You can only delete ${user.assignedPlant} actions` 
      });
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
  cloudinaryUpload.array('files', 10), // Max 10 files at once
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const files = req.files as any[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const action = await prisma.action.findUnique({
        where: { id },
      });

      if (!action) {
        return res.status(404).json({ error: 'Action not found' });
      }

      // Determine if files are photos based on MIME type
      const isPhoto = (mimeType: string) => mimeType.startsWith('image/');

      const authReq = req as AuthRequest;
      
      // Create database records for each file (now with Cloudinary URLs)
      const fileRecords = await Promise.all(
        files.map(file =>
          prisma.actionFile.create({
            data: {
              actionId: id,
              filename: file.public_id || file.filename,
              originalName: file.originalname,
              fileType: file.mimetype,
              fileSize: file.size,
              filePath: file.secure_url || file.url || file.path, // Full Cloudinary URL
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

// POST status request for action
router.post('/:id/status-request', authenticateToken, sendStatusRequest);

export default router;
