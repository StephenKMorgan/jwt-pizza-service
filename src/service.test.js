const request = require('supertest');
const app = require('./service.js'); // Adjust the path as necessary
const version = require('./version.json');
const config = require('./config.js');

describe('Service Test', () => {
  test('GET / should return welcome message and version', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'welcome to JWT Pizza',
      version: version.version,
    });
  });

  test('GET /api/docs should return API documentation', async () => {
    const res = await request(app).get('/api/docs');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      version: version.version,
      endpoints: expect.any(Array),
      config: { factory: config.factory.url, db: config.db.connection.host },
    });
  });

  test('Unknown endpoint should return 404', async () => {
    const res = await request(app).get('/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      message: 'unknown endpoint',
    });
  });
});