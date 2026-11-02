import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { higgsfieldDevProxy } from '../dev/higgsfieldDevProxy.js'

const r = (p) => fileURLToPath(new URL(p, import.meta.url))

// Presto Banner Lab — standalone prototype (logo optimizer + background
// graphics). Same Quasar/Presto setup and Higgsfield dev proxy as the Brand
// Studio prototype; relative base so it runs from /presto-higgsfield/banner-lab/.
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
  server: { port: 6220, host: true },
  build: { outDir: r('./dist'), emptyOutDir: true, chunkSizeWarningLimit: 4000 },
})
