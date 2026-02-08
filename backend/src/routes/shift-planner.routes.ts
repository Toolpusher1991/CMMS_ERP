import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Get all positions for a plant
router.get('/positions/:plant', async (req, res) => {
  try {
    const { plant } = req.params;
    
    const positions = await prisma.shiftPosition.findMany({
      where: { plant, isActive: true },
      orderBy: { order: 'asc' },
    });
    
    res.json(positions);
  } catch (error: any) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// Get all personnel for a plant
router.get('/personnel/:plant', async (req, res) => {
  try {
    const { plant } = req.params;
    
    const personnel = await prisma.shiftPersonnel.findMany({
      where: { plant, isActive: true },
      orderBy: [
        { position: 'asc' },
        { isBackToBack: 'asc' },
      ],
    });
    
    res.json(personnel);
  } catch (error: any) {
    console.error('Error fetching personnel:', error);
    res.status(500).json({ error: 'Failed to fetch personnel' });
  }
});

// Get assignments for a plant and time range
router.get('/assignments/:plant', async (req, res) => {
  try {
    const { plant } = req.params;
    const { year, startMonth, endMonth } = req.query;
    
    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        plant,
        year: year ? parseInt(year as string) : 2026,
        month: {
          gte: startMonth ? parseInt(startMonth as string) : 1,
          lte: endMonth ? parseInt(endMonth as string) : 12,
        },
      },
      include: {
        personnel: true,
        position: true,
      },
      orderBy: [
        { month: 'asc' },
        { startDay: 'asc' },
      ],
    });
    
    res.json(assignments);
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Create assignment(s) - can handle bulk creation
router.post('/assignments', async (req, res) => {
  try {
    const { assignments } = req.body;
    
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'Invalid assignments data' });
    }
    
    const created = await prisma.shiftAssignment.createMany({
      data: assignments,
      skipDuplicates: true,
    });
    
    res.json({ created: created.count });
  } catch (error: any) {
    console.error('Error creating assignments:', error);
    res.status(500).json({ error: 'Failed to create assignments' });
  }
});

// Update assignment
router.patch('/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updated = await prisma.shiftAssignment.update({
      where: { id },
      data: updateData,
      include: {
        personnel: true,
        position: true,
      },
    });
    
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete assignment
router.delete('/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.shiftAssignment.delete({
      where: { id },
    });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// Delete all assignments for a plant/period (for reset)
router.delete('/assignments/:plant/clear', async (req, res) => {
  try {
    const { plant } = req.params;
    const { year, month } = req.query;
    
    const deleted = await prisma.shiftAssignment.deleteMany({
      where: {
        plant,
        year: year ? parseInt(year as string) : undefined,
        month: month ? parseInt(month as string) : undefined,
      },
    });
    
    res.json({ deleted: deleted.count });
  } catch (error: any) {
    console.error('Error clearing assignments:', error);
    res.status(500).json({ error: 'Failed to clear assignments' });
  }
});

// Generate automatic rotation schedule
router.post('/generate-rotation', async (req, res) => {
  try {
    const { plant, startYear, startMonth, endYear, endMonth, workDays, offDays } = req.body;
    
    // Get all personnel for this plant
    const personnel = await prisma.shiftPersonnel.findMany({
      where: { plant, isActive: true },
    });
    
    // Get all positions for this plant
    const positions = await prisma.shiftPosition.findMany({
      where: { plant, isActive: true },
    });
    
    const assignments: any[] = [];
    const daysInMonths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // 2026 (non-leap)
    
    // Group personnel by position
    const personnelByPosition = personnel.reduce((acc, p) => {
      if (!acc[p.position]) acc[p.position] = [];
      acc[p.position].push(p);
      return acc;
    }, {} as Record<string, any[]>);
    
    // For each position
    for (const position of positions) {
      const positionPersonnel = personnelByPosition[position.name] || [];
      if (positionPersonnel.length < 2) continue; // Need A & B team
      
      // Sort by isBackToBack to get A-team first, then B-team
      positionPersonnel.sort((a, b) => Number(a.isBackToBack) - Number(b.isBackToBack));
      
      let currentPersonnelIndex = 0;
      let currentMonth = startMonth - 1; // 0-indexed
      let currentDay = 1;
      let currentYear = startYear;
      
      while (
        currentYear < endYear ||
        (currentYear === endYear && currentMonth <= endMonth - 1)
      ) {
        const person = positionPersonnel[currentPersonnelIndex];
        const daysInCurrentMonth = daysInMonths[currentMonth];
        
        // Work period
        let remainingWorkDays = workDays || 28;
        while (remainingWorkDays > 0) {
          const daysLeftInMonth = daysInCurrentMonth - currentDay + 1;
          const daysToAssign = Math.min(remainingWorkDays, daysLeftInMonth);
          const endDay = currentDay + daysToAssign - 1;
          
          assignments.push({
            plant,
            personnelId: person.id,
            positionId: position.id,
            year: currentYear,
            month: currentMonth + 1, // 1-indexed for DB
            startDay: currentDay,
            endDay,
            isOff: false,
            isHandover: remainingWorkDays - daysToAssign === 0, // Last day is handover
            absenceType: 'work',
            workDays: workDays || 28,
            offDays: offDays || 28,
          });
          
          remainingWorkDays -= daysToAssign;
          currentDay = endDay + 1;
          
          if (currentDay > daysInCurrentMonth) {
            currentMonth++;
            currentDay = 1;
            if (currentMonth > 11) {
              currentMonth = 0;
              currentYear++;
            }
          }
          
          if (
            currentYear > endYear ||
            (currentYear === endYear && currentMonth > endMonth - 1)
          ) {
            break;
          }
        }
        
        // Switch to other person (back-to-back)
        currentPersonnelIndex = (currentPersonnelIndex + 1) % positionPersonnel.length;
        
        // Off period for the person who just worked
        let remainingOffDays = offDays || 28;
        while (remainingOffDays > 0) {
          const daysInCurrentMonth = daysInMonths[currentMonth];
          const daysLeftInMonth = daysInCurrentMonth - currentDay + 1;
          const daysToAssign = Math.min(remainingOffDays, daysLeftInMonth);
          
          remainingOffDays -= daysToAssign;
          currentDay += daysToAssign;
          
          if (currentDay > daysInCurrentMonth) {
            currentMonth++;
            currentDay = 1;
            if (currentMonth > 11) {
              currentMonth = 0;
              currentYear++;
            }
          }
          
          if (
            currentYear > endYear ||
            (currentYear === endYear && currentMonth > endMonth - 1)
          ) {
            break;
          }
        }
      }
    }
    
    // Bulk create all assignments
    const created = await prisma.shiftAssignment.createMany({
      data: assignments,
      skipDuplicates: true,
    });
    
    res.json({ 
      generated: assignments.length,
      created: created.count,
      message: `Generated ${assignments.length} assignments for ${plant}`,
    });
  } catch (error: any) {
    console.error('Error generating rotation:', error);
    res.status(500).json({ error: 'Failed to generate rotation', details: error.message });
  }
});

export default router;
