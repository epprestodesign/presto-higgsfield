// Prototype project (or draft snapshot) → a real Presto project, through the
// same converter the live Studio uses for its mockups (toPrestoProject). The
// sample event behind each brand supplies the Presto content (event details,
// hotels, sections); the prototype supplies the logo, colours, fonts, banner
// and page text.
import { toPrestoProject } from '@bs/banner-lab/studioProjects.js'

const FONT_IDS = { Oswald: 'oswald', 'Barlow Condensed': 'barlow-condensed', 'Playfair Display': 'playfair', Montserrat: 'montserrat' }
const abs = (src) => (src ? new URL(src, window.location.href).href : src)

export function toPresto(view) {
  const b = view.brand
  const sel = view.selected || { key: b.images[0].id, src: b.images[0].src }
  const [primary, accent, , dark] = view.palette
  const lab = {
    key: b.id,
    name: b.name,
    colors: { primary, secondary: dark, accent },
    typography: FONT_IDS[b.fonts.display] ? { heading: FONT_IDS[b.fonts.display] } : {},
    logo: { src: abs(b.logo), onDarkSrc: abs(b.logoOnDark), name: `${b.name} logo` },
    banners: [{ id: `proto-${sel.key}`, src: abs(sel.src), alt: `${b.name} banner`, kind: 'photo' }],
    selectedBannerId: `proto-${sel.key}`,
    copy: JSON.parse(JSON.stringify(view.copy)),
  }
  return toPrestoProject(lab)
}
