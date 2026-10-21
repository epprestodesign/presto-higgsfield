<script setup>
// BrandHero — the branded event banner. One component renders every creative
// concept (6 layouts × any Brand Kit) at every size: the full landing hero,
// the compact band on Browse / Details (references/102126), and gallery cards.
//
// Artwork (photo, duotone, patterns) is a background layer; the logo, headline
// and dates are live DOM on top — never baked into generated images — so
// they stay editable, accessible and sharp. Sizing uses container queries, so
// the same markup adapts inside a 390px phone frame or a 320px gallery card.
import { computed } from 'vue'
import { getFont } from '../../theme/fonts.js'
import { resolvePalette } from '../../theme/brandTheme.js'
import { shade } from '../../theme/color.js'
import { getImage } from '../../assets/imagery/index.js'
import { prestoBannerConcept } from '../../providers/ai/conceptFactory.js'

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

// No concept selected yet → a clean Brand Signature default from the kit.
const fallback = computed(() => {
  const p = resolvePalette(props.brandKit.colors)
  // A brand banner (e.g. generated with Higgsfield) → the Presto standard layout.
  const banner = getImage(props.brandKit.bannerImageId) || (props.brandKit.imagery || []).find((a) => a.id === props.brandKit.bannerImageId)
  if (banner) return prestoBannerConcept(props.brandKit, banner)
  const hero = getImage(props.brandKit.heroImageId) || (props.brandKit.imagery || []).find((a) => a.id === props.brandKit.heroImageId)
  return {
    layout: hero ? 'editorial' : 'centered',
    headingFont: props.brandKit.typography?.heading,
    treatment: {
      background: hero ? shade(p.primary, 0.3) : p.primary,
      foreground: p.onPrimary,
      accent: p.secondary,
      highlight: p.accent,
      imageSrc: hero?.src || null,
      imageAlt: '',
      overlay: hero ? 'scrim' : 'none',
      pattern: hero ? 'none' : 'dots',
    },
  }
})

const c = computed(() => props.concept || fallback.value)
const t = computed(() => c.value.treatment || {})
const layout = computed(() => c.value.layout || 'centered')
const palette = computed(() => resolvePalette(props.brandKit.colors))

// Energy layouts shout; premium whispers.
const uppercase = computed(() => ['band', 'angled'].includes(layout.value))
const darkArt = computed(() => layout.value !== 'framed')

const logoSrc = computed(() => {
  const bk = props.brandKit
  if (darkArt.value && bk.logoOnDark?.src) return bk.logoOnDark.src
  return bk.logo?.src || ''
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
    :class="[`bh--${layout}`, `bh--${size}`, { 'bh--upper': uppercase }]"
    :style="style"
    :aria-label="headline"
  >
    <!-- Artwork layer (decorative) -->
    <div class="bh__art" aria-hidden="true">
      <div v-if="t.imageSrc" class="bh__photo" :class="`bh__photo--${t.overlay || 'none'}`">
        <img :src="t.imageSrc" alt="" decoding="async" />
      </div>
      <div v-if="t.pattern && t.pattern !== 'none'" class="bh__pattern" :class="`bh__pattern--${t.pattern}`" />
      <div v-if="layout === 'angled'" class="bh__slash" />
    </div>

    <!-- Live content layer -->
    <div class="bh__content">
      <img v-if="showLogo && logoSrc" :src="logoSrc" :alt="logoAlt" class="bh__logo" />
      <div class="bh__text">
        <p v-if="meta && size !== 'compact' && layout === 'editorial'" class="bh__eyebrow">{{ meta }}</p>
        <component :is="headingTag" class="bh__headline">{{ headline }}</component>
        <p v-if="tagline" class="bh__tagline">{{ tagline }}</p>
        <p v-if="meta && !(size !== 'compact' && layout === 'editorial')" class="bh__meta">{{ meta }}</p>
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
/* scrim — readable text over full-bleed photography */
.bh__photo--scrim::after { background: linear-gradient(90deg, rgb(0 0 0 / 0.72) 0%, rgb(0 0 0 / 0.38) 55%, rgb(0 0 0 / 0.12) 100%); }
/* tint — brand color wash */
.bh__photo--tint img { filter: grayscale(0.4) contrast(1.05); }
.bh__photo--tint::after { background: var(--bh-bg); mix-blend-mode: multiply; opacity: 0.55; }
/* duotone — grayscale photo multiplied into the brand dark + accent glow */
.bh__photo--duotone img { filter: grayscale(1) contrast(1.25) brightness(0.95); }
.bh__photo--duotone::after { background: linear-gradient(120deg, var(--bh-bg) 10%, var(--bh-accent) 130%); mix-blend-mode: multiply; }

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
.bh--upper .bh__headline { text-transform: uppercase; letter-spacing: 0.01em; }
.bh__tagline { margin: 0; font-size: clamp(14px, 2cqi, 20px); line-height: 1.35; opacity: 0.92; text-wrap: balance; }
.bh__meta, .bh__eyebrow { margin: 0; font-size: clamp(12px, 1.5cqi, 15px); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.9; }
.bh__eyebrow { color: var(--bh-highlight); opacity: 1; }

/* ── Layouts ─────────────────────────────────────────────────────────── */
/* presto — the Presto banner standard (references/102226): a minimal,
   system-safe full-bleed background with logo + all copy centered on top. */
.bh--presto .bh__logo { height: clamp(48px, 11cqi, 120px); }
.bh--presto .bh__headline { text-shadow: 0 2px 18px rgb(0 0 0 / 0.35); }

/* split — brand panel left, tinted photo right */
.bh--split .bh__photo { left: 55%; }
.bh--split .bh__art::after { content: ''; position: absolute; top: 0; bottom: 0; left: 55%; width: 6px; background: var(--bh-highlight); }
.bh--split .bh__content { align-items: flex-start; text-align: left; padding-right: 48%; }

/* band — dark band, chevrons left, angled duotone photo right (reference look) */
.bh--band .bh__photo { left: auto; width: 42%; clip-path: polygon(22% 0, 100% 0, 100% 100%, 0 100%); }

/* angled — full-bleed duotone, diagonal accent slash, left-aligned shout */
.bh__slash { position: absolute; inset: 0 auto 0 -10%; width: 58%; background: var(--bh-bg); transform: skewX(-14deg); box-shadow: 14px 0 0 var(--bh-accent), 26px 0 0 var(--bh-highlight); }
.bh--angled .bh__content { align-items: flex-start; text-align: left; padding-right: 46%; }

/* editorial — full-bleed photo, scrim, bottom-left serif */
.bh--editorial { align-items: flex-end; }
.bh--editorial .bh__content { align-items: flex-start; text-align: left; }
.bh--editorial .bh__headline { font-weight: 600; letter-spacing: -0.015em; }

/* framed — light field, framed photograph right, serif left */
.bh--framed .bh__photo { inset: clamp(12px, 3cqi, 28px) clamp(12px, 3cqi, 28px) clamp(12px, 3cqi, 28px) 52%; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 30px rgb(0 0 0 / 0.18); }
.bh--framed .bh__content { align-items: flex-start; text-align: left; padding-right: 52%; }
.bh--framed .bh__headline { font-weight: 600; }
.bh--framed .bh__meta { opacity: 0.7; }

/* ── Compact band (Browse / Details) — logo beside title, one row ────── */
.bh--compact .bh__content { flex-direction: row; justify-content: center; text-align: left; padding-block: 18px; gap: 18px; }
.bh--compact .bh__text { align-items: flex-start; gap: 2px; }
.bh--compact .bh__logo { height: 64px; max-width: 140px; }
.bh--compact .bh__headline { font-size: clamp(18px, 2.6cqi, 30px); }
.bh--compact .bh__tagline { font-size: clamp(13px, 1.4cqi, 16px); }
.bh--compact.bh--split .bh__content,
.bh--compact.bh--angled .bh__content,
.bh--compact.bh--framed .bh__content { justify-content: flex-start; }
.bh--compact.bh--editorial { align-items: center; }

/* Narrow containers (phones, gallery cards): stack + recentre side layouts */
@container (max-width: 560px) {
  .bh--split .bh__photo { left: 0; opacity: 0.35; }
  .bh--split .bh__art::after { display: none; }
  .bh--band .bh__photo { width: 100%; clip-path: none; opacity: 0.28; }
  .bh__slash { width: 120%; opacity: 0.82; }
  .bh--framed .bh__photo { inset: auto 0 0 0; height: 38%; border-radius: 0; box-shadow: none; }
  .bh--framed { align-items: flex-start; }
  .bh--split .bh__content,
  .bh--angled .bh__content,
  .bh--framed .bh__content { padding-right: clamp(16px, 4cqi, 40px); }
  .bh--framed .bh__content { padding-bottom: 42%; }
  .bh--compact .bh__content { flex-direction: column; text-align: center; align-items: center; }
  .bh--compact .bh__text { align-items: center; }
  .bh--compact .bh__logo { height: 48px; }
}
</style>
