// useHistory — undo / redo for the Studio editor.
//
// Snapshots the whole project document (it is plain, serializable JSON) after
// edits settle, via the project store's $subscribe. A burst of keystrokes in
// one field becomes ONE history step. Undo/redo restore through the store's
// `load` action, so history never mutates state behind the store's back.
import { ref, computed, onBeforeUnmount } from 'vue'

export function useHistory(store, { limit = 60, debounceMs = 400 } = {}) {
  const past = ref([])
  const future = ref([])
  const pending = ref(false) // an edit is still settling (counts as undoable)
  let current = JSON.stringify(store.project)
  let applying = false
  let timer = null

  function commit() {
    clearTimeout(timer)
    timer = null
    pending.value = false
    const next = JSON.stringify(store.project)
    if (next === current) return
    past.value.push(current)
    if (past.value.length > limit) past.value.shift()
    current = next
    future.value = []
  }

  // flush: 'sync' so the `applying` guard covers the load() mutation itself.
  const stop = store.$subscribe(
    () => {
      if (applying) return
      clearTimeout(timer)
      timer = setTimeout(commit, debounceMs)
      pending.value = true
    },
    { flush: 'sync' },
  )

  function apply(json) {
    applying = true
    try {
      store.load(json)
    } finally {
      applying = false
    }
    current = json
  }

  function undo() {
    if (timer) commit() // fold in the edit that is still settling
    if (!past.value.length) return false
    future.value.push(current)
    apply(past.value.pop())
    return true
  }

  function redo() {
    if (timer) commit()
    if (!future.value.length) return false
    past.value.push(current)
    apply(future.value.pop())
    return true
  }

  onBeforeUnmount(() => {
    clearTimeout(timer)
    stop()
  })

  return {
    undo,
    redo,
    canUndo: computed(() => past.value.length > 0 || pending.value),
    canRedo: computed(() => future.value.length > 0),
    depth: computed(() => past.value.length),
  }
}
