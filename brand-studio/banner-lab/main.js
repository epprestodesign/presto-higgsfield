// Presto Banner Lab — standalone prototype entry. Same Quasar + Presto setup
// as the Brand Studio prototype (brand-studio/app/main.js). One bundle, three
// modes:
//   ./                → Banner Lab (the logo and background steppers);
//                       the Studio when built with VITE_DEFAULT_ROUTE=studio (Vercel)
//   ./#/studio        → Banner Lab Studio, starting at the log-in
//   ./?bsPreview=1    → the preview host the Studio's page mockups load in an iframe
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify, Dialog } from 'quasar'
import * as QComponents from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import '@lib/css/app.scss'
import '@bs/styles/studio.scss'
import { configurePreviewHost } from '@bs/preview/bridge.js'
import BannerLabApp from '@bs/components/banner-lab/BannerLabApp.vue'
import LabStudioApp from '@bs/components/lab-studio/LabStudioApp.vue'
import PreviewHost from '@bs/components/preview/PreviewHost.vue'

const isPreview = new URLSearchParams(window.location.search).get('bsPreview') === '1'
// A build can open somewhere other than Banner Lab when there's no hash: the
// Vercel deploy sets VITE_DEFAULT_ROUTE=studio (GitHub Pages leaves it unset).
if (!isPreview && !window.location.hash && import.meta.env.VITE_DEFAULT_ROUTE === 'studio') {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/studio`)
}
const isStudio = !isPreview && window.location.hash.startsWith('#/studio')

// The Studio's phone and hotel-details mockups are this same app in preview mode.
configurePreviewHost(`${window.location.pathname}?bsPreview=1&bsEmbed=1`)

const app = isPreview ? createApp(PreviewHost)
  : isStudio ? createApp(LabStudioApp, { requireAuth: true, liveGeneration: true })
    : createApp(BannerLabApp, { syncHash: true })
if (isStudio) document.title = 'Banner Lab Studio · Prototype'
// Moving between Banner Lab and the Studio swaps the whole app.
window.addEventListener('hashchange', () => {
  if (!isPreview && window.location.hash.startsWith('#/studio') !== isStudio) window.location.reload()
})

app.use(createPinia())
app.use(Quasar, { plugins: { Notify, Dialog } })
for (const [name, component] of Object.entries(QComponents)) {
  if (/^Q[A-Z]/.test(name) && component && (component.render || component.setup || component.__name || component.name)) {
    app.component(name, component)
  }
}
app.mount('#app')
