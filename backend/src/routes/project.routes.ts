import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as projectController from '../controllers/project.controller';

const router = Router();

// Debug endpoint without authentication to check projects count
router.get('/debug/count', projectController.getProjectsCount);

// Debug endpoint to check JWT configuration
router.get('/debug/auth', (req, res) => {
  const authHeader = req.headers.authorization;
  const hasToken = !!authHeader;
  const tokenPrefix = authHeader ? authHeader.substring(0, 20) + '...' : 'No token';
  
  res.json({
    success: true,
    message: 'Auth debug info',
    data: {
      hasAuthHeader: hasToken,
      tokenPrefix: tokenPrefix,
      jwtSecretConfigured: !!process.env.JWT_SECRET,
      jwtRefreshSecretConfigured: !!process.env.JWT_REFRESH_SECRET,
      nodeEnv: process.env.NODE_ENV,
    }
  });
});

// All routes require authentication
router.use(authenticate);

// Projects
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Tasks
router.get('/:id/tasks', projectController.getProjectTasks);
router.post('/:id/tasks', projectController.createTask);
router.put('/:id/tasks/:taskId', projectController.updateTask);
router.delete('/:id/tasks/:taskId', projectController.deleteTask);

// Files
router.get('/:id/files', projectController.getProjectFiles);
router.post('/:id/files', projectController.createFile);
router.delete('/:id/files/:fileId', projectController.deleteFile);
router.post('/:id/files/:fileId/checkout', projectController.checkoutFile);
router.post('/:id/files/:fileId/checkin', projectController.checkinFile);

export default router;
