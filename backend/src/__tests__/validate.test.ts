import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../middleware/validate.middleware';
import { createEquipmentSchema } from '../schemas/equipment.schema';

// Minimal app just for testing the middleware
function buildApp() {
  const app = express();
  app.use(express.json());

  app.post('/test', validate(createEquipmentSchema), (_req, res) => {
    res.json({ success: true, data: _req.body });
  });

  return app;
}

describe('validate middleware', () => {
  const app = buildApp();

  it('passes valid body through', async () => {
    const res = await request(app)
      .post('/test')
      .send({ category: 'Pumps', name: 'Mud Pump', price: '50000' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      category: 'Pumps',
      name: 'Mud Pump',
      price: '50000',
    });
  });

  it('rejects body with missing required fields', async () => {
    const res = await request(app)
      .post('/test')
      .send({ category: 'Pumps' }); // missing name, price

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validierungsfehler');
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('rejects empty body', async () => {
    const res = await request(app)
      .post('/test')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(3); // category, name, price
  });

  it('strips unknown fields via Zod passthrough (strict by default)', async () => {
    const res = await request(app)
      .post('/test')
      .send({ category: 'X', name: 'Y', price: '10', hackerField: 'evil' });

    // Zod .object() strips unknown keys by default
    expect(res.status).toBe(200);
    expect(res.body.data.hackerField).toBeUndefined();
  });
});
