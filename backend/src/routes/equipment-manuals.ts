import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { analyzeManualWithAI } from "../services/manual-ai.service";

const router = Router();
const prisma = new PrismaClient();

// Helper function to make existing Cloudinary file public
const makeFilePublic = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.explicit(publicId, {
      type: "upload",
      resource_type: "raw",
      access_mode: "public",
    });
    console.log(`✅ Made file public: ${publicId}`);
  } catch (error) {
    console.error(`❌ Failed to make file public: ${publicId}`, error);
    throw error;
  }
};

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
        type: "upload",
        access_mode: "public",
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

    console.log(`🤖 Starting AI processing for manual: ${manual.equipmentName}`);

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/dhb5tjle6/raw/upload/v1762069340/cmms-erp/equipment-manuals/manual_xxx.pdf
    const urlParts = manual.manualFilePath.split('/');
    const versionIndex = urlParts.findIndex((part: string) => part.startsWith('v'));
    const publicId = urlParts.slice(versionIndex + 1).join('/').replace('.pdf', '');
    
    // Make sure the file is publicly accessible
    console.log(`🔓 Making file public: ${publicId}`);
    await makeFilePublic(publicId);

    // Use AI to analyze the manual
    const aiResult = await analyzeManualWithAI(
      manual.manualFilePath,
      manual.equipmentName,
      manual.manufacturer || undefined
    );

    console.log(`✅ AI analysis complete. Creating database records...`);

    // Create maintenance schedules from AI result
    if (aiResult.maintenanceSchedules.length > 0) {
      await prisma.maintenanceSchedule.createMany({
        data: aiResult.maintenanceSchedules.map(schedule => ({
          manualId: id,
          ...schedule,
        })),
      });
      console.log(`✅ Created ${aiResult.maintenanceSchedules.length} maintenance schedules`);
    }

    // Create spare parts from AI result
    if (aiResult.spareParts.length > 0) {
      await prisma.sparePart.createMany({
        data: aiResult.spareParts.map(part => ({
          manualId: id,
          ...part,
        })),
      });
      console.log(`✅ Created ${aiResult.spareParts.length} spare parts`);
    }

    // Create specifications from AI result
    if (aiResult.specifications.length > 0) {
      await prisma.specification.createMany({
        data: aiResult.specifications.map(spec => ({
          manualId: id,
          ...spec,
        })),
      });
      console.log(`✅ Created ${aiResult.specifications.length} specifications`);
    }

    // Update manual as processed
    const updatedManual = await prisma.equipmentManual.update({
      where: { id },
      data: {
        aiProcessed: true,
        aiProcessedAt: new Date(),
        summary: aiResult.summary,
        aiExtractionData: aiResult as any, // Store raw AI response for debugging
      },
      include: {
        maintenanceSchedules: true,
        spareParts: true,
        specifications: true,
      },
    });

    console.log(`🎉 AI processing complete for ${manual.equipmentName}`);

    res.json({
      success: true,
      data: updatedManual,
      message: "Manual processed successfully with AI",
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
