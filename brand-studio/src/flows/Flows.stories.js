import FlowApp from './FlowApp.vue'
import { withProject } from '../stories/_helpers.js'

export default {
  title: 'Brand Studio/Flows',
  component: FlowApp,
  decorators: [withProject({ sample: null, latencyMs: 1600 })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The whole journey, end to end, built from the real screens: marketing site → event intake → studio editor (brand kit and concepts are its Brand and Concept panels) → publishing → published demo, plus the dashboard. **Tap-to-fill** (bottom-right) fills any empty field with sample data, so no typing is needed. **Skip** jumps from intake to the studio using the sample event. The same component powers the standalone mobile prototype.',
      },
    },
  },
}

export const EndToEnd = { name: 'End-to-End' }

export const EndToEndMobile = { name: 'End-to-End · Mobile', globals: { viewport: { value: 'mobile' } } }

export const StartInEditor = {
  name: 'Start in the editor (sample)',
  decorators: [withProject({ sample: 'heartland', select: 2 })],
  args: { initialStep: 'studio' },
}
