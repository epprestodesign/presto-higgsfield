import ProductPreview from './ProductPreview.vue'

export default {
  title: 'Brand Studio/Marketing Site/Sections/Product Preview',
  component: ProductPreview,
  parameters: {
    docs: { description: { component: 'A realistic branded Presto booking page for a sample event — real GlobalNav, BookingWidget and HotelCardGroup components themed by BrandThemeProvider, fronted by BrandHero. Used throughout the marketing site.' } },
  },
  argTypes: {
    sample: { control: 'inline-radio', options: ['heartland', 'fintech', 'wedding', 'lakeshore'] },
    variant: { control: 'inline-radio', options: ['desktop', 'mobile'] },
  },
  decorators: [() => ({ template: '<div style="padding:32px;background:#F6F7FA"><story /></div>' })],
}

export const Desktop = { args: { sample: 'heartland', variant: 'desktop' } }
export const Mobile = {
  args: { sample: 'wedding', variant: 'mobile', designHeight: 780 },
  decorators: [() => ({ template: '<div style="max-width:320px;margin:0 auto"><story /></div>' })],
}
