import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/auth.middleware";
import { cloudinaryProjectFilesUpload } from "../lib/cloudinary";

const router = express.Router();

// Ensure uploads directory exists (for local development)
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for LOCAL file upload (development only)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

const localUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and common document formats
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Ungültiger Dateityp. Nur Bilder und Dokumente sind erlaubt."));
    }
  },
});

// Use Cloudinary in production, local storage in development
const isDevelopment = process.env.NODE_ENV !== 'production';
const upload = isDevelopment ? localUpload : cloudinaryProjectFilesUpload;

// Upload single file
router.post("/upload", authenticate, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Keine Datei hochgeladen",
      });
    }

    // Generate URL based on environment
    let fileUrl: string;
    let filename: string;

    // Check if file is from Cloudinary (production)
    if ('path' in req.file && req.file.path.includes('cloudinary')) {
      // Cloudinary file - use the secure URL
      fileUrl = req.file.path;
      filename = req.file.filename;
    } else {
      // Local file - generate full URL with protocol and host
      const protocol = req.protocol;
      const host = req.get('host');
      filename = req.file.filename;
      fileUrl = `${protocol}://${host}/uploads/${filename}`;
    }

    res.status(200).json({
      success: true,
      data: {
        filename: filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        path: req.file.path,
      },
      message: "Datei erfolgreich hochgeladen",
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      success: false,
      message: "Fehler beim Hochladen der Datei",
    });
  }
});

// Get file
router.get("/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Datei nicht gefunden",
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error("File retrieval error:", error);
    res.status(500).json({
      success: false,
      message: "Fehler beim Abrufen der Datei",
    });
  }
});

// Delete file
router.delete("/:filename", authenticate, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Datei nicht gefunden",
      });
    }

    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: "Datei erfolgreich gelöscht",
    });
  } catch (error) {
    console.error("File deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Fehler beim Löschen der Datei",
    });
  }
});

export default router;
