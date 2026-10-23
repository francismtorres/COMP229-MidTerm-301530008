import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: jest.fn(),
    sign: jest.fn(),
  },
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

// Mocks are intentionally typed loose — jest mocks don't play well with
// strict return types inferred from `jest.fn()` with no generics.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jwt = (await import('jsonwebtoken')).default as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const User = (await import('../models/User.js')).default as any;
const requireAuth = (await import('../middleware/auth.js')).default;

function buildRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res) as unknown as Response['status'];
  res.json = jest.fn().mockReturnValue(res) as unknown as Response['json'];
  return res;
}

describe('requireAuth middleware', () => {
  const ORIGINAL_SECRET = process.env.JWT_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = ORIGINAL_SECRET;
  });

  test('rejects a request with no Authorization header', async () => {
    const req = { headers: {} } as Request;
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing or malformed Authorization header',
    });
    expect(next).not.toHaveBeenCalled();
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  test('rejects a non-Bearer scheme', async () => {
    const req = { headers: { authorization: 'Basic abc.def.ghi' } } as Request;
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing or malformed Authorization header',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a request with a Bearer scheme but no token', async () => {
    const req = { headers: { authorization: 'Bearer ' } } as Request;
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when the referenced user no longer exists', async () => {
    jwt.verify.mockReturnValue({ sub: 'user-id-123' });
    User.findById.mockResolvedValue(null);

    const req = { headers: { authorization: 'Bearer good.token.here' } } as Request;
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await requireAuth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('good.token.here', 'test-secret');
    expect(User.findById).toHaveBeenCalledWith('user-id-123');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'User no longer exists' });
    expect(next).not.toHaveBeenCalled();
  });

  test('attaches the user and calls next on a valid token', async () => {
    const fakeUser = { _id: 'user-id-123', email: 'a@b.co' };
    jwt.verify.mockReturnValue({ sub: 'user-id-123' });
    User.findById.mockResolvedValue(fakeUser);

    const req = { headers: { authorization: 'Bearer good.token.here' } } as Request;
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await requireAuth(req, res, next);

    expect(req.user).toBe(fakeUser);
    expect(req.userId).toBe(fakeUser._id);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 401 "Token expired" on TokenExpiredError', async () => {
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => {
      throw err;
    });

    const req = { headers: { authorization: 'Bearer expired.token' } } as Request;
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 "Invalid token" on JsonWebTokenError', async () => {
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';
    jwt.verify.mockImplementation(() => {
      throw err;
    });

    const req = { headers: { authorization: 'Bearer bad.token' } } as Request;
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('forwards unexpected errors to next()', async () => {
    const boom = new Error('db offline');
    jwt.verify.mockReturnValue({ sub: 'user-id-123' });
    User.findById.mockRejectedValue(boom);

    const req = { headers: { authorization: 'Bearer good.token' } } as Request;
    const res = buildRes();
    const next = jest.fn() as unknown as NextFunction;

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(boom);
    expect(res.status).not.toHaveBeenCalled();
  });
});
