import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as projectController from '../controllers/project.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Projects
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);

// Not implemented yet (return 501)
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
