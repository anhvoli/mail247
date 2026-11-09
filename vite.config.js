import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import url from 'url';
import handler from './api/reports.js';

function apiPlugin() {
  const handleApi = async (req, res, next) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      req.query = parsedUrl.query;

      // Đọc body nếu là POST / PUT
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        let bodyStr = '';
        req.on('data', chunk => { bodyStr += chunk; });
        req.on('end', async () => {
          try {
            req.body = bodyStr ? JSON.parse(bodyStr) : {};
          } catch {
            req.body = bodyStr;
          }

          // Mock Express/Vercel res.status().json()
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };

          await handler(req, res);
        });
      } else {
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };
        await handler(req, res);
      }
    } catch (err) {
      console.error('[Vite Dev API Middleware Error]:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
  };

  return {
    name: 'vite-api-server',
    configureServer(server) {
      server.middlewares.use('/api/reports', handleApi);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/reports', handleApi);
    }
  };
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
