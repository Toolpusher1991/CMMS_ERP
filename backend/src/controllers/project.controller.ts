// Project controller - simple implementation for T208, T700, T207, T46
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { createNotification } from './notification.controller';

const prisma = new PrismaClient();

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    
    // TEMP FIX: Disable plant filtering since all projects have plant:null
    // Build where clause based on user's assigned plant
    const where: { plant?: string | null } = {};
    // Temporarily commented out to show all projects regardless of plant
    // if (user?.assignedPlant && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    //   where.plant = user.assignedPlant;
    // }
    
    const projects = await prisma.project.findMany({
      where,
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
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
        files: {
          orderBy: { uploadedAt: 'desc' },
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
    const user = req.user;
    
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

    // Check plant access
    if (user?.assignedPlant && project.plant !== user.assignedPlant && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. You can only access ${user.assignedPlant} projects` 
      });
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
      plant,
      category,
    } = req.body;

    if (!projectNumber || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project number and name are required' 
      });
    }

    const user = req.user;
    
    // Check plant access - users can only create projects for their assigned plant
    if (user?.assignedPlant && plant && plant !== user.assignedPlant && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. You can only create projects for ${user.assignedPlant}` 
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
        plant,
        category: category || 'MECHANICAL',
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

    // Send notification if manager was assigned
    if (managerId) {
      try {
        const assigningUser = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'System' : 'System';
        await createNotification({
          userId: managerId,
          type: 'PROJECT_ASSIGNMENT',
          title: `Projekt zugewiesen: ${project.name}`,
          message: `${assigningUser} hat Ihnen das Projekt "${project.name}" zugewiesen.`,
          metadata: {
            projectId: project.id,
            projectName: project.name,
            assignedBy: user?.id,
          },
          relatedId: project.id,
        });
      } catch (notificationError) {
        console.error('Failed to send project assignment notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('Create project error:', error);
    
    // Import Sentry for error reporting
    const { captureError } = await import('../lib/sentry');
    
    if ((error as {code?: string}).code === 'P2002') {
      // Report duplicate project number issue to Sentry
      captureError(new Error(`Duplicate project number attempted: ${req.body.projectNumber}`), {
        projectNumber: req.body.projectNumber,
        userId: req.user?.id,
        userEmail: req.user?.email,
        requestBody: req.body
      });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Project number already exists' 
      });
    }
    
    // Report other project creation errors
    captureError(error as Error, {
      operation: 'createProject',
      userId: req.user?.id,
      userEmail: req.user?.email,
      requestBody: req.body
    });
    
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
      category,
      flowData,
    } = req.body;

    const user = req.user;
    
    // First, check if project exists and user has access
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Check plant access
    if (user?.assignedPlant && existingProject.projectNumber !== user.assignedPlant && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. You can only modify ${user.assignedPlant} projects` 
      });
    }

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
        ...(category && { category }),
        ...(flowData !== undefined && { flowData }),
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

    // Send notification if manager was assigned or changed
    if (managerId && managerId !== existingProject.managerId) {
      try {
        const assigningUser = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'System' : 'System';
        await createNotification({
          userId: managerId,
          type: 'PROJECT_ASSIGNMENT',
          title: `Projekt zugewiesen: ${project.name}`,
          message: `${assigningUser} hat Ihnen das Projekt "${project.name}" zugewiesen.`,
          metadata: {
            projectId: project.id,
            projectName: project.name,
            assignedBy: user?.id,
          },
          relatedId: project.id,
        });
      } catch (notificationError) {
        console.error('Failed to send project assignment notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

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
    const user = req.user;

    // First, check if project exists and user has access
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Check plant access
    if (user?.assignedPlant && existingProject.projectNumber !== user.assignedPlant && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. You can only delete ${user.assignedPlant} projects` 
      });
    }

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

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        status: status || 'PENDING',
        priority: priority || 'NORMAL',
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate, completedAt } = req.body;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
      },
    });

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Update task error:', error);
    if ((error as {code?: string}).code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;

    await prisma.task.delete({
      where: { id: taskId },
    });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    if ((error as {code?: string}).code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};

export const getProjectTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId } = req.params;

    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

export const createFile = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { filename, originalName, fileType, fileSize, filePath, uploadedBy } = req.body;

    const file = await prisma.file.create({
      data: {
        projectId,
        filename,
        originalName,
        fileType,
        fileSize,
        filePath,
        uploadedBy,
      },
    });

    res.json({ success: true, data: file });
  } catch (error) {
    console.error('Create file error:', error);
    res.status(500).json({ success: false, message: 'Failed to create file record' });
  }
};

export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;

    await prisma.file.delete({
      where: { id: fileId },
    });

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    if ((error as {code?: string}).code === 'P2025') {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete file' });
  }
};

export const getProjectFiles = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId } = req.params;

    const files = await prisma.file.findMany({
      where: { projectId },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ success: true, data: files });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch files' });
  }
};

export const checkoutFile = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId, fileId } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.firstName && req.user?.lastName 
      ? `${req.user.firstName} ${req.user.lastName}` 
      : 'Unknown User';

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Check if file exists and is in this project
    const file = await prisma.file.findFirst({
      where: { id: fileId, projectId },
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Check if already checked out
    if (file.checkedOutBy) {
      return res.status(400).json({ 
        success: false, 
        message: `File is already checked out by ${file.checkedOutByName || 'another user'}` 
      });
    }

    // Check out the file
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        checkedOutBy: userId,
        checkedOutByName: userName,
        checkedOutAt: new Date(),
      },
    });

    res.json({ success: true, data: updatedFile });
  } catch (error) {
    console.error('Checkout file error:', error);
    res.status(500).json({ success: false, message: 'Failed to checkout file' });
  }
};

export const checkinFile = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId, fileId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Check if file exists and is in this project
    const file = await prisma.file.findFirst({
      where: { id: fileId, projectId },
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Check if file is checked out
    if (!file.checkedOutBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'File is not checked out' 
      });
    }

    // Only the user who checked it out (or admin) can check it back in
    if (file.checkedOutBy !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the user who checked out the file can check it back in' 
      });
    }

    // Check in the file
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        checkedOutBy: null,
        checkedOutByName: null,
        checkedOutAt: null,
      },
    });

    res.json({ success: true, data: updatedFile });
  } catch (error) {
    console.error('Checkin file error:', error);
    res.status(500).json({ success: false, message: 'Failed to checkin file' });
  }
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

// Debug endpoint to check projects count (no authentication required)
export const getProjectsCount = async (_req: Request, res: Response) => {
  try {
    const totalProjects = await prisma.project.count();
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        projectNumber: true,
        name: true,
        status: true,
        plant: true,
        createdAt: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const stats = {
      total: totalProjects,
      byStatus: {
        PLANNED: projects.filter(p => p.status === 'PLANNED').length,
        IN_PROGRESS: projects.filter(p => p.status === 'IN_PROGRESS').length,
        COMPLETED: projects.filter(p => p.status === 'COMPLETED').length,
        ON_HOLD: projects.filter(p => p.status === 'ON_HOLD').length,
        CANCELLED: projects.filter(p => p.status === 'CANCELLED').length,
      },
      byPlant: {
        T208: projects.filter(p => p.plant === 'T208').length,
        T207: projects.filter(p => p.plant === 'T207').length,
        T700: projects.filter(p => p.plant === 'T700').length,
        T46: projects.filter(p => p.plant === 'T46').length,
      }
    };

    res.json({
      success: true,
      message: `Found ${totalProjects} projects in database`,
      data: {
        stats,
        recentProjects: projects.slice(0, 10) // Last 10 projects
      }
    });
  } catch (error) {
    console.error('Debug projects count error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch projects count',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
