<script setup>
// Logo step 4 · Vector: the SVG version. Uploaded SVGs are kept as designed;
// images are traced in the logo's own colours, compared side by side.
import { ref } from 'vue'
import { useLogoOutputs } from '../../banner-lab/useLogoOutputs.js'
import { DETAIL } from '../../banner-lab/vectorize.js'

const { s, isVector, traced, tracedUrl, finishedUrl, downloadSvg } = useLogoOutputs()
const zoom = ref(1)
const toggle = { noCaps: true, unelevated: true, toggleColor: 'primary', color: 'white', textColor: 'dark' }
</script>

<template>
  <div class="lv">
    <div v-if="isVector" class="bs-card lv__vector-ok">
      <q-icon name="verified" size="28px" />
      <div>
        <p class="bs-subtitle">Your upload is already a vector</p>
        <p class="bs-caption">It stays exactly as designed and is sharp at every size. Nothing to trace.</p>
      </div>
      <q-btn unelevated no-caps class="bs-btn bs-btn--ghost" icon="download" label="Download SVG" @click="downloadSvg" />
    </div>

    <template v-else>
      <div class="bs-card lv__controls">
        <label class="lv__ctl">
          <span class="bs-caption">Colours: <strong>{{ s.vector.colors }}</strong></span>
          <q-slider :model-value="s.vector.colors" :min="2" :max="12" :step="1" color="primary" label @change="(v) => (s.vector.colors = v)" />
        </label>
        <div class="lv__ctl">
          <span class="bs-caption">Detail</span>
          <q-btn-toggle v-model="s.vector.detail" v-bind="toggle" :options="Object.entries(DETAIL).map(([v, d]) => ({ value: v, label: d.label }))" />
        </div>
        <div class="lv__ctl">
          <span class="bs-caption">Zoom to compare</span>
          <q-btn-toggle v-model="zoom" v-bind="toggle" :options="[{ value: 1, label: 'Fit' }, { value: 3, label: '3×' }, { value: 6, label: '6×' }]" />
        </div>
        <div class="lv__stat">
          <p v-if="traced?.svg" class="bs-caption">{{ traced.paths }} shapes · {{ (traced.bytes / 1024).toFixed(1) }} KB</p>
          <q-btn unelevated no-caps class="bs-btn bs-btn--ghost" icon="download" label="Download SVG" :disable="!traced?.svg" @click="downloadSvg" />
        </div>
      </div>

      <div class="lv__compare">
        <figure>
          <div class="bl-check bl-check--wide"><img :src="finishedUrl" alt="Original image" :style="{ transform: `scale(${zoom})` }" /></div>
          <figcaption class="bs-caption">Image (pixels)</figcaption>
        </figure>
        <figure>
          <div class="bl-check bl-check--wide">
            <q-spinner v-if="s.vector.busy" size="32px" color="primary" />
            <img v-else-if="tracedUrl" :src="tracedUrl" alt="Traced vector" :style="{ transform: `scale(${zoom})` }" />
            <span v-else-if="traced?.error" class="bs-caption">{{ traced.error }}</span>
          </div>
          <figcaption class="bs-caption">Vector (SVG)</figcaption>
        </figure>
      </div>
      <p class="bs-caption lv__tip">Fewer colours give a cleaner, smaller file; more keep shading. Logos with photos or gradients trace as flat bands of colour.</p>
    </template>
  </div>
</template>

<style scoped>
.lv { display: grid; gap: 16px; }
.lv__vector-ok { display: flex; align-items: center; gap: 16px; padding: 20px 22px; }
.lv__vector-ok .q-icon { color: var(--bs-success); }
.lv__vector-ok > div { flex: 1; }
.lv__controls { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-end; padding: 16px 20px; }
.lv__ctl { display: grid; gap: 6px; min-width: 180px; }
.lv__stat { margin-left: auto; display: flex; align-items: center; gap: 14px; }
.lv__compare { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.lv__compare figure { margin: 0; text-align: center; }
.lv__tip { text-align: center; }
@media (max-width: 900px) { .lv__compare { grid-template-columns: 1fr; } .lv__stat { margin-left: 0; } }
</style>
