import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createAssetRigSchema, updateAssetRigSchema } from '../schemas/asset-integrity.schema';

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

// ======================
// RIG CRUD OPERATIONS
// ======================

// GET all rigs with asset integrity data
router.get('/rigs', authenticate, async (req: Request, res: Response) => {
  try {
    const rigs = await prisma.rig.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            actions: true,
            projects: true,
            failureReports: true
          }
        }
      }
    });

    // Parse JSON fields
    const rigsWithParsedData = rigs.map(rig => ({
      ...rig,
      certifications: JSON.parse(rig.certifications),
      generalInfo: JSON.parse(rig.generalInfo),
      inspections: JSON.parse(rig.inspections),
      issues: JSON.parse(rig.issues),
      improvements: JSON.parse(rig.improvements),
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
      message: 'Fehler beim Laden der Anlagen'
    });
  }
});

// GET single rig with full details and relations
router.get('/rigs/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rig = await prisma.rig.findUnique({
      where: { id },
      include: {
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Latest 10 actions
        },
        projects: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Latest 10 projects
        },
        failureReports: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Latest 10 failure reports
        },
        _count: {
          select: {
            actions: true,
            projects: true,
            failureReports: true
          }
        }
      }
    });

    if (!rig) {
      return res.status(404).json({
        success: false,
        message: 'Anlage nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: {
        ...rig,
        certifications: JSON.parse(rig.certifications),
        generalInfo: JSON.parse(rig.generalInfo),
        inspections: JSON.parse(rig.inspections),
        issues: JSON.parse(rig.issues),
        improvements: JSON.parse(rig.improvements),
        applications: JSON.parse(rig.applications)
      }
    });
  } catch (error) {
    console.error('Error fetching rig:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Anlage'
    });
  }
});

// POST create new rig (Admin only)
router.post('/rigs', authenticate, requireAdmin, validate(createAssetRigSchema), async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      region,
      contractStatus,
      location,
      operator,
      dayRate,
      contractEndDate,
      certifications
    } = req.body;

    // Check if rig with same name already exists
    const existingRig = await prisma.rig.findUnique({
      where: { name }
    });

    if (existingRig) {
      return res.status(409).json({
        success: false,
        message: `Anlage mit dem Namen "${name}" existiert bereits`
      });
    }

    const rig = await prisma.rig.create({
      data: {
        name,
        region,
        contractStatus: contractStatus || 'idle',
        location: location || '',
        operator: operator || null,
        contractEndDate: contractEndDate || null,
        // Required technical fields with defaults
        category: 'Mittlere Leistung',
        maxDepth: 5000,
        maxHookLoad: 500,
        footprint: 'Mittel',
        rotaryTorque: 50000,
        pumpPressure: 7500,
        drawworks: dayRate ? `${dayRate} HP` : 'N/A',
        mudPumps: 'N/A',
        topDrive: 'N/A',
        derrickCapacity: 'N/A',
        crewSize: '40-45',
        mobilizationTime: '30 Tage',
        dayRate: dayRate || 'N/A',
        description: `Drilling rig ${name}`,
        applications: JSON.stringify([]),
        technicalSpecs: '',
        certifications: JSON.stringify(certifications || []),
        generalInfo: JSON.stringify([]),
        inspections: JSON.stringify([]),
        issues: JSON.stringify([]),
        improvements: JSON.stringify([]),
        lastEditedBy: req.user?.id || 'system'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Anlage erfolgreich erstellt',
      data: {
        ...rig,
        certifications: JSON.parse(rig.certifications),
        generalInfo: JSON.parse(rig.generalInfo),
        inspections: JSON.parse(rig.inspections),
        issues: JSON.parse(rig.issues),
        improvements: JSON.parse(rig.improvements)
      }
    });
  } catch (error) {
    console.error('Error creating rig:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen der Anlage'
    });
  }
});

// PUT update rig asset integrity data
router.put('/rigs/:id', authenticate, validate(updateAssetRigSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      region,
      contractStatus,
      location,
      operator,
      dayRate,
      contractEndDate,
      certifications,
      generalInfo,
      inspections,
      issues,
      improvements
    } = req.body;

    const existingRig = await prisma.rig.findUnique({
      where: { id }
    });

    if (!existingRig) {
      return res.status(404).json({
        success: false,
        message: 'Anlage nicht gefunden'
      });
    }

    const updateData: any = {
      lastEditedBy: req.user?.id || 'system'
    };

    if (region !== undefined) updateData.region = region;
    if (contractStatus !== undefined) updateData.contractStatus = contractStatus;
    if (location !== undefined) updateData.location = location;
    if (operator !== undefined) updateData.operator = operator;
    if (contractEndDate !== undefined) updateData.contractEndDate = contractEndDate;
    if (dayRate !== undefined) updateData.dayRate = String(dayRate);
    if (certifications !== undefined) updateData.certifications = JSON.stringify(certifications);
    if (generalInfo !== undefined) updateData.generalInfo = JSON.stringify(generalInfo);
    if (inspections !== undefined) updateData.inspections = JSON.stringify(inspections);
    if (issues !== undefined) updateData.issues = JSON.stringify(issues);
    if (improvements !== undefined) updateData.improvements = JSON.stringify(improvements);

    const updatedRig = await prisma.rig.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Anlage erfolgreich aktualisiert',
      data: {
        ...updatedRig,
        certifications: JSON.parse(updatedRig.certifications),
        generalInfo: JSON.parse(updatedRig.generalInfo),
        inspections: JSON.parse(updatedRig.inspections),
        issues: JSON.parse(updatedRig.issues),
        improvements: JSON.parse(updatedRig.improvements)
      }
    });
  } catch (error) {
    console.error('Error updating rig:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren der Anlage'
    });
  }
});

// DELETE rig (Admin only)
router.delete('/rigs/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingRig = await prisma.rig.findUnique({
      where: { id }
    });

    if (!existingRig) {
      return res.status(404).json({
        success: false,
        message: 'Anlage nicht gefunden'
      });
    }

    await prisma.rig.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: `Anlage "${existingRig.name}" erfolgreich gelöscht`
    });
  } catch (error) {
    console.error('Error deleting rig:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen der Anlage'
    });
  }
});

// ======================
// RELATION ENDPOINTS
// ======================

// GET all actions for a rig
router.get('/rigs/:id/actions', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const actions = await prisma.action.findMany({
      where: { rigId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        actionFiles: true
      }
    });

    res.json({
      success: true,
      data: actions
    });
  } catch (error) {
    console.error('Error fetching rig actions:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Actions'
    });
  }
});

// GET all projects for a rig
router.get('/rigs/:id/projects', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const projects = await prisma.project.findMany({
      where: { rigId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: true,
        files: true
      }
    });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching rig projects:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Projekte'
    });
  }
});

// GET all failure reports for a rig
router.get('/rigs/:id/failure-reports', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const failureReports = await prisma.failureReport.findMany({
      where: { rigId: id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: failureReports
    });
  } catch (error) {
    console.error('Error fetching rig failure reports:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Störmeldungen'
    });
  }
});

// POST link action to rig
router.post('/rigs/:rigId/actions/:actionId', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { rigId, actionId } = req.params;

    const action = await prisma.action.update({
      where: { id: actionId },
      data: { rigId }
    });

    res.json({
      success: true,
      message: 'Action erfolgreich mit Anlage verknüpft',
      data: action
    });
  } catch (error) {
    console.error('Error linking action to rig:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Verknüpfen der Action'
    });
  }
});

// POST link project to rig
router.post('/rigs/:rigId/projects/:projectId', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { rigId, projectId } = req.params;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { rigId }
    });

    res.json({
      success: true,
      message: 'Projekt erfolgreich mit Anlage verknüpft',
      data: project
    });
  } catch (error) {
    console.error('Error linking project to rig:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Verknüpfen des Projekts'
    });
  }
});

export default router;
