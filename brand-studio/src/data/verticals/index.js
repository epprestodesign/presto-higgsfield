// Verticals → ready-to-load example projects. Joins the pure-data catalog with
// the Higgsfield-generated assets (logos + banners) when they exist, so the
// catalog works before, during and after generation.
import { VERTICALS, VERTICAL_GROUPS, getVertical, verticalsForCategory } from './catalog.js'
import { getImage } from '../../assets/imagery/index.js'
import logoManifest from '../../assets/logos/generated/manifest.json'

const logoFiles = import.meta.glob('../../assets/logos/generated/*.png', { eager: true, query: '?url', import: 'default' })
const logoFor = (id, dark = false) => {
  const entry = logoManifest.find((m) => m.id === id)
  const file = dark ? entry?.fileOnDark : entry?.file
  const src = file && logoFiles[`../../assets/logos/generated/${file}`]
  return src ? { id: `logo-${id}${dark ? '-dark' : ''}`, src, alt: entry.alt, kind: 'logo' } : null
}
const asset = (id) => {
  const img = getImage(id)
  return img ? { id: img.id, src: img.src, alt: img.alt, kind: img.kind || 'photo', credit: img.credit } : null
}

/** SAMPLE_EVENTS-shaped entries for every vertical that defines its own example. */
export const VERTICAL_SAMPLES = VERTICALS.filter((v) => v.event).map((v) => {
  const imagery = ['photo', 'photo2', 'abstract'].map((k) => asset(`${v.id}-${k}`)).filter(Boolean)
  const banner = imagery[0]?.id || null
  return {
    key: v.id,
    vertical: v.id,
    event: { websiteUrl: `https://${v.id}.example.com`, description: '', ...v.event },
    organizer: v.organizer,
    copy: v.copy,
    brandKit: {
      source: 'suggested',
      logo: logoFor(v.id),
      logoOnDark: logoFor(v.id, true),
      colors: { surface: '#FFFFFF', ...v.colors },
      typography: v.typography,
      imagery,
      heroImageId: banner,
      bannerImageId: banner,
      direction: v.direction,
      keywords: v.keywords,
    },
    sponsors: [],
  }
})

/** Every example (vertical) with its group + sample key, for galleries. */
export const VERTICAL_EXAMPLES = VERTICALS.map((v) => ({
  ...v,
  sampleKey: v.sample || v.id,
  groupLabel: VERTICAL_GROUPS.find((g) => g.id === v.group)?.label,
}))

export { VERTICALS, VERTICAL_GROUPS, getVertical, verticalsForCategory }
