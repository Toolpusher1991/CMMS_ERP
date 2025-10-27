import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { initSentry, captureError } from './lib/sentry';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import userManagementRoutes from './routes/user-management.routes';
import projectRoutes from './routes/project.routes';
import fileRoutes from './routes/file.routes';
import actionRoutes from './routes/actions';
import rigRoutes from './routes/rigs.routes';
import equipmentRoutes from './routes/equipment.routes';
import failureReportRoutes from './routes/failure-reports.routes';
import notificationRoutes from './routes/notification.routes';
import commentRoutes from './routes/comment.routes';
import chatbotRoutes from './routes/chatbot.routes';
import qrCodeRoutes from './routes/qr-code.routes';
import tenderRoutes from './routes/tender.routes';
import { errorHandler } from './middleware/error.middleware';
import { apiLimiter, authLimiter } from './middleware/rate-limit.middleware';

dotenv.config();

// Initialize Sentry as early as possible
initSentry();

const app = express();
const PORT = parseInt(process.env.PORT || '5137', 10);

// Trust proxy - wichtig für Render.com (hinter Reverse Proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline needed for Vite in dev
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:3000', 'http://localhost:5173', 'http://192.168.188.20:3000', 'http://192.168.188.20:5173'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'development' ? false : true,
  })
);

// CORS - Development + Production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://192.168.188.20:5173',
  'http://192.168.188.20:5174',
  'http://192.168.188.20:5175',
  'https://maintain-nory.onrender.com', // Production Frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`❌ CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
  })
);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically with CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Rate limiting
app.use('/api/', apiLimiter);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Auth routes with strict rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/rigs', rigRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/failure-reports', failureReportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/qr', qrCodeRoutes); // QR-Code Generation & Management
app.use('/api/tender', tenderRoutes); // Tender configuration CRUD (requires prisma client/migrations)

// Error handling
app.use(errorHandler);

// Listen on all network interfaces (0.0.0.0) für Netzwerk-Zugriff
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

// Error handling for server startup
server.on('error', (error: Error & { code?: string }) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    captureError(error, { port: PORT, environment: process.env.NODE_ENV });
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    captureError(error, { port: PORT, environment: process.env.NODE_ENV });
    process.exit(1);
  }
});

export default app;
