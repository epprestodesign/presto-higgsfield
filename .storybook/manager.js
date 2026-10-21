import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming'

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Presto Brand Studio',
    colorPrimary: '#01113E',
    colorSecondary: '#7C3AED',
    fontBase: "'PT Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  }),
})
