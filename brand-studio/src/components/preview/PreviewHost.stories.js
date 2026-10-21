import PreviewHost from './PreviewHost.vue'

// The Studio editor loads THIS story in an <iframe> (preview/bridge.js
// PREVIEW_HOST_STORY_ID = 'brand-studio-branded-preview-preview-host--host') and
// streams the live project into it over postMessage. Opened directly it shows a
// sample project so it is still viewable.
export default {
  title: 'Brand Studio/Branded Preview/Preview Host',
  component: PreviewHost,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Iframe target for the Studio live preview. Embedded, it waits for `bs-preview:render` messages `{ project, page }` and reports clicks-through with `bs-preview:navigate`. An iframe gives the mobile preview a real 390px window, so Presto’s media queries and `$q.screen` behave exactly as on a phone.',
      },
    },
  },
  argTypes: {
    sample: { control: 'select', options: ['heartland', 'fintech', 'wedding', 'lakeshore'] },
    initialPage: { control: 'select', options: ['landing', 'browse', 'details', 'checkout', 'confirmation'] },
  },
}

export const Host = { args: { sample: 'heartland', initialPage: 'landing' } }
