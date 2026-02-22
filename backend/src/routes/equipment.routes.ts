import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createEquipmentSchema, updateEquipmentSchema } from '../schemas/equipment.schema';

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

// GET all equipment (public - no auth needed)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const equipment = await prisma.equipment.findMany({
      where: category ? { category: category as string } : undefined,
      orderBy: { name: 'asc' }
    });

    // Parse properties JSON string back to object
    const equipmentWithParsedData = equipment.map(item => ({
      ...item,
      properties: JSON.parse(item.properties)
    }));

    res.json({
      success: true,
      data: equipmentWithParsedData
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Equipment-Daten'
    });
  }
});

// GET single equipment by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const equipment = await prisma.equipment.findUnique({
      where: { id }
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: {
        ...equipment,
        properties: JSON.parse(equipment.properties)
      }
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Equipment'
    });
  }
});

// POST create new equipment (Admin only)
router.post('/', authenticate, requireAdmin, validate(createEquipmentSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { category, name, price, properties } = req.body;

    const equipment = await prisma.equipment.create({
      data: {
        category,
        name,
        price,
        properties: JSON.stringify(properties || {}),
        createdBy: req.user?.id || 'system',
        lastEditedBy: req.user?.id || 'system'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Equipment erfolgreich erstellt',
      data: {
        ...equipment,
        properties: JSON.parse(equipment.properties)
      }
    });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Equipment'
    });
  }
});

// PUT update equipment (Admin only)
router.put('/:id', authenticate, requireAdmin, validate(updateEquipmentSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { category, name, price, properties } = req.body;

    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id }
    });

    if (!existingEquipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment nicht gefunden'
      });
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        category: category || existingEquipment.category,
        name: name || existingEquipment.name,
        price: price || existingEquipment.price,
        properties: properties ? JSON.stringify(properties) : existingEquipment.properties,
        lastEditedBy: req.user?.id || 'system'
      }
    });

    res.json({
      success: true,
      message: 'Equipment erfolgreich aktualisiert',
      data: {
        ...updatedEquipment,
        properties: JSON.parse(updatedEquipment.properties)
      }
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Equipment'
    });
  }
});

// DELETE equipment (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingEquipment = await prisma.equipment.findUnique({
      where: { id }
    });

    if (!existingEquipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment nicht gefunden'
      });
    }

    await prisma.equipment.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: `Equipment "${existingEquipment.name}" erfolgreich gelöscht`
    });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen des Equipment'
    });
  }
});

export default router;
