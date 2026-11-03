// The Presto Preview Host (brand-studio/src/components/preview/PreviewHost.vue),
// served by the prototype so its mockups are the real Presto templates. The
// prototype's frames post a Presto project + page to it over the preview
// bridge (brand-studio/src/preview/bridge.js). Same Quasar + Presto setup as
// brand-studio/app/main.js.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify, Dialog, Loading } from 'quasar'
import * as QComponents from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import '@lib/css/app.scss'
import '@bs/styles/studio.scss'
import PreviewHost from '@bs/components/preview/PreviewHost.vue'

const app = createApp(PreviewHost)
app.use(createPinia())
app.use(Quasar, { plugins: { Notify, Dialog, Loading } })
for (const [name, component] of Object.entries(QComponents)) {
  if (/^Q[A-Z]/.test(name) && component && (component.render || component.setup || component.__name || component.name)) {
    app.component(name, component)
  }
}
app.mount('#app')
