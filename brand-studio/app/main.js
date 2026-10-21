// Presto Brand Studio — standalone prototype app.
//
// One bundle, two modes:
//   ./               → the end-to-end journey (FlowApp), hash-routed
//   ./?bsPreview=1   → the Preview Host the Studio editor loads in its iframe
// Same Quasar + Presto setup as .storybook/preview.js.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify, Dialog, Loading } from 'quasar'
import * as QComponents from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import '@lib/css/app.scss'
import '@bs/styles/studio.scss'
import { configurePreviewHost } from '@bs/preview/bridge.js'
import FlowApp from '@bs/flows/FlowApp.vue'
import PreviewHost from '@bs/components/preview/PreviewHost.vue'

const params = new URLSearchParams(window.location.search)
const isPreview = params.get('bsPreview') === '1'

// The editor's live preview is this same app in preview mode.
configurePreviewHost(`${window.location.pathname}?bsPreview=1&bsEmbed=1`)

const app = createApp(isPreview ? PreviewHost : FlowApp, isPreview ? {} : { syncHash: true })
app.use(createPinia())
app.use(Quasar, { plugins: { Notify, Dialog, Loading } })
for (const [name, component] of Object.entries(QComponents)) {
  if (/^Q[A-Z]/.test(name) && component && (component.render || component.setup || component.__name || component.name)) {
    app.component(name, component)
  }
}
app.mount('#app')
