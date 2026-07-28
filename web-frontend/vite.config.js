import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/soundwave-musicstream-app/',
  build: {
    outDir: resolve(__dirname, '../docs'),
    emptyOutDir: true
  }
});
