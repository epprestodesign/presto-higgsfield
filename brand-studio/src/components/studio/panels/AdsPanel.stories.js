import AdsPanel from './AdsPanel.vue'
import { withProject } from '../../../stories/_helpers.js'

const sidebar = () => ({
  template: '<div style="width:300px;height:100vh;overflow:auto;background:#fff;border-right:1px solid #E2E8F0"><story /></div>',
})

export default {
  title: 'Brand Studio/Studio Editor/Panels/Ads',
  component: AdsPanel,
  parameters: { layout: 'fullscreen' },
  decorators: [sidebar, withProject({ select: 2 })],
}

export const Default = {}

export const NoSponsors = {
  name: 'No sponsors',
  decorators: [withProject({ sample: 'wedding' })],
}
