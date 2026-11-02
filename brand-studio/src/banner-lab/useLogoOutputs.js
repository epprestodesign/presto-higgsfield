// What the Logo steps show and download, derived from the optimized logo:
// image URLs, the SVG (traced, or the original for vector uploads), the Presto
// placements, and the ZIP of everything.
import { computed, ref } from 'vue'
import { useBannerLab } from './useBannerLab.js'
import { TREATMENTS, placementAssets, svgDataUrl } from './canvas.js'
import { saveText, saveZip, slug } from './download.js'

export function useLogoOutputs() {
  const lab = useBannerLab()
  const s = lab.s
  const logo = computed(() => s.logo)
  const name = computed(() => slug(logo.value?.name))

  const finished = computed(() => logo.value.treatments.original.canvas)
  const finishedUrl = computed(() => finished.value.toDataURL('image/png'))
  const beforeUrl = computed(() => logo.value.preview.before.toDataURL('image/png'))
  const treatmentUrls = computed(() => Object.fromEntries(TREATMENTS.map((t) => [t.id, logo.value.treatments[t.id].canvas.toDataURL('image/png')])))

  // ── SVG ─────────────────────────────────────────────────────────────────
  const isVector = computed(() => logo.value.source.isVector)
  const originalSvg = ref('')
  async function loadOriginalSvg() {
    if (originalSvg.value || !isVector.value) return originalSvg.value
    const src = logo.value.source.src
    originalSvg.value = src.startsWith('data:')
      ? new TextDecoder().decode(Uint8Array.from(atob(src.split(',')[1]), (c) => c.charCodeAt(0)))
      : await (await fetch(src)).text()
    return originalSvg.value
  }
  const traced = computed(() => s.vector.result)
  const tracedUrl = computed(() => (traced.value?.svg ? svgDataUrl(traced.value.svg) : ''))
  async function downloadSvg() {
    const svg = isVector.value ? await loadOriginalSvg() : traced.value?.svg
    if (svg) saveText(svg, `${name.value}.svg`)
  }

  // ── Presto placements ───────────────────────────────────────────────────
  // The 200×200 brand-logo slot shows the logo as uploaded (event graphics put
  // it on white); every other placement is on a dark bar or banner, so it
  // takes the on-dark version picked in Clean up.
  const placements = computed(() => {
    const onDark = placementAssets(logo.value.treatments[s.treatment].canvas)
    const original = placementAssets(finished.value)
    return onDark.map((p, i) => {
      const a = p.square ? original[i] : p
      return { ...a, url: a.png1x.toDataURL('image/png'), dark: !p.square }
    })
  })

  const zipping = ref(false)
  async function downloadAll() {
    zipping.value = true
    const entries = [
      { name: `${name.value}-transparent.png`, canvas: finished.value },
      ...placements.value.flatMap((p) => [
        { name: `presto/${p.id}-${p.size.w}x${p.size.h}.png`, canvas: p.png1x },
        { name: `presto/${p.id}-${p.size.w}x${p.size.h}@2x.png`, canvas: p.png2x },
      ]),
      {
        name: 'README.txt',
        text: [
          `${logo.value.name}: logo files for Presto (Banner Lab)`,
          '',
          ...placements.value.map((p) => `${p.label.padEnd(26)} ${`${p.size.w}×${p.size.h}px`.padEnd(12)} ${p.where}`),
          '',
          `On dark bars and banners: ${TREATMENTS.find((t) => t.id === s.treatment).label}.`,
          ...logo.value.checks.map((c) => `- ${c.title}: ${c.detail}`),
        ].join('\n'),
      },
    ]
    const svg = isVector.value ? await loadOriginalSvg() : traced.value?.svg
    if (svg) entries.unshift({ name: `${name.value}.svg`, text: svg })
    await saveZip(entries, `${name.value}-presto-logo.zip`)
    zipping.value = false
  }

  return { lab, s, logo, name, finished, finishedUrl, beforeUrl, treatmentUrls, isVector, traced, tracedUrl, downloadSvg, placements, zipping, downloadAll }
}
