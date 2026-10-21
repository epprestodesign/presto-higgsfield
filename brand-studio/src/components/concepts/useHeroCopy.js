// Live hero copy for concept thumbnails — the same event text the booking page
// will show, so concepts are judged with real content, not lorem ipsum.
import { computed } from 'vue'
import { useProjectStore } from '../../stores/project.js'
import { formatDateRange, locationLabel } from '../../models/event.js'

export function useHeroCopy() {
  const project = useProjectStore()
  return computed(() => {
    const ev = project.event
    const hero = project.pages.landing.hero
    return {
      headline: hero.headline || ev.name || 'Your Event Name',
      tagline: hero.tagline,
      dates: formatDateRange(ev.startDate, ev.endDate),
      location: locationLabel(ev),
      ctaLabel: hero.ctaLabel,
      showLogo: hero.showLogo,
      showDates: hero.showDates,
    }
  })
}
