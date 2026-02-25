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
        contractStatus: contractStatus || 'stacked',
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

// PATCH update rig status
router.patch('/rigs/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['stacked', 'operational', 'overhaul'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiger Status. Erlaubt: stacked, operational, overhaul'
      });
    }

    const existingRig = await prisma.rig.findUnique({ where: { id } });
    if (!existingRig) {
      return res.status(404).json({
        success: false,
        message: 'Anlage nicht gefunden'
      });
    }

    const updatedRig = await prisma.rig.update({
      where: { id },
      data: {
        contractStatus: status,
        lastEditedBy: req.user?.id || 'system'
      }
    });

    res.json({
      success: true,
      message: 'Status erfolgreich aktualisiert',
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
    console.error('Error updating rig status:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Status'
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

// ======================
// FLEET RESET ENDPOINT
// ======================

// POST reset fleet — replaces all rigs with Equipment Master Database fleet (Admin only)
router.post('/reset-fleet', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // 1. Unlink relations
    await prisma.action.updateMany({ where: { rigId: { not: null } }, data: { rigId: null } });
    await prisma.project.updateMany({ where: { rigId: { not: null } }, data: { rigId: null } });
    await prisma.failureReport.updateMany({ where: { rigId: { not: null } }, data: { rigId: null } });

    // 2. Delete all existing rigs
    const deleted = await prisma.rig.deleteMany({});

    // 3. Create new fleet
    const rigFleet = [
      { id: 't51',  name: 'T-51',  rigType: 'EMSCO C-3 III',       hp: 3000, year: 1980, category: 'Schwerlast' },
      { id: 't91',  name: 'T-91',  rigType: '2000 HP Stationary',   hp: 2000, year: 2014, category: 'Schwerlast' },
      { id: 't92',  name: 'T-92',  rigType: '2000 HP Stationary',   hp: 2000, year: 2014, category: 'Schwerlast' },
      { id: 't93',  name: 'T-93',  rigType: '2000 HP Stationary',   hp: 2000, year: 2015, category: 'Schwerlast' },
      { id: 't94',  name: 'T-94',  rigType: '2000 HP Stationary',   hp: 2000, year: 2015, category: 'Schwerlast' },
      { id: 't95',  name: 'T-95',  rigType: '2000 HP Stationary',   hp: 2000, year: 2015, category: 'Schwerlast' },
      { id: 't144', name: 'T-144', rigType: '1250 HP Mobile',       hp: 1250, year: 2023, category: 'Mittlere Leistung' },
      { id: 't145', name: 'T-145', rigType: '1250 HP Mobile',       hp: 1250, year: 2023, category: 'Mittlere Leistung' },
      { id: 't146', name: 'T-146', rigType: '1250 HP Mobile',       hp: 1250, year: 2024, category: 'Mittlere Leistung' },
      { id: 't147', name: 'T-147', rigType: '1250 HP Mobile',       hp: 1250, year: 2024, category: 'Mittlere Leistung' },
      { id: 't801', name: 'T-801', rigType: '800 HP Highly Mobile',  hp: 800,  year: 1992, category: 'Kompakt' },
      { id: 't826', name: 'T-826', rigType: '800 HP CARDWELL',      hp: 800,  year: 1988, category: 'Kompakt' },
      { id: 't849', name: 'T-849', rigType: '1500 HP Mobile',       hp: 1500, year: 2010, category: 'Mittlere Leistung' },
      { id: 't853', name: 'T-853', rigType: '800 HP Highly Mobile',  hp: 800,  year: 1995, category: 'Kompakt' },
      { id: 't858', name: 'T-858', rigType: '1500 HP Mobile',       hp: 1500, year: 2010, category: 'Mittlere Leistung' },
      { id: 't859', name: 'T-859', rigType: '1500 HP Mobile',       hp: 1500, year: 2010, category: 'Mittlere Leistung' },
      { id: 't867', name: 'T-867', rigType: '2000 HP Land Rig',     hp: 2000, year: 2014, category: 'Schwerlast' },
      { id: 't872', name: 'T-872', rigType: '800 HP Highly Mobile',  hp: 800,  year: 1992, category: 'Kompakt' },
      { id: 't889', name: 'T-889', rigType: '2000 HP Land Rig',     hp: 2000, year: 2006, category: 'Schwerlast' },
      { id: 't895', name: 'T-895', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt' },
      { id: 't896', name: 'T-896', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt' },
      { id: 't897', name: 'T-897', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt' },
      { id: 't898', name: 'T-898', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt' },
      { id: 't899', name: 'T-899', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt' },
    ];

    await prisma.rig.createMany({
      data: rigFleet.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        maxDepth: r.hp >= 2000 ? 7000 : r.hp >= 1250 ? 5000 : 3000,
        maxHookLoad: Math.round(r.hp * 0.35),
        footprint: r.hp >= 2000 ? 'Groß' : r.hp >= 1250 ? 'Mittel' : 'Klein',
        rotaryTorque: r.hp * 35,
        pumpPressure: r.hp >= 2000 ? 7500 : r.hp >= 1250 ? 5500 : 4500,
        drawworks: `${r.hp} HP`,
        mudPumps: r.hp >= 2000 ? '2x Triplex' : '1x Triplex',
        topDrive: r.hp >= 2000 ? '1000 HP' : r.hp >= 1250 ? '500 HP' : '350 HP',
        derrickCapacity: `${Math.round(r.hp * 0.5)} t`,
        crewSize: r.hp >= 2000 ? '40-50' : r.hp >= 1250 ? '30-35' : '20-25',
        mobilizationTime: r.hp >= 2000 ? '30-45 Tage' : r.hp >= 1250 ? '15-20 Tage' : '7-12 Tage',
        dayRate: '0',
        description: `${r.rigType} Drilling Rig (${r.year})`,
        applications: JSON.stringify([]),
        technicalSpecs: JSON.stringify({ rigType: r.rigType, hpRating: `${r.hp} HP`, year: r.year }),
        region: 'Oman',
        contractStatus: 'stacked',
        location: '',
        certifications: JSON.stringify([]),
        generalInfo: JSON.stringify([]),
        inspections: JSON.stringify([]),
        issues: JSON.stringify([]),
        improvements: JSON.stringify([]),
      })),
    });

    res.json({
      success: true,
      message: `Fleet reset: ${deleted.count} alte Anlagen gelöscht, ${rigFleet.length} neue Anlagen erstellt`,
      data: { deleted: deleted.count, created: rigFleet.length }
    });
  } catch (error) {
    console.error('Error resetting fleet:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Fleet-Reset'
    });
  }
});

export default router;
