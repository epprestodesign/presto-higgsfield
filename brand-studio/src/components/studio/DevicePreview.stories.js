import DevicePreview from './DevicePreview.vue'
import { withProject } from '../../stories/_helpers.js'

export default {
  title: 'Brand Studio/Studio Editor/Device Preview',
  component: DevicePreview,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Live preview canvas. Loads the Preview Host (`preview/bridge.js`) in an iframe at a real device width so Presto’s responsive layouts behave exactly as on a device, then scales it to fit. Streams the project on every change and follows in-preview navigation. Shows a skeleton while connecting and a reload state if the host never answers.',
      },
    },
  },
  argTypes: {
    page: { control: 'inline-radio', options: ['landing', 'browse', 'details'] },
    device: { control: 'inline-radio', options: ['desktop', 'tablet', 'mobile'] },
  },
  decorators: [
    withProject({ select: 2 }),
    () => ({ template: '<div style="height:100vh;background:#F6F7FA"><story /></div>' }),
  ],
  render: (args, { updateArgs }) => ({
    components: { DevicePreview },
    setup: () => ({ args, updateArgs }),
    template: '<device-preview v-bind="args" @update:page="(p) => updateArgs({ page: p })" />',
  }),
}

export const Desktop = { args: { page: 'landing', device: 'desktop' } }
export const Tablet = { args: { page: 'browse', device: 'tablet' } }
export const Mobile = { args: { page: 'landing', device: 'mobile' } }

export const HostUnavailable = {
  name: 'Host unavailable (reload state)',
  args: { device: 'desktop', src: 'about:blank', connectTimeoutMs: 1200 },
}
