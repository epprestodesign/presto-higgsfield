import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { higgsfieldDevProxy } from '../dev/higgsfieldDevProxy.js'

const r = (p) => fileURLToPath(new URL(p, import.meta.url))

// Standalone Brand Studio prototype. `base` is relative so the build runs from
// any sub-path (GitHub Pages: /presto-higgsfield/prototype/).
export default defineConfig({
  root: r('.'),
  base: './',
  envDir: r('../..'),
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({ sassVariables: r('../../src/css/quasar.variables.scss') }),
    higgsfieldDevProxy({ root: r('../..') }),
  ],
  resolve: { alias: { '@lib': r('../../src'), '@bs': r('../src') } },
  server: { port: 6210, host: true },
  build: {
    outDir: r('./dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 4000,
    // index.html = the app (desktop + phone); phone.html = the app inside a phone frame.
    rollupOptions: { input: { main: r('./index.html'), phone: r('./phone.html') } },
  },
})
