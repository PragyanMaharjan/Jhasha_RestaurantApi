const path = require('path');
const fs = require('fs');
const auditLogger = require('../../middleware/auditLogger');

describe('Audit logger middleware', () => {
  const logFile = path.join(process.cwd(), 'logs', 'audit.log');

  beforeEach(() => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
  });

  it('writes an audit entry for auth failures', () => {
    const req: any = { method: 'POST', path: '/api/auth/login', originalUrl: '/api/auth/login', user: { userId: 'u1', role: 'user' }, ip: '127.0.0.1' };
    const res: any = { statusCode: 401, on: jest.fn((event, handler) => handler()) };
    const next = jest.fn();

    auditLogger(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(fs.existsSync(logFile)).toBe(true);
  });
});
