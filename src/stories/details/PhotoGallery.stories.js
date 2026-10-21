// HOTEL DETAILS / Photo Gallery — the hero photo mosaic at the top of the
// detail screen (GalleryHero), plus the underlying DsImageList grid it reuses
// inside its "See all photos" modal. Photos load from the local imagery library.
import { ref, onMounted, h } from 'vue'
import { loadImagery } from '../../lib/imagery'
import GalleryHero from '../../components/details/GalleryHero.vue'
import DsImageList from '../../components/DsImageList.vue'

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Loads `categories` from the imagery library into [{ src, title }].
function useImages(categories, seed = 0) {
  const items = ref([])
  onMounted(async () => {
    const lib = await loadImagery()
    const out = []
    categories.forEach((c, k) => {
      const arr = lib[c]
      if (arr && arr.length) { const e = arr[(seed + k) % arr.length]; out.push({ src: e.url, title: cap(c) }) }
    })
    items.value = out
  })
  return items
}

const HERO_CATS = ['exterior', 'rooms', 'dining', 'suites', 'bar', 'pool', 'lobby', 'spa', 'bathroom']

export default {
  title: 'Hotel Details/Components/Photo Gallery',
  component: GalleryHero,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Overview
The detail-screen **Photo Gallery** is the **GalleryHero** mosaic (ported from
the prototype): one large lead image spanning two rows on the left, a 2×2
cluster on the right, and a **"See all N photos"** pill that opens a full
gallery modal. The modal's grid reuses the **DsImageList** layout primitive —
see [Layout / Image List](/?path=/docs/layout-image-list--docs).
` } } },
}

/** The hero mosaic — click "See all photos" to open the modal (DsImageList grid). */
export const Default = {
  render: () => ({
    components: { GalleryHero },
    setup() {
      const images = useImages(HERO_CATS)
      return { images }
    },
    template: `<div style="max-width:1180px"><gallery-hero :images="images" :all-images="images" /></div>`,
  }),
}

/** Shorter container — the mosaic with a reduced height. */
export const Compact = {
  render: () => ({
    components: { GalleryHero },
    setup() {
      const images = useImages(HERO_CATS, 3)
      return { images }
    },
    template: `<div style="max-width:920px"><gallery-hero :images="images" :all-images="images" height="300px" /></div>`,
  }),
}

/** The underlying DsImageList grid (what the "See all photos" modal renders). */
export const AllPhotosGrid = {
  render: () => ({
    components: { DsImageList },
    setup() {
      const items = useImages(HERO_CATS)
      return () => h('div', { style: 'max-width:1180px' }, [h(DsImageList, { items: items.value, cols: 3, gap: '8px' })])
    },
  }),
}
