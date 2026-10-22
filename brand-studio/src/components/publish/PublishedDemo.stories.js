import { expect, userEvent, within, fn } from 'storybook/test'
import PublishedDemoPage from './PublishedDemoPage.vue'
import DemoBanner from './DemoBanner.vue'
import BrandHero from '../brand/BrandHero.vue'
import { withProject } from '../../stories/_helpers.js'
import { useProjectStore } from '../../stores/project.js'
import { formatDateRange, locationLabel } from '../../models/event.js'

export default {
  title: 'Brand Studio/Publishing/Published Demo',
  component: PublishedDemoPage,
  decorators: [withProject({ sample: 'heartland', select: 3 })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Public shell for `demo.eventpipe.com/<slug>`. A sticky, non-dismissible **DemoBanner** states that rates and availability are illustrative and bookings are disabled; form submits and `[data-booking-action]` clicks inside the page are intercepted. By default the page renders the full branded booking site (`BrandedSite`); the default slot can override it, which the interaction story uses to prove booking actions are blocked.',
      },
    },
  },
  argTypes: { onCreate: { action: 'create' }, onBlocked: { action: 'blocked' } },
}

const pageStory = {
  render: (args) => ({
    components: { PublishedDemoPage, BrandHero },
    setup() {
      const project = useProjectStore()
      const p = project.project
      return {
        args,
        project,
        dates: formatDateRange(p.event.startDate, p.event.endDate),
        where: locationLabel(p.event),
        hotels: ['Courtyard by Marriott Downtown', 'Hyatt Place Convention Center', 'Hampton Inn Arena District'],
      }
    },
    template: `<published-demo-page :project="project.project" @create="args.onCreate" @blocked="args.onBlocked">
      <brand-hero
        :concept="project.selectedConcept"
        :brand-kit="project.project.brandKit"
        :headline="project.project.event.name"
        :tagline="project.project.pages.landing.hero.tagline"
        :dates="dates" :location="where"
      />
      <div style="max-width:1040px;margin:0 auto;padding:40px 24px 80px;display:grid;gap:16px;font-family:var(--bs-font)">
        <h2 class="bs-title">Official event hotels</h2>
        <div v-for="h in hotels" :key="h" style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border:1px solid var(--bs-line);border-radius:8px;background:#fff">
          <div><strong>{{ h }}</strong><p class="bs-caption">Overland Park, KS · Sample rate shown for demo</p></div>
          <q-btn unelevated no-caps color="primary" label="Choose your room" data-booking-action />
        </div>
      </div>
    </published-demo-page>`,
  }),
}

// The real thing: banner + the full branded booking site (BrandedSite).
export const BrandedSite = {
  name: 'Branded site',
  render: (args) => ({
    components: { PublishedDemoPage },
    setup: () => ({ args, project: useProjectStore() }),
    template: '<published-demo-page :project="project.project" @create="args.onCreate" @blocked="args.onBlocked" />',
  }),
}

export const BrandedSiteMobile = { ...BrandedSite, name: 'Branded site · Mobile', globals: { viewport: { value: 'mobile' } } }

export const Default = {
  ...pageStory,
  name: 'Booking actions blocked',
  args: { onBlocked: fn(), onCreate: fn() },
  play: async ({ canvasElement, args }) => {
    const ui = within(canvasElement)
    await expect(ui.getByRole('region', { name: 'Demo notice' })).toHaveTextContent('Bookings are disabled')
    // A booking action is intercepted.
    await userEvent.click(ui.getAllByRole('button', { name: 'Choose your room' })[0])
    await expect(args.onBlocked).toHaveBeenCalled()
  },
}

export const Mobile = { ...pageStory, globals: { viewport: { value: 'mobile' } } }

export const Banner = {
  name: 'Demo banner',
  render: () => ({
    components: { DemoBanner },
    template: '<div><demo-banner :sticky="false" /></div>',
  }),
}
