import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import userManagementRoutes from './routes/user-management.routes';
import projectRoutes from './routes/project.routes';
import fileRoutes from './routes/file.routes';
import actionRoutes from './routes/actions';
import rigRoutes from './routes/rigs.routes';
import assetIntegrityRoutes from './routes/asset-integrity.routes';
import equipmentRoutes from './routes/equipment.routes';
import failureReportRoutes from './routes/failure-reports.routes';
import notificationRoutes from './routes/notification.routes';
import commentRoutes from './routes/comment.routes';
import chatbotRoutes from './routes/chatbot.routes';
import qrCodeRoutes from './routes/qr-code.routes';
import tenderRoutes from './routes/tender.routes';
import inspectionReportRoutes from './routes/inspection-report.routes';
import { errorHandler } from './middleware/error.middleware';

/**
 * Creates an Express app with all routes mounted but WITHOUT:
 * - Helmet (security headers interfere with tests)
 * - Rate limiting
 * - Sentry
 * - Static file serving
 * - Server listener
 *
 * Used by Supertest in integration tests.
 */
export function createTestApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
  });

  // Routes — same mount paths as index.ts
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/user-management', userManagementRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/actions', actionRoutes);
  app.use('/api/rigs', rigRoutes);
  app.use('/api/asset-integrity', assetIntegrityRoutes);
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/failure-reports', failureReportRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/chatbot', chatbotRoutes);
  app.use('/api/qr', qrCodeRoutes);
  app.use('/api/tender', tenderRoutes);
  app.use('/api/inspection-reports', inspectionReportRoutes);

  app.use(errorHandler);

  return app;
}
