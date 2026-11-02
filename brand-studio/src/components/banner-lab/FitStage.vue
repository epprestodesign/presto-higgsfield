<script setup>
// Fit & export: one background, the two Presto crops (1440×400 landing,
// 1440×240 hotel listings) at their exact sizes, scored against the banner
// standard, with the controls to fix what fails and the ZIP.
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useBannerLab } from '../../banner-lab/useBannerLab.js'
import { loadImage, renderBanner, checkBanner } from '../../banner-lab/canvas.js'
import { BANNER_SPECS, CENTER_ZONE, THRESHOLDS } from '../../banner-lab/standards.js'
import { saveCanvas, saveZip, slug } from '../../banner-lab/download.js'
import StepNav from './StepNav.vue'

defineProps({ step: { type: Number, default: 5 }, of: { type: Number, default: 5 } })
const lab = useBannerLab()
const s = lab.s
const v = s.view

const art = shallowRef(null)
const out = shallowRef([]) // [{ spec, canvas, background, url, check }]
const showZone = ref(false)
const error = ref('')

onMounted(async () => {
  try { art.value = await loadImage(s.selected.src); render() } catch (e) { error.value = `${e.message} If this was a live result, the dev server needs to be running.` }
})

let raf = 0
function render() {
  if (!art.value) return
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    const logo = v.showLogo ? lab.logoCanvas.value : null
    out.value = BANNER_SPECS.map((spec) => {
      const r = renderBanner(art.value, spec, v, logo)
      return { spec, ...r, url: r.canvas.toDataURL('image/jpeg', 0.9), check: checkBanner(r, spec, logo) }
    })
  })
}
watch(() => ({ ...v, t: s.treatment }), render, { deep: true })

const pct = (x) => `${Math.round(x * 100)}%`
const zoneStyle = (spec) => ({ left: pct((1 - CENTER_ZONE.w) / 2), top: pct((1 - CENTER_ZONE.h) / 2), width: pct(CENTER_ZONE.w), height: pct(CENTER_ZONE.h) })

function rows(o) {
  const g = o.check.grade
  const list = [
    { ok: g.dark, label: g.dark ? 'Dark enough behind the logo' : 'Too bright behind the logo', detail: `White text ${g.whiteContrast}:1 in the center (needs 4.5:1)` },
    { ok: g.calm !== 'busy', warn: g.calm === 'some', label: g.calm === 'calm' ? 'Calm center' : g.calm === 'some' ? 'Some detail in the center' : 'Busy center', detail: g.calm === 'busy' ? 'Soften it, or move the busy part out of the middle' : 'Low detail where the logo sits' },
  ]
  const lc = o.check.logo
  if (lc) list.push({ ok: lc.verdict === 'good' || lc.verdict === 'detail', warn: lc.verdict === 'borderline', label: lc.verdict === 'good' ? 'Logo stands out' : lc.verdict === 'detail' ? 'Logo details stand out' : lc.verdict === 'borderline' ? 'Logo is borderline' : 'Logo blends in', detail: `${lc.ratio}:1 overall, ${lc.detail}:1 at its strongest` })
  return list
}
const allPass = computed(() => out.value.length && out.value.every((o) => rows(o).every((r) => r.ok)))

const name = computed(() => slug(s.logo?.name || 'event'))
const zipping = ref(false)
async function exportZip() {
  zipping.value = true
  const logo = lab.logoCanvas.value
  const entries = []
  for (const o of out.value) {
    const bg = renderBanner(art.value, o.spec, v, null)
    entries.push({ name: `banner-${o.spec.id}-${o.spec.width}x${o.spec.height}.jpg`, canvas: bg.canvas, type: 'image/jpeg', quality: 0.9 })
    if (logo) entries.push({ name: `preview/${o.spec.id}-with-logo.jpg`, canvas: o.canvas, type: 'image/jpeg', quality: 0.9 })
  }
  entries.push({
    name: 'README.txt',
    text: [
      'Presto banner backgrounds (Banner Lab)',
      '',
      ...out.value.map((o) => `${o.spec.label}: ${o.spec.width}×${o.spec.height}. White text ${o.check.grade.whiteContrast}:1 in the center; ${o.check.grade.calm} center.`),
      '',
      'The logo is a live layer on the page, not part of these files (see the Logo download).',
      `Darken ${Math.round(v.scrim * 100)}%, soften ${v.blur}px, focus ${Math.round(v.fx * 100)}% / ${Math.round(v.fy * 100)}%.`,
      '',
      'Prompt:',
      s.jobs.find((j) => j.id === s.selected.jobId)?.prompt || '',
    ].join('\n'),
  })
  await saveZip(entries, `${name.value}-presto-banners.zip`)
  zipping.value = false
}
</script>

<template>
  <section class="fs" aria-labelledby="fs-title">
    <header class="fs__head">
      <div>
        <p class="bs-eyebrow">Step {{ step }} of {{ of }}</p>
        <h1 id="fs-title" class="bs-title">Fit to the Presto banner sizes</h1>
        <p class="bs-body">One background, two crops. The center has to stay dark and calm for the logo; the checks below update as you adjust.</p>
      </div>
      <span class="fs__verdict" :class="allPass ? 'is-ok' : 'is-warn'">
        <q-icon :name="allPass ? 'verified' : 'tune'" size="20px" /> {{ allPass ? 'Meets the banner standard' : 'Adjust to meet the standard' }}
      </span>
    </header>
    <p v-if="error" class="fs__error" role="alert">{{ error }}</p>

    <div class="fs__layout">
      <div class="fs__previews">
        <article v-for="o in out" :key="o.spec.id" class="bs-card fs__banner">
          <div class="fs__bhead">
            <strong>{{ o.spec.label }}</strong>
            <span class="bs-caption">{{ o.spec.width }} × {{ o.spec.height }} px</span>
            <q-btn flat dense no-caps size="sm" icon="download" label="JPG" @click="saveCanvas(renderBanner(art, o.spec, v, null).canvas, `banner-${o.spec.id}-${o.spec.width}x${o.spec.height}.jpg`, 'image/jpeg', 0.9)" />
          </div>
          <div class="fs__img" :style="{ aspectRatio: `${o.spec.width} / ${o.spec.height}` }">
            <img :src="o.url" :alt="`${o.spec.label} preview`" />
            <div v-if="showZone" class="fs__zone" :style="zoneStyle(o.spec)" aria-hidden="true"><span>Logo zone</span></div>
          </div>
          <ul class="fs__checks">
            <li v-for="r in rows(o)" :key="r.label" :class="r.ok ? (r.warn ? 'is-warn' : 'is-ok') : 'is-bad'">
              <q-icon :name="r.ok ? (r.warn ? 'info' : 'check_circle') : 'error'" size="18px" />
              <span><strong>{{ r.label }}</strong> <span class="bs-caption">{{ r.detail }}</span></span>
            </li>
          </ul>
        </article>

        <article v-if="out[0]" class="bs-card fs__page" aria-label="On the booking page">
          <p class="bs-subtitle">On the booking page</p>
          <div class="fs__mock">
            <div class="fs__nav"><span>Event</span><span class="fs__navbtn">Manage Booking</span></div>
            <div class="fs__hero" :style="{ backgroundImage: `url(${out[0].url})` }" />
            <div class="fs__widget"><strong>Let’s Get Started</strong><span /><span /><em>View Hotels</em></div>
          </div>
        </article>
      </div>

      <aside class="bs-card fs__controls" aria-label="Adjust">
        <p class="bs-subtitle">Adjust</p>
        <label class="fs__ctl">
          <span class="bs-caption">Focus, left ↔ right <strong>{{ Math.round(v.fx * 100) }}%</strong></span>
          <q-slider v-model="v.fx" :min="0" :max="1" :step="0.01" color="primary" />
        </label>
        <label class="fs__ctl">
          <span class="bs-caption">Focus, up ↕ down <strong>{{ Math.round(v.fy * 100) }}%</strong></span>
          <q-slider v-model="v.fy" :min="0" :max="1" :step="0.01" color="primary" />
        </label>
        <label class="fs__ctl">
          <span class="bs-caption">Zoom <strong>{{ v.zoom.toFixed(2) }}×</strong></span>
          <q-slider v-model="v.zoom" :min="1" :max="2" :step="0.05" color="primary" />
        </label>
        <div class="fs__ctl">
          <span class="bs-caption">Darken <strong>{{ Math.round(v.scrim * 100) }}%</strong> <em v-if="v.autoScrim">(auto: {{ Math.round(v.autoScrim * 100) }}%)</em></span>
          <q-slider v-model="v.scrim" :min="0" :max="THRESHOLDS.maxScrim" :step="0.01" color="primary" />
          <q-btn flat dense no-caps size="sm" icon="auto_fix_high" label="Auto: just enough for white text" class="fs__auto" @click="lab.reAutoScrim()" />
        </div>
        <label class="fs__ctl">
          <span class="bs-caption">Soften <strong>{{ v.blur }}px</strong></span>
          <q-slider v-model="v.blur" :min="0" :max="12" :step="1" color="primary" />
        </label>
        <q-toggle v-model="showZone" dense color="primary" label="Show the logo zone" />
        <q-btn flat dense no-caps size="sm" icon="restart_alt" label="Reset framing" class="fs__auto" @click="Object.assign(v, { fx: 0.5, fy: 0.5, zoom: 1, blur: 0 }); lab.reAutoScrim()" />
        <q-toggle :model-value="v.showLogo && !!lab.logoCanvas.value" dense color="primary" :disable="!lab.logoCanvas.value" @update:model-value="(on) => (v.showLogo = on)" :label="lab.logoCanvas.value ? 'Preview with my logo' : 'No logo yet (Logo tab)'" />
      </aside>
    </div>

    <StepNav back="Pick another" next="Download banners (ZIP)" next-icon="download" :next-loading="zipping" :next-disabled="!out.length" @back="s.bgStep = 'results'" @next="exportZip">
      Both crops as JPGs, plus a preview with your logo and the prompt used.
    </StepNav>
  </section>
</template>

<style scoped>
.fs { display: grid; gap: 18px; }
.fs__head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; }
.fs__head .bs-title { margin-top: 6px; }
.fs__head .bs-body { margin-top: 4px; max-width: 620px; }
.fs__cta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.fs__verdict { display: inline-flex; align-items: center; gap: 6px; font: 600 0.9375rem var(--bs-font); }
.fs__verdict.is-ok { color: var(--bs-success); }
.fs__verdict.is-warn { color: var(--bs-warning); }
.fs__error { color: var(--bs-danger); font: 600 0.9375rem var(--bs-font); }
.fs__layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 20px; align-items: start; }
.fs__previews { display: grid; gap: 16px; }
.fs__banner { padding: 14px; display: grid; gap: 10px; }
.fs__bhead { display: flex; align-items: baseline; gap: 10px; }
.fs__bhead strong { font: 600 0.9375rem var(--bs-font); color: var(--bs-ink); }
.fs__bhead .q-btn { margin-left: auto; }
.fs__img { position: relative; border-radius: var(--bs-radius-sm); overflow: hidden; background: #0b1736; }
.fs__img img { display: block; width: 100%; height: 100%; }
.fs__zone { position: absolute; border: 2px dashed rgb(255 255 255 / 0.85); border-radius: 4px; }
.fs__zone span { position: absolute; top: 4px; left: 6px; font: 600 0.6875rem var(--bs-font); color: #fff; text-shadow: 0 1px 2px #000; }
.fs__checks { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.fs__checks li { display: flex; gap: 8px; align-items: center; font: 400 0.875rem var(--bs-font); }
.fs__checks strong { font-weight: 600; color: var(--bs-ink); }
.is-ok > .q-icon { color: var(--bs-success); }
.is-warn > .q-icon { color: var(--bs-warning); }
.is-bad > .q-icon { color: var(--bs-danger); }
.fs__controls { padding: 18px; display: grid; gap: 12px; position: sticky; top: 84px; }
.fs__ctl { display: grid; gap: 2px; }
.fs__ctl em { font-style: normal; color: var(--bs-ink-faint); }
.fs__auto { justify-self: start; color: var(--bs-accent); }
.fs__page { padding: 14px; display: grid; gap: 10px; }
.fs__mock { border: 1px solid var(--bs-line); border-radius: var(--bs-radius-md); overflow: hidden; background: #fff; }
.fs__nav { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; background: #0b1736; color: #fff; font: 700 0.8125rem var(--bs-font); }
.fs__navbtn { background: #fff; color: #0b1736; border-radius: 999px; padding: 3px 10px; font-size: 0.6875rem; }
.fs__hero { aspect-ratio: 1440 / 400; background-size: cover; background-position: center; }
.fs__widget {
  display: grid; grid-template-columns: auto 1fr 1fr auto; gap: 10px; align-items: center; margin: -22px auto 16px; width: 70%;
  padding: 12px 14px; background: #fff; border-radius: 8px; box-shadow: var(--bs-shadow-2); position: relative; font: 600 0.75rem var(--bs-font);
}
.fs__widget span { height: 22px; border: 1px solid var(--bs-line); border-radius: 4px; }
.fs__widget em { font-style: normal; background: #1d4ed8; color: #fff; padding: 4px 10px; border-radius: 999px; }
@media (max-width: 1000px) { .fs__layout { grid-template-columns: 1fr; } .fs__controls { position: static; } }
</style>
