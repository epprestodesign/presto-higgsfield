<script setup>
// PublishedDemoPage — the public shell for demo.eventpipe.com/<slug>.
// DemoBanner on top, then the branded booking site (BrandedSite, unless the
// default slot overrides it). Any form submit
// or element marked [data-booking-action] inside the page is intercepted, so
// a demo can never start a reservation or payment.
import { useQuasar } from 'quasar'
import DemoBanner from './DemoBanner.vue'
import BrandedSite from '../preview/BrandedSite.vue'

const props = defineProps({
  project: { type: Object, default: null },
  createHref: { type: String, default: '' },
})
const emit = defineEmits(['create', 'blocked'])
const $q = useQuasar()

function block(e) {
  const target = e.type === 'submit' ? e.target : e.target.closest?.('[data-booking-action]')
  if (!target) return
  e.preventDefault()
  e.stopPropagation()
  emit('blocked', target)
  $q.notify({
    message: 'Booking is turned off in this demo',
    caption: 'Rates and availability shown are illustrative.',
    icon: 'info',
    color: 'dark',
    position: 'bottom',
    timeout: 2600,
  })
}
</script>

<template>
  <div class="pdp" @submit.capture="block" @click.capture="block">
    <demo-banner :cta-href="createHref" @create="emit('create')" />
    <div class="pdp__site">
      <slot :project="project">
        <!-- The banner already carries the demo disclaimer. -->
        <branded-site v-if="project" :project="project" interactive-ads :show-demo-notice="false" />
      </slot>
    </div>
  </div>
</template>

<style scoped>
.pdp { min-height: 100vh; background: var(--ds-color-surface, #fff); }
.pdp__site { position: relative; }
</style>
