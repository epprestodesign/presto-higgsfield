import BannerLabApp from './BannerLabApp.vue'

export default {
  title: 'Brand Studio/Banner Lab',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Standalone prototype (`pnpm banner-lab`, port 6220). **Logo**: drop any logo, box it, get a transparent PNG, a traced SVG and the exact size for every Presto placement. **Background graphics**: drop reference images, describe the banner, optimize the prompt for Higgsfield, generate, then fit to 1440×400 and 1440×240 against the banner standard.',
      },
    },
  },
}

const lab = (args) => ({
  args,
  render: (a) => ({ components: { BannerLabApp }, setup: () => ({ a }), template: '<banner-lab-app v-bind="a" />' }),
})

/** Uses your local Higgsfield key when the dev server has one; sample mode otherwise. */
export const Logo = { ...lab({ initialMode: 'logo' }), name: 'Logo' }
export const BackgroundGraphics = { ...lab({ initialMode: 'background' }), name: 'Background graphics' }
export const BackgroundGraphicsSample = { ...lab({ initialMode: 'background', sampleMode: true }), name: 'Background graphics · Sample mode (no credits)' }
export const Mobile = { ...lab({ initialMode: 'logo', sampleMode: true }), name: 'Mobile', globals: { viewport: { value: 'mobile' } } }
