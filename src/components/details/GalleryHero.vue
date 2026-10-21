<script setup>
// GalleryHero — the hero photo mosaic at the top of the hotel detail screen
// (ported from the prototype): one large image spanning two rows on the left
// with a 2×2 cluster on the right, and a "See all N photos" pill that opens a
// full gallery modal. The modal grid reuses the DsImageList primitive.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import DsImageList from '../DsImageList.vue'

const $q = useQuasar()
// Phones: the gallery is a single top-down column (scroll through every photo);
// desktop keeps the 3-up grid.
const modalCols = computed(() => ($q.screen.lt.sm ? 1 : 3))

const props = defineProps({
  images: { type: Array, default: () => [] },       // [{ src, title }] — mosaic uses up to 5
  allImages: { type: Array, default: () => [] },     // modal grid; defaults to `images`
  modalTitle: { type: String, default: 'Photo gallery' },
  height: { type: String, default: '380px' },
})

const mosaic = computed(() => props.images.slice(0, 5))
const all = computed(() => (props.allImages.length ? props.allImages : props.images))
const totalCount = computed(() => all.value.length)

const open = ref(false)
const show = () => { open.value = true }
const close = () => { open.value = false }
const onKey = (e) => { if (e.key === 'Escape') close() }
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="gh">
    <div class="gh__grid" :style="{ height }">
      <div
        v-for="(img, i) in mosaic"
        :key="i"
        class="gh__cell"
        :class="{ 'gh__cell--lead': i === 0, 'gh__cell--more': i === mosaic.length - 1 }"
        role="button"
        tabindex="0"
        @click="show"
        @keydown.enter="show"
      >
        <img :src="img.src" :alt="img.title || ''" class="gh__img" />
        <button
          v-if="i === mosaic.length - 1 && totalCount"
          type="button"
          class="gh__pill"
          @click="show"
        ><q-icon name="photo_library" size="16px" /> See all {{ totalCount }} photos</button>
      </div>
    </div>

    <!-- Phones: a single static hero photo — no carousel. The pinned pill is the
         only way to browse the set, and it opens the full-screen all-photos view. -->
    <button v-if="totalCount" type="button" class="gh__pill gh__pill--fixed" @click="show"><q-icon name="photo_library" size="16px" /> See all {{ totalCount }} photos</button>

    <!-- All-photos modal — grid reuses DsImageList -->
    <div v-if="open" class="gh__modal" @click.self="close">
      <div class="gh__dialog" role="dialog" aria-modal="true" :aria-label="modalTitle">
        <div class="gh__head">
          <h2 class="gh__title">{{ modalTitle }}</h2>
          <button type="button" class="gh__close" aria-label="Close gallery" @click="close"><q-icon name="close" size="22px" /></button>
        </div>
        <div class="gh__body">
          <ds-image-list :items="all" :cols="modalCols" gap="8px" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gh__grid { display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8px; border-radius: var(--ds-radius-lg); overflow: hidden; }
.gh__cell { position: relative; min-height: 0; background: var(--ds-palette-slate-100); cursor: pointer; }
.gh__cell--lead { grid-row: 1 / 3; }
.gh__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.gh__pill { position: absolute; right: 12px; bottom: 12px; display: inline-flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.6); color: #fff; border: 0; border-radius: var(--ds-radius-pill); padding: 6px 14px; font-family: inherit; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: background var(--ds-duration-fast) var(--ds-ease-standard); }
.gh__pill:hover { background: rgba(0,0,0,0.78); }

/* The .gh box is the positioning context for the pinned pill, which is hidden on
   desktop (the mosaic shows its own in-cell pill). */
.gh { position: relative; }
/* The pinned pill reuses .gh__pill (dark, bottom-right) but anchors to .gh rather
   than a single cell, so it sits on the phone hero photo. */
.gh__pill--fixed { display: none; z-index: 2; }

/* Modal */
.gh__modal { position: fixed; inset: 0; z-index: 3000; background: rgba(9,9,11,0.45); display: flex; align-items: center; justify-content: center; padding: 24px; }
.gh__dialog { background: var(--ds-color-surface); width: 920px; max-width: 94vw; max-height: 90vh; border-radius: var(--ds-radius-lg); box-shadow: var(--ds-shadow-4); display: flex; flex-direction: column; overflow: hidden; }
.gh__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--ds-color-border); }
.gh__title { font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--ds-color-text); }
.gh__close { width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--ds-palette-slate-100); color: var(--ds-color-text); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.gh__close:hover { background: var(--ds-palette-slate-200); }
.gh__body { padding: 20px; overflow-y: auto; }

@media (max-width: 860px) {
  .gh__grid { grid-template-columns: 1fr 1fr; height: auto !important; }
  .gh__cell--lead { grid-row: auto; }
  .gh__cell { aspect-ratio: 4 / 3; }
}
/* Phones (<600px): ONE static hero photo — no carousel, no swiping, no arrows.
   Browsing happens only through "See all N photos", which opens the full-screen
   modal. The photo runs square to the screen edges (no rounding), matching
   production's details header. */
@media (max-width: 600px) {
  .gh__grid { display: block; border-radius: 0; height: auto !important; }
  .gh__cell { aspect-ratio: 4 / 3; }
  .gh__cell--lead { grid-row: auto; }
  /* Only the lead photo shows; the rest live in the all-photos modal. */
  .gh__cell:not(.gh__cell--lead) { display: none; }
  /* Show the pinned pill; hide the per-cell one. */
  .gh__pill--fixed { display: inline-flex; }
  .gh__cell .gh__pill { display: none; }
  .gh__modal { padding: 0; }
  .gh__dialog { width: 100vw; max-width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; }
}
</style>
