<script setup>
// Logo step 5 · Sizes & download: the exact width × height the logo gets in
// each Presto placement, as transparent PNGs (1x, 2x), plus the ZIP.
import { useLogoOutputs } from '../../banner-lab/useLogoOutputs.js'
import { LOGO_SPEC, SYSTEM_DARK } from '../../banner-lab/standards.js'
import { saveCanvas } from '../../banner-lab/download.js'

const { logo, name, placements } = useLogoOutputs()
const limitText = (p) => (p.size.limit === 'square' ? `${LOGO_SPEC.padding * 100}% padding inside the square` : p.size.limit === 'height' ? `Fills the ${p.box.h}px height` : `Hits the ${p.box.w}px max width`)
</script>

<template>
  <div class="lz">
    <p class="bs-body">Each place Presto shows the logo gives it a height and a maximum width. Here’s the exact size yours gets in each, with transparent PNGs at 1x and 2x. The dashed line is the space Presto reserves.</p>
    <div class="lz__grid">
      <article v-for="p in placements" :key="p.id" class="bs-card lz__size">
        <div class="lz__slot" :class="{ 'lz__slot--dark': p.dark }" :style="p.dark ? { background: SYSTEM_DARK } : null">
          <!-- 100% when it fits; wide boxes (the 708px banner slot) scale down, proportions kept. -->
          <div class="lz__box" :style="{ width: `min(100%, ${p.box.w}px)`, aspectRatio: `${p.box.w} / ${p.box.h}` }">
            <img :src="p.url" :alt="`${logo.name} at ${p.size.w} by ${p.size.h}`" :style="{ width: `${(p.size.w / p.box.w) * 100}%`, height: `${(p.size.h / p.box.h) * 100}%` }" />
          </div>
        </div>
        <div class="lz__meta">
          <strong>{{ p.label }}</strong>
          <span class="bs-caption">{{ p.where }}</span>
          <span class="lz__dims">{{ p.size.w }} × {{ p.size.h }} px</span>
          <span class="bs-caption">{{ limitText(p) }} · box {{ p.box.w }} × {{ p.box.h }}</span>
          <span class="lz__dl">
            <q-btn dense flat no-caps size="sm" icon="download" label="PNG" @click="saveCanvas(p.png1x, `${name}-${p.id}-${p.size.w}x${p.size.h}.png`)" />
            <q-btn dense flat no-caps size="sm" icon="download" label="@2x" @click="saveCanvas(p.png2x, `${name}-${p.id}-${p.size.w}x${p.size.h}@2x.png`)" />
          </span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.lz { display: grid; gap: 16px; }
.lz__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }
.lz__size { display: grid; gap: 10px; padding: 12px; }
.lz__slot { display: grid; place-items: center; min-height: 150px; padding: 14px; border-radius: var(--bs-radius-sm); overflow: hidden; background: repeating-conic-gradient(#e7e9ef 0% 25%, #fff 0% 50%) 50% / 16px 16px; }
.lz__box { display: grid; place-items: center; outline: 1px dashed rgb(59 130 246 / 0.8); margin: 0 auto; }
.lz__slot--dark .lz__box { outline-color: rgb(147 197 253 / 0.8); }
.lz__box img { display: block; }
.lz__meta { display: grid; gap: 2px; }
.lz__meta strong { font: 600 0.9375rem var(--bs-font); color: var(--bs-ink); }
.lz__dims { font: 700 1.0625rem var(--bs-font); color: var(--bs-ink); margin-top: 4px; }
.lz__dl { display: flex; gap: 4px; margin-top: 4px; }
</style>
