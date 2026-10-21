import MarketingHero from './MarketingHero.vue'

export default {
  title: 'Brand Studio/Marketing Site/Sections/Hero',
  component: MarketingHero,
  parameters: { layout: 'fullscreen' },
  decorators: [() => ({ template: '<div style="display:flow-root;background:var(--bs-canvas);padding-bottom:48px"><story /></div>' })],
}

export const Default = {}
export const Mobile = { globals: { viewport: { value: 'mobile' } } }
