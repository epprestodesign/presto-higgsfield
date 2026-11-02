<script setup>
// Logo step 3 · Clean up: before → after, what was checked and fixed, the
// brand colours, and which version reads on dark banners.
import { useLogoOutputs } from '../../banner-lab/useLogoOutputs.js'
import { TREATMENTS } from '../../banner-lab/canvas.js'
import { SYSTEM_DARK } from '../../banner-lab/standards.js'

const { s, logo, finishedUrl, beforeUrl, treatmentUrls } = useLogoOutputs()

const STATUS = {
  pass: { icon: 'check_circle', label: 'Good' },
  fixed: { icon: 'auto_fix_high', label: 'Fixed' },
  warn: { icon: 'warning', label: 'Heads up' },
  fail: { icon: 'error', label: 'Needs attention' },
}
</script>

<template>
  <div class="lc">
    <div class="lc__pair">
      <figure>
        <div class="bl-check"><img :src="beforeUrl" alt="Your upload" /></div>
        <figcaption class="bs-caption">Before</figcaption>
      </figure>
      <q-icon name="arrow_forward" size="24px" class="lc__arrow" />
      <figure>
        <div class="bl-check"><img :src="finishedUrl" :alt="`${logo.name}, transparent and trimmed`" /></div>
        <figcaption class="bs-caption">After: transparent and trimmed</figcaption>
      </figure>
      <div class="lc__palette" aria-label="Brand colours found in the logo">
        <p class="bs-subtitle">Brand colours</p>
        <ul>
          <li v-for="c in logo.palette" :key="c.hex"><span :style="{ background: c.hex }" /> <code>{{ c.hex }}</code> <small>{{ c.share }}%</small></li>
        </ul>
        <p class="bs-caption">Used to steer your background graphics.</p>
      </div>
    </div>

    <div class="lc__grid">
      <section class="bs-card lc__card" aria-labelledby="lc-checks">
        <h2 id="lc-checks" class="bs-subtitle">What we checked</h2>
        <ul class="lc__checks">
          <li v-for="c in logo.checks" :key="c.id" :class="`lc__c lc__c--${c.status}`">
            <q-icon :name="STATUS[c.status].icon" size="20px" :aria-label="STATUS[c.status].label" />
            <div><strong>{{ c.title }}</strong><p class="bs-caption">{{ c.detail }}</p></div>
          </li>
        </ul>
        <q-toggle v-if="logo.background.kind === 'solid'" v-model="s.removeBg" dense color="primary" label="Remove the plain background" class="lc__toggle" />
      </section>

      <section class="bs-card lc__card" aria-labelledby="lc-dark">
        <h2 id="lc-dark" class="bs-subtitle">On dark banners</h2>
        <p class="bs-caption">Presto banners and nav bars are dark, and the logo sits on top. Pick how it should read there.</p>
        <div class="lc__treatments" role="radiogroup" aria-label="On-dark version">
          <button
            v-for="t in TREATMENTS" :key="t.id" type="button" role="radio" :aria-checked="s.treatment === t.id"
            class="lc__t bs-focusable" :class="{ 'is-on': s.treatment === t.id }" @click="s.treatment = t.id"
          >
            <span class="lc__t-art" :style="{ background: SYSTEM_DARK }"><img :src="treatmentUrls[t.id]" alt="" /></span>
            <strong>{{ t.label }}<em v-if="logo.recommended === t.id"> · recommended</em></strong>
            <small>{{ t.hint }}</small>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.lc { display: grid; gap: 20px; }
.lc__pair { display: grid; grid-template-columns: 1fr auto 1fr minmax(200px, 0.8fr); gap: 16px; align-items: center; }
.lc__pair figure { margin: 0; text-align: center; }
.lc__arrow { color: var(--bs-ink-faint); }
.lc__palette ul { list-style: none; margin: 10px 0; padding: 0; display: grid; gap: 6px; }
.lc__palette li { display: flex; align-items: center; gap: 8px; font: 500 0.875rem var(--bs-font); color: var(--bs-ink); }
.lc__palette li span { width: 22px; height: 22px; border-radius: 50%; border: 1px solid rgb(0 0 0 / 0.1); }
.lc__palette small { color: var(--bs-ink-faint); }
.lc__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.lc__card { padding: 20px 22px; }
.lc__card > .bs-caption { margin-top: 4px; }
.lc__checks { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 12px; }
.lc__c { display: flex; gap: 12px; align-items: flex-start; }
.lc__c strong { font: 600 0.9375rem var(--bs-font); color: var(--bs-ink); }
.lc__c--pass .q-icon { color: var(--bs-success); }
.lc__c--fixed .q-icon { color: var(--bs-accent); }
.lc__c--warn .q-icon { color: var(--bs-warning); }
.lc__c--fail .q-icon { color: var(--bs-danger); }
.lc__toggle { margin-top: 14px; }
.lc__treatments { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
.lc__t { display: grid; gap: 4px; text-align: left; padding: 8px; border-radius: var(--bs-radius-md); border: 2px solid var(--bs-line); background: var(--bs-surface); cursor: pointer; font-family: var(--bs-font); }
.lc__t.is-on { border-color: var(--bs-accent); }
.lc__t-art { display: grid; place-items: center; height: 96px; border-radius: var(--bs-radius-sm); }
.lc__t-art img { max-width: 80%; max-height: 76px; object-fit: contain; }
.lc__t strong { font-size: 0.875rem; color: var(--bs-ink); }
.lc__t em { font-style: normal; color: var(--bs-accent); }
.lc__t small { font-size: 0.75rem; color: var(--bs-ink-soft); }
@media (max-width: 900px) { .lc__pair, .lc__grid { grid-template-columns: 1fr; } .lc__arrow { transform: rotate(90deg); justify-self: center; } }
</style>
