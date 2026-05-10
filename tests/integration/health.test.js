import { expect } from 'chai';
import request from 'supertest';
import app from '../../index.js';

describe('Health Endpoints', () => {
  describe('GET /api/', () => {
    it('should return API welcome message', async () => {
      const res = await request(app).get('/api/');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.contain('Bienvenido');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).to.equal(200);
      expect(res.text).to.equal('OK');
    });
  });
});