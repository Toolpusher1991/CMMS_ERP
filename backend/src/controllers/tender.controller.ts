import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { captureError } from '../lib/sentry';
import type { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export interface TenderConfigurationData {
  projectName: string;
  clientName?: string;
  location?: string;
  projectDuration?: string;
  selectedRig: any; // JSON object with rig data
  selectedEquipment: any; // JSON object with equipment data
  totalPrice: number;
  isUnderContract?: boolean;
  notes?: string;
}

// GET /api/tender - Get all tender configurations for current user
export const getAllTenderConfigurations = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const tenderConfigurations = await prisma.tenderConfiguration.findMany({
      where: {
        createdBy: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: tenderConfigurations
    });
  } catch (error) {
    console.error('Error fetching tender configurations:', error);
    captureError(error as Error, {
      operation: 'getAllTenderConfigurations',
      userId: (req as AuthRequest).user?.id,
    });
    throw new AppError('Failed to fetch tender configurations', 500);
  }
};

// POST /api/tender - Create a new tender configuration
export const createTenderConfiguration = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const {
      projectName,
      clientName,
      location,
      projectDuration,
      selectedRig,
      selectedEquipment,
      totalPrice,
      isUnderContract = false,
      notes
    }: TenderConfigurationData = req.body;

    if (!projectName || !selectedRig || totalPrice === undefined) {
      throw new AppError('Missing required fields: projectName, selectedRig, totalPrice', 400);
    }

    const tenderConfiguration = await prisma.tenderConfiguration.create({
      data: {
        projectName,
        clientName,
        location,
        projectDuration,
        selectedRig,
        selectedEquipment,
        totalPrice,
        isUnderContract,
        notes,
        createdBy: userId
      }
    });

    res.status(201).json({
      success: true,
      data: tenderConfiguration,
      message: 'Tender configuration created successfully'
    });
  } catch (error) {
    console.error('Error creating tender configuration:', error);
    captureError(error as Error, {
      operation: 'createTenderConfiguration',
      userId: (req as AuthRequest).user?.id,
      projectName: req.body.projectName,
    });
    throw new AppError('Failed to create tender configuration', 500);
  }
};

// PUT /api/tender/:id - Update a tender configuration
export const updateTenderConfiguration = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    // Check if tender configuration exists and belongs to user
    const existingTender = await prisma.tenderConfiguration.findFirst({
      where: {
        id,
        createdBy: userId
      }
    });

    if (!existingTender) {
      throw new AppError('Tender configuration not found or access denied', 404);
    }

    const updateData: Partial<TenderConfigurationData> = req.body;

    const updatedTender = await prisma.tenderConfiguration.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: updatedTender,
      message: 'Tender configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating tender configuration:', error);
    throw new AppError('Failed to update tender configuration', 500);
  }
};

// PATCH /api/tender/:id/contract-status - Toggle contract status
export const toggleContractStatus = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    // Check if tender configuration exists and belongs to user
    const existingTender = await prisma.tenderConfiguration.findFirst({
      where: {
        id,
        createdBy: userId
      }
    });

    if (!existingTender) {
      throw new AppError('Tender configuration not found or access denied', 404);
    }

    const updatedTender = await prisma.tenderConfiguration.update({
      where: { id },
      data: {
        isUnderContract: !existingTender.isUnderContract
      }
    });

    res.json({
      success: true,
      data: updatedTender,
      message: `Contract status updated to ${updatedTender.isUnderContract ? 'under contract' : 'pending'}`
    });
  } catch (error) {
    console.error('Error toggling contract status:', error);
    throw new AppError('Failed to update contract status', 500);
  }
};

// DELETE /api/tender/:id - Delete a tender configuration
export const deleteTenderConfiguration = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    // Check if tender configuration exists and belongs to user
    const existingTender = await prisma.tenderConfiguration.findFirst({
      where: {
        id,
        createdBy: userId
      }
    });

    if (!existingTender) {
      throw new AppError('Tender configuration not found or access denied', 404);
    }

    await prisma.tenderConfiguration.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Tender configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tender configuration:', error);
    throw new AppError('Failed to delete tender configuration', 500);
  }
};

// GET /api/tender/:id - Get a specific tender configuration
export const getTenderConfiguration = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const tenderConfiguration = await prisma.tenderConfiguration.findFirst({
      where: {
        id,
        createdBy: userId
      }
    });

    if (!tenderConfiguration) {
      throw new AppError('Tender configuration not found or access denied', 404);
    }

    res.json({
      success: true,
      data: tenderConfiguration
    });
  } catch (error) {
    console.error('Error fetching tender configuration:', error);
    throw new AppError('Failed to fetch tender configuration', 500);
  }
};