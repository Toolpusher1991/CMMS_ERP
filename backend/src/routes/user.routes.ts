import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
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
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticate);

// Get users list for assignment (available to all authenticated users)
router.get('/list', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        approvalStatus: 'APPROVED',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        assignedPlant: true,
      },
      orderBy: [
        { assignedPlant: 'asc' },
        { firstName: 'asc' },
      ],
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users list:', error);
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

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
