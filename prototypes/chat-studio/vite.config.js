import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Chat Studio — standalone UX prototype. Plain Vue, no Quasar, no app code,
// no env keys, no API proxy: everything is mock data in ./src.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  envDir: false,
  plugins: [vue()],
  server: { port: 6230, host: true },
  build: { outDir: 'dist', emptyOutDir: true },
})
