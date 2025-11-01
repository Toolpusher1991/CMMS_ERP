import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { pdfParserService } from '../services/pdf-parser.service';

const prisma = new PrismaClient();

// Generate unique report number
async function generateReportNumber(type: string, plant: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${type}-${plant}-${year}${month}`;

  // Find the latest report with this prefix
  const latestReport = await prisma.inspectionReport.findFirst({
    where: {
      reportNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      reportNumber: 'desc',
    },
  });

  let nextNumber = 1;
  if (latestReport) {
    const match = latestReport.reportNumber.match(/-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
}

// Get all inspection reports
export const getInspectionReports = async (req: AuthRequest, res: Response) => {
  try {
    const { plant, type, status } = req.query;

    const where: any = {};
    if (plant) where.plant = plant;
    if (type) where.type = type;
    if (status) where.status = status;

    const reports = await prisma.inspectionReport.findMany({
      where,
      include: {
        sections: {
          include: {
            items: true,
          },
          orderBy: {
            sectionNumber: 'asc',
          },
        },
        attachments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get inspection reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inspection reports' });
  }
};

// Get single inspection report
export const getInspectionReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const report = await prisma.inspectionReport.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            items: true,
          },
          orderBy: {
            sectionNumber: 'asc',
          },
        },
        attachments: true,
      },
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Inspection report not found' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Get inspection report error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inspection report' });
  }
};

// Create inspection report
export const createInspectionReport = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      type,
      plant,
      equipment,
      inspectionDate,
      inspector,
      sections,
    } = req.body;

    const userId = req.user?.id;
    const userName = req.user?.firstName && req.user?.lastName
      ? `${req.user.firstName} ${req.user.lastName}`
      : 'Unknown User';

    // Generate report number
    const reportNumber = await generateReportNumber(type, plant);

    // Create report with sections and items
    const report = await prisma.inspectionReport.create({
      data: {
        reportNumber,
        title,
        type,
        plant,
        equipment,
        inspectionDate: new Date(inspectionDate),
        inspector: inspector || userName,
        inspectorId: userId,
        status: 'DRAFT',
        createdBy: userId,
        sections: {
          create: sections?.map((section: any) => ({
            sectionNumber: section.sectionNumber,
            title: section.title,
            description: section.description,
            items: {
              create: section.items?.map((item: any) => ({
                itemNumber: item.itemNumber,
                description: item.description,
                itemType: item.itemType || 'CHECKBOX',
                minValue: item.minValue,
                maxValue: item.maxValue,
                referenceValue: item.referenceValue,
                measurementUnit: item.measurementUnit,
              })) || [],
            },
          })) || [],
        },
      },
      include: {
        sections: {
          include: {
            items: true,
          },
        },
      },
    });

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Create inspection report error:', error);
    res.status(500).json({ success: false, message: 'Failed to create inspection report' });
  }
};

// Update inspection report
export const updateInspectionReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      status,
      overallResult,
      generalNotes,
      recommendations,
      inspectorSignature,
      supervisorSignature,
    } = req.body;

    const report = await prisma.inspectionReport.update({
      where: { id },
      data: {
        title,
        status,
        overallResult,
        generalNotes,
        recommendations,
        inspectorSignature,
        supervisorSignature,
        ...(status === 'APPROVED' && {
          approvedBy: req.user?.id,
          approvedAt: new Date(),
        }),
      },
      include: {
        sections: {
          include: {
            items: true,
          },
        },
      },
    });

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Update inspection report error:', error);
    res.status(500).json({ success: false, message: 'Failed to update inspection report' });
  }
};

// Update inspection item
export const updateInspectionItem = async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const {
      isChecked,
      measurementValue,
      textValue,
      rating,
      result,
      notes,
    } = req.body;

    const item = await prisma.inspectionItem.update({
      where: { id: itemId },
      data: {
        isChecked,
        measurementValue,
        textValue,
        rating,
        result,
        notes,
      },
    });

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Update inspection item error:', error);
    res.status(500).json({ success: false, message: 'Failed to update inspection item' });
  }
};

// Delete inspection report
export const deleteInspectionReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.inspectionReport.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Inspection report deleted successfully' });
  } catch (error) {
    console.error('Delete inspection report error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete inspection report' });
  }
};

// Upload attachment
export const uploadAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { id: reportId } = req.params;
    
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const userName = req.user?.firstName && req.user?.lastName
      ? `${req.user.firstName} ${req.user.lastName}`
      : 'Unknown User';

    const attachments = [];

    for (const file of req.files) {
      const cloudinaryFile = file as any;
      
      const attachment = await prisma.inspectionAttachment.create({
        data: {
          reportId,
          filename: cloudinaryFile.filename || cloudinaryFile.public_id,
          originalName: cloudinaryFile.originalname,
          fileType: cloudinaryFile.mimetype,
          fileSize: cloudinaryFile.size,
          filePath: cloudinaryFile.secure_url || cloudinaryFile.path,
          uploadedBy: userName,
        },
      });

      attachments.push(attachment);
    }

    res.json({ success: true, data: attachments });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload attachment' });
  }
};

// Delete attachment
export const deleteAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { attachmentId } = req.params;

    await prisma.inspectionAttachment.delete({
      where: { id: attachmentId },
    });

    res.json({ success: true, message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete attachment' });
  }
};

// Parse PDF and create inspection report
export const parsePDFAndCreateReport = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
    }

    const { plant, equipment, inspector, inspectionDate } = req.body;

    if (!plant || !equipment) {
      return res.status(400).json({ success: false, message: 'Plant and equipment are required' });
    }

    // Parse PDF
    const pdfBuffer = req.file.buffer;
    const parsedData = await pdfParserService.parsePDF(pdfBuffer);

    // Generate report number
    const reportNumber = await generateReportNumber(parsedData.type, plant);

    // Parse inspectionDate to full ISO DateTime
    let inspectionDateTime = new Date().toISOString();
    if (inspectionDate) {
      // If date format is YYYY-MM-DD, append time
      if (/^\d{4}-\d{2}-\d{2}$/.test(inspectionDate)) {
        inspectionDateTime = new Date(inspectionDate + 'T00:00:00Z').toISOString();
      } else {
        inspectionDateTime = new Date(inspectionDate).toISOString();
      }
    }

    // Create inspection report
    const report = await prisma.inspectionReport.create({
      data: {
        reportNumber,
        title: parsedData.title,
        type: parsedData.type,
        plant,
        equipment,
        inspectionDate: inspectionDateTime,
        inspector: inspector || `${req.user?.firstName} ${req.user?.lastName}`,
        status: 'DRAFT',
        createdBy: req.user?.id,
        sections: {
          create: parsedData.sections.map((section) => ({
            sectionNumber: section.sectionNumber,
            title: section.title,
            description: section.description,
            items: {
              create: section.items.map((item) => ({
                itemNumber: item.itemNumber,
                description: item.description,
                itemType: item.itemType,
                minValue: item.minValue,
                maxValue: item.maxValue,
                measurementUnit: item.measurementUnit,
                result: 'N/A',
              })),
            },
          })),
        },
      },
      include: {
        sections: {
          include: {
            items: true,
          },
        },
      },
    });

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Parse PDF error:', error);
    res.status(500).json({ success: false, message: 'Failed to parse PDF and create report' });
  }
};

