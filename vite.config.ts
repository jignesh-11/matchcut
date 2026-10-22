import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function apiDevPlugin() {
  return {
    name: 'api-dev-server',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/api/generate')) {
          try {
            // Read request body if not already parsed
            if (!req.body) {
              const chunks: Buffer[] = [];
              for await (const chunk of req) {
                chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
              }
              const rawStr = Buffer.concat(chunks).toString('utf-8');
              try {
                req.body = JSON.parse(rawStr);
              } catch {
                req.body = rawStr;
              }
            }

            const module = await server.ssrLoadModule('./api/generate.ts');
            await module.default(req, res);
          } catch (err: any) {
            console.error('Local API dev error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message || 'Local API handler failure' }));
          }
          return;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
    headers: {
      // Cross-origin isolation headers if needed for SharedArrayBuffer / high-perf timers
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  // @ts-expect-error Vitest config is handled seamlessly
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
