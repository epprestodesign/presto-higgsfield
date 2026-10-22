<script setup>
// ChromeMobile — Google Chrome for iOS around a live mobile page: iOS status
// bar + Dynamic Island, Chrome's top address pill (Gemini sparkle · host ·
// share) and bottom toolbar (back · forward · new tab · tabs · menu).
//
// Like the real app, scrolling down collapses the chrome to a small host line
// and slides the toolbar away; scrolling up (or tapping the host) restores it.
// The host drives `collapsed` from the page's scroll and handles back/forward.
//
// Sized in design px for a 390 × 844 screen; the parent scales it as a whole
// (`scale`). The page slot gets a fixed 390 × PAGE_H viewport.
import { computed } from 'vue'

const props = defineProps({
  url: { type: String, default: 'demo.eventpipe.com' },
  collapsed: { type: Boolean, default: false },
  canBack: { type: Boolean, default: false },
  canForward: { type: Boolean, default: false },
  scale: { type: Number, default: 1 },
  time: { type: String, default: '9:41' },
})
const emit = defineEmits(['back', 'forward', 'expand'])

const host = computed(() => props.url.replace(/^https?:\/\//, '').split('/')[0])
</script>

<script>
// Design px (iPhone 12–15: 390 × 844).
export const SCREEN_W = 390
export const SCREEN_H = 844
export const STATUS_H = 54
export const BAR_H = 62 // expanded address bar
export const BAR_MIN_H = 30 // collapsed host line
export const PAGE_H = SCREEN_H - STATUS_H - BAR_MIN_H
</script>

<template>
  <div
    class="cm" :class="{ 'is-collapsed': collapsed }"
    :style="{ width: `${SCREEN_W}px`, height: `${SCREEN_H}px`, transform: `scale(${scale})` }"
  >
    <!-- iOS status bar -->
    <div class="cm__status" aria-hidden="true">
      <span class="cm__time">{{ time }}</span>
      <span class="cm__island" />
      <span class="cm__sys">
        <svg viewBox="0 0 18 12" class="cm__signal"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" opacity="0.3" /></svg>
        <svg viewBox="0 0 16 12" class="cm__wifi"><path d="M8 11.5l2.2-2.6a3.2 3.2 0 0 0-4.4 0z" /><path d="M3.5 6.6l1.4 1.6a4.6 4.6 0 0 1 6.2 0l1.4-1.6a6.7 6.7 0 0 0-9 0z" /><path d="M1 3.9l1.4 1.6a8.3 8.3 0 0 1 11.2 0L15 3.9a10.4 10.4 0 0 0-14 0z" /></svg>
        <span class="cm__battery"><i /></span>
      </span>
    </div>

    <!-- Address bar: pill when expanded, host line when collapsed -->
    <div class="cm__bar" :style="{ height: `${collapsed ? BAR_MIN_H : BAR_H}px` }">
      <button v-if="collapsed" type="button" class="cm__mini" :aria-label="`${host}, show browser controls`" @click="emit('expand')">{{ host }}</button>
      <div v-else class="cm__pill" aria-hidden="true">
        <svg viewBox="0 0 24 24" class="cm__spark"><path d="M12 2.5c.5 4.9 4.6 9 9.5 9.5-4.9.5-9 4.6-9.5 9.5-.5-4.9-4.6-9-9.5-9.5 4.9-.5 9-4.6 9.5-9.5z" /></svg>
        <span class="cm__host">{{ host }}</span>
        <svg viewBox="0 0 24 24" class="cm__share"><path d="M12 15V3.5m-4 4l4-4 4 4M7 10H5.5v10.5h13V10H17" /></svg>
      </div>
    </div>

    <!-- Page -->
    <div class="cm__page" :style="{ top: `${STATUS_H + (collapsed ? BAR_MIN_H : BAR_H)}px`, height: `${PAGE_H}px` }">
      <slot />
    </div>

    <!-- Bottom toolbar -->
    <nav class="cm__tools" aria-label="Browser controls">
      <button type="button" class="cm__tool" :disabled="!canBack" aria-label="Back" @click="emit('back')">
        <svg viewBox="0 0 24 24"><path d="M20 12H4.5m6-6.5L4 12l6.5 6.5" /></svg>
      </button>
      <button type="button" class="cm__tool" :disabled="!canForward" aria-label="Forward" @click="emit('forward')">
        <svg viewBox="0 0 24 24"><path d="M4 12h15.5m-6-6.5L20 12l-6.5 6.5" /></svg>
      </button>
      <span class="cm__tool cm__tool--new" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></span>
      <span class="cm__tool" aria-hidden="true"><span class="cm__tabs">1</span></span>
      <span class="cm__tool" aria-hidden="true"><svg viewBox="0 0 24 24" class="cm__dots"><circle cx="5" cy="12" r="1.9" /><circle cx="12" cy="12" r="1.9" /><circle cx="19" cy="12" r="1.9" /></svg></span>
    </nav>
    <span class="cm__home" aria-hidden="true" />
  </div>
</template>

<style scoped>
.cm {
  --cm-ease: cubic-bezier(0.2, 0, 0, 1);
  --cm-dur: 220ms;
  position: relative; overflow: hidden; transform-origin: 0 0; background: #fff; color: #000;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
}
/* Status bar */
.cm__status { position: absolute; z-index: 4; inset: 0 0 auto; height: 54px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 0 28px 0 36px; background: #fff; }
.cm__time { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
.cm__island { width: 124px; height: 36px; border-radius: 999px; background: #000; }
.cm__sys { justify-self: end; display: flex; align-items: center; gap: 6px; }
.cm__signal { width: 18px; height: 12px; fill: #000; }
.cm__wifi { width: 16px; height: 12px; fill: #000; }
.cm__battery { position: relative; width: 25px; height: 12px; border-radius: 3.5px; border: 1px solid rgb(0 0 0 / 0.4); padding: 1.5px; }
.cm__battery::after { content: ''; position: absolute; right: -3.5px; top: 3px; width: 1.6px; height: 4px; border-radius: 0 2px 2px 0; background: rgb(0 0 0 / 0.4); }
.cm__battery i { display: block; height: 100%; width: 60%; border-radius: 2px; background: #000; }

/* Address bar */
.cm__bar {
  position: absolute; z-index: 3; top: 54px; left: 0; right: 0;
  display: flex; align-items: center; justify-content: center; padding: 0 12px 6px;
  background: #fff; box-shadow: 0 1px 0 rgb(0 0 0 / 0.12);
  transition: height var(--cm-dur) var(--cm-ease);
}
.cm__pill { flex: 1; display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; height: 48px; border-radius: 999px; background: #ECEDF1; }
.cm__spark { justify-self: center; width: 22px; height: 22px; fill: none; stroke: #5F6368; stroke-width: 1.6; stroke-linejoin: round; }
.cm__host { text-align: center; font-size: 18px; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cm__share { justify-self: center; width: 22px; height: 22px; fill: none; stroke: #5F6368; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.cm__mini { margin: 0; padding: 0 16px 2px; border: 0; background: none; font: inherit; font-size: 14px; color: #000; cursor: pointer; }

/* Page */
.cm__page { position: absolute; z-index: 1; left: 0; right: 0; transition: top var(--cm-dur) var(--cm-ease); }

/* Bottom toolbar */
.cm__tools {
  position: absolute; z-index: 3; left: 0; right: 0; bottom: 0; height: 84px;
  display: grid; grid-template-columns: repeat(5, 1fr); align-items: start; padding: 6px 10px 0;
  background: #fff; box-shadow: 0 -1px 0 rgb(0 0 0 / 0.12);
  transition: transform var(--cm-dur) var(--cm-ease);
}
.cm.is-collapsed .cm__tools { transform: translateY(100%); }
.cm__tool { display: flex; align-items: center; justify-content: center; height: 44px; margin: 0; padding: 0; border: 0; background: none; color: #3C4043; }
button.cm__tool { cursor: pointer; }
button.cm__tool:disabled { color: #BDC1C6; cursor: default; }
.cm__tool svg { width: 28px; height: 28px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.cm__tool--new svg { width: 46px; height: 46px; padding: 11px; border-radius: 999px; background: #E8EAED; }
.cm__tool .cm__dots { fill: currentColor; stroke: none; }
.cm__tabs { display: grid; place-items: center; width: 25px; height: 25px; border: 2px solid currentColor; border-radius: 6px; font-size: 13px; font-weight: 600; }
.cm__home { position: absolute; z-index: 5; left: 50%; bottom: 8px; width: 140px; height: 5px; margin-left: -70px; border-radius: 999px; background: #000; }

@media (prefers-reduced-motion: reduce) {
  .cm__bar, .cm__page, .cm__tools { transition: none; }
}
</style>
