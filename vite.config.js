import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
  build: {
    rollupOptions: {
      output: {
        // N-01: tách three + @react-three/* (nặng nhất trong bundle 1,33MB)
        // ra chunk vendor riêng — AdminPanel + Sanh3D đã lazy() ở App.jsx
        // nên chunk này chỉ nạp khi vào phòng 3D. Ảnh cheer KHÔNG đưa ra
        // public/ (snapshot-push không đẩy được file nhị phân) nên base64
        // trong cheerImages.js vẫn ở trong bundle chính.
        manualChunks: (id) => {
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) return 'three-vendor';
          return undefined;
        },
      },
    },
  },
});
