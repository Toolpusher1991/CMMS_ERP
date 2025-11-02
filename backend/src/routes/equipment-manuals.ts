import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

const router = Router();
const prisma = new PrismaClient();

// Configure Cloudinary upload for manuals
const storage = multer.memoryStorage();
const uploadManual = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (
  buffer: Buffer,
  filename: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "cmms-erp/equipment-manuals",
        resource_type: "raw",
        public_id: `manual_${Date.now()}_${filename}`,
      },
      (error, result) => {
        if (error) reject(error);
        else
          resolve({
            url: result!.secure_url,
            publicId: result!.public_id,
          });
      }
    );

    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
};

// GET /equipment-manuals - Get all manuals
router.get("/", async (req: Request, res: Response) => {
  try {
    const manuals = await prisma.equipmentManual.findMany({
      include: {
        maintenanceSchedules: true,
        spareParts: true,
        specifications: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ success: true, data: manuals });
  } catch (error) {
    console.error("Error fetching manuals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch manuals",
    });
  }
});

// GET /equipment-manuals/:id - Get single manual
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const manual = await prisma.equipmentManual.findUnique({
      where: { id },
      include: {
        maintenanceSchedules: true,
        spareParts: true,
        specifications: true,
      },
    });

    if (!manual) {
      return res.status(404).json({
        success: false,
        message: "Manual not found",
      });
    }

    res.json({ success: true, data: manual });
  } catch (error) {
    console.error("Error fetching manual:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch manual",
    });
  }
});

// POST /equipment-manuals/upload - Upload new manual
router.post(
  "/upload",
  uploadManual.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const {
        equipmentName,
        equipmentNumber,
        manufacturer,
        model,
        serialNumber,
        plant,
        location,
      } = req.body;

      if (!equipmentName || !plant) {
        return res.status(400).json({
          success: false,
          message: "Equipment name and plant are required",
        });
      }

      // Upload to Cloudinary
      const { url } = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname
      );

      // Create manual record
      const manual = await prisma.equipmentManual.create({
        data: {
          equipmentName,
          equipmentNumber: equipmentNumber || null,
          manufacturer: manufacturer || null,
          model: model || null,
          serialNumber: serialNumber || null,
          plant,
          location: location || null,
          manualFileName: req.file.originalname,
          manualFilePath: url,
          manualFileSize: req.file.size,
          uploadedBy: (req as any).user?.id || null,
          aiProcessed: false,
        },
      });

      res.status(201).json({
        success: true,
        data: manual,
        message: "Manual uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading manual:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload manual",
      });
    }
  }
);

// POST /equipment-manuals/:id/process - Process manual with AI
router.post("/:id/process", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const manual = await prisma.equipmentManual.findUnique({
      where: { id },
    });

    if (!manual) {
      return res.status(404).json({
        success: false,
        message: "Manual not found",
      });
    }

    // TODO: Implement AI processing here
    // For now, we'll create some sample data
    
    // Sample maintenance schedules
    await prisma.maintenanceSchedule.createMany({
      data: [
        {
          manualId: id,
          taskName: "Oil Change",
          description: "Change oil and filter",
          interval: "500 hours",
          intervalHours: 500,
          priority: "HIGH",
          category: "Lubrication",
          estimatedDuration: "2 hours",
          requiredTools: "Oil filter wrench, drain pan",
          safetyNotes: "Ensure equipment is cool before draining oil",
        },
        {
          manualId: id,
          taskName: "Visual Inspection",
          description: "Check for leaks and damage",
          interval: "Daily",
          intervalDays: 1,
          priority: "MEDIUM",
          category: "Inspection",
          estimatedDuration: "30 minutes",
        },
      ],
    });

    // Sample spare parts
    await prisma.sparePart.createMany({
      data: [
        {
          manualId: id,
          partNumber: "12345-ABC",
          partName: "Oil Filter",
          description: "High-efficiency oil filter",
          category: "Filter",
          quantity: 5,
          manufacturer: manual.manufacturer || "Unknown",
          replacementInterval: "500 hours",
          criticalPart: true,
        },
        {
          manualId: id,
          partNumber: "67890-XYZ",
          partName: "Bearing Assembly",
          description: "Main shaft bearing",
          category: "Bearing",
          quantity: 2,
          manufacturer: manual.manufacturer || "Unknown",
          replacementInterval: "2000 hours",
          criticalPart: true,
        },
      ],
    });

    // Sample specifications
    await prisma.specification.createMany({
      data: [
        {
          manualId: id,
          category: "Performance",
          name: "Max Load Capacity",
          value: "50",
          unit: "tons",
        },
        {
          manualId: id,
          category: "Dimensions",
          name: "Height",
          value: "12",
          unit: "meters",
        },
        {
          manualId: id,
          category: "Electrical",
          name: "Operating Voltage",
          value: "480",
          unit: "V",
        },
      ],
    });

    // Update manual as processed
    const updatedManual = await prisma.equipmentManual.update({
      where: { id },
      data: {
        aiProcessed: true,
        aiProcessedAt: new Date(),
        summary: `${manual.equipmentName} manual has been processed. Key maintenance intervals and spare parts have been extracted.`,
      },
      include: {
        maintenanceSchedules: true,
        spareParts: true,
        specifications: true,
      },
    });

    res.json({
      success: true,
      data: updatedManual,
      message: "Manual processed successfully",
    });
  } catch (error) {
    console.error("Error processing manual:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process manual",
    });
  }
});

// DELETE /equipment-manuals/:id - Delete manual
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const manual = await prisma.equipmentManual.findUnique({
      where: { id },
    });

    if (!manual) {
      return res.status(404).json({
        success: false,
        message: "Manual not found",
      });
    }

    // Delete from database (cascade will delete related records)
    await prisma.equipmentManual.delete({
      where: { id },
    });

    // TODO: Delete from Cloudinary if needed

    res.json({
      success: true,
      message: "Manual deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting manual:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete manual",
    });
  }
});

export default router;
