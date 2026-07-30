const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: 5000, path, method: options.method || 'GET', headers: options.headers || {} }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

(async () => {
  const checks = [
    ['GET', '/api/health'],
    ['GET', '/api/categories'],
    ['GET', '/api/products'],
    ['GET', '/api/auth/me'],
  ];

  for (const [method, path] of checks) {
    try {
      const result = await request(path, { method });
      console.log(path, result.status, result.body);
    } catch (error) {
      console.error(path, 'ERROR', error.message);
      process.exitCode = 1;
    }
  }
})();
