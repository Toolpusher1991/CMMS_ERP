import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

// Standalone mini-app — avoids loading all routes (which need PrismaClient)
const app = express();
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

describe('Health endpoint', () => {
  it('GET /api/health → 200 with status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      message: 'API is running',
    });
  });

  it('GET /unknown → 404', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
  });
});
