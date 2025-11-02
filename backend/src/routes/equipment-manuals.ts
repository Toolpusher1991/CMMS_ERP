import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { analyzeManualWithAI } from "../services/manual-ai.service";

const router = Router();
const prisma = new PrismaClient();

// Configure local disk storage for manuals
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/manuals");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const filename = `manual_${uniqueSuffix}_${file.originalname}`;
    cb(null, filename);
  },
});

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

// GET /equipment-manuals/:id/download - Download PDF file
router.get("/:id/download", async (req: Request, res: Response) => {
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

    // Construct absolute path to the PDF file
    const filePath = path.join(__dirname, "../../uploads/manuals", manual.manualFilePath);

    // Send file for download
    res.download(filePath, manual.manualFileName, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).json({
          success: false,
          message: "Failed to download file",
        });
      }
    });
  } catch (error) {
    console.error("Error in download route:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download manual",
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

      // File is now saved locally via multer
      const filePath = req.file.path; // Absolute path on disk
      const filename = req.file.filename; // Generated filename

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
          manualFilePath: filename, // Store just the filename, we know the folder
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

    // Construct absolute path to the PDF file
    const manualPath = path.join(__dirname, "../../uploads/manuals", manual.manualFilePath);
    
    // Use AI to analyze the manual
    const aiResult = await analyzeManualWithAI(
      manualPath, // Pass local file path instead of URL
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
