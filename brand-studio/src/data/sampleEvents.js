// Realistic (fictional) sample events — one per category Brand Studio sells to.
// The sports event matches the Presto mock hotel data (Overland Park / Kansas
// City area, Jun 16–19 2027), so it is the default demo project.
import { createProject } from '../models/project.js'
import { getImage } from '../assets/imagery/index.js'
import { SAMPLE_SPONSORS } from './sponsors.js'
import { VERTICAL_SAMPLES } from './verticals/index.js'
// Logos generated with Higgsfield (Ideogram 4.0) — scripts/hf-generate-logos.mjs,
// cut out by scripts/recut-logos.mjs. Self-contained emblems that read on light
// and dark; Fintech's wordmark has a white-lettering variant for dark heroes.
import heartland from '../assets/logos/generated/heartland.png'
import fintech from '../assets/logos/generated/fintech.png'
import fintechLight from '../assets/logos/generated/fintech-dark.png'
import alvarez from '../assets/logos/generated/wedding.png'
import lakeshore from '../assets/logos/generated/lakeshore.png'

const photo = (id) => {
  const img = getImage(id)
  return img ? { id: img.id, src: img.src, alt: img.alt, kind: img.kind || 'photo', credit: img.credit } : null
}
// All sample imagery is generated with Higgsfield (Presto banner system).
const imagery = (...ids) => ids.map(photo).filter(Boolean)
const logo = (id, src, alt) => ({ id, src, alt, kind: 'logo' })

export const SAMPLE_EVENTS = [
  {
    key: 'heartland',
    event: {
      name: 'Heartland Invitational Soccer Cup 2027',
      category: 'sports',
      venue: 'Overland Park Soccer Complex',
      city: 'Overland Park',
      region: 'KS',
      startDate: '2027-06-16',
      endDate: '2027-06-19',
      websiteUrl: 'https://heartlandcup.example.com',
      attendance: '4,000+ players and families',
      description: '',
    },
    organizer: { firstName: 'Dana', lastName: 'Whitaker', email: 'dana@heartlandcup.example.com', phone: '(913) 555-0142', organization: 'Heartland Youth Soccer Association', role: 'Tournament Director' },
    brandKit: {
      source: 'suggested',
      logo: logo('logo-heartland', heartland, 'Heartland Invitational Soccer Cup'),
      colors: { primary: '#0E1B2C', secondary: '#19C6B8', accent: '#F5B700', ink: '#0B1220', surface: '#FFFFFF' },
      typography: { heading: 'barlow-condensed', body: 'inter' },
      imagery: imagery('heartland-photo', 'heartland-photo2', 'heartland-photo3', 'heartland-abstract'),
      heroImageId: 'heartland-photo',
      bannerImageId: 'heartland-photo',
      direction: 'energy',
      keywords: ['competitive', 'youth', 'family-friendly', 'electric'],
    },
    sponsors: SAMPLE_SPONSORS,
  },
  {
    key: 'fintech',
    event: {
      name: 'Fintech Forward Summit 2027',
      category: 'conference',
      venue: 'Kansas City Convention Center',
      city: 'Kansas City',
      region: 'MO',
      startDate: '2027-03-09',
      endDate: '2027-03-11',
      websiteUrl: 'https://fintechforward.example.com',
      attendance: '2,500 attendees',
      description: '',
    },
    organizer: { firstName: 'Priya', lastName: 'Raman', email: 'priya@fintechforward.example.com', organization: 'Fintech Forward', role: 'Head of Events' },
    brandKit: {
      source: 'suggested',
      logo: logo('logo-fintech', fintech, 'Fintech Forward Summit'),
      logoOnDark: logo('logo-fintech-light', fintechLight, 'Fintech Forward Summit'),
      colors: { primary: '#1B1F5E', secondary: '#FF6B4A', accent: '#FFC857', ink: '#12143A', surface: '#FFFFFF' },
      typography: { heading: 'montserrat', body: 'inter' },
      imagery: imagery('fintech-abstract', 'fintech-photo', 'fintech-photo2', 'fintech-photo3'),
      heroImageId: 'fintech-abstract',
      bannerImageId: 'fintech-abstract',
      direction: 'signature',
      keywords: ['innovative', 'professional', 'optimistic'],
    },
    sponsors: [],
  },
  {
    key: 'wedding',
    event: {
      name: 'The Alvarez & Chen Wedding',
      category: 'wedding',
      venue: 'The Rookery Building',
      city: 'Chicago',
      region: 'IL',
      startDate: '2027-09-24',
      endDate: '2027-09-26',
      websiteUrl: 'https://alvarezchen.example.com',
      attendance: '180 guests',
      description: 'We can’t wait to celebrate with you in Chicago! We’ve held rooms at a few of our favorite hotels near the ceremony.',
    },
    organizer: { firstName: 'Marisol', lastName: 'Alvarez', email: 'marisol.alvarez@example.com' },
    brandKit: {
      source: 'manual',
      logo: logo('logo-alvarez', alvarez, 'Alvarez & Chen monogram'),
      colors: { primary: '#3E5245', secondary: '#C9A96E', accent: '#E8D9C5', ink: '#1F2A22', surface: '#FFFFFF' },
      typography: { heading: 'playfair', body: 'lora' },
      imagery: imagery('wedding-photo', 'wedding-photo2', 'wedding-photo3', 'wedding-abstract'),
      heroImageId: 'wedding-photo',
      bannerImageId: 'wedding-photo',
      direction: 'premium',
      keywords: ['romantic', 'elegant', 'warm'],
    },
    sponsors: [],
  },
  {
    key: 'lakeshore',
    event: {
      name: 'Lakeshore Half Marathon 2027',
      category: 'sports',
      venue: 'Grant Park',
      city: 'Chicago',
      region: 'IL',
      startDate: '2027-10-09',
      endDate: '2027-10-10',
      websiteUrl: 'https://lakeshorehalf.example.com',
      attendance: '12,000 runners',
      description: '',
    },
    organizer: { firstName: 'Jordan', lastName: 'Okafor', email: 'jordan@lakeshorehalf.example.com', organization: 'Lakeshore Running Club', role: 'Race Director' },
    brandKit: {
      source: 'suggested',
      logo: logo('logo-lakeshore', lakeshore, 'Lakeshore Half Marathon'),
      colors: { primary: '#0057B8', secondary: '#FF3D2E', accent: '#FFD23F', ink: '#0A1F3D', surface: '#FFFFFF' },
      typography: { heading: 'oswald', body: 'work-sans' },
      imagery: imagery('lakeshore-photo', 'lakeshore-photo2', 'lakeshore-photo3', 'lakeshore-abstract'),
      heroImageId: 'lakeshore-photo',
      bannerImageId: 'lakeshore-photo',
      direction: 'energy',
      keywords: ['energetic', 'community', 'city'],
    },
    sponsors: SAMPLE_SPONSORS.slice(1),
  },
]

/** The four curated samples + one example per industry vertical (data/verticals). */
export const ALL_EXAMPLES = [...SAMPLE_EVENTS, ...VERTICAL_SAMPLES]

export const getSampleEvent = (key) => ALL_EXAMPLES.find((s) => s.key === key) || SAMPLE_EVENTS[0]

/** A fully-populated project for a sample event (used by stories + "Try a sample"). */
export function sampleProject(key = 'heartland') {
  const sample = getSampleEvent(key)
  const project = createProject(sample)
  // Vertical examples carry their own hero copy (tone matters: a funeral home
  // isn't a tournament).
  const c = sample.copy
  if (c) {
    const l = project.pages.landing
    if (c.tagline) l.hero.tagline = c.tagline
    if (c.benefits) l.sections.benefits.items = [...c.benefits]
    if (c.attending) Object.assign(l.sections.attending, { title: c.attendingTitle || l.sections.attending.title, items: c.attending.map((a) => ({ ...a })) })
  }
  return project
}
