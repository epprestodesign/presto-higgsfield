// Mock projects for the chat-first Studio prototype. Nothing here talks to
// Supabase, Clerk or Higgsfield: every logo and banner is a local file and
// every "generation" is scripted in mockAgent.js.
const logos = import.meta.glob('./assets/logos/*.png', { eager: true, query: '?url', import: 'default' })
const banners = import.meta.glob('./assets/banners/*.jpg', { eager: true, query: '?url', import: 'default' })

const logo = (id) => logos[`./assets/logos/${id}.png`]
const banner = (id) => banners[`./assets/banners/${id}.jpg`]

/** The look of each sample brand: who it is, its colours and fonts, its images. */
export const BRANDS = {
  heartland: {
    name: 'Heartland Invitational Cup',
    short: 'Heartland Cup',
    website: 'heartlandcup.org',
    dates: 'JUN 12 – 15, 2027',
    place: 'OVERLAND PARK, KS',
    tagline: 'Four days of youth soccer under the lights.',
    colors: ['#0F3D2E', '#F2B705', '#FFFFFF', '#1C1C1C'],
    fonts: { display: 'Oswald', body: 'Inter' },
    keywords: ['soccer', 'football', 'cup', 'tournament', 'youth', 'heartland'],
  },
  lakeshore: {
    name: 'Lakeshore Half Marathon',
    short: 'Lakeshore Half',
    website: 'lakeshorehalf.com',
    dates: 'APR 18, 2027',
    place: 'CHICAGO, IL',
    tagline: '13.1 miles along the water.',
    colors: ['#0057B8', '#FF3D2E', '#FFFFFF', '#0B1F3A'],
    fonts: { display: 'Barlow Condensed', body: 'Inter' },
    keywords: ['marathon', 'run', 'race', '5k', '10k', 'half', 'lakeshore'],
  },
  fintech: {
    name: 'Fintech Forward Summit',
    short: 'Fintech Forward',
    website: 'fintechforward.io',
    dates: 'SEP 22 – 24, 2027',
    place: 'NEW YORK, NY',
    tagline: 'Where money meets what’s next.',
    colors: ['#1B1F5E', '#FF6B4A', '#F5F6FA', '#0E1030'],
    fonts: { display: 'Space Grotesk', body: 'Inter' },
    keywords: ['fintech', 'summit', 'conference', 'finance', 'tech', 'bank'],
    logoDark: 'fintech-dark',
  },
  'music-festival': {
    name: 'Riverbend Music Festival',
    short: 'Riverbend Fest',
    website: 'riverbendfest.com',
    dates: 'JUL 9 – 11, 2027',
    place: 'CHATTANOOGA, TN',
    tagline: 'Three nights. Five stages. One river.',
    colors: ['#3A1C71', '#FF8A3D', '#FFE8D1', '#14082B'],
    fonts: { display: 'Bebas Neue', body: 'Inter' },
    keywords: ['music', 'festival', 'concert', 'band', 'riverbend'],
  },
  golf: {
    name: 'Prairie Ridge Charity Golf Classic',
    short: 'Prairie Ridge Classic',
    website: 'prairieridgeclassic.org',
    dates: 'MAY 6, 2027',
    place: 'WICHITA, KS',
    tagline: 'Eighteen holes for the kids of Sedgwick County.',
    colors: ['#1F4D2B', '#C9A227', '#F7F3E8', '#102818'],
    fonts: { display: 'Playfair Display', body: 'Inter' },
    keywords: ['golf', 'charity', 'classic', 'tee', 'fundraiser'],
  },
  wedding: {
    name: 'Alvarez & Chen Wedding',
    short: 'Alvarez & Chen',
    website: 'alvarezchen.wedding',
    dates: 'SEP 25, 2027',
    place: 'NAPA, CA',
    tagline: 'Join us among the vines.',
    colors: ['#3E5245', '#C9A96E', '#FBF8F1', '#1F2A22'],
    fonts: { display: 'Cormorant Garamond', body: 'Inter' },
    keywords: ['wedding', 'bride', 'groom', 'reception', 'marry'],
  },
  esports: {
    name: 'Apex Arena Invitational',
    short: 'Apex Arena',
    website: 'apexarena.gg',
    dates: 'NOV 5 – 7, 2027',
    place: 'LAS VEGAS, NV',
    tagline: 'Sixteen teams. One crown.',
    colors: ['#0B0B1A', '#00E0FF', '#FF2E88', '#FFFFFF'],
    fonts: { display: 'Rajdhani', body: 'Inter' },
    keywords: ['esports', 'gaming', 'game', 'arena', 'lan'],
  },
  corporate: {
    name: 'Altura Sales Kickoff',
    short: 'Altura SKO',
    website: 'altura.com',
    dates: 'JAN 20 – 22, 2027',
    place: 'SCOTTSDALE, AZ',
    tagline: 'One team. One number. Let’s go.',
    colors: ['#13294B', '#F26B38', '#F4F6F9', '#0A1626'],
    fonts: { display: 'Montserrat', body: 'Inter' },
    keywords: ['sales', 'kickoff', 'sko', 'company', 'offsite', 'corporate', 'retreat'],
  },
}

for (const [id, b] of Object.entries(BRANDS)) {
  b.id = id
  b.logo = logo(id)
  b.logoOnDark = b.logoDark ? logo(b.logoDark) : null
  b.images = ['photo', 'photo2', 'abstract'].map((v) => ({ id: `${id}-${v}`, src: banner(`${id}-${v}`), kind: v === 'abstract' ? 'Graphic' : 'Photo' }))
}

/** Event themes, by sample brand (team feed and library filters). */
export const THEMES = {
  Sports: ['heartland', 'lakeshore', 'golf', 'esports'],
  Business: ['fintech', 'corporate'],
  Celebrations: ['wedding'],
  Festivals: ['music-festival'],
}
export const themeOf = (brandId) => Object.keys(THEMES).find((t) => THEMES[t].includes(brandId)) || 'Business'

/** Which sample brand a prompt is closest to (the prototype's stand-in for real generation). */
export function brandFor(prompt) {
  const t = (prompt || '').toLowerCase()
  let best = 'corporate'
  let score = 0
  for (const b of Object.values(BRANDS)) {
    const s = b.keywords.filter((k) => t.includes(k)).length
    if (s > score) { best = b.id; score = s }
  }
  return BRANDS[best]
}

export const SUGGESTIONS = {
  Popular: [
    'Youth soccer tournament in Overland Park, June 2027',
    'Brand our sales kickoff from altura.com',
    'Half marathon along the Chicago lakefront',
    'Music festival by the river, three nights',
    'Charity golf classic for a children’s fund',
    'Esports invitational in Las Vegas',
  ],
  Sports: [
    'Floodlit soccer cup for 16 club teams',
    'Spring half marathon, sunrise start',
    'Charity golf scramble with a gala dinner',
    'Regional esports finals, neon arena look',
  ],
  Business: [
    'Fintech summit in New York, three days',
    'Sales kickoff in Scottsdale for 900 reps',
    'Trade expo for farm equipment dealers',
    'Leadership offsite at a mountain lodge',
  ],
  Celebrations: [
    'Vineyard wedding in Napa, sage and gold',
    'Family reunion weekend at a lake',
    'University commencement weekend',
    'Riverside music festival with five stages',
  ],
}

/**
 * Example prompts the home composer cycles through while it's empty, so people
 * see what they can ask for. One set per mode; `tag` says what the example
 * shows off, `attach` opens the file picker when it's used.
 */
export const PROMPT_IDEAS = {
  logo: [
    { tag: 'From a website', icon: 'link', text: 'Grab the logo from heartlandcup.org and clean it up' },
    { tag: 'Upload a file', icon: 'clip', text: 'Our soccer cup logo is a blurry JPEG, make it crisp on a transparent background', attach: true },
    { tag: 'Logo versions', icon: 'spark', text: 'Make a white version of the Lakeshore Half logo for dark banners' },
    { tag: 'From a name', icon: 'pencil', text: 'Simple badge logo for the Prairie Ridge golf classic' },
  ],
  banners: [
    { tag: 'From a website', icon: 'link', text: 'Use the colours from lakeshorehalf.com for a sunrise race banner' },
    { tag: 'Describe a photo', icon: 'image', text: 'Floodlit soccer stadium at dusk, with room for our logo in the middle' },
    { tag: 'Set a mood', icon: 'palette', text: 'Dark, electric neon arena banner for an esports invitational' },
    { tag: 'Show the place', icon: 'map', text: 'New York skyline at night for our fintech summit' },
  ],
  ads: [
    { tag: 'Sponsor ads', icon: 'megaphone', text: 'Ads for our 3 soccer tournament sponsors, each linking to their website' },
    { tag: 'Point to a page', icon: 'link', text: 'An ad sending golf classic guests to our FAQ and parking info' },
    { tag: 'Re-fit an ad', icon: 'clip', text: 'Re-fit our sponsor’s existing ad to every banner size', attach: true },
    { tag: 'Whole package', icon: 'layers', text: 'Design the full ad package for riverbendfest.com' },
  ],
  full: [
    { tag: 'From a website', icon: 'link', text: 'Brand our sales kickoff from altura.com' },
    { tag: 'Describe the event', icon: 'pencil', text: 'Youth soccer tournament in Overland Park, June 2027' },
    { tag: 'Upload a logo', icon: 'clip', text: 'Here’s our wedding logo, build the banners and hotel pages around it', attach: true },
    { tag: 'Everything at once', icon: 'layers', text: 'Logo, banners, pages and sponsor ads for a charity golf classic' },
    { tag: 'Paste a link', icon: 'link', text: 'apexarena.gg' },
  ],
}
