const fs = require('fs');
const path = require('path');

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const appendAuditLog = (entry: Record<string, unknown>) => {
  const line = `${new Date().toISOString()} ${JSON.stringify(entry)}\n`;
  fs.appendFileSync(path.join(logDir, 'audit.log'), line);
};

const auditMiddleware = (req: any, res: any, next: () => void) => {
  const start = Date.now();
  res.on('finish', () => {
    const shouldLog = req.method !== 'OPTIONS' && (res.statusCode >= 400 || req.path.includes('/auth') || req.path.includes('/admin') || req.path.includes('/orders'));
    if (!shouldLog) return;

    appendAuditLog({
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      userId: req.user?.userId || null,
      role: req.user?.role || null,
      ip: req.ip || 'unknown',
      durationMs: Date.now() - start,
    });
  });
  next();
};

module.exports = auditMiddleware;
export {};
