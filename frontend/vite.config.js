import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El navegador llama a /api/... y Vite lo reenvía a FastAPI (uvicorn en el puerto 8000).
// Así no hay problemas de CORS mientras desarrollan.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Si en FastAPI las rutas NO empiezan con /api, descomenta esta línea:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
