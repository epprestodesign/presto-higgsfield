<script setup>
// AssetDropzone — drag & drop (or browse) image upload for logos and brand
// photography. Files are validated against UPLOAD_LIMITS, read locally with
// FileReader into data: URLs (nothing leaves the browser in Phase 1; Phase 2
// uploads to Supabase Storage), and emitted as BrandAsset objects.
import { ref, computed, useId } from 'vue'
import { uid } from '../../models/ids.js'
import { UPLOAD_LIMITS, validateUpload } from '../../models/brandKit.js'

const props = defineProps({
  kind: { type: String, default: 'photo' }, // 'logo' | 'photo'
  label: { type: String, default: 'Upload images' },
  hint: { type: String, default: '' },
  multiple: { type: Boolean, default: false },
  maxFiles: { type: Number, default: 8 },
  // Current assets (shown as previews with a remove button).
  assets: { type: Array, default: () => [] },
  compact: { type: Boolean, default: false },
})
const emit = defineEmits(['add', 'remove'])

const id = useId()
const input = ref(null)
const dragging = ref(false)
const reading = ref(false)
const error = ref('')

const rule = computed(() => UPLOAD_LIMITS[props.kind] || UPLOAD_LIMITS.photo)
const typesLabel = computed(() =>
  rule.value.types.map((t) => t.replace('image/', '').replace('svg+xml', 'SVG').replace('jpeg', 'JPG').toUpperCase()).join(', '),
)
const limitLabel = computed(() => `${typesLabel.value} · up to ${Math.round(rule.value.maxBytes / 1024 / 1024)} MB`)
const full = computed(() => !props.multiple ? false : props.assets.length >= props.maxFiles)

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })

async function handleFiles(fileList) {
  error.value = ''
  const files = Array.from(fileList || [])
  if (!files.length) return
  const room = props.multiple ? props.maxFiles - props.assets.length : 1
  const take = files.slice(0, Math.max(0, room))
  if (files.length > take.length) error.value = `You can add up to ${props.maxFiles} images.`
  reading.value = true
  try {
    for (const file of take) {
      const problem = validateUpload(file, props.kind)
      if (problem) { error.value = `${file.name}: ${problem}`; continue }
      const src = await readAsDataUrl(file)
      emit('add', {
        id: uid('ast'),
        src,
        alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
        kind: props.kind,
        name: file.name,
        size: file.size,
      })
    }
  } catch {
    error.value = 'We could not read that file. Try a different image.'
  } finally {
    reading.value = false
    if (input.value) input.value.value = ''
  }
}

const browse = () => input.value?.click()
const onDrop = (e) => { dragging.value = false; handleFiles(e.dataTransfer?.files) }
</script>

<template>
  <div class="adz" :class="{ 'adz--compact': compact }">
    <div v-if="assets.length" class="adz__previews" :class="`adz__previews--${kind}`">
      <figure v-for="a in assets" :key="a.id" class="adz__preview">
        <img :src="a.src" :alt="a.alt || ''" />
        <figcaption class="bs-sr-only">{{ a.alt || a.name }}</figcaption>
        <button type="button" class="adz__remove bs-focusable" :aria-label="`Remove ${a.alt || a.name || 'image'}`" @click="emit('remove', a.id)">
          <q-icon name="close" size="16px" />
        </button>
      </figure>
    </div>

    <button
      v-if="!full && (multiple || !assets.length)"
      type="button"
      class="adz__zone bs-focusable"
      :class="{ 'adz__zone--drag': dragging }"
      :aria-describedby="`${id}-limits ${id}-error`"
      @click="browse"
      @dragenter.prevent="dragging = true"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <q-spinner v-if="reading" size="22px" color="primary" />
      <q-icon v-else :name="kind === 'logo' ? 'add_photo_alternate' : 'collections'" size="26px" class="adz__icon" />
      <span class="adz__label">{{ label }}</span>
      <span class="adz__sub">Drag & drop or <u>browse</u></span>
      <span :id="`${id}-limits`" class="adz__limits">{{ hint || limitLabel }}</span>
    </button>
    <button v-else-if="!multiple && assets.length" type="button" class="adz__replace bs-focusable" @click="browse">
      <q-icon name="swap_horiz" size="18px" /> Replace {{ kind === 'logo' ? 'logo' : 'image' }}
    </button>

    <input
      ref="input"
      class="bs-sr-only"
      type="file"
      tabindex="-1"
      aria-hidden="true"
      :accept="rule.types.join(',')"
      :multiple="multiple"
      @change="handleFiles($event.target.files)"
    />
    <p :id="`${id}-error`" class="adz__error" role="status" aria-live="polite">
      <template v-if="error"><q-icon name="error_outline" size="16px" /> {{ error }}</template>
    </p>
  </div>
</template>

<style scoped>
.adz { display: flex; flex-direction: column; gap: 10px; }
.adz__zone {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  width: 100%; min-height: 128px; padding: 18px;
  background: var(--bs-surface-2); border: 1.5px dashed var(--bs-line-strong); border-radius: var(--bs-radius-md);
  color: var(--bs-ink); font-family: var(--bs-font); cursor: pointer; text-align: center;
  transition: border-color var(--ds-duration-fast) var(--ds-ease-standard), background var(--ds-duration-fast) var(--ds-ease-standard);
}
.adz--compact .adz__zone { min-height: 92px; padding: 12px; }
.adz__zone:hover, .adz__zone--drag { border-color: var(--bs-brand); background: var(--ds-palette-navy-50); }
.adz__icon { color: var(--bs-ink-soft); margin-bottom: 4px; }
.adz__label { font-weight: 700; font-size: 0.9375rem; }
.adz__sub { font-size: 0.875rem; color: var(--bs-ink-soft); }
.adz__limits { font-size: 0.75rem; color: var(--bs-ink-soft); margin-top: 2px; }
.adz__replace {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 12px;
  background: transparent; border: 1px solid var(--bs-line-strong); border-radius: var(--bs-radius-sm);
  font: 700 0.875rem/1 var(--bs-font); color: var(--bs-ink); cursor: pointer;
}
.adz__replace:hover { background: var(--bs-surface-2); }
.adz__previews { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); }
.adz__previews--logo { grid-template-columns: minmax(0, 220px); }
.adz__preview { position: relative; margin: 0; aspect-ratio: 4 / 3; border-radius: var(--bs-radius-sm); overflow: hidden; background: var(--bs-surface-2); border: 1px solid var(--bs-line); }
.adz__previews--logo .adz__preview { aspect-ratio: 16 / 9; background: repeating-conic-gradient(#F1F5F9 0% 25%, #fff 0% 50%) 50% / 16px 16px; }
.adz__preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
.adz__previews--logo .adz__preview img { object-fit: contain; padding: 12px; }
.adz__remove {
  position: absolute; top: 6px; right: 6px; width: 28px; height: 28px; display: grid; place-items: center;
  border: 0; border-radius: 50%; background: rgb(3 10 38 / 0.72); color: #fff; cursor: pointer;
}
.adz__remove:hover { background: var(--bs-danger); }
.adz__error { margin: 0; min-height: 0; font-size: 0.8125rem; color: var(--ds-color-text-danger); display: flex; align-items: center; gap: 4px; }
.adz__error:empty { display: none; }
</style>
