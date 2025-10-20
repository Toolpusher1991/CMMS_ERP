import { Router } from 'express';
import {
  getPendingUsers,
  approveUser,
  changeUserPassword,
  changeOwnPassword,
  unlockUserAccount,
  getUserStatistics,
  getPasswordResetRequests,
  resolvePasswordResetRequest,
} from '../controllers/user-management.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// Get pending users awaiting approval
router.get('/pending', authorize('ADMIN'), getPendingUsers);

// Get user statistics
router.get('/statistics', authorize('ADMIN'), getUserStatistics);

// Get password reset requests
router.get('/password-resets', authorize('ADMIN'), getPasswordResetRequests);

// Approve or reject a user
router.post('/:id/approve', authorize('ADMIN'), approveUser);

// Change password for any user (Admin only)
router.post('/:id/change-password', authorize('ADMIN'), changeUserPassword);

// Unlock user account (Admin only)
router.post('/:id/unlock', authorize('ADMIN'), unlockUserAccount);

// Resolve password reset request
router.post('/password-resets/:id/resolve', authorize('ADMIN'), resolvePasswordResetRequest);

// ============================================
// USER SELF-SERVICE ROUTES
// ============================================

// Change own password
router.post('/change-password', changeOwnPassword);

export default router;
