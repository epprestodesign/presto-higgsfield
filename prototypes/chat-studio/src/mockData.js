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

/**
 * Starter prompts on Home, by topic. The short `label` is what's listed;
 * clicking one fills the composer with the full `prompt`, written the way an
 * organiser would brief us, to show how much detail helps. Every brief covers
 * who's travelling and where they need to stay, since the graphics and pages
 * exist to get guests booked near the event.
 */
const s = (label, prompt) => ({ label, prompt })
export const SUGGESTIONS = {
  Popular: [
    s('Youth soccer tournament in Overland Park, June 2027', 'Heartland Invitational Cup, a youth soccer tournament at the Overland Park Soccer Complex, June 12–15, 2027. About 120 club teams are coming from six states, and most families drive in and need two or three nights. Help them find hotels within 15 minutes of the fields, with free breakfast and enough rooms to keep each team together. A moody night-match look under the stadium lights, in our green and gold. The logo and colours are on heartlandcup.org.'),
    s('Brand our sales kickoff from altura.com', 'Brand our 2027 sales kickoff from altura.com. It’s January 20–22 at a resort in Scottsdale, Arizona, and about 900 reps are flying in from across North America, most into Phoenix Sky Harbor. We want everyone booked in our room block at the resort first, with two overflow hotels nearby for late registrations. Bold and confident, with desert light at sunset.'),
    s('Half marathon along the Chicago lakefront', 'Lakeshore Half Marathon on April 18, 2027, starting in Grant Park and running north along the Chicago lakefront. We expect about 8,000 runners, and roughly a third travel in the night before. Point them to hotels in the Loop and South Loop within walking distance of the start, because the race begins at 6:30 a.m. and the roads close early. Sunrise over the lake, bright and energetic, in blue and race-day red. Our site is lakeshorehalf.com.'),
    s('Music festival by the river, three nights', 'Riverbend Music Festival, three nights on the Chattanooga riverfront, July 9–11, 2027, with five stages and around 30,000 people a night. Lots of fans come up from Atlanta, Nashville and Birmingham, so they need two or three nights close by. Show hotels downtown and across the river on the North Shore, within walking distance of the gates or on the free shuttle loop. Warm summer evenings, with stage lights on the water. Pull everything from riverbendfest.com.'),
    s('Charity golf classic for a children’s fund', 'Prairie Ridge Charity Golf Classic on May 6, 2027 in Wichita, raising money for the children’s hospital fund. 36 foursomes, plus sponsors and their guests at the dinner afterwards. Many players drive in from Kansas City and Oklahoma City the night before, so suggest hotels near the course and a few by the airport for flights home the next morning. Green fairways at golden hour, classic and warm. Use our website, prairieridgeclassic.org.'),
    s('Esports invitational in Las Vegas', 'Apex Arena Invitational, an esports event in Las Vegas on November 5–7, 2027: 16 pro teams, open qualifiers and about 12,000 fans in the arena each day. Teams, staff and fans fly in from all over, so they need hotels on or just off the Strip, a short walk or rideshare from the arena, ideally with fast Wi-Fi and late check-out. A dark, electric neon look. The logo is on apexarena.gg.'),
  ],
  Sports: [
    s('Floodlit soccer cup for 16 club teams', 'A floodlit soccer cup for 16 club teams over one weekend in June 2027 at the Heartland complex in Overland Park. The players are 14 to 18 and travel with coaches and parents, so about 600 people need two nights. Keep each team together in family-friendly hotels near the fields, with parking for team buses. Night matches under bright stadium lights, in deep green and gold. Our logo is on heartlandcup.org.'),
    s('Spring half marathon, sunrise start', 'A spring half marathon with a sunrise start: the Lakeshore Half in Chicago on April 18, 2027. Runners pick up their bibs at the expo the day before, so most of the 8,000 arrive on Friday and stay one or two nights. Suggest hotels near the expo and the start line, and point out the ones that serve breakfast early. Soft pink and gold sunrise over the water, using the colours from lakeshorehalf.com.'),
    s('Charity golf scramble with a gala dinner', 'A charity golf scramble and gala dinner, the Prairie Ridge Classic, on May 6, 2027 in Wichita. 144 golfers play in the morning, then 400 guests come to dinner in the clubhouse ballroom. Out-of-town donors and sponsors need one night, so show hotels within 10 minutes of the club that have a shuttle to the gala. An elegant evening look in navy and gold, with the course at dusk. The logo is on prairieridgeclassic.org.'),
    s('Regional esports finals, neon arena look', 'Regional esports finals at the Apex Arena in Las Vegas, November 5–7, 2027. Eight finalist college teams, their coaches and a few thousand fans. Teams need rooms for three nights close to the arena, and fans want hotels on the Strip they can walk back to after the late matches. A neon arena look: dark background, electric purple and cyan. Use the logo from apexarena.gg.'),
  ],
  Business: [
    s('Fintech summit in New York, three days', 'Fintech Forward Summit, September 22–24, 2027 at the Javits Center in New York. About 4,000 founders, investors and bank leaders, most flying in for two or three nights. Help them find hotels in Hudson Yards and Midtown West within walking distance, plus a few near Penn Station for people coming by train. Sharp and modern, navy with one bright accent. Pull our brand from fintechforward.io.'),
    s('Sales kickoff in Scottsdale for 900 reps', 'A sales kickoff in Scottsdale for 900 reps, January 20–22, 2027. Everyone flies into Phoenix and we run shuttles from the airport, so book them at the host resort first, then at two nearby overflow hotels once our block fills. A desert-sunset look, confident and upbeat. Use the logo and colours from altura.com.'),
    s('Trade expo for farm equipment dealers', 'A trade expo for farm equipment dealers, three days in March 2027 at the convention center in Des Moines, Iowa. Around 2,500 dealers and their teams drive in from across the Midwest, many with trucks and trailers. Show hotels near the convention center that have truck parking, and a few by the airport for exhibitors who fly in. A bright daytime look: big skies, green fields, rows of tractors.'),
    s('Leadership offsite at a mountain lodge', 'A leadership offsite for 60 directors at a mountain lodge near Park City, Utah, three days in October 2027. Most fly into Salt Lake City and drive up, so they need rooms at the lodge itself, plus a couple of nearby hotels if we outgrow it. Calm and minimal: pine trees, mountains, early morning light.'),
  ],
  Celebrations: [
    s('Vineyard wedding in Napa, sage and gold', 'Our wedding, Alvarez & Chen, at a vineyard in Napa on September 25, 2027. About 150 guests, many flying in from Los Angeles and Chicago for the whole weekend. Help them find places to stay in Napa and Yountville close to the venue, from boutique inns to family-friendly hotels, and mention the shuttle from downtown Napa. Soft sage and gold, romantic, golden hour among the vines. Our site is alvarezchen.wedding.'),
    s('Family reunion weekend at a lake', 'A family reunion weekend at Lake of the Ozarks, Missouri, in July 2027. About 80 relatives are coming from eight states, from grandparents to toddlers, so we need lake-view hotels and cabins within 20 minutes of the marina where we’re meeting. Summery, sunny and relaxed, with blue water and pines.'),
    s('University commencement weekend', 'University commencement weekend at the University of Kansas in Lawrence, May 2027: 5,000 graduates and about 15,000 family members coming to town for two nights. Hotels near campus sell out a year ahead, so show what’s still open within 30 minutes, with notes on parking and the shuttle to the stadium. Proud and bright, in school colours, with caps in the air.'),
    s('Riverside music festival with five stages', 'Riverbend Music Festival, five stages on the Chattanooga riverfront over three nights, July 9–11, 2027. Fans want to stay close and leave the car behind: show hotels downtown and on the North Shore within walking distance of the gates, and campsites and cabins a short drive away. Warm, colourful and lively, with stage lights reflected in the river. Our site is riverbendfest.com.'),
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
