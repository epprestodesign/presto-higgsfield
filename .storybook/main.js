import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'
import { quasar } from '@quasar/vite-plugin'
import { higgsfieldDevProxy } from '../brand-studio/dev/higgsfieldDevProxy.js'

const quasarVariables = fileURLToPath(
  new URL('../src/css/quasar.variables.scss', import.meta.url)
)
const lib = fileURLToPath(new URL('../src', import.meta.url))
const brandStudio = fileURLToPath(new URL('../brand-studio/src', import.meta.url))
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

/** @type { import('@storybook/vue3-vite').StorybookConfig } */
const config = {
  stories: [
    '../brand-studio/src/**/*.mdx',
    '../brand-studio/src/**/*.stories.@(js|jsx|ts|tsx)',
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: ['@storybook/addon-themes', '@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  docs: {},
  async viteFinal(baseConfig) {
    // Note: @storybook/vue3-vite already provides the @vitejs/plugin-vue
    // ('vite:vue') plugin. We must NOT add a second one — a duplicate Vue
    // plugin breaks .vue SFC compilation. Quasar's plugin auto-detects the
    // existing Vue plugin and slots in after it.
    return mergeConfig(baseConfig, {
      // higgsfieldDevProxy: local-only /hf-api → api.higgsfield.ai with the key from .env.
      plugins: [quasar({ sassVariables: quasarVariables }), higgsfieldDevProxy({ root: repoRoot })],
      // @lib → the Presto design system (src/), @bs → Brand Studio.
      resolve: { alias: { '@lib': lib, '@bs': brandStudio } },
    })
  },
}

export default config
