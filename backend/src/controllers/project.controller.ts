// Project controller - simple implementation for T208, T700, T207, T46
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        projectNumber: 'asc',
      },
    });

    // Calculate simple stats
    const stats = {
      total: projects.length,
      planned: projects.filter((p) => p.status === 'PLANNED').length,
      inProgress: projects.filter((p) => p.status === 'IN_PROGRESS').length,
      completed: projects.filter((p) => p.status === 'COMPLETED').length,
      totalBudget: projects.reduce((sum, p) => sum + p.totalBudget, 0),
      spentBudget: projects.reduce((sum, p) => sum + p.spentBudget, 0),
      totalSpent: projects.reduce((sum, p) => sum + p.spentBudget, 0),
    };

    res.json({ success: true, data: { projects, stats } });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch project' });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const {
      projectNumber,
      name,
      description,
      status,
      priority,
      progress,
      totalBudget,
      spentBudget,
      startDate,
      endDate,
      managerId,
    } = req.body;

    if (!projectNumber || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project number and name are required' 
      });
    }

    const project = await prisma.project.create({
      data: {
        projectNumber,
        name,
        description: description || '',
        status: status || 'PLANNED',
        priority: priority || 'NORMAL',
        progress: progress || 0,
        totalBudget: totalBudget || 0,
        spentBudget: spentBudget || 0,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        managerId: managerId || undefined,
        createdBy: req.user!.id,
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('Create project error:', error);
    if ((error as {code?: string}).code === 'P2002') {
      return res.status(400).json({ 
        success: false, 
        message: 'Project number already exists' 
      });
    }
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      projectNumber,
      name,
      description,
      status,
      priority,
      progress,
      totalBudget,
      spentBudget,
      startDate,
      endDate,
      managerId,
    } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(projectNumber && { projectNumber }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(progress !== undefined && { progress }),
        ...(totalBudget !== undefined && { totalBudget }),
        ...(spentBudget !== undefined && { spentBudget }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(managerId !== undefined && { managerId }),
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Update project error:', error);
    if ((error as {code?: string}).code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    res.status(500).json({ success: false, message: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    if ((error as {code?: string}).code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
};

export const createTask = async (_req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Tasks not implemented' });
};

export const updateTask = async (_req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Tasks not implemented' });
};

export const addBudgetEntry = async (_req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Budget entries not implemented' });
};

export const addProjectMember = async (_req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Project members not implemented' });
};

export const removeProjectMember = async (_req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Project members not implemented' });
};
