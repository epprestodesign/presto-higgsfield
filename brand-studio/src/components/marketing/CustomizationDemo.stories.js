import CustomizationDemo from './CustomizationDemo.vue'

export default {
  title: 'Brand Studio/Marketing Site/Sections/Customization',
  component: CustomizationDemo,
  parameters: { layout: 'fullscreen' },
  decorators: [() => ({ template: '<div style="display:flow-root;background:var(--bs-canvas);padding-bottom:48px"><story /></div>' })],
}

export const Default = {}
export const Mobile = { globals: { viewport: { value: 'mobile' } } }
