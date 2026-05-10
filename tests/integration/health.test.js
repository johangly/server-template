import { expect } from 'chai';
import request from 'supertest';
import app from '../../index.js';

describe('Health Endpoints', () => {
  describe('GET /', () => {
    it('should return API welcome message', async () => {
      const res = await request(app).get('/');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message');
      expect(res.body.message).toContain('API');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('status');
      expect(res.body.status).to.equal('OK');
      expect(res.body).to.have.property('timestamp');
      expect(res.body).to.have.property('version');
    });
  });

  describe('GET /api/health/db', () => {
    it('should return database health status', async () => {
      const res = await request(app).get('/api/health/db');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('database');
      expect(res.body.database).to.equal('connected');
    });
  });
});
