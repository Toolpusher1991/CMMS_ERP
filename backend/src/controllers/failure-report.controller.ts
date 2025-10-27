import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { notifyManagers } from './notification.controller';

const prisma = new PrismaClient();

export const getFailureReports = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { plant, status, severity } = req.query;

    // Build where clause based on user's assigned plant
    const where: any = {};
    
    if (user?.assignedPlant && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      where.plant = user.assignedPlant;
    } else if (plant) {
      where.plant = plant;
    }
    
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const reports = await prisma.failureReport.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching failure reports:', error);
    res.status(500).json({ error: 'Failed to fetch failure reports' });
  }
};

export const getFailureReportById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const report = await prisma.failureReport.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ error: 'Failure report not found' });
    }

    // Check plant access
    if (user?.assignedPlant && report.plant !== user.assignedPlant && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `You can only access ${user.assignedPlant} failure reports` 
      });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching failure report:', error);
    res.status(500).json({ error: 'Failed to fetch failure report' });
  }
};

export const createFailureReport = async (req: AuthRequest, res: Response) => {
  try {
    const {
      plant,
      title,
      description,
      location,
      severity,
      photoFilename,
      photoPath,
    } = req.body;

    const user = req.user;

    // Validation
    if (!plant || !title || !description) {
      return res.status(400).json({ error: 'Plant, title, and description are required' });
    }

    const validPlants = ['T208', 'T207', 'T700', 'T46'];
    if (!validPlants.includes(plant)) {
      return res.status(400).json({ error: 'Invalid plant' });
    }

    // Check plant access
    if (user?.assignedPlant && plant !== user.assignedPlant && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `You can only create reports for ${user.assignedPlant}` 
      });
    }

    const report = await prisma.failureReport.create({
      data: {
        plant,
        title,
        description,
        location: location || null,
        severity: severity || 'MEDIUM',
        status: 'REPORTED',
        photoFilename: photoFilename || null,
        photoPath: photoPath || null,
        reportedBy: user?.email || 'Unknown',
        reportedByName: user?.email || 'Unknown',
      },
    });

    // Notify all managers about the new failure report
    await notifyManagers({
      id: report.id,
      title: report.title,
      plant: report.plant,
      severity: report.severity,
      reportedByName: report.reportedByName,
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating failure report:', error);
    res.status(500).json({ error: 'Failed to create failure report' });
  }
};

export const updateFailureReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      location,
      severity,
      status,
    } = req.body;

    const user = req.user;

    const existingReport = await prisma.failureReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return res.status(404).json({ error: 'Failure report not found' });
    }

    // Check plant access
    if (user?.assignedPlant && existingReport.plant !== user.assignedPlant && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `You can only modify ${user.assignedPlant} failure reports` 
      });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (severity !== undefined) updateData.severity = severity;
    if (status !== undefined) updateData.status = status;

    const report = await prisma.failureReport.update({
      where: { id },
      data: updateData,
    });

    res.json(report);
  } catch (error) {
    console.error('Error updating failure report:', error);
    res.status(500).json({ error: 'Failed to update failure report' });
  }
};

export const deleteFailureReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const existingReport = await prisma.failureReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return res.status(404).json({ error: 'Failure report not found' });
    }

    // Check plant access
    if (user?.assignedPlant && existingReport.plant !== user.assignedPlant && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `You can only delete ${user.assignedPlant} failure reports` 
      });
    }

    // TODO: Delete photo file if exists

    await prisma.failureReport.delete({
      where: { id },
    });

    res.json({ message: 'Failure report deleted successfully' });
  } catch (error) {
    console.error('Error deleting failure report:', error);
    res.status(500).json({ error: 'Failed to delete failure report' });
  }
};

export const convertToAction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedTo, priority, dueDate } = req.body;
    const user = req.user;

    const report = await prisma.failureReport.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ error: 'Failure report not found' });
    }

    // Check plant access
    if (user?.assignedPlant && report.plant !== user.assignedPlant && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `You can only convert ${user.assignedPlant} failure reports` 
      });
    }

    // Check if already converted
    if (report.status === 'CONVERTED_TO_ACTION' && report.convertedToActionId) {
      return res.status(400).json({ 
        error: 'Already converted', 
        message: 'This failure report has already been converted to an action',
        actionId: report.convertedToActionId 
      });
    }

    // Create Action from Failure Report
    // Description: Original description + hidden photo reference for frontend button
    let actionDescription = report.description;
    
    // Add location if provided
    if (report.location) {
      actionDescription += `\n\n📍 Standort: ${report.location}`;
    }
    
    // Add photo URL if provided (Cloudinary URL or filename)
    if (report.photoPath) {
      actionDescription += `\n\n📸 Photo: ${report.photoPath}`;
    } else if (report.photoFilename) {
      actionDescription += `\n\n📸 Photo: ${report.photoFilename}`;
    }

    const action = await prisma.action.create({
      data: {
        plant: report.plant,
        title: report.title,
        description: actionDescription,
        status: 'OPEN',
        priority: priority || (report.severity === 'CRITICAL' ? 'URGENT' : report.severity === 'HIGH' ? 'HIGH' : 'MEDIUM'),
        assignedTo: assignedTo || report.reportedBy,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 7 days from now
        createdBy: user?.email || 'System',
      },
    });

    // Update Failure Report status
    const updatedReport = await prisma.failureReport.update({
      where: { id },
      data: {
        status: 'CONVERTED_TO_ACTION',
        convertedToActionId: action.id,
        convertedAt: new Date(),
        convertedBy: user?.email || 'Unknown',
      },
    });

    res.json({
      message: 'Failure report converted to action successfully',
      action,
      report: updatedReport,
    });
  } catch (error) {
    console.error('Error converting failure report to action:', error);
    res.status(500).json({ error: 'Failed to convert failure report to action' });
  }
};
