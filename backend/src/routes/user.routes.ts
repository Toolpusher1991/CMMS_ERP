import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  authorizeOwnership,
  preventPrivilegeEscalation,
} from '../middleware/ownership.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users (Admin and Manager only)
router.get('/', authorize('ADMIN', 'MANAGER'), getAllUsers);

// Get user by ID (Admin, Manager, or own profile)
router.get(
  '/:id',
  authorize('ADMIN', 'MANAGER', 'USER'),
  authorizeOwnership('id'),
  getUserById
);

// Create user (Admin only)
router.post('/', authorize('ADMIN'), createUser);

// Update user (Admin or own profile, but no privilege escalation)
router.put(
  '/:id',
  authorize('ADMIN', 'USER'),
  authorizeOwnership('id'),
  preventPrivilegeEscalation,
  updateUser
);

// Delete user (Admin only)
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;
