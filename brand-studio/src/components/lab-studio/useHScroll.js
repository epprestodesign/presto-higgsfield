// A horizontally scrolling row (suggestion chips, banner strips). Trackpad and
// Magic Mouse swipes scroll it natively; an up/down wheel is turned into
// left/right; with { drag: true } a mouse can click and drag it too (a drag
// doesn't count as a click on what's under it). The returned classes fade
// whichever edge has more to see.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import './hScroll.css'

export function useHScroll({ drag = false } = {}) {
  const el = ref(null)
  const atStart = ref(true)
  const atEnd = ref(true)

  function update() {
    const r = el.value
    if (!r) return
    atStart.value = r.scrollLeft <= 1
    atEnd.value = r.scrollLeft + r.clientWidth >= r.scrollWidth - 1
  }
  function onWheel(e) {
    const r = el.value
    if (!r || r.scrollWidth <= r.clientWidth) return
    // Sideways swipes already scroll; only redirect a vertical wheel.
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
    const max = r.scrollWidth - r.clientWidth
    if ((e.deltaY < 0 && r.scrollLeft <= 0) || (e.deltaY > 0 && r.scrollLeft >= max)) return
    e.preventDefault()
    r.scrollLeft += e.deltaY
  }

  // Click-and-drag with a mouse (touch already scrolls natively).
  const dragging = ref(false)
  let start = null
  function onPointerDown(e) {
    if (!drag || e.pointerType !== 'mouse' || e.button !== 0) return
    start = { x: e.clientX, left: el.value.scrollLeft, moved: false }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp, { once: true })
  }
  function onPointerMove(e) {
    if (!start) return
    const dx = e.clientX - start.x
    if (!start.moved && Math.abs(dx) < 5) return
    start.moved = true
    dragging.value = true
    el.value.scrollLeft = start.left - dx
  }
  function onPointerUp() {
    window.removeEventListener('pointermove', onPointerMove)
    if (start?.moved) {
      // Swallow the click that ends a drag so it doesn't pick a thumbnail.
      const stop = (ev) => { ev.stopPropagation(); ev.preventDefault() }
      el.value?.addEventListener('click', stop, { capture: true, once: true })
      setTimeout(() => el.value?.removeEventListener('click', stop, { capture: true }), 0)
    }
    start = null
    dragging.value = false
  }
  onBeforeUnmount(() => window.removeEventListener('pointermove', onPointerMove))

  /** Scroll a child into view (centered) if it's outside the row. */
  function reveal(child, { smooth = true } = {}) {
    const r = el.value
    if (!r || !child) return
    const a = r.getBoundingClientRect()
    const c = child.getBoundingClientRect()
    if (c.left >= a.left + 24 && c.right <= a.right - 24) return
    r.scrollTo({ left: r.scrollLeft + (c.left + c.width / 2) - (a.left + a.width / 2), behavior: smooth ? 'smooth' : 'auto' })
  }

  // Track the row's size; it may appear later (e.g. inside a dialog).
  let ro
  onMounted(() => { ro = new ResizeObserver(update); if (el.value) ro.observe(el.value); nextTick(update) })
  watch(el, (now, before) => {
    if (before) ro?.unobserve(before)
    if (now) { ro?.observe(now); nextTick(update) }
  })
  onBeforeUnmount(() => ro?.disconnect())

  const classes = computed(() => ({ 'hs--fade-l': !atStart.value, 'hs--fade-r': !atEnd.value, 'hs--drag': drag && !(atStart.value && atEnd.value), 'is-dragging': dragging.value }))
  return { el, onScroll: update, onWheel, onPointerDown, classes, update, reveal }
}
