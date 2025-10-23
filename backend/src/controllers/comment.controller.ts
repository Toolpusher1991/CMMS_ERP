import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

// Get all comments for an action
export const getActionComments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { actionId } = req.params;

    const comments = await prisma.actionComment.findMany({
      where: { actionId },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch user details for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await prisma.user.findUnique({
          where: { id: comment.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });

        return {
          ...comment,
          user: user || { 
            id: comment.userId, 
            email: 'Unknown', 
            firstName: 'Unknown', 
            lastName: 'User' 
          },
        };
      })
    );

    res.json(commentsWithUsers);
  } catch (error) {
    next(error);
  }
};

// Create a new comment
export const createActionComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { actionId } = req.params;
    const { text } = req.body;
    const userId = req.user!.id;

    if (!text || text.trim().length === 0) {
      throw new AppError('Comment text is required', 400);
    }

    const comment = await prisma.actionComment.create({
      data: {
        actionId,
        userId,
        text: text.trim(),
      },
    });

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    res.status(201).json({
      ...comment,
      user: user || { 
        id: userId, 
        email: req.user!.email, 
        firstName: req.user!.firstName || 'Unknown', 
        lastName: req.user!.lastName || 'User' 
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update a comment
export const updateActionComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user!.id;

    if (!text || text.trim().length === 0) {
      throw new AppError('Comment text is required', 400);
    }

    const comment = await prisma.actionComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Only comment author can edit
    if (comment.userId !== userId) {
      throw new AppError('You can only edit your own comments', 403);
    }

    const updated = await prisma.actionComment.update({
      where: { id: commentId },
      data: { text: text.trim() },
    });

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    res.json({
      ...updated,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a comment
export const deleteActionComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { commentId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const comment = await prisma.actionComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Only comment author or admin/manager can delete
    if (comment.userId !== userId && userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      throw new AppError('You can only delete your own comments', 403);
    }

    await prisma.actionComment.delete({
      where: { id: commentId },
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get all comments for a project
export const getProjectComments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;

    const comments = await prisma.projectComment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch user details for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await prisma.user.findUnique({
          where: { id: comment.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });

        return {
          ...comment,
          user: user || { 
            id: comment.userId, 
            email: 'Unknown', 
            firstName: 'Unknown', 
            lastName: 'User' 
          },
        };
      })
    );

    res.json(commentsWithUsers);
  } catch (error) {
    next(error);
  }
};

// Create a new project comment
export const createProjectComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;
    const { text } = req.body;
    const userId = req.user!.id;

    if (!text || text.trim().length === 0) {
      throw new AppError('Comment text is required', 400);
    }

    const comment = await prisma.projectComment.create({
      data: {
        projectId,
        userId,
        text: text.trim(),
      },
    });

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    res.status(201).json({
      ...comment,
      user: user || { 
        id: userId, 
        email: req.user!.email, 
        firstName: req.user!.firstName || 'Unknown', 
        lastName: req.user!.lastName || 'User' 
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update a project comment
export const updateProjectComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user!.id;

    if (!text || text.trim().length === 0) {
      throw new AppError('Comment text is required', 400);
    }

    const comment = await prisma.projectComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Only comment author can edit
    if (comment.userId !== userId) {
      throw new AppError('You can only edit your own comments', 403);
    }

    const updated = await prisma.projectComment.update({
      where: { id: commentId },
      data: { text: text.trim() },
    });

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    res.json({
      ...updated,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a project comment
export const deleteProjectComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { commentId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const comment = await prisma.projectComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Only comment author or admin/manager can delete
    if (comment.userId !== userId && userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      throw new AppError('You can only delete your own comments', 403);
    }

    await prisma.projectComment.delete({
      where: { id: commentId },
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
