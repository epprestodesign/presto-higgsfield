<script setup>
// ChromeWindow — a realistic Google Chrome (macOS, light) window around a page
// mockup: traffic lights, tab strip with favicon + title, toolbar with
// back/forward/reload, the omnibox (site-info icon, host + grey path), star,
// extensions, profile and menu.
//
// All chrome is sized in "design pixels" (--u = 1/designWidth of the window
// width, via container units), so it scales together with the page inside —
// exactly like a screenshot of a real 1440px browser window.
import { computed } from 'vue'

const props = defineProps({
  url: { type: String, default: 'demo.eventpipe.com' },
  title: { type: String, default: 'Presto' },
  favicon: { type: String, default: '' }, // image URL; falls back to a letter tile
  faviconColor: { type: String, default: '#01113E' },
  designWidth: { type: Number, default: 1440 },
  label: { type: String, default: 'Desktop browser preview' },
})

const parts = computed(() => {
  const clean = props.url.replace(/^https?:\/\//, '')
  const i = clean.indexOf('/')
  return i === -1 ? { host: clean, path: '' } : { host: clean.slice(0, i), path: clean.slice(i) }
})
const initial = computed(() => (props.title || 'P').trim().charAt(0).toUpperCase())
</script>

<template>
  <figure class="cw" :style="{ '--dw': designWidth }" :aria-label="label">
    <div class="cw__frame" aria-hidden="true">
      <!-- Tab strip -->
      <div class="cw__tabs">
        <span class="cw__lights"><i class="r" /><i class="y" /><i class="g" /></span>
        <div class="cw__tab">
          <img v-if="favicon" :src="favicon" alt="" class="cw__fav" />
          <span v-else class="cw__fav cw__fav--letter" :style="{ background: faviconColor }">{{ initial }}</span>
          <span class="cw__title">{{ title }}</span>
          <svg class="cw__x" viewBox="0 0 16 16"><path d="M4.5 4.5l7 7m0-7l-7 7" /></svg>
        </div>
        <svg class="cw__plus" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" /></svg>
        <span class="cw__grow" />
        <svg class="cw__tabsearch" viewBox="0 0 16 16"><path d="M4 6.5l4 4 4-4" /></svg>
      </div>
      <!-- Toolbar -->
      <div class="cw__bar">
        <svg class="cw__ico" viewBox="0 0 24 24"><path d="M20 12H5m6-7l-7 7 7 7" /></svg>
        <svg class="cw__ico cw__ico--off" viewBox="0 0 24 24"><path d="M4 12h15m-6-7l7 7-7 7" /></svg>
        <svg class="cw__ico" viewBox="0 0 24 24"><path d="M19 12a7 7 0 1 1-2.05-4.95M19 4v4h-4" /></svg>
        <div class="cw__omni">
          <svg class="cw__tune" viewBox="0 0 24 24"><path d="M4 8h9m4 0h3M4 16h3m4 0h9" /><circle cx="15" cy="8" r="2" /><circle cx="9" cy="16" r="2" /></svg>
          <span class="cw__url"><b>{{ parts.host }}</b>{{ parts.path }}</span>
          <svg class="cw__star" viewBox="0 0 24 24"><path d="M12 4.5l2.3 4.8 5.2.6-3.9 3.6 1 5.2L12 16.1l-4.6 2.6 1-5.2-3.9-3.6 5.2-.6z" /></svg>
        </div>
        <svg class="cw__ico" viewBox="0 0 24 24"><path d="M10 4.5a1.8 1.8 0 0 1 3.6 0V6H17a1 1 0 0 1 1 1v3.4h-1.5a1.8 1.8 0 0 0 0 3.6H18V18a1 1 0 0 1-1 1h-3.4v-1.5a1.8 1.8 0 0 0-3.6 0V19H6.6a1 1 0 0 1-1-1v-3.6h1.5a1.8 1.8 0 0 0 0-3.6H5.6V7a1 1 0 0 1 1-1H10z" /></svg>
        <span class="cw__avatar">E</span>
        <svg class="cw__ico cw__ico--dots" viewBox="0 0 24 24"><circle cx="12" cy="5.5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="18.5" r="1.6" /></svg>
      </div>
    </div>
    <div class="cw__page"><slot /></div>
  </figure>
</template>

<style scoped>
.cw {
  container-type: inline-size;
  margin: 0;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 0 0 1px rgb(0 0 0 / 0.14), 0 2px 6px rgb(3 10 38 / 0.08), 0 28px 70px rgb(3 10 38 / 0.22);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.cw__frame { --u: calc(100cqw / var(--dw)); }
/* Tab strip — Chrome light frame */
.cw__tabs {
  display: flex; align-items: flex-end; gap: calc(var(--u) * 6);
  height: calc(var(--u) * 44); padding: 0 calc(var(--u) * 12) 0 calc(var(--u) * 16);
  background: #DFE3E8;
}
.cw__lights { display: flex; gap: calc(var(--u) * 8); align-self: center; margin-right: calc(var(--u) * 14); }
.cw__lights i { width: calc(var(--u) * 12); height: calc(var(--u) * 12); border-radius: 50%; box-shadow: inset 0 0 0 calc(var(--u) * 0.6) rgb(0 0 0 / 0.12); }
.cw__lights .r { background: #FF5F57; } .cw__lights .y { background: #FEBC2E; } .cw__lights .g { background: #28C840; }
.cw__tab {
  position: relative; display: flex; align-items: center; gap: calc(var(--u) * 9);
  width: calc(var(--u) * 240); height: calc(var(--u) * 36); padding: 0 calc(var(--u) * 10) 0 calc(var(--u) * 12);
  background: #fff; border-radius: calc(var(--u) * 9) calc(var(--u) * 9) 0 0;
}
/* Chrome's flared tab feet */
.cw__tab::before, .cw__tab::after { content: ''; position: absolute; bottom: 0; width: calc(var(--u) * 9); height: calc(var(--u) * 9); background: transparent; }
.cw__tab::before { left: calc(var(--u) * -9); border-bottom-right-radius: calc(var(--u) * 9); box-shadow: calc(var(--u) * 4) calc(var(--u) * 4) 0 calc(var(--u) * 4) #fff; }
.cw__tab::after { right: calc(var(--u) * -9); border-bottom-left-radius: calc(var(--u) * 9); box-shadow: calc(var(--u) * -4) calc(var(--u) * 4) 0 calc(var(--u) * 4) #fff; }
.cw__fav { width: calc(var(--u) * 16); height: calc(var(--u) * 16); border-radius: calc(var(--u) * 3); object-fit: contain; flex: none; }
.cw__fav--letter { display: grid; place-items: center; color: #fff; font-weight: 700; font-size: calc(var(--u) * 10); }
.cw__title { flex: 1; min-width: 0; font-size: calc(var(--u) * 12); color: #1F1F1F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cw__x, .cw__plus, .cw__tabsearch { fill: none; stroke: #474747; stroke-width: 1.4; stroke-linecap: round; flex: none; }
.cw__x { width: calc(var(--u) * 16); height: calc(var(--u) * 16); }
.cw__plus { width: calc(var(--u) * 16); height: calc(var(--u) * 16); align-self: center; margin-left: calc(var(--u) * 10); }
.cw__tabsearch { width: calc(var(--u) * 16); height: calc(var(--u) * 16); align-self: center; }
.cw__grow { flex: 1; }
/* Toolbar */
.cw__bar {
  display: flex; align-items: center; gap: calc(var(--u) * 14);
  height: calc(var(--u) * 40); padding: 0 calc(var(--u) * 14);
  background: #fff; border-bottom: 1px solid #E3E3E3;
}
.cw__ico { width: calc(var(--u) * 18); height: calc(var(--u) * 18); fill: none; stroke: #474747; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.cw__ico--off { stroke: #B9B9B9; }
.cw__ico--dots { fill: #474747; stroke: none; }
.cw__omni {
  flex: 1; min-width: 0; display: flex; align-items: center; gap: calc(var(--u) * 10);
  height: calc(var(--u) * 30); padding: 0 calc(var(--u) * 12); border-radius: 999px; background: #EDF0F2;
}
.cw__tune { width: calc(var(--u) * 16); height: calc(var(--u) * 16); fill: none; stroke: #474747; stroke-width: 1.8; stroke-linecap: round; flex: none; }
.cw__url { flex: 1; min-width: 0; font-size: calc(var(--u) * 13.5); color: #6B6B6B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.005em; }
.cw__url b { font-weight: 400; color: #1F1F1F; }
.cw__star { width: calc(var(--u) * 18); height: calc(var(--u) * 18); fill: none; stroke: #474747; stroke-width: 1.6; stroke-linejoin: round; flex: none; }
.cw__avatar { width: calc(var(--u) * 22); height: calc(var(--u) * 22); border-radius: 50%; display: grid; place-items: center; background: #0B8A7A; color: #fff; font-size: calc(var(--u) * 11); font-weight: 600; flex: none; }
.cw__page { position: relative; background: var(--ds-color-surface-sunken, #F8FAFC); }
</style>
