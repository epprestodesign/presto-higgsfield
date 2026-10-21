<script setup>
// BrandThemeProvider — scopes a Brand Kit's colors + fonts to its subtree by
// setting the Presto semantic tokens as inline CSS custom properties. Wrap any
// Presto page (LandingPage, HotelListPage, HotelDetailPage …) in it to preview
// that page in the customer's branding without modifying the component.
import { computed, provide } from 'vue'
import { brandThemeVars } from './brandTheme.js'

const props = defineProps({
  brandKit: { type: Object, default: () => ({}) },
  tag: { type: String, default: 'div' },
  // Event dates (ISO yyyy-mm-dd). Presto's BookingWidget opens on these.
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
})

const slash = (iso) => (iso ? iso.replace(/-/g, '/') : '')
if (props.startDate) provide('presto:defaultDateRange', { from: slash(props.startDate), to: slash(props.endDate || props.startDate) })

const vars = computed(() => brandThemeVars(props.brandKit))
</script>

<template>
  <component :is="tag" class="brand-theme" :style="vars">
    <slot />
  </component>
</template>

<style scoped>
.brand-theme { font-family: var(--brand-font-body); }
/* Presto headings read --ds-font-family (typography.scss); make plain heading
   tags inside the preview follow the brand heading face too. */
.brand-theme :deep(h1),
.brand-theme :deep(h2),
.brand-theme :deep(h3) { font-family: var(--brand-font-heading); }
</style>
