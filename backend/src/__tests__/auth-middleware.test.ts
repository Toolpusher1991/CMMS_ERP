import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authHeader, testUsers, signToken } from './helpers';
import { errorHandler } from '../middleware/error.middleware';

function buildApp() {
  const app = express();
  app.use(express.json());

  app.get('/protected', authenticate, (req: AuthRequest, res) => {
    res.json({ success: true, user: req.user });
  });

  app.use(errorHandler);
  return app;
}

describe('auth middleware', () => {
  const app = buildApp();

  it('allows access with valid token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', authHeader(testUsers.admin));

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@test.com');
    expect(res.body.user.role).toBe('ADMIN');
  });

  it('rejects request without token', async () => {
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
  });

  it('rejects invalid token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid-garbage-token');

    expect(res.status).toBe(401);
  });

  it('populates user fields from token payload', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', authHeader(testUsers.user));

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: 'test-user-id',
      email: 'user@test.com',
      role: 'USER',
      assignedPlant: 'T208',
    });
  });

  it('supports token via query param', async () => {
    const token = signToken(testUsers.manager);
    const res = await request(app).get(`/protected?token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('MANAGER');
  });
});
