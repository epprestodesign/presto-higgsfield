import { ref } from 'vue'
import { expect, userEvent, within } from 'storybook/test'
import DirectionPicker from './DirectionPicker.vue'

export default {
  title: 'Brand Studio/Creative Concepts/Directions',
  component: DirectionPicker,
  parameters: {
    docs: {
      description: {
        component:
          'Choose which creative directions to explore — **Brand Signature** (clean, on-brand), **Event Energy** (bold, promotional) and **Premium Experience** (soft, photographic). Card art comes from the approved Higgsfield theme pass (see Direction Themes). Checkbox semantics; at least one stays selected. The Brand Kit’s current direction is badged *Suggested*.',
      },
    },
  },
  render: (args) => ({
    components: { DirectionPicker },
    setup() {
      const value = ref(args.modelValue)
      return { args, value }
    },
    template: `<div style="max-width:1100px;padding:24px;background:var(--bs-canvas)">
      <direction-picker v-bind="args" v-model="value" />
      <p class="bs-caption" style="margin-top:12px">Selected: {{ value.join(', ') }}</p>
    </div>`,
  }),
  args: { modelValue: ['signature', 'energy', 'premium'], suggested: 'energy', disabled: false },
}

export const AllSelected = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const premium = canvas.getByRole('checkbox', { name: /premium experience/i })
    await userEvent.click(premium)
    await expect(premium).toHaveAttribute('aria-checked', 'false')
    await userEvent.click(premium)
    await expect(premium).toHaveAttribute('aria-checked', 'true')
  },
}

export const OneSelected = { args: { modelValue: ['premium'], suggested: 'premium' } }

export const Disabled = { name: 'Disabled (while generating)', args: { disabled: true } }

export const Mobile = { globals: { viewport: { value: 'mobile' } } }
