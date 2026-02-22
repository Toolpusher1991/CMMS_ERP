import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

interface TestUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'MANAGER';
  assignedPlant?: string | null;
  firstName?: string;
  lastName?: string;
}

/** Pre-built test users */
export const testUsers = {
  admin: {
    id: 'test-admin-id',
    email: 'admin@test.com',
    role: 'ADMIN' as const,
    firstName: 'Test',
    lastName: 'Admin',
  },
  user: {
    id: 'test-user-id',
    email: 'user@test.com',
    role: 'USER' as const,
    assignedPlant: 'T208',
    firstName: 'Test',
    lastName: 'User',
  },
  manager: {
    id: 'test-manager-id',
    email: 'manager@test.com',
    role: 'MANAGER' as const,
    firstName: 'Test',
    lastName: 'Manager',
  },
};

/** Sign a short-lived JWT for the given test user (no DB required). */
export function signToken(user: TestUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      assignedPlant: user.assignedPlant ?? null,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    JWT_SECRET,
    { expiresIn: '15m' },
  );
}

/** Convenience: returns `Bearer <token>` header value. */
export function authHeader(user: TestUser = testUsers.admin): string {
  return `Bearer ${signToken(user)}`;
}
