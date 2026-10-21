<script setup>
// AdCreative — one sponsor display unit at an IAB size (models/ads.js AD_SIZES).
// Renders the sponsor's uploaded artwork for that size when present, otherwise
// an HTML creative (logo · name · tagline · CTA in the sponsor's colors) laid out
// for the unit's aspect: skyscraper, rectangle, billboard, leaderboard or mobile
// banner. With no sponsor it falls back to the Presto DisplayAd placeholder.
// Visual simulation only — no ad server, no tracking. Always labelled "Sponsored".
import { computed } from 'vue'
import DisplayAd from '@lib/components/DisplayAd.vue'
import { AD_SIZES } from '../../models/ads.js'

const props = defineProps({
  sponsor: { type: Object, default: null },
  size: { type: String, default: '300x250' },
  // true → the unit is a real link to sponsor.url (new tab). Previews pass false
  // so a click inside the Studio never leaves the page.
  interactive: { type: Boolean, default: true },
  label: { type: String, default: 'Sponsored' },
  // Scale down to the container when it is narrower than the unit.
  fluid: { type: Boolean, default: true },
})

const dims = computed(() => AD_SIZES[props.size] || AD_SIZES['300x250'])
const ratio = computed(() => dims.value.width / dims.value.height)
// Layout family by aspect ratio.
const shape = computed(() => {
  const r = ratio.value
  if (r <= 0.5) return 'tower' // 160x600, 120x600
  if (r < 1.6) return 'box' // 300x250
  if (r < 5) return dims.value.height <= 100 ? 'strip' : 'billboard' // 970x250 / 320x100
  return 'strip' // 970x90, 728x90, 320x50
})
const tiny = computed(() => dims.value.height <= 60)

const artwork = computed(() => props.sponsor?.artwork?.[props.size] || null)
const colors = computed(() => ({
  background: '#0F172A',
  foreground: '#FFFFFF',
  accent: '#F59E0B',
  ...(props.sponsor?.colors || {}),
}))
const safeUrl = computed(() => {
  const u = props.sponsor?.url || ''
  return /^https:\/\//i.test(u) ? u : ''
})
const name = computed(() => props.sponsor?.name || 'Sponsor')
const cta = computed(() => props.sponsor?.cta || 'Learn more')
const accessibleName = computed(() =>
  `Sponsored: ${name.value}${props.sponsor?.tagline ? ` — ${props.sponsor.tagline}` : ''}. ${cta.value}${props.interactive && safeUrl.value ? ' (opens in a new tab)' : ''}`,
)
const linkTag = computed(() => (props.interactive && safeUrl.value ? 'a' : 'div'))
const linkAttrs = computed(() =>
  linkTag.value === 'a'
    ? { href: safeUrl.value, target: '_blank', rel: 'sponsored noopener noreferrer', 'aria-label': accessibleName.value }
    : { role: 'img', 'aria-label': accessibleName.value },
)

const style = computed(() => ({
  width: `${dims.value.width}px`,
  maxWidth: props.fluid ? '100%' : undefined,
  aspectRatio: `${dims.value.width} / ${dims.value.height}`,
  '--ad-bg': colors.value.background,
  '--ad-fg': colors.value.foreground,
  '--ad-accent': colors.value.accent,
}))
</script>

<template>
  <!-- Empty slot → Presto's DisplayAd placeholder (dimension-labelled box). -->
  <display-ad
    v-if="!sponsor"
    class="adc-placeholder"
    :width="dims.width"
    :height="dims.height"
    :label="`${dims.width}×${dims.height}`"
  />

  <component
    :is="linkTag"
    v-else
    v-bind="linkAttrs"
    class="adc"
    :class="[`adc--${shape}`, { 'adc--tiny': tiny, 'adc--art': artwork }]"
    :style="style"
    :data-size="size"
  >
    <img v-if="artwork" :src="artwork.src" :alt="artwork.alt || ''" class="adc__art" />

    <template v-else>
      <span class="adc__deco" aria-hidden="true" />
      <img v-if="sponsor.logo?.src" :src="sponsor.logo.src" alt="" class="adc__logo" />
      <span class="adc__copy" aria-hidden="true">
        <span class="adc__name">{{ name }}</span>
        <span v-if="sponsor.tagline && !tiny" class="adc__tagline">{{ sponsor.tagline }}</span>
      </span>
      <span class="adc__cta" aria-hidden="true">
        <template v-if="!tiny">{{ cta }}</template>
        <span v-else class="adc__chev">›</span>
      </span>
    </template>

    <span class="adc__label">{{ label }}</span>
  </component>
</template>

<style scoped>
.adc {
  container-type: inline-size;
  position: relative;
  box-sizing: border-box;
  display: flex;
  overflow: hidden;
  border-radius: 4px;
  background: var(--ad-bg);
  color: var(--ad-fg);
  text-decoration: none;
  font-family: 'PT Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  isolation: isolate;
  flex: none;
}
a.adc { cursor: pointer; }
a.adc:focus-visible { outline: 3px solid var(--ds-color-border-focused, #01113E); outline-offset: 2px; }
a.adc:hover .adc__cta { filter: brightness(1.08); }

.adc__art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }

/* Decorative accent shape — a diagonal band in the sponsor's accent color. */
.adc__deco { position: absolute; z-index: -1; background: var(--ad-accent); opacity: 0.22; }

.adc__logo { display: block; flex: none; object-fit: contain; }
.adc__copy { display: flex; flex-direction: column; min-width: 0; gap: 4px; }
.adc__name { font-weight: 700; line-height: 1.1; letter-spacing: -0.01em; }
.adc__tagline { line-height: 1.3; opacity: 0.9; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }
.adc__cta {
  flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 4px;
  background: var(--ad-accent);
  color: var(--ad-bg);
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}
.adc__chev { font-size: 1.25em; line-height: 1; }

/* "Sponsored" — always visible, top-right, on a translucent chip for contrast. */
.adc__label {
  position: absolute; top: 4px; right: 4px; z-index: 2;
  padding: 2px 6px; border-radius: 3px;
  background: rgb(0 0 0 / 0.55); color: #fff;
  font: 700 9px/1.2 'PT Sans', sans-serif; letter-spacing: 0.06em; text-transform: uppercase;
  pointer-events: none;
}

/* ── tower: 160×600 / 120×600 ─────────────────────────────────────────── */
.adc--tower { flex-direction: column; align-items: center; text-align: center; padding: 30px 10px 14px; gap: 14px; }
.adc--tower .adc__deco { left: -40%; right: -40%; top: 58%; height: 22%; transform: rotate(-18deg); }
.adc--tower .adc__logo { width: 72%; max-height: 120px; margin-top: 8px; }
.adc--tower .adc__copy { align-items: center; flex: 1; justify-content: flex-start; gap: 10px; }
.adc--tower .adc__name { font-size: clamp(16px, 13cqi, 22px); }
.adc--tower .adc__tagline { font-size: clamp(12px, 9cqi, 15px); -webkit-line-clamp: 7; }
.adc--tower .adc__cta { width: 100%; min-height: 40px; padding: 8px 6px; font-size: clamp(12px, 9cqi, 14px); white-space: normal; text-align: center; }

/* ── box: 300×250 ─────────────────────────────────────────────────────── */
.adc--box { flex-direction: column; justify-content: center; align-items: flex-start; padding: 22px 20px 18px; gap: 10px; }
.adc--box .adc__deco { right: -20%; bottom: -30%; width: 70%; height: 80%; border-radius: 50%; }
.adc--box .adc__logo { height: 56px; width: auto; max-width: 50%; }
.adc--box .adc__name { font-size: 22px; }
.adc--box .adc__tagline { font-size: 14px; -webkit-line-clamp: 3; }
.adc--box .adc__cta { margin-top: auto; height: 38px; padding: 0 16px; font-size: 14px; }

/* ── billboard: 970×250 ───────────────────────────────────────────────── */
.adc--billboard { align-items: center; padding: 0 clamp(16px, 5cqi, 56px); gap: clamp(14px, 4cqi, 40px); }
.adc--billboard .adc__deco { top: -30%; bottom: -30%; right: 18%; width: 22%; transform: skewX(-18deg); }
.adc--billboard .adc__logo { height: 64%; width: auto; max-width: 24%; }
.adc--billboard .adc__copy { flex: 1; gap: clamp(4px, 1cqi, 10px); }
.adc--billboard .adc__name { font-size: clamp(18px, 3.8cqi, 38px); }
.adc--billboard .adc__tagline { font-size: clamp(12px, 1.9cqi, 19px); -webkit-line-clamp: 2; }
.adc--billboard .adc__cta { height: clamp(34px, 5.4cqi, 52px); padding: 0 clamp(12px, 2.6cqi, 26px); font-size: clamp(12px, 1.8cqi, 17px); }

/* ── strip: 970×90 / 728×90 / 320×100 / 320×50 ────────────────────────── */
.adc--strip { align-items: center; padding: 0 clamp(10px, 2.4cqi, 24px); gap: clamp(8px, 2cqi, 18px); }
.adc--strip .adc__deco { top: -50%; bottom: -50%; right: 22%; width: 14%; transform: skewX(-18deg); }
.adc--strip .adc__logo { height: 70%; width: auto; max-width: 18%; }
.adc--strip .adc__copy { flex: 1; flex-direction: row; align-items: baseline; gap: clamp(6px, 1.6cqi, 16px); }
.adc--strip .adc__name { font-size: clamp(14px, 2.6cqi, 24px); white-space: nowrap; }
.adc--strip .adc__tagline { font-size: clamp(12px, 1.6cqi, 15px); -webkit-line-clamp: 1; }
.adc--strip .adc__cta { height: clamp(28px, 4.2cqi, 40px); padding: 0 clamp(10px, 2cqi, 20px); font-size: clamp(12px, 1.5cqi, 15px); }
.adc--strip .adc__label { top: 3px; right: 3px; font-size: 8px; padding: 1px 4px; }
.adc--strip .adc__copy { min-width: 0; }
.adc--strip .adc__name { flex: none; }
.adc--strip .adc__tagline { min-width: 0; }

/* Narrow strips (320×100 phones) stack the tagline under the name. */
@container (max-width: 480px) {
  .adc--strip .adc__copy { flex-direction: column; align-items: flex-start; gap: 2px; }
  .adc--strip .adc__name { flex: initial; font-size: 15px; white-space: normal; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
  .adc--strip .adc__cta { padding: 0 10px; font-size: 12px; max-width: 38%; white-space: normal; text-align: center; line-height: 1.1; }
  .adc--strip .adc__tagline { -webkit-line-clamp: 2; font-size: 12px; }
}
.adc--tiny .adc__name { font-size: 14px; }
.adc--tiny .adc__cta { width: 28px; height: 28px; padding: 0; border-radius: 50%; }
.adc--tiny.adc--tower .adc__cta { width: 100%; border-radius: 4px; }

/* Uploaded artwork: just the image + label. */
.adc--art { padding: 0; }
</style>
