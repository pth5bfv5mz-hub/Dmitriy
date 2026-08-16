import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // base: './' — так сборка работает и на Vercel/Netlify в корне, и из подпапки.
  base: './',
});
