// Realistic (fictional) sample events — one per category Brand Studio sells to.
// The sports event matches the Presto mock hotel data (Overland Park / Kansas
// City area, Jun 16–19 2027), so it is the default demo project.
import { createProject } from '../models/project.js'
import { getImage } from '../assets/imagery/index.js'
import { SAMPLE_SPONSORS } from './sponsors.js'
import heartland from '../assets/logos/heartland-cup.svg'
import fintech from '../assets/logos/fintech-forward.svg'
import fintechLight from '../assets/logos/fintech-forward-light.svg'
import alvarez from '../assets/logos/alvarez-chen.svg'
import alvarezLight from '../assets/logos/alvarez-chen-light.svg'
import lakeshore from '../assets/logos/lakeshore-half.svg'
import lakeshoreLight from '../assets/logos/lakeshore-half-light.svg'

const photo = (id) => {
  const img = getImage(id)
  return { id: img.id, src: img.src, alt: img.alt, kind: 'photo', credit: img.credit }
}
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
      imagery: [photo('soccer-night-match'), photo('soccer-stadium-lights'), photo('soccer-team-huddle')],
      heroImageId: 'soccer-night-match',
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
      imagery: [photo('conference-speaker'), photo('conference-screen'), photo('conference-crowd')],
      heroImageId: 'conference-speaker',
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
      websiteUrl: '',
      attendance: '180 guests',
      description: 'We can’t wait to celebrate with you in Chicago! We’ve held rooms at a few of our favorite hotels near the ceremony.',
    },
    organizer: { firstName: 'Marisol', lastName: 'Alvarez', email: 'marisol.alvarez@example.com' },
    brandKit: {
      source: 'manual',
      logo: logo('logo-alvarez', alvarez, 'Alvarez & Chen monogram'),
      logoOnDark: logo('logo-alvarez-light', alvarezLight, 'Alvarez & Chen monogram'),
      colors: { primary: '#3E5245', secondary: '#C9A96E', accent: '#E8D9C5', ink: '#1F2A22', surface: '#FFFFFF' },
      typography: { heading: 'playfair', body: 'lora' },
      imagery: [photo('wedding-arch'), photo('wedding-table'), photo('wedding-winery-dinner')],
      heroImageId: 'wedding-arch',
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
      logoOnDark: logo('logo-lakeshore-light', lakeshoreLight, 'Lakeshore Half Marathon'),
      colors: { primary: '#0057B8', secondary: '#FF3D2E', accent: '#FFD23F', ink: '#0A1F3D', surface: '#FFFFFF' },
      typography: { heading: 'oswald', body: 'work-sans' },
      imagery: [photo('marathon-street'), photo('marathon-city')],
      heroImageId: 'marathon-street',
      direction: 'energy',
      keywords: ['energetic', 'community', 'city'],
    },
    sponsors: SAMPLE_SPONSORS.slice(1),
  },
]

export const getSampleEvent = (key) => SAMPLE_EVENTS.find((s) => s.key === key) || SAMPLE_EVENTS[0]

/** A fully-populated project for a sample event (used by stories + "Try a sample"). */
export const sampleProject = (key = 'heartland') => createProject(getSampleEvent(key))
