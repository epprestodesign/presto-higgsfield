// Option B data: every industry example (data/verticals) as a poster card —
// its Higgsfield banner photo, generated logo and BrandHero props.
import { VERTICAL_EXAMPLES, VERTICAL_GROUPS } from '../../../data/verticals/index.js'
import { sampleProject } from '../../../data/sampleEvents.js'
import { getImage } from '../../../assets/imagery/index.js'

export const OPTION_B_POSTERS = VERTICAL_EXAMPLES.map((v) => {
  const p = sampleProject(v.sampleKey)
  const photo = getImage(`${v.id}-photo`) || p.brandKit.imagery?.find((a) => a.kind !== 'logo' && !/abstract/.test(a.id)) || p.brandKit.imagery?.[0]
  return {
    id: v.id,
    sampleKey: v.sampleKey,
    label: v.label,
    icon: v.icon,
    group: v.group,
    eventName: p.event.name,
    photo: photo?.src || '',
    logo: p.brandKit.logoOnDark?.src || p.brandKit.logo?.src || '',
    hero: { brandKit: p.brandKit, headline: p.event.name, tagline: '', dates: '', location: '' },
  }
})

export const posterById = (id) => OPTION_B_POSTERS.find((p) => p.id === id) || OPTION_B_POSTERS[0]

/** Big-type industry list (section 5): group label + the posters in it. */
export const OPTION_B_GROUPS = VERTICAL_GROUPS.map((g) => ({ ...g, posters: OPTION_B_POSTERS.filter((p) => p.group === g.id) }))
