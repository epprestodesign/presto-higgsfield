// BROWSE HOTELS / Hotel Listing Card — Horizontal (Expedia-style layout).
// A horizontal alternative to the vertical card: a flush 3-image grid on the left
// (1 lead + 2 thumbs, no carousel/gallery) with the SAME data as the Book
// Reservation / Group Block cards on the right — stars, availability status,
// distance, price, CTA, and the expandable Availability panel.
import { ref } from 'vue'
import { loadImagery } from '../../lib/imagery'
import { sampleRooms } from './_rooms-sample.js'
import HotelCardHorizontal from '../../components/browse/HotelCardHorizontal.vue'

// Pull 3 images (different categories) from the imagery library.
const useImages = (specs) => {
  const imgs = ref([])
  loadImagery().then((lib) => {
    imgs.value = specs.map(([cat, seed]) => {
      const arr = lib[cat] || lib.rooms || []
      const e = arr[seed % (arr.length || 1)]
      return e ? { src: e.url, alt: e.alt } : { src: '' }
    })
  })
  return imgs
}

export default {
  title: 'Browse Hotels/Mobile/Hotel Listing Card',
  component: HotelCardHorizontal,
  tags: ['autodocs', 'mobile'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: `
## Hotel Listing Card — Horizontal (Expedia-style)
A horizontal alternative to the vertical hotel card: a **flush 3-image grid** on
the left (one lead + two thumbnails — no carousel, no gallery) with the **same
data** as the Book Reservation / Group Block cards on the right — name, stars,
availability status, distance, price and CTA, plus the expandable **Availability**
panel. Works for both flows via the \`flow\` prop.
` } },
  },
}

const IMAGES = () => useImages([['exterior', 1], ['lobby', 2], ['rooms', 0]])

/** Book Reservation — Fully Available, From/total price, Choose Your Room. */
export const BookReservation = {
  name: 'Book Reservation',
  render: () => ({
    components: { HotelCardHorizontal },
    setup: () => ({ images: IMAGES(), rooms: sampleRooms }),
    template: `<div style="width:390px;margin:0 auto"><hotel-card-horizontal
      flow="reserve" name="The Grand Riverside Hotel" city="Overland Park" :stars="4"
      distance="0.3 mi from Main Arena" :preferred="true" availability="available"
      :from-nightly="189" :total="756" :rooms="rooms" :images="images" /></div>`,
  }),
}

/** Group Block — matches request, Starting Price, Select Rooms. */
export const GroupBlock = {
  name: 'Group Block',
  render: () => ({
    components: { HotelCardHorizontal },
    setup: () => ({ images: IMAGES(), rooms: sampleRooms }),
    template: `<div style="width:390px;margin:0 auto"><hotel-card-horizontal
      flow="group" name="Omni Downtown Suites" city="Lenexa" :stars="4.5"
      distance="0.6 mi from Main Arena" availability="matches" :rooms-available="11"
      :starting-price="219" :rooms="rooms" :images="images" /></div>`,
  }),
}

/** Availability panel expanded — the shared per-night rooms-left carousel. */
export const AvailabilityOpen = {
  name: 'Availability Open',
  render: () => ({
    components: { HotelCardHorizontal },
    setup: () => ({ images: IMAGES(), rooms: sampleRooms }),
    template: `<div style="width:390px;margin:0 auto"><hotel-card-horizontal
      flow="reserve" name="The Grand Riverside Hotel" city="Overland Park" :stars="4"
      distance="0.3 mi from Main Arena" availability="available" :from-nightly="189"
      :total="756" :rooms="rooms" :open-availability="true" :images="images" /></div>`,
  }),
}
