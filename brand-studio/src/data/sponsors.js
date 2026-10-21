// Fictional demo sponsors. Destination URLs point at example.com on purpose —
// a demo must never send traffic to a real business without its consent.
import { createSponsor } from '../models/ads.js'
import prairieFire from '../assets/logos/sponsor-prairie-fire.svg'
import velo from '../assets/logos/sponsor-velo.svg'
import ridgeline from '../assets/logos/sponsor-ridgeline.svg'

export const SAMPLE_SPONSORS = [
  createSponsor({
    id: 'spn_prairie',
    name: 'Prairie Fire BBQ',
    tagline: 'Team dinners for 10–100. Walk-ins welcome after the final whistle.',
    cta: 'Book a team table',
    url: 'https://example.com/prairie-fire-bbq',
    colors: { background: '#7A1F12', foreground: '#FFF7ED', accent: '#F59E0B' },
    logo: { id: 'logo-prairie', src: prairieFire, alt: 'Prairie Fire BBQ', kind: 'logo' },
  }),
  createSponsor({
    id: 'spn_velo',
    name: 'Velo Hydration',
    tagline: 'Official hydration partner. Refill stations at every field.',
    cta: 'Find a refill station',
    url: 'https://example.com/velo-hydration',
    colors: { background: '#0EA5E9', foreground: '#FFFFFF', accent: '#0B1F33' },
    logo: { id: 'logo-velo', src: velo, alt: 'Velo Hydration', kind: 'logo' },
  }),
  createSponsor({
    id: 'spn_ridgeline',
    name: 'Ridgeline Sports Medicine',
    tagline: 'On-site athletic trainers all weekend. Same-day appointments.',
    cta: 'See clinic hours',
    url: 'https://example.com/ridgeline-sports-medicine',
    colors: { background: '#064E3B', foreground: '#ECFDF5', accent: '#34D399' },
    logo: { id: 'logo-ridgeline', src: ridgeline, alt: 'Ridgeline Sports Medicine', kind: 'logo' },
  }),
]

export const getSponsor = (id) => SAMPLE_SPONSORS.find((s) => s.id === id) || null
