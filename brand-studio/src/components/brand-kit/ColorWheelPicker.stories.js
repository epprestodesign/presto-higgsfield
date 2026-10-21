import { expect, userEvent, within, waitFor } from 'storybook/test'
import ColorWheelPicker from './ColorWheelPicker.vue'
import { withProject } from '../../stories/_helpers.js'
import { useProjectStore } from '../../stores/project.js'
import { hexToHsv, HARMONIES } from './colorWheel.js'

const sidebar = (width = 300) => () => ({
  template: `<div style="width:${width}px;max-width:100%;padding:16px;background:#fff;border-right:1px solid #E2E8F0;min-height:100vh;box-sizing:border-box"><story /></div>`,
})

export default {
  title: 'Brand Studio/Studio Editor/Panels/Color Wheel',
  component: ColorWheelPicker,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A calm take on Adobe Color’s wheel for the Brand Kit. Drag **Primary** (the ringed base), **Secondary** and **Accent** around the hue/saturation wheel. Pick a harmony (Analogous, Monochrome, Complementary, Split, Triad, Square) and the others follow the base. A brightness slider adjusts the selected swatch, and hex entry and copy are built in. Live WCAG checks come with a one-click *Make it accessible* fix. Every change writes to the project store, so the Studio preview re-themes as you drag. Keyboard: Tab to a handle, then ←/→ for hue and ↑/↓ for saturation, with Shift for bigger steps.',
      },
    },
  },
  decorators: [sidebar(), withProject({ select: 2 })],
}

export const Default = {}

const ruleHue = (hex) => hexToHsv(hex).h
const hueGap = (a, b) => Math.round(((ruleHue(b) - ruleHue(a)) + 360) % 360)

/** Triad: moving the base with the keyboard rotates Secondary/Accent with it. */
export const Triad = {
  args: { initialRule: 'custom' },
  play: async ({ canvasElement }) => {
    const ui = within(canvasElement)
    const store = useProjectStore()
    await userEvent.click(ui.getByRole('radio', { name: 'Triad harmony' }))
    await waitFor(() => expect(hueGap(store.brandKit.colors.primary, store.brandKit.colors.secondary)).toBeGreaterThan(110))
    const before = { ...store.brandKit.colors }
    const handle = ui.getByRole('slider', { name: 'Primary color' })
    handle.focus()
    await userEvent.keyboard('{Shift>}{ArrowRight}{ArrowRight}{ArrowRight}{/Shift}')
    await waitFor(() => expect(store.brandKit.colors.primary).not.toBe(before.primary))
    await expect(store.brandKit.colors.secondary).not.toBe(before.secondary)
    await expect(store.brandKit.colors.accent).not.toBe(before.accent)
    const gap = hueGap(store.brandKit.colors.primary, store.brandKit.colors.secondary)
    await expect(gap).toBeGreaterThan(110)
    await expect(gap).toBeLessThan(130)
  },
}

const harmony = (id) => ({ name: HARMONIES.find((r) => r.id === id).label, args: { initialRule: id, applyOnMount: true } })
export const Analogous = harmony('analogous')
export const Monochromatic = harmony('monochromatic')
export const Complementary = harmony('complementary')
export const Split = harmony('split')
export const Square = harmony('square')

export const NarrowSidebar = { name: 'Narrow sidebar (320px)', decorators: [sidebar(320)] }

export const LowContrast = {
  name: 'Fails AA → Make it accessible',
  decorators: [withProject({ select: 2, mutate: (p) => p.setColor('primary', '#787878') })],
  play: async ({ canvasElement }) => {
    const ui = within(canvasElement)
    const store = useProjectStore()
    await userEvent.click(await ui.findByRole('button', { name: /make it accessible/i }))
    await waitFor(() => expect(ui.queryByRole('button', { name: /make it accessible/i })).toBeNull())
    await expect(store.brandKit.colors.primary).not.toBe('#787878')
  },
}

export const Mobile = { decorators: [sidebar(390)], globals: { viewport: { value: 'mobile' } } }
