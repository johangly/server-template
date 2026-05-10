import request from 'supertest';
import app from '../index.js';

describe('Health Endpoints', () => {
  describe('GET /', () => {
    it('should return API welcome message', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('API');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('OK');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('version');
    });
  });

  describe('GET /api/health/db', () => {
    it('should return database health status', async () => {
      const res = await request(app).get('/api/health/db');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('database');
      expect(res.body.database).toBe('connected');
    });
  });
});
