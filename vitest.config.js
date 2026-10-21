import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Unit tests for Brand Studio's framework-agnostic logic (models, theme engine,
// AI provider, stores). UI flows are covered by Storybook play functions.
export default defineConfig({
  resolve: {
    alias: {
      '@lib': fileURLToPath(new URL('./src', import.meta.url)),
      '@bs': fileURLToPath(new URL('./brand-studio/src', import.meta.url)),
    },
  },
  test: {
    include: ['brand-studio/**/*.test.js'],
    environment: 'node',
  },
})
