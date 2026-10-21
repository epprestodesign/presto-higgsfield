<script setup>
// IPhone — a realistic iPhone (Pro-style) around a mobile page mockup:
// titanium edge + side buttons, Dynamic Island, iOS status bar (9:41, signal,
// Wi-Fi, battery), Safari's compact bottom address bar and the home indicator.
//
// Everything is sized in design points (--u = 1/(screen+bezel) of the width,
// via container units) so the whole handset scales as one, like a product shot.
// The page slot renders at `screenWidth` design px (390 = iPhone 12–15).
import { computed } from 'vue'
import ScaledFrame from '../marketing/ScaledFrame.vue'

const props = defineProps({
  screenWidth: { type: Number, default: 390 },
  pageHeight: { type: Number, default: 700 }, // visible page height between status bar and Safari bar
  url: { type: String, default: 'demo.eventpipe.com' },
  time: { type: String, default: '9:41' },
  safari: { type: Boolean, default: true },
  label: { type: String, default: 'iPhone preview' },
})

const BEZEL = 12
const host = computed(() => props.url.replace(/^https?:\/\//, '').split('/')[0])
</script>

<template>
  <figure class="ip" :style="{ '--dw': screenWidth + BEZEL * 2 + 4 }" :aria-label="label">
    <div class="ip__u">
      <!-- side buttons -->
      <span class="ip__btn ip__btn--action" aria-hidden="true" />
      <span class="ip__btn ip__btn--volup" aria-hidden="true" />
      <span class="ip__btn ip__btn--voldn" aria-hidden="true" />
      <span class="ip__btn ip__btn--power" aria-hidden="true" />
      <div class="ip__titanium">
        <div class="ip__bezel">
          <div class="ip__screen">
            <!-- status bar -->
            <div class="ip__status" aria-hidden="true">
              <span class="ip__time">{{ time }}</span>
              <span class="ip__island" />
              <span class="ip__sys">
                <svg viewBox="0 0 18 12" class="ip__signal"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
                <svg viewBox="0 0 16 12" class="ip__wifi"><path d="M8 11.5l2.2-2.6a3.2 3.2 0 0 0-4.4 0z" /><path d="M3.5 6.6l1.4 1.6a4.6 4.6 0 0 1 6.2 0l1.4-1.6a6.7 6.7 0 0 0-9 0z" /><path d="M1 3.9l1.4 1.6a8.3 8.3 0 0 1 11.2 0L15 3.9a10.4 10.4 0 0 0-14 0z" /></svg>
                <span class="ip__battery"><i /></span>
              </span>
            </div>
            <!-- page -->
            <div class="ip__page">
              <scaled-frame :design-width="screenWidth" :design-height="pageHeight">
                <slot />
              </scaled-frame>
            </div>
            <!-- Safari compact bottom bar -->
            <div v-if="safari" class="ip__safari" aria-hidden="true">
              <div class="ip__address">
                <span class="ip__aa">AA</span>
                <span class="ip__host"><svg viewBox="0 0 12 14" class="ip__lock"><rect x="1.5" y="6" width="9" height="7" rx="1.6" /><path d="M3.6 6V4.4a2.4 2.4 0 0 1 4.8 0V6" fill="none" stroke-width="1.4" /></svg>{{ host }}</span>
                <svg viewBox="0 0 16 16" class="ip__reload"><path d="M13 8a5 5 0 1 1-1.5-3.55M13 2.5v3h-3" /></svg>
              </div>
              <div class="ip__tools">
                <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>
                <svg viewBox="0 0 24 24" class="off"><path d="M9 5l7 7-7 7" /></svg>
                <svg viewBox="0 0 24 24"><path d="M12 15V4m-4 4l4-4 4 4M6 11v8h12v-8" /></svg>
                <svg viewBox="0 0 24 24"><path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H11v15H6.5A1.5 1.5 0 0 1 5 17.5zM13 4h4.5A1.5 1.5 0 0 1 19 5.5v12a1.5 1.5 0 0 1-1.5 1.5H13z" /></svg>
                <svg viewBox="0 0 24 24"><rect x="4" y="7" width="12" height="12" rx="2" /><path d="M8 7V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" /></svg>
              </div>
            </div>
            <span class="ip__home" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  </figure>
</template>

<style scoped>
.ip { container-type: inline-size; margin: 0; position: relative; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif; }
.ip__u { --u: calc(100cqw / var(--dw)); position: relative; padding: 0 calc(var(--u) * 2); }
/* Titanium band → black bezel → screen */
.ip__titanium {
  border-radius: calc(var(--u) * 64);
  padding: calc(var(--u) * 2);
  background: linear-gradient(145deg, #D6D3CE 0%, #8C8A86 22%, #4A4947 50%, #8C8A86 78%, #CFCCC7 100%);
  box-shadow: 0 2px 6px rgb(3 10 38 / 0.18), 0 30px 70px rgb(3 10 38 / 0.32);
}
.ip__bezel { border-radius: calc(var(--u) * 62); padding: calc(var(--u) * 12); background: #050506; box-shadow: inset 0 0 0 calc(var(--u) * 1) rgb(255 255 255 / 0.06); }
.ip__screen { position: relative; border-radius: calc(var(--u) * 50); overflow: hidden; background: #fff; }
.ip__btn { position: absolute; width: calc(var(--u) * 4); border-radius: calc(var(--u) * 2); background: linear-gradient(90deg, #6E6C69, #B9B6B1); z-index: 0; }
.ip__btn--action { left: 0; top: calc(var(--u) * 116); height: calc(var(--u) * 32); }
.ip__btn--volup { left: 0; top: calc(var(--u) * 170); height: calc(var(--u) * 58); }
.ip__btn--voldn { left: 0; top: calc(var(--u) * 240); height: calc(var(--u) * 58); }
.ip__btn--power { right: 0; top: calc(var(--u) * 196); height: calc(var(--u) * 92); }
/* Status bar */
.ip__status {
  position: relative; z-index: 4; height: calc(var(--u) * 54);
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  padding: 0 calc(var(--u) * 28) 0 calc(var(--u) * 34); background: #fff; color: #000;
}
.ip__time { font-size: calc(var(--u) * 17); font-weight: 600; letter-spacing: -0.01em; }
.ip__island { width: calc(var(--u) * 124); height: calc(var(--u) * 36); border-radius: 999px; background: #000; }
.ip__sys { justify-self: end; display: flex; align-items: center; gap: calc(var(--u) * 6); }
.ip__signal { width: calc(var(--u) * 18); height: calc(var(--u) * 12); fill: #000; }
.ip__wifi { width: calc(var(--u) * 16); height: calc(var(--u) * 12); fill: #000; }
.ip__battery { position: relative; width: calc(var(--u) * 25); height: calc(var(--u) * 12); border-radius: calc(var(--u) * 3.5); border: calc(var(--u) * 1) solid rgb(0 0 0 / 0.4); padding: calc(var(--u) * 1.5); }
.ip__battery::after { content: ''; position: absolute; right: calc(var(--u) * -3.5); top: calc(var(--u) * 3.5); width: calc(var(--u) * 1.6); height: calc(var(--u) * 4); border-radius: 0 2px 2px 0; background: rgb(0 0 0 / 0.4); }
.ip__battery i { display: block; height: 100%; width: 82%; border-radius: calc(var(--u) * 2); background: #000; }
.ip__page { position: relative; z-index: 1; }
/* Safari bottom bar */
.ip__safari { position: relative; z-index: 4; background: rgb(249 249 249 / 0.96); border-top: 1px solid rgb(0 0 0 / 0.08); padding: calc(var(--u) * 8) calc(var(--u) * 14) calc(var(--u) * 30); }
.ip__address { display: flex; align-items: center; gap: calc(var(--u) * 10); height: calc(var(--u) * 44); padding: 0 calc(var(--u) * 14); border-radius: calc(var(--u) * 14); background: #fff; box-shadow: 0 calc(var(--u) * 1) calc(var(--u) * 6) rgb(0 0 0 / 0.12); }
.ip__aa { font-size: calc(var(--u) * 15); font-weight: 600; color: #000; letter-spacing: -0.03em; }
.ip__host { flex: 1; display: flex; align-items: center; justify-content: center; gap: calc(var(--u) * 5); font-size: calc(var(--u) * 16); color: #000; white-space: nowrap; overflow: hidden; }
.ip__lock { width: calc(var(--u) * 10); height: calc(var(--u) * 12); fill: #6B6B6B; stroke: #6B6B6B; flex: none; }
.ip__reload { width: calc(var(--u) * 17); height: calc(var(--u) * 17); fill: none; stroke: #000; stroke-width: 1.6; stroke-linecap: round; }
.ip__tools { display: flex; justify-content: space-between; padding: calc(var(--u) * 10) calc(var(--u) * 10) 0; }
.ip__tools svg { width: calc(var(--u) * 24); height: calc(var(--u) * 24); fill: none; stroke: #007AFF; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.ip__tools svg.off { stroke: #C7C7CC; }
.ip__home { position: absolute; z-index: 5; left: 50%; bottom: calc(var(--u) * 8); width: calc(var(--u) * 140); height: calc(var(--u) * 5); margin-left: calc(var(--u) * -70); border-radius: 999px; background: #000; }
</style>
