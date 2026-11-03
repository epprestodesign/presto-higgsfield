import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

const r = (p) => fileURLToPath(new URL(p, import.meta.url))

// Chat Studio — UX prototype. The prototype itself (index.html) is plain Vue
// with mock data: no auth, database, generation or env keys. Its page mockups
// show the REAL Presto templates: preview.html is brand-studio's Preview Host
// (the same page the live Studio loads in its iframes), which needs Quasar and
// the Presto design system, hence the plugin and aliases below.
export default defineConfig({
  root: r('.'),
  base: './',
  envDir: false,
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({ sassVariables: r('../../src/css/quasar.variables.scss') }),
  ],
  resolve: { alias: { '@lib': r('../../src'), '@bs': r('../../brand-studio/src') } },
  server: { port: 6230, host: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 4000,
    rollupOptions: { input: { main: r('index.html'), preview: r('preview.html') } },
  },
})
