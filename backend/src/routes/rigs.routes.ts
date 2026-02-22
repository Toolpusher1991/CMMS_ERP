import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createRigSchema, updateRigSchema } from '../schemas/rig.schema';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to check if user is Admin
const requireAdmin = (req: AuthRequest, res: Response, next: () => void) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Zugriff verweigert. Nur Administratoren können diese Aktion ausführen.'
    });
  }
  next();
};

// GET all rigs (public - no auth needed)
router.get('/', async (req: Request, res: Response) => {
  try {
    const rigs = await prisma.rig.findMany({
      orderBy: { name: 'asc' }
    });

    // Parse applications JSON string back to array
    const rigsWithParsedData = rigs.map(rig => ({
      ...rig,
      applications: JSON.parse(rig.applications)
    }));

    res.json({
      success: true,
      data: rigsWithParsedData
    });
  } catch (error) {
    console.error('Error fetching rigs:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Bohranlagen'
    });
  }
});

// GET single rig by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rig = await prisma.rig.findUnique({
      where: { id }
    });

    if (!rig) {
      return res.status(404).json({
        success: false,
        message: 'Bohranlage nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: {
        ...rig,
        applications: JSON.parse(rig.applications)
      }
    });
  } catch (error) {
    console.error('Error fetching rig:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Bohranlage'
    });
  }
});

// POST create new rig (Admin only)
router.post('/', authenticate, requireAdmin, validate(createRigSchema), async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      category,
      maxDepth,
      maxHookLoad,
      footprint,
      rotaryTorque,
      pumpPressure,
      drawworks,
      mudPumps,
      topDrive,
      derrickCapacity,
      crewSize,
      mobilizationTime,
      dayRate,
      description,
      applications,
      technicalSpecs
    } = req.body;

    // Check if rig with same name already exists
    const existingRig = await prisma.rig.findUnique({
      where: { name }
    });

    if (existingRig) {
      return res.status(409).json({
        success: false,
        message: `Bohranlage mit dem Namen "${name}" existiert bereits`
      });
    }

    const rig = await prisma.rig.create({
      data: {
        name,
        category,
        maxDepth: parseInt(maxDepth),
        maxHookLoad: parseInt(maxHookLoad),
        footprint,
        rotaryTorque: parseInt(rotaryTorque),
        pumpPressure: parseInt(pumpPressure),
        drawworks,
        mudPumps,
        topDrive,
        derrickCapacity,
        crewSize,
        mobilizationTime,
        dayRate,
        description,
        applications: JSON.stringify(applications || []),
        technicalSpecs,
        lastEditedBy: req.user?.id || 'system'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Bohranlage erfolgreich erstellt',
      data: {
        ...rig,
        applications: JSON.parse(rig.applications)
      }
    });
  } catch (error) {
    console.error('Error creating rig:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen der Bohranlage'
    });
  }
});

// PUT update rig (Admin only)
router.put('/:id', authenticate, requireAdmin, validate(updateRigSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      maxDepth,
      maxHookLoad,
      footprint,
      rotaryTorque,
      pumpPressure,
      drawworks,
      mudPumps,
      topDrive,
      derrickCapacity,
      crewSize,
      mobilizationTime,
      dayRate,
      description,
      applications,
      technicalSpecs
    } = req.body;

    // Check if rig exists
    const existingRig = await prisma.rig.findUnique({
      where: { id }
    });

    if (!existingRig) {
      return res.status(404).json({
        success: false,
        message: 'Bohranlage nicht gefunden'
      });
    }

    const updatedRig = await prisma.rig.update({
      where: { id },
      data: {
        name: name || existingRig.name,
        category: category || existingRig.category,
        maxDepth: maxDepth ? parseInt(maxDepth) : existingRig.maxDepth,
        maxHookLoad: maxHookLoad ? parseInt(maxHookLoad) : existingRig.maxHookLoad,
        footprint: footprint || existingRig.footprint,
        rotaryTorque: rotaryTorque ? parseInt(rotaryTorque) : existingRig.rotaryTorque,
        pumpPressure: pumpPressure ? parseInt(pumpPressure) : existingRig.pumpPressure,
        drawworks: drawworks || existingRig.drawworks,
        mudPumps: mudPumps || existingRig.mudPumps,
        topDrive: topDrive || existingRig.topDrive,
        derrickCapacity: derrickCapacity || existingRig.derrickCapacity,
        crewSize: crewSize || existingRig.crewSize,
        mobilizationTime: mobilizationTime || existingRig.mobilizationTime,
        dayRate: dayRate || existingRig.dayRate,
        description: description || existingRig.description,
        applications: applications ? JSON.stringify(applications) : existingRig.applications,
        technicalSpecs: technicalSpecs || existingRig.technicalSpecs,
        lastEditedBy: req.user?.id || 'system'
      }
    });

    res.json({
      success: true,
      message: 'Bohranlage erfolgreich aktualisiert',
      data: {
        ...updatedRig,
        applications: JSON.parse(updatedRig.applications)
      }
    });
  } catch (error) {
    console.error('Error updating rig:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren der Bohranlage'
    });
  }
});

// DELETE rig (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingRig = await prisma.rig.findUnique({
      where: { id }
    });

    if (!existingRig) {
      return res.status(404).json({
        success: false,
        message: 'Bohranlage nicht gefunden'
      });
    }

    await prisma.rig.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: `Bohranlage "${existingRig.name}" erfolgreich gelöscht`
    });
  } catch (error) {
    console.error('Error deleting rig:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen der Bohranlage'
    });
  }
});

export default router;
