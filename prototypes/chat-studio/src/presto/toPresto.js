// Prototype project (or draft snapshot) → a real Presto project, through the
// same converter the live Studio uses for its mockups (toPrestoProject). The
// sample event behind each brand supplies the Presto content (event details,
// hotels, sections); the prototype supplies the logo, colours, fonts, banner
// and page text.
import { toPrestoProject } from '@bs/banner-lab/studioProjects.js'
import { logoOnDarkOf } from '../mockAgent.js'
import { lookedLogo } from './logoLooks.js'
import { prestoAds } from '../ads.js'

const FONT_IDS = { Oswald: 'oswald', 'Barlow Condensed': 'barlow-condensed', 'Playfair Display': 'playfair', Montserrat: 'montserrat', 'PT Sans': 'pt-sans' }
const abs = (src) => (src ? new URL(src, window.location.href).href : src)

export function toPresto(view) {
  const b = view.brand
  const heading = view.font || b.fonts.display
  const sel = view.selected || { key: b.images[0].id, src: b.images[0].src }
  const [primary, accent, , dark] = view.palette
  const lab = {
    key: b.id,
    name: b.name,
    colors: { primary, secondary: dark, accent },
    typography: FONT_IDS[heading] ? { heading: FONT_IDS[heading] } : {},
    // The logo in its chosen look (badge / all white / on dark are drawn as files).
    logo: { src: abs(lookedLogo(view)), onDarkSrc: view.look === 'original' ? abs(logoOnDarkOf(view)) : null, name: `${b.name} logo` },
    banners: [{ id: `proto-${sel.key}`, src: abs(sel.src), alt: `${b.name} banner`, kind: 'photo' }],
    selectedBannerId: `proto-${sel.key}`,
    copy: JSON.parse(JSON.stringify(view.copy)),
  }
  const presto = toPrestoProject(lab)
  // Advertisements: the offered placements filled with the event's ads.
  presto.ads = prestoAds(view.ads)
  return presto
}
