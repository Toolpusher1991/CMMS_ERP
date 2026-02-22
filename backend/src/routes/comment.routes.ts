import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { commentSchema } from '../schemas/comment.schema';
import {
  getActionComments,
  createActionComment,
  updateActionComment,
  deleteActionComment,
  getProjectComments,
  createProjectComment,
  updateProjectComment,
  deleteProjectComment,
} from '../controllers/comment.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Action Comments
router.get('/actions/:actionId', getActionComments);
router.post('/actions/:actionId', validate(commentSchema), createActionComment);
router.put('/actions/:actionId/comments/:commentId', validate(commentSchema), updateActionComment);
router.delete('/actions/:actionId/comments/:commentId', deleteActionComment);

// Project Comments
router.get('/projects/:projectId', getProjectComments);
router.post('/projects/:projectId', validate(commentSchema), createProjectComment);
router.put('/projects/:projectId/comments/:commentId', validate(commentSchema), updateProjectComment);
router.delete('/projects/:projectId/comments/:commentId', deleteProjectComment);

export default router;
