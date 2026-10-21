// Brand Studio sample imagery — licensed under the Unsplash License
// (https://unsplash.com/license: free commercial use, no permission needed).
// Downloads were registered via the Unsplash API download endpoint, as the
// API guidelines require. Credit is shown wherever an image is surfaced as a
// choice (hero picker, reference images) via `credit`.
const files = import.meta.glob('./*.jpg', { eager: true, query: '?url', import: 'default' })
const url = (name) => files[`./${name}.jpg`]

const RAW = [
  { id: 'soccer-night-match', tags: ['sports', 'soccer'], alt: 'Players on a floodlit soccer field at night', by: 'Abigail Keenan', unsplashId: '8-s5QuUBtyM' },
  { id: 'soccer-stadium-lights', tags: ['sports', 'soccer'], alt: 'Green soccer field under bright stadium lights', by: 'Jonathan Petersson', unsplashId: 'ARU18GpF6QQ' },
  { id: 'soccer-team-huddle', tags: ['sports', 'soccer'], alt: 'Youth soccer team in a huddle on the field', by: 'Jeffrey F Lin', unsplashId: 'GLKM5guF69Y' },
  { id: 'soccer-field-green', tags: ['sports', 'soccer'], alt: 'Soccer ball on a lush green field', by: 'Giero Saaski', unsplashId: 'HPus1oCcOdk' },
  { id: 'conference-speaker', tags: ['conference'], alt: 'Speaker on stage addressing a large audience', by: 'Alexandre Pellaes', unsplashId: '6vAjp0pscX0' },
  { id: 'conference-screen', tags: ['conference'], alt: 'Audience watching a speaker on a bright screen', by: 'Kevin Gonzalez', unsplashId: '-NXNaE9lu6w' },
  { id: 'conference-crowd', tags: ['conference'], alt: 'Conference attendees seated in a hall', by: 'Headway', unsplashId: 'F2KRf_QfCqw' },
  { id: 'wedding-arch', tags: ['wedding'], alt: 'Outdoor wedding ceremony with a floral arch', by: 'Jonathan Borba', unsplashId: '_a4OJrB5Q4A' },
  { id: 'wedding-table', tags: ['wedding'], alt: 'White reception table set for dinner', by: 'Fantesca Estate & Winery', unsplashId: 'bLLTxcSxTGc' },
  { id: 'wedding-winery-dinner', tags: ['wedding'], alt: 'Guests at a long table dinner at a winery', by: 'David Todd McCarty', unsplashId: 'LD6arW6i01E' },
  { id: 'marathon-street', tags: ['sports', 'running'], alt: 'Runners in a city marathon', by: 'Jerry Wei', unsplashId: '9bmzFkLt1r0' },
  { id: 'marathon-city', tags: ['sports', 'running'], alt: 'Marathon runners racing down a city street', by: 'Jerry Wei', unsplashId: 'OQAfT2THd6k' },
  { id: 'nashville-skyline', tags: ['city', 'nashville'], alt: 'Nashville skyline lit up at dawn', by: 'Brandon Jean', unsplashId: 'o1Bxf1tX9t0' },
  { id: 'nashville-river-night', tags: ['city', 'nashville'], alt: 'Downtown Nashville and the Cumberland River at night', by: 'Brice Cooper', unsplashId: '6PtSoSxo1bU' },
]

export const IMAGERY = RAW.map((img) => ({
  ...img,
  src: url(img.id),
  credit: `Photo by ${img.by} on Unsplash`,
  creditUrl: `https://unsplash.com/photos/${img.unsplashId}`,
}))

export const getImage = (id) => IMAGERY.find((img) => img.id === id) || null
export const imagesTagged = (tag) => IMAGERY.filter((img) => img.tags.includes(tag))
