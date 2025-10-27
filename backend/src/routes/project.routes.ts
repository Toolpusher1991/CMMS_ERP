import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as projectController from '../controllers/project.controller';

const router = Router();

// Debug endpoint without authentication to check projects count
router.get('/debug/count', projectController.getProjectsCount);

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

export default router;
