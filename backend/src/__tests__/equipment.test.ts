import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { testUsers, authHeader } from './helpers';

// ── Mock PrismaClient before any route imports ────────
const { mockEquipment } = vi.hoisted(() => ({
  mockEquipment: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => {
  const MockPrismaClient = function(this: any) {
    Object.assign(this, {
    equipment: mockEquipment,
    // Stubs for other models (routes import at module scope)
    user: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    action: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    project: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    file: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    task: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    rig: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    assetRig: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    failureReport: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    notification: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    comment: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    refreshToken: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    tender: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    tenderConfiguration: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    passwordResetRequest: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    inspectionReport: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    inspectionSection: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    inspectionItem: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn((cb: any) => cb({
      equipment: mockEquipment,
    })),
    });
  };
  return { PrismaClient: MockPrismaClient };
});

import { createTestApp } from '../app';

const app = createTestApp();

// ── Sample data ───────────────────────────────────────
const sampleEquipment = {
  id: 'eq-1',
  category: 'Pumps',
  name: 'Mud Pump',
  price: '50000',
  properties: '{"power":"1600hp"}',
  createdBy: 'test-admin-id',
  lastEditedBy: 'test-admin-id',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleEquipment2 = {
  id: 'eq-2',
  category: 'Pumps',
  name: 'Cement Pump',
  price: '35000',
  properties: '{}',
  createdBy: 'test-admin-id',
  lastEditedBy: 'test-admin-id',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Tests ─────────────────────────────────────────────
describe('Equipment CRUD Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET /api/equipment ──────────────────────────────
  describe('GET /api/equipment', () => {
    it('returns all equipment', async () => {
      mockEquipment.findMany.mockResolvedValue([sampleEquipment, sampleEquipment2]);

      const res = await request(app).get('/api/equipment');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe('Mud Pump');
      // Properties should be parsed from JSON string
      expect(res.body.data[0].properties).toEqual({ power: '1600hp' });
    });

    it('filters by category when query param provided', async () => {
      mockEquipment.findMany.mockResolvedValue([sampleEquipment]);

      const res = await request(app).get('/api/equipment?category=Pumps');

      expect(res.status).toBe(200);
      expect(mockEquipment.findMany).toHaveBeenCalledWith({
        where: { category: 'Pumps' },
        orderBy: { name: 'asc' },
      });
    });

    it('returns empty array when no equipment exists', async () => {
      mockEquipment.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/equipment');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('does not require authentication', async () => {
      mockEquipment.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/equipment');
      // Should NOT be 401 — this is a public endpoint
      expect(res.status).toBe(200);
    });
  });

  // ── GET /api/equipment/:id ──────────────────────────
  describe('GET /api/equipment/:id', () => {
    it('returns equipment by ID', async () => {
      mockEquipment.findUnique.mockResolvedValue(sampleEquipment);

      const res = await request(app).get('/api/equipment/eq-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Mud Pump');
      expect(res.body.data.properties).toEqual({ power: '1600hp' });
    });

    it('returns 404 when equipment not found', async () => {
      mockEquipment.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/equipment/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/equipment ─────────────────────────────
  describe('POST /api/equipment', () => {
    const validBody = { category: 'Pumps', name: 'New Pump', price: '40000' };

    it('creates equipment as admin', async () => {
      mockEquipment.create.mockResolvedValue({
        id: 'eq-new',
        ...validBody,
        properties: '{}',
        createdBy: testUsers.admin.id,
        lastEditedBy: testUsers.admin.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/equipment')
        .set('Authorization', authHeader(testUsers.admin))
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockEquipment.create).toHaveBeenCalledTimes(1);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app).post('/api/equipment').send(validBody);
      expect(res.status).toBe(401);
    });

    it('rejects non-admin user', async () => {
      const res = await request(app)
        .post('/api/equipment')
        .set('Authorization', authHeader(testUsers.user))
        .send(validBody);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid body (missing required fields)', async () => {
      const res = await request(app)
        .post('/api/equipment')
        .set('Authorization', authHeader(testUsers.admin))
        .send({ category: 'Pumps' }); // missing name and price

      expect(res.status).toBe(400);
    });
  });

  // ── PUT /api/equipment/:id ──────────────────────────
  describe('PUT /api/equipment/:id', () => {
    it('updates equipment as admin', async () => {
      mockEquipment.findUnique.mockResolvedValue(sampleEquipment);
      mockEquipment.update.mockResolvedValue({
        ...sampleEquipment,
        price: '55000',
        properties: '{"power":"1600hp"}',
      });

      const res = await request(app)
        .put('/api/equipment/eq-1')
        .set('Authorization', authHeader(testUsers.admin))
        .send({ price: '55000' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockEquipment.update).toHaveBeenCalledTimes(1);
    });

    it('returns 404 when equipment not found', async () => {
      mockEquipment.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/equipment/nonexistent')
        .set('Authorization', authHeader(testUsers.admin))
        .send({ price: '55000' });

      expect(res.status).toBe(404);
    });

    it('rejects non-admin user', async () => {
      const res = await request(app)
        .put('/api/equipment/eq-1')
        .set('Authorization', authHeader(testUsers.user))
        .send({ price: '55000' });

      expect(res.status).toBe(403);
    });
  });

  // ── DELETE /api/equipment/:id ───────────────────────
  describe('DELETE /api/equipment/:id', () => {
    it('deletes equipment as admin', async () => {
      mockEquipment.findUnique.mockResolvedValue(sampleEquipment);
      mockEquipment.delete.mockResolvedValue(sampleEquipment);

      const res = await request(app)
        .delete('/api/equipment/eq-1')
        .set('Authorization', authHeader(testUsers.admin));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Mud Pump');
    });

    it('returns 404 when equipment not found', async () => {
      mockEquipment.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/equipment/nonexistent')
        .set('Authorization', authHeader(testUsers.admin));

      expect(res.status).toBe(404);
    });

    it('rejects non-admin user', async () => {
      const res = await request(app)
        .delete('/api/equipment/eq-1')
        .set('Authorization', authHeader(testUsers.user));

      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app).delete('/api/equipment/eq-1');
      expect(res.status).toBe(401);
    });
  });
});
