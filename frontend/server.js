const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT) || 80;
const buildDir = path.join(__dirname, 'build');
const backendHost = process.env.BACKEND_HOST || 'backend';
const backendPort = Number(process.env.BACKEND_PORT) || 5000;

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function sendFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.end(data);
  });
}

function proxyApiRequest(req, res) {
  const clientIp = req.socket.remoteAddress || '';
  const headers = {
    ...req.headers,
    host: `${backendHost}:${backendPort}`,
    'x-forwarded-for': req.headers['x-forwarded-for']
      ? `${req.headers['x-forwarded-for']}, ${clientIp}`
      : clientIp,
    'x-forwarded-proto': 'http'
  };

  const proxyReq = http.request(
    {
      hostname: backendHost,
      port: backendPort,
      path: req.url,
      method: req.method,
      headers
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify({ message: 'Bad gateway: backend unavailable' }));
  });

  req.pipe(proxyReq, { end: true });
}

const server = http.createServer((req, res) => {
  if (req.url === '/api' || req.url.startsWith('/api/')) {
    proxyApiRequest(req, res);
    return;
  }

  const requestPath = decodeURIComponent(req.url.split('?')[0]);
  const safePath = path.normalize(requestPath).replace(/^([.][.][\\/])+/, '');
  const filePath = path.join(buildDir, safePath === '/' ? 'index.html' : safePath);

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      sendFile(filePath, res);
      return;
    }

    sendFile(path.join(buildDir, 'index.html'), res);
  });
});

server.listen(port, () => {
  console.log(`Frontend server is running on port ${port}`);
});
