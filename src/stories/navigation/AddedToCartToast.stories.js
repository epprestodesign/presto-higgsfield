// APP SHELL / Added To Cart — the compact "Added to cart" confirmation that
// drops from the nav cart icon after a room is added (Uber Eats style).
import { ref } from 'vue'
import { loadImagery } from '../../lib/imagery'
import AddedToCartToast from '../../components/AddedToCartToast.vue'

const useImg = (cat, seed) => {
  const img = ref('')
  loadImagery().then((lib) => { const arr = lib[cat] || lib.rooms || []; if (arr[seed]) img.value = arr[seed].url })
  return img
}

export default {
  title: 'App Shell/Added To Cart',
  component: AddedToCartToast,
  tags: ['autodocs'],
  parameters: { layout: 'centered', docs: { description: { component: `
The **Added To Cart** popover confirms a room was added — anchored under the nav
cart icon (little arrow up top). Shows the **room type + hotel** just held with a
hotel photo, plus **View cart** / **Go to checkout**. It's presentational: the
host positions it and passes \`auto-dismiss\` (ms) to auto-hide (emits \`dismiss\`).
` } } },
}

/** With a hotel photo. */
export const Default = {
  name: 'Added to Cart',
  render: () => ({
    components: { AddedToCartToast },
    setup: () => ({ img: useImg('exterior', 2) }),
    template: `<added-to-cart-toast room-type="Urban King" hotel="The Concord Hotel Convention Center" :image="img" />`,
  }),
}

/** No photo available — falls back to a room icon tile. */
export const NoPhoto = {
  name: 'No Photo (icon)',
  render: () => ({
    components: { AddedToCartToast },
    template: `<added-to-cart-toast room-type="Double Queen" hotel="Embassy Suites Downtown" />`,
  }),
}
