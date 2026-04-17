describe('security middleware', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.JWT_SECRET = 'test-secret';
    process.env.MONGO_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_ISSUER = 'kursach-backend';
    process.env.JWT_AUDIENCE = 'kursach-frontend';
  });

  test('auth middleware sets user data for valid token', () => {
    const jwt = require('jsonwebtoken');
    const authMiddleware = require('../src/middleware/auth');
    const token = jwt.sign(
      { id: 'user-1', role: 'patient' },
      process.env.JWT_SECRET,
      { issuer: process.env.JWT_ISSUER, audience: process.env.JWT_AUDIENCE }
    );

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(req.userId).toBe('user-1');
    expect(req.userRole).toBe('patient');
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('roleAuth blocks route for wrong role', () => {
    const { isDoctor } = require('../src/middleware/roleAuth');
    const req = { userRole: 'patient' };
    const res = {};
    const next = jest.fn();

    isDoctor(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err.status).toBe(403);
  });

  test('validate middleware rejects invalid payload', () => {
    const validate = require('../src/middleware/validate');
    const { authSchemas } = require('../src/validation/schemas');
    const req = { body: { phone: {} }, params: {}, query: {} };
    const res = {};
    const next = jest.fn();

    validate(authSchemas.login)(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err.status).toBe(400);
    expect(Array.isArray(err.details)).toBe(true);
  });
});
