<script setup>
// DsTransferList — move items between two lists (MUI "Transfer List").
// No Quasar equivalent; composed from two QList panels + move controls.
import { ref } from 'vue'
const props = defineProps({
  left: { type: Array, default: () => [] },
  right: { type: Array, default: () => [] },
})
const leftItems = ref([...props.left])
const rightItems = ref([...props.right])
const leftSel = ref([])
const rightSel = ref([])

const move = (from, to, sel) => {
  to.value.push(...from.value.filter((i) => sel.value.includes(i)))
  from.value = from.value.filter((i) => !sel.value.includes(i))
  sel.value = []
}
const toggle = (sel, item) => {
  const i = sel.value.indexOf(item)
  i === -1 ? sel.value.push(item) : sel.value.splice(i, 1)
}
</script>
<template>
  <div class="dtl row items-center q-gutter-md">
    <q-list class="dtl__list" bordered separator style="width:200px;border-radius:4px;overflow:hidden">
      <q-item v-for="it in leftItems" :key="it" clickable :active="leftSel.includes(it)"
        active-class="bg-primary text-white" @click="toggle(leftSel, it)">
        <q-item-section>{{ it }}</q-item-section>
      </q-item>
    </q-list>
    <div class="dtl__moves column q-gutter-sm">
      <q-btn dense outline color="primary" icon="chevron_right"
        :disable="!leftSel.length" @click="move(leftItems, rightItems, leftSel)" />
      <q-btn dense outline color="primary" icon="chevron_left"
        :disable="!rightSel.length" @click="move(rightItems, leftItems, rightSel)" />
    </div>
    <q-list class="dtl__list" bordered separator style="width:200px;border-radius:4px;overflow:hidden">
      <q-item v-for="it in rightItems" :key="it" clickable :active="rightSel.includes(it)"
        active-class="bg-primary text-white" @click="toggle(rightSel, it)">
        <q-item-section>{{ it }}</q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<style scoped>
/* Phones: stack the two lists full-width with a horizontal move-button row
   between them (side-by-side is ~450px). !important overrides the inline 200px. */
@media (max-width: 600px) {
  .dtl { flex-direction: column; align-items: stretch; }
  .dtl__list { width: 100% !important; }
  .dtl__moves { flex-direction: row; justify-content: center; }
}
</style>
