// Shared wireframe/template render for the Hotel Detail Page stories. Instead of
// full content, it lays out the page's sections in order as labeled placeholder
// blocks describing what content typically goes in each. Only the Rooms section
// differs per flow (Book Reservation vs Group Block).

const HEAD = [
  { n: 'Photo Gallery', d: 'Hero photo mosaic (lead image + cluster) with a "See all photos" affordance that opens the full gallery grid.' },
  { n: 'Detail Tabs (sticky nav)', d: 'Overview · Rooms · Property · Amenities · Policies — a sticky in-page nav; each tab scrolls to its section.' },
  { n: 'Hotel Summary Header', d: 'Hotel name, star rating, review score + label, distance / address, popular amenities, and a mini-map.' },
]
const TAIL = [
  { n: 'About the Property', d: 'Long-form property description with a "read more" expander.' },
  { n: 'Amenities', d: 'Categorized amenity groups (icon + label grid) with a "view all amenities" affordance.' },
  { n: 'Property Policies', d: 'Check-in / check-out times, children & extra beds, cancellation, and other booking policies.' },
]

// roomsSection: { n, d } describing the flow-specific "Select Your Room" area.
export const wireframe = (heading, roomsSection) => ({
  setup: () => ({ heading, sections: [...HEAD, roomsSection, ...TAIL] }),
  template: `
    <div style="max-width:1180px;margin:0 auto;padding:28px 24px">
      <div style="font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ds-color-text-subtle)">Hotel Detail Page — template</div>
      <h2 style="margin:6px 0 4px;font-size:1.5rem;font-weight:700;color:var(--ds-color-text-brand)">{{ heading }}</h2>
      <p style="margin:0 0 20px;color:var(--ds-color-text-subtle);font-size:0.9375rem">Section layout only — placeholders describe the content each area holds.</p>

      <div style="display:flex;flex-direction:column;gap:14px">
        <div v-for="(s, i) in sections" :key="s.n"
             style="display:flex;align-items:flex-start;gap:18px;border:2px dashed var(--ds-color-border-bold);border-radius:var(--ds-radius-md);background:var(--ds-color-surface-sunken);padding:20px 22px">
          <div style="flex:none;width:88px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--ds-color-text-subtle);padding-top:3px">Section {{ i + 1 }}</div>
          <div>
            <div style="font-size:1.1875rem;font-weight:700;color:var(--ds-color-text-brand)">{{ s.n }}</div>
            <div style="margin-top:4px;color:var(--ds-color-text-subtle);font-size:0.9375rem;line-height:1.5">{{ s.d }}</div>
          </div>
        </div>
      </div>
    </div>`,
})
