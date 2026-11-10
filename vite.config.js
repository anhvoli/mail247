import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import url from 'url';
import reportsHandler from './api/reports.js';
import tasksHandler from './api/tasks.js';

function createApiMiddleware(handler) {
  return async (req, res, next) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      req.query = parsedUrl.query;

      // Đọc body nếu là POST / PUT / PATCH
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
}

function apiPlugin() {
  const reportsMiddleware = createApiMiddleware(reportsHandler);
  const tasksMiddleware = createApiMiddleware(tasksHandler);

  return {
    name: 'vite-api-server',
    configureServer(server) {
      server.middlewares.use('/api/tasks', tasksMiddleware);
      server.middlewares.use('/api/reports', reportsMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/tasks', tasksMiddleware);
      server.middlewares.use('/api/reports', reportsMiddleware);
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
