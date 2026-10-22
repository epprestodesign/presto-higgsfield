<script setup>
// BrandHero — the branded event banner. One component renders every creative
// concept (any Brand Kit) at every size: the full landing hero, the compact
// band on Browse / Details (references/102126), and gallery cards.
//
// One layout only — the Presto hero standard (presto-2026 LandingPage /
// HotelListPage): logo, event name and dates stacked and centered over a
// full-bleed background. Concepts vary the background treatment, never the
// layout. Older saved concepts (split, band, angled, editorial, framed) are
// normalized to the centered layout.
//
// Artwork (photo, duotone, patterns) is a background layer; the logo, headline
// and dates are live DOM on top — never baked into generated images — so
// they stay editable, accessible and sharp. Sizing uses container queries, so
// the same markup adapts inside a 390px phone frame or a 320px gallery card.
import { computed } from 'vue'
import { getFont } from '../../theme/fonts.js'
import { resolvePalette } from '../../theme/brandTheme.js'
import { resolveHeroConcept } from '../../theme/heroConcept.js'

const props = defineProps({
  concept: { type: Object, default: null },
  brandKit: { type: Object, default: () => ({}) },
  headline: { type: String, default: 'Your Event Name' },
  tagline: { type: String, default: '' },
  dates: { type: String, default: '' },
  location: { type: String, default: '' },
  showLogo: { type: Boolean, default: true },
  showDates: { type: Boolean, default: true },
  // 'landing' (tall hero) | 'compact' (Browse/Details band) | 'card' (gallery thumbnail)
  size: { type: String, default: 'landing' },
  headingLevel: { type: Number, default: 1 },
})

// No concept selected yet → a default from the Brand Kit; legacy layouts → centered.
const c = computed(() => resolveHeroConcept(props.concept, props.brandKit))
const t = computed(() => c.value.treatment || {})
const layout = computed(() => c.value.layout || 'centered')
const palette = computed(() => resolvePalette(props.brandKit.colors))

const logoSrc = computed(() => {
  const bk = props.brandKit
  return bk.logoOnDark?.src || bk.logo?.src || ''
})
const logoAlt = computed(() => props.brandKit.logo?.alt || props.headline)

const meta = computed(() => [props.showDates && props.dates, props.location].filter(Boolean).join('  ·  '))

const style = computed(() => ({
  '--bh-bg': t.value.background,
  '--bh-fg': t.value.foreground,
  '--bh-accent': t.value.accent,
  '--bh-highlight': t.value.highlight || palette.value.accent,
    '--bh-font': getFont(c.value.headingFont).family,
}))

const headingTag = computed(() => `h${Math.min(6, Math.max(1, props.headingLevel))}`)
</script>

<template>
  <section
    class="bh"
    :class="[`bh--${layout}`, `bh--${size}`]"
    :style="style"
    :aria-label="headline"
  >
    <!-- Artwork layer (decorative) -->
    <div class="bh__art" aria-hidden="true">
      <div v-if="t.imageSrc" class="bh__photo" :class="`bh__photo--${t.overlay || 'none'}`">
        <img :src="t.imageSrc" alt="" decoding="async" />
      </div>
      <div v-if="t.pattern && t.pattern !== 'none'" class="bh__pattern" :class="`bh__pattern--${t.pattern}`" />
    </div>

    <!-- Live content layer -->
    <div class="bh__content">
      <img v-if="showLogo && logoSrc" :src="logoSrc" :alt="logoAlt" class="bh__logo" />
      <div class="bh__text">
        <component :is="headingTag" class="bh__headline">{{ headline }}</component>
        <p v-if="meta" class="bh__meta">{{ meta }}</p>
        <p v-if="tagline && size !== 'compact'" class="bh__tagline">{{ tagline }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bh {
  container-type: inline-size;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: var(--bh-bg);
  color: var(--bh-fg);
  display: flex;
  align-items: center;
}
.bh--landing { min-height: clamp(260px, 42cqi, 460px); }
.bh--compact { min-height: 150px; }
.bh--card { aspect-ratio: 16 / 7; }

/* ── Artwork ─────────────────────────────────────────────────────────── */
.bh__art { position: absolute; inset: 0; z-index: 0; }
.bh__photo { position: absolute; inset: 0; }
.bh__photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.bh__photo::after { content: ''; position: absolute; inset: 0; }

/* dim — even darkening so a centered white logo + headline read anywhere */
.bh__photo--dim::after { background: linear-gradient(rgb(0 0 0 / 0.28), rgb(0 0 0 / 0.42)); }
/* scrim — centered vignette: darkest behind the copy, lighter at the edges */
.bh__photo--scrim::after { background: radial-gradient(ellipse at center, rgb(0 0 0 / 0.58) 0%, rgb(0 0 0 / 0.34) 70%, rgb(0 0 0 / 0.22) 100%); }
/* soft — defocused photo + dim: atmosphere without competing with the type */
.bh__photo--soft img { filter: blur(3px) saturate(0.9); transform: scale(1.04); }
.bh__photo--soft::after { background: rgb(0 0 0 / 0.4); }
/* tint — brand color wash */
.bh__photo--tint img { filter: grayscale(0.4) contrast(1.05); }
.bh__photo--tint::after { background: var(--bh-bg); mix-blend-mode: multiply; opacity: 0.55; }
/* duotone — grayscale photo recolored with the brand hues (keeps the photo's
   light, so dark photos don't go black), dimmed for centered white type */
.bh__photo--duotone img { filter: grayscale(1) contrast(1.1) brightness(0.72); }
.bh__photo--duotone::after { background: linear-gradient(120deg, var(--bh-bg) 0%, var(--bh-accent) 100%); mix-blend-mode: color; }

/* patterns */
.bh__pattern { position: absolute; inset: 0; pointer-events: none; }
.bh__pattern--dots {
  background-image: radial-gradient(color-mix(in srgb, var(--bh-fg) 22%, transparent) 1.3px, transparent 1.7px);
  background-size: 18px 18px;
  mask-image: linear-gradient(90deg, #000, transparent 70%);
}
.bh__pattern--lines {
  background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--bh-fg) 10%, transparent) 0 1px, transparent 1px 12px);
}
.bh__pattern--speed {
  background: repeating-linear-gradient(115deg, color-mix(in srgb, var(--bh-highlight) 55%, transparent) 0 5px, transparent 5px 26px);
  mask-image: linear-gradient(90deg, #000 0%, transparent 38%);
}
.bh__pattern--chevrons {
  background: var(--bh-accent);
  opacity: 0.55;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='60'%3E%3Cpath d='M4 0h12l22 30L16 60H4l22-30Z'/%3E%3C/svg%3E") 0 0 / 44px 60px repeat, linear-gradient(90deg, #000 0%, transparent 30%);
  -webkit-mask-composite: source-in;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='60'%3E%3Cpath d='M4 0h12l22 30L16 60H4l22-30Z'/%3E%3C/svg%3E") 0 0 / 44px 60px repeat, linear-gradient(90deg, #000 0%, transparent 30%);
  mask-composite: intersect;
}

/* ── Content ─────────────────────────────────────────────────────────── */
.bh__content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(20px, 5cqi, 56px) clamp(16px, 4cqi, 40px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: clamp(8px, 1.6cqi, 16px);
}
.bh__text { display: flex; flex-direction: column; align-items: inherit; gap: clamp(4px, 1cqi, 10px); max-width: 760px; }
.bh__logo { height: clamp(40px, 9cqi, 96px); width: auto; max-width: 60%; object-fit: contain; display: block; }
.bh__headline {
  margin: 0;
  font-family: var(--bh-font);
  font-weight: 700;
  font-size: clamp(22px, 5.4cqi, 56px);
  line-height: 1.05;
  letter-spacing: -0.01em;
  text-wrap: balance;
  color: inherit;
}
.bh__tagline { margin: 0; font-size: clamp(14px, 2cqi, 20px); line-height: 1.35; opacity: 0.92; text-wrap: balance; }
.bh__meta { margin: 0; font-size: clamp(12px, 1.5cqi, 15px); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.9; }

/* ── Layout ──────────────────────────────────────────────────────────── */
/* presto — the Presto banner standard (references/102226): a minimal,
   system-safe full-bleed background with logo + all copy centered on top. */
.bh--presto .bh__logo { height: clamp(48px, 11cqi, 120px); }
.bh--presto .bh__headline,
.bh--presto .bh__meta,
.bh--presto .bh__tagline { text-shadow: 0 2px 18px rgb(0 0 0 / 0.35); }
/* Brand-field backgrounds: keep pattern texture to the edges, clear behind the copy. */
.bh--presto .bh__pattern--dots,
.bh--centered .bh__pattern--dots { mask-image: radial-gradient(ellipse at center, transparent 35%, #000 95%); }

/* ── Compact band (Browse / Details) — same centered stack, tighter ──── */
.bh--compact .bh__content { padding-block: 16px; gap: 8px; }
.bh--compact .bh__text { gap: 4px; }
.bh--compact .bh__logo,
.bh--compact.bh--presto .bh__logo { height: clamp(32px, 4.4cqi, 56px); max-width: 180px; }
.bh--compact .bh__headline { font-size: clamp(18px, 2.6cqi, 30px); }

@container (max-width: 560px) {
  .bh--compact .bh__logo,
  .bh--compact.bh--presto .bh__logo { height: 36px; }
}
</style>
