<script setup>
// OptionELogoMarquee — infinite logo strip for the Option E homepage. The list
// is rendered twice and the track slides by half its width, so the loop is
// seamless; hover pauses it, and reduced motion shows one static row.
// Logos are placeholders (supplied references), flagged as such on the page.
import amazon from '../../../assets/marketing/option-e/marquee/amazon.svg'
import disney from '../../../assets/marketing/option-e/marquee/disney.svg'
import accenture from '../../../assets/marketing/option-e/marquee/accenture.svg'
import microsoft from '../../../assets/marketing/option-e/marquee/microsoft.svg'
import deloitte from '../../../assets/marketing/option-e/marquee/deloitte.svg'
import ey from '../../../assets/marketing/option-e/marquee/ey.svg'
import airbus from '../../../assets/marketing/option-e/marquee/airbus.svg'
import cisco from '../../../assets/marketing/option-e/marquee/cisco.svg'
import toyota from '../../../assets/marketing/option-e/marquee/toyota.svg'

defineProps({
  // Seconds for one full loop.
  duration: { type: Number, default: 38 },
})

const LOGOS = [
  { name: 'Amazon', src: amazon },
  { name: 'Disney', src: disney },
  { name: 'Accenture', src: accenture },
  { name: 'Microsoft', src: microsoft },
  { name: 'Deloitte', src: deloitte },
  { name: 'EY', src: ey },
  { name: 'Airbus', src: airbus },
  { name: 'Cisco', src: cisco },
  { name: 'Toyota', src: toyota },
]
</script>

<template>
  <div class="olm" :style="{ '--olm-duration': `${duration}s` }">
    <div class="olm__track">
      <ul v-for="copy in 2" :key="copy" class="olm__set" :aria-hidden="copy === 2 ? 'true' : undefined">
        <li v-for="l in LOGOS" :key="l.name"><img :src="l.src" :alt="copy === 1 ? l.name : ''" width="168" height="112" /></li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.olm {
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
}
.olm__track { display: flex; width: max-content; animation: olm-slide var(--olm-duration) linear infinite; }
.olm:hover .olm__track { animation-play-state: paused; }
.olm__set { display: flex; align-items: center; gap: 72px; margin: 0; padding: 0 36px; list-style: none; }
/* The SVGs carry generous built-in padding, so the box is taller than the mark. */
.olm__set img { display: block; height: 112px; width: auto; }
@keyframes olm-slide { to { transform: translateX(-50%); } }

@media (max-width: 640px) {
  .olm__set { gap: 44px; padding: 0 22px; }
  .olm__set img { height: 88px; }
}
@media (prefers-reduced-motion: reduce) {
  .olm { mask-image: none; }
  .olm__track { animation: none; width: auto; }
  .olm__set { flex-wrap: wrap; justify-content: center; row-gap: 0; }
  .olm__set[aria-hidden] { display: none; }
}
</style>
