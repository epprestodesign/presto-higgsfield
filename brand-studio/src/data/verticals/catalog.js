// Verticals catalog — every industry that books group hotel travel through
// Presto, each with a complete fictional example (organizer, event, brand kit,
// hero copy) and the Higgsfield prompts that generate its logo + banners.
//
// PURE DATA (no asset imports) so the generation script
// (scripts/hf-generate-verticals.mjs) and the app read the same source.
// Organizations, people and venues are fictional.
//
// Image rules (Presto banner system, references/102226): banners are minimal,
// system-safe BACKGROUNDS — the logo and all copy are live hero layers — and
// logos are self-contained emblems that read on light and dark.

export const VERTICAL_GROUPS = [
  { id: 'sports', label: 'Sports & recreation', icon: 'sports_soccer' },
  { id: 'business', label: 'Business & events', icon: 'business_center' },
  { id: 'workforce', label: 'Workforce & crews', icon: 'engineering' },
  { id: 'healthcare', label: 'Healthcare', icon: 'local_hospital' },
  { id: 'community', label: 'Life & community', icon: 'diversity_3' },
  { id: 'education', label: 'Education & culture', icon: 'school' },
]

// `sample` marks verticals whose example already exists in data/sampleEvents.js.
export const VERTICALS = [
  // ── Sports & recreation ───────────────────────────────────────────────
  { id: 'youth-sports', group: 'sports', category: 'sports', label: 'Youth sports tournaments', icon: 'sports_soccer', sample: 'heartland',
    pitch: 'Team blocks, family rooms and stay-close-to-the-fields urgency for club tournaments.' },
  { id: 'endurance', group: 'sports', category: 'sports', label: 'Races & endurance events', icon: 'directions_run', sample: 'lakeshore',
    pitch: 'Start-line hotels and race-weekend packages for marathons, triathlons and rides.' },
  {
    id: 'esports', group: 'sports', label: 'Esports tournaments', icon: 'sports_esports',
    pitch: 'Team and fan lodging minutes from the arena, with late check-out after finals.',
    event: { name: 'Apex Arena Invitational 2027', category: 'sports', venue: 'Silver Mesa Esports Arena', city: 'Las Vegas', region: 'NV', startDate: '2027-07-22', endDate: '2027-07-25', attendance: '64 teams · 9,000 fans' },
    organizer: { firstName: 'Riley', lastName: 'Chen', email: 'riley@apexarena.example.com', organization: 'Apex Arena Esports', role: 'Event Operations Lead' },
    colors: { primary: '#140C2E', secondary: '#8B5CF6', accent: '#22D3EE', ink: '#0B0718' },
    typography: { heading: 'barlow-condensed', body: 'inter' }, direction: 'energy', keywords: ['electric', 'competitive', 'nocturnal'],
    copy: { tagline: 'Official team and fan hotels, minutes from the main stage.', attendingTitle: 'Who’s coming?', attending: [{ title: 'Teams & coaches', text: 'Quiet rooms with fast Wi-Fi and late check-out after the finals.' }, { title: 'Fans', text: 'Stay close to the arena and the watch parties.' }], benefits: ['Walkable to the arena', 'Team block rates', 'Late check-out on finals night', 'Instant confirmation'] },
    prompts: {
      logo: 'Esports tournament crest: an angular hexagonal badge filled deep midnight violet (#140C2E) with a glowing violet (#8B5CF6) and cyan (#22D3EE) double outline, a stylized controller-and-lightning mark at the top, the word "APEX" in heavy futuristic block capitals in white and "INVITATIONAL 2027" in small cyan letter-spaced capitals below.',
      photo: 'An empty esports arena stage with tall LED light walls glowing violet and cyan, rows of gaming stations softly out of focus at the far edges, light haze in the air; dark and moody, the center calm.',
      photo2: 'Dark arena seating seen from the floor, rows of seats dissolving into violet and cyan stage-light bokeh near the edges, quiet and atmospheric.',
      abstract: 'Minimal abstract background: solid deep midnight violet field with very thin glowing circuit-like lines and tiny cyan pixels along the right edge, fading to plain dark violet toward the left and center.',
    },
  },
  {
    id: 'camps', group: 'sports', label: 'Summer camps & youth programs', icon: 'cabin',
    pitch: 'Parent weekends, drop-off and pick-up lodging for camps and youth programs.',
    event: { name: 'Camp Pinecrest Family Weekend 2027', category: 'other', venue: 'Camp Pinecrest', city: 'Lake Geneva', region: 'WI', startDate: '2027-07-09', endDate: '2027-07-11', attendance: '300 families' },
    organizer: { firstName: 'Morgan', lastName: 'Ellis', email: 'morgan@camppinecrest.example.com', organization: 'Camp Pinecrest', role: 'Family Programs Director' },
    colors: { primary: '#1F3D2B', secondary: '#E07A2F', accent: '#F2E3C6', ink: '#14251A' },
    typography: { heading: 'poppins', body: 'work-sans' }, direction: 'signature', keywords: ['outdoors', 'family', 'warm'],
    copy: { tagline: 'Stay close to camp for Family Weekend.', attendingTitle: 'For families', attending: [{ title: 'Parents & guardians', text: 'Cozy rooms ten minutes from the camp gate.' }, { title: 'Siblings', text: 'Family suites with pools and breakfast included.' }], benefits: ['Minutes from camp', 'Family suites', 'Breakfast included', 'Free cancellation'] },
    prompts: {
      logo: 'Summer camp emblem: a round badge filled deep forest green (#1F3D2B) with a cream (#F2E3C6) border ring, a simple pine tree and tent silhouette over a lake with an orange (#E07A2F) sun, the words "CAMP PINECREST" in friendly bold rounded capitals in cream arched across the top and "EST. 1962" small below.',
      photo: 'A misty lake at dawn with a long wooden dock in soft focus, pine forest silhouettes along the left and right edges, calm water in the center, gentle morning light.',
      photo2: 'A campfire circle with log benches at dusk in a pine forest, warm glow and embers only at the far edges, deep green shadows, peaceful and quiet.',
      abstract: 'Minimal abstract background: solid deep forest green field with fine topographic contour lines in slightly lighter green along the outer edges and one thin orange line, large plain calm center.',
    },
  },
  {
    id: 'golf', group: 'sports', label: 'Charity golf & pro-ams', icon: 'golf_course',
    pitch: 'Sponsor and player hospitality for charity classics, pro-ams and club championships.',
    event: { name: 'Prairie Ridge Charity Golf Classic 2027', category: 'sports', venue: 'Prairie Ridge Golf Club', city: 'Hutchinson', region: 'KS', startDate: '2027-05-13', endDate: '2027-05-15', attendance: '144 players' },
    organizer: { firstName: 'Caroline', lastName: 'Brandt', email: 'caroline@prairieridgeclassic.example.com', organization: 'Prairie Ridge Foundation', role: 'Tournament Chair' },
    colors: { primary: '#0F3B2E', secondary: '#C8A24B', accent: '#F4F1E8', ink: '#0A231B' },
    typography: { heading: 'playfair', body: 'lora' }, direction: 'premium', keywords: ['heritage', 'refined', 'charitable'],
    copy: { tagline: 'Player and sponsor hotels for tournament week.', attendingTitle: 'Who’s playing?', attending: [{ title: 'Players & guests', text: 'Quiet rooms near the club with early tee-time breakfast.' }, { title: 'Sponsors', text: 'Suites for hosting partners after the round.' }], benefits: ['Near the club', 'Sponsor suites', 'Early breakfast', 'Group rates'] },
    prompts: {
      logo: 'Classic golf tournament crest: a shield filled deep pine green (#0F3B2E) with a fine gold (#C8A24B) border, crossed golf clubs and a pin flag in gold, the words "PRAIRIE RIDGE" in an elegant serif in cream (#F4F1E8) on a gold ribbon and "CHARITY CLASSIC" in tiny letter-spaced capitals.',
      photo: 'A golf fairway at sunrise with soft mist over rolling dunes, tall prairie grass framing the left and right edges, the green far in the distance, calm and elegant, muted greens with warm gold light.',
      photo2: 'A classic clubhouse veranda at golden hour seen from the lawn, softly out of focus, white rocking chairs at the far edges, warm and refined.',
      abstract: 'Minimal abstract background: solid deep pine green field with delicate gold linework of rolling dune contours along the bottom edge, large plain calm area above.',
    },
  },

  // ── Business & events ─────────────────────────────────────────────────
  { id: 'conference', group: 'business', category: 'conference', label: 'Conferences & summits', icon: 'groups', sample: 'fintech',
    pitch: 'Negotiated attendee rates near the convention center, presented with your conference brand.' },
  {
    id: 'destinations', group: 'business', label: 'Conference destinations & CVBs', icon: 'location_city',
    pitch: 'One branded booking page for every meeting your destination hosts.',
    event: { name: 'Meet Cedar Harbor Meetings Week 2027', category: 'conference', venue: 'Downtown Convention District', city: 'Cedar Harbor', region: 'ME', startDate: '2027-04-19', endDate: '2027-04-23', attendance: '40 groups' },
    organizer: { firstName: 'Jordan', lastName: 'Pike', email: 'jordan@meetcedarharbor.example.com', organization: 'Cedar Harbor Meetings & Conventions Bureau', role: 'Director of Sales' },
    colors: { primary: '#12355B', secondary: '#2BA84A', accent: '#F6AE2D', ink: '#0B2138' },
    typography: { heading: 'montserrat', body: 'inter' }, direction: 'signature', keywords: ['welcoming', 'coastal', 'professional'],
    copy: { tagline: 'Preferred hotels for every group meeting in town.', attendingTitle: 'Planning a meeting?', attending: [{ title: 'Meeting planners', text: 'Pre-negotiated blocks at the city’s preferred hotels.' }, { title: 'Attendees', text: 'Walkable stays near venues, dining and the waterfront.' }], benefits: ['Preferred hotel partners', 'Negotiated group rates', 'Walkable downtown', 'One link for every group'] },
    prompts: {
      logo: 'Destination marketing emblem: a rounded-square badge filled deep navy (#12355B) with a lighthouse and layered harbor-wave shapes in green (#2BA84A) and a golden (#F6AE2D) sun, the word "MEET" in bold modern sans-serif capitals in white and "CEDAR HARBOR" in small letter-spaced capitals below.',
      photo: 'An aerial view of a small coastal harbor town at blue hour, wooded hills fading into mist on the horizon, warm harbor lights only at the outer edges, calm water and sky in the center.',
      photo2: 'A modern convention center plaza at dusk with soft glowing windows, trees framing the edges, empty open plaza in the middle, softly out of focus.',
      abstract: 'Minimal abstract background: solid deep navy field with fine layered wave lines in slightly lighter navy along the bottom edge and one thin green line, large plain area above.',
    },
  },
  {
    id: 'corporate', group: 'business', label: 'Corporate offsites & incentive trips', icon: 'flight_takeoff',
    pitch: 'Sales kickoffs, leadership offsites and incentive trips with one branded booking link.',
    event: { name: 'Altura Sales Kickoff 2027', category: 'conference', venue: 'Saguaro Sky Resort', city: 'Scottsdale', region: 'AZ', startDate: '2027-01-18', endDate: '2027-01-21', attendance: '650 employees' },
    organizer: { firstName: 'Sam', lastName: 'Okoye', email: 'sam.okoye@altura.example.com', organization: 'Altura Software', role: 'Events & Experiences Manager' },
    colors: { primary: '#111827', secondary: '#F97316', accent: '#FDE68A', ink: '#0B1220' },
    typography: { heading: 'poppins', body: 'inter' }, direction: 'energy', keywords: ['ambitious', 'warm', 'celebratory'],
    copy: { tagline: 'Your room for Kickoff week is waiting.', attendingTitle: 'Who’s attending?', attending: [{ title: 'Sales teams', text: 'Rooms at the resort and two partner hotels next door.' }, { title: 'Leadership & guests', text: 'Suites near the general session ballroom.' }], benefits: ['Resort and partner hotels', 'Company-paid where applicable', 'Shuttle to sessions', 'Instant confirmation'] },
    prompts: {
      logo: 'Corporate event emblem: a rounded-square badge filled near-black charcoal (#111827) with a bold orange (#F97316) upward mountain-peak arrow mark, the word "ALTURA" in heavy geometric sans-serif capitals in white and "SALES KICKOFF 2027" in small soft yellow (#FDE68A) letter-spaced capitals below.',
      photo: 'A desert resort pool at twilight with palm trees silhouetted at the left and right edges, still water reflecting a deep orange and indigo sky, calm and luxurious, empty loungers softly out of focus.',
      photo2: 'An elegant hotel ballroom set for a general session, round tables and stage lighting dissolving into warm orange bokeh at the edges, empty and calm in the center.',
      abstract: 'Minimal abstract background: solid near-black charcoal field with thin warm orange gradient light streaks sweeping in from the right edge, large plain dark area.',
    },
  },
  {
    id: 'trade-show', group: 'business', label: 'Trade shows & expos', icon: 'storefront',
    pitch: 'Exhibitor and attendee housing for expos, with room-block tracking per company.',
    event: { name: 'MidAmerica Ag & Equipment Expo 2027', category: 'conference', venue: 'Heartland Expo Center', city: 'Des Moines', region: 'IA', startDate: '2027-02-09', endDate: '2027-02-11', attendance: '1,200 exhibitors · 30,000 attendees' },
    organizer: { firstName: 'Dale', lastName: 'Hoffman', email: 'dale@midamericaexpo.example.com', organization: 'MidAmerica Expo Group', role: 'Exhibitor Services Manager' },
    colors: { primary: '#1B4332', secondary: '#F4A100', accent: '#D8F3DC', ink: '#0F2A1F' },
    typography: { heading: 'oswald', body: 'work-sans' }, direction: 'energy', keywords: ['rugged', 'industrious', 'bold'],
    copy: { tagline: 'Exhibitor and attendee hotels for show week.', attendingTitle: 'Who’s coming?', attending: [{ title: 'Exhibitors', text: 'Company room blocks near the expo halls, with early move-in.' }, { title: 'Attendees', text: 'Shuttle-connected hotels across the metro.' }], benefits: ['Shuttle to the expo center', 'Exhibitor block rates', 'Early check-in for move-in day', 'Free parking'] },
    prompts: {
      logo: 'Agricultural trade show emblem: a bold hexagon badge filled deep green (#1B4332) with a harvest-gold (#F4A100) wheat stalk crossed with a gear, the words "MIDAMERICA EXPO" in heavy condensed capitals in white and "AG & EQUIPMENT 2027" in small gold letter-spaced capitals below.',
      photo: 'A huge empty exhibition hall seen from a high angle, rows of booths and large equipment softly out of focus at the far edges, warm overhead light, calm open aisle in the center.',
      photo2: 'Rolling farm fields at sunrise with a row of modern tractors softly blurred at the far left and right, wide open sky in the center, golden light.',
      abstract: 'Minimal abstract background: solid deep green field with fine diagonal gold lines like rows of crops along the right edge, large plain calm area.',
    },
  },

  // ── Workforce & crews ─────────────────────────────────────────────────
  {
    id: 'construction', group: 'workforce', label: 'Construction & infrastructure crews', icon: 'construction',
    pitch: 'Long-stay crew lodging near the job site, with weekly rates and parking for work trucks.',
    event: { name: 'Ironline Builders · Riverside Bridge Project', category: 'other', venue: 'Riverside Bridge job site', city: 'Davenport', region: 'IA', startDate: '2027-03-01', endDate: '2027-11-19', attendance: '120 crew members' },
    organizer: { firstName: 'Marcus', lastName: 'Reyes', email: 'marcus.reyes@ironline.example.com', organization: 'Ironline Builders', role: 'Project Logistics Coordinator' },
    colors: { primary: '#1C1C1C', secondary: '#F2B705', accent: '#E5E5E5', ink: '#111111' },
    typography: { heading: 'oswald', body: 'inter' }, direction: 'energy', keywords: ['industrial', 'dependable', 'strong'],
    copy: { tagline: 'Crew housing near the job site. Weekly rates, truck parking.', attendingTitle: 'Who’s staying?', attending: [{ title: 'Field crews', text: 'Extended-stay rooms with kitchenettes, 10 minutes from site.' }, { title: 'Project managers', text: 'Quiet suites with desks and early breakfast.' }], benefits: ['Weekly and monthly rates', 'Truck and trailer parking', 'Kitchenettes', 'Early breakfast'] },
    prompts: {
      logo: 'Construction company emblem: a bold shield badge filled charcoal black (#1C1C1C) with a safety-yellow (#F2B705) steel I-beam and bridge-truss mark, the word "IRONLINE" in heavy industrial block capitals in white and "BUILDERS" in small yellow letter-spaced capitals below.',
      photo: 'A large steel bridge under construction at dawn over a wide river, tower cranes silhouetted at the left and right edges, soft fog over the water in the center, muted steel blue and warm amber light.',
      photo2: 'A construction site at blue hour with two tall tower cranes at the far edges against a calm dusky sky, work lights glowing softly, empty open sky in the center.',
      abstract: 'Minimal abstract background: solid deep charcoal field with a few very thin safety-yellow diagonal lines and a faint steel grid texture along the right edge, large plain dark area.',
    },
  },
  {
    id: 'utility-crews', group: 'workforce', label: 'Utility & storm-response crews', icon: 'bolt',
    pitch: 'Rapid crew housing for storm restoration, outages and line work — booked in minutes.',
    event: { name: 'Meridian Power · Storm Response Lodging', category: 'other', venue: 'Gulf Coast staging yard', city: 'Mobile', region: 'AL', startDate: '2027-08-23', endDate: '2027-09-10', attendance: '400 line workers' },
    organizer: { firstName: 'Tasha', lastName: 'Greene', email: 'tasha.greene@meridianpower.example.com', organization: 'Meridian Power Co-op', role: 'Emergency Logistics Manager' },
    colors: { primary: '#0B2545', secondary: '#13B5EA', accent: '#F5D547', ink: '#071A30' },
    typography: { heading: 'barlow-condensed', body: 'inter' }, direction: 'energy', keywords: ['resilient', 'urgent', 'reliable'],
    copy: { tagline: 'Crew lodging near the staging yard, available now.', attendingTitle: 'Who’s staying?', attending: [{ title: 'Line crews', text: 'Rooms with laundry and 24-hour front desks near the staging yard.' }, { title: 'Mutual-aid partners', text: 'Blocks for visiting crews, billed to the co-op.' }], benefits: ['Book in minutes', 'Truck parking', '24-hour front desk', 'Direct billing'] },
    prompts: {
      logo: 'Utility company emblem: a bold circular badge filled deep navy (#0B2545) with a sky-blue (#13B5EA) power-line tower and a yellow (#F5D547) lightning bolt, the word "MERIDIAN" in heavy condensed capitals in white and "POWER CO-OP" in small blue letter-spaced capitals below.',
      photo: 'Utility power lines and transmission towers across open fields at stormy dusk, dramatic clouds parting with blue light, towers only at the far left and right, calm sky in the center.',
      photo2: 'A line of utility bucket trucks parked at a staging yard at dawn, softly out of focus at the edges, wet pavement reflecting blue light, empty center.',
      abstract: 'Minimal abstract background: solid deep navy field with fine sky-blue electrical line patterns along the right edge and one thin yellow line, large plain area.',
    },
  },
  {
    id: 'film-production', group: 'workforce', label: 'Film & TV production crews', icon: 'movie',
    pitch: 'Cast and crew housing for location shoots, organized by department.',
    event: { name: 'Silverlake Studios · On Location in Savannah', category: 'other', venue: 'Historic District locations', city: 'Savannah', region: 'GA', startDate: '2027-04-05', endDate: '2027-06-18', attendance: '180 cast & crew' },
    organizer: { firstName: 'Avery', lastName: 'Lindqvist', email: 'avery@silverlakestudios.example.com', organization: 'Silverlake Studios', role: 'Production Coordinator' },
    colors: { primary: '#141414', secondary: '#E63946', accent: '#F1FAEE', ink: '#0D0D0D' },
    typography: { heading: 'barlow-condensed', body: 'inter' }, direction: 'premium', keywords: ['cinematic', 'discreet', 'creative'],
    copy: { tagline: 'Cast and crew housing for the Savannah shoot.', attendingTitle: 'Who’s staying?', attending: [{ title: 'Crew', text: 'Extended stays near base camp with early breakfast.' }, { title: 'Cast', text: 'Private suites in the historic district.' }], benefits: ['Near base camp', 'Extended-stay rates', 'Early call-time breakfast', 'Discreet check-in'] },
    prompts: {
      logo: 'Film studio emblem: a rounded-square badge filled near-black (#141414) with a white film-camera and clapperboard mark and a red (#E63946) circle like a recording light, the word "SILVERLAKE" in condensed bold capitals in white and "STUDIOS" in small red letter-spaced capitals below.',
      photo: 'A film set at night in a historic street, large soft lights and a camera crane silhouetted only at the far left and right edges, cobblestones and haze glowing softly in the center, cinematic and moody.',
      photo2: 'A historic tree-lined square at blue hour with Spanish moss hanging from oak trees at the edges, soft lamplight, calm empty path in the center, cinematic.',
      abstract: 'Minimal abstract background: solid near-black field with a subtle film-grain texture and a few thin red light-leak streaks along the right edge, large plain dark area.',
    },
  },

  // ── Healthcare ────────────────────────────────────────────────────────
  {
    id: 'hospital-families', group: 'healthcare', label: 'Hospital & patient family lodging', icon: 'local_hospital',
    pitch: 'Comfortable, discounted stays near the hospital for patients’ families.',
    event: { name: 'St. Brielle Children’s Hospital · Family Stays', category: 'other', venue: 'St. Brielle Children’s Hospital', city: 'Columbus', region: 'OH', startDate: '2027-01-01', endDate: '2027-12-31', attendance: 'Ongoing family program' },
    organizer: { firstName: 'Nadia', lastName: 'Farouk', email: 'nadia.farouk@stbrielle.example.org', organization: 'St. Brielle Children’s Hospital', role: 'Family Services Coordinator' },
    colors: { primary: '#0E4D64', secondary: '#4FB0C6', accent: '#F3B391', ink: '#0A3646' },
    typography: { heading: 'poppins', body: 'work-sans' }, direction: 'signature', keywords: ['caring', 'calm', 'trustworthy'],
    copy: { tagline: 'A comfortable place to stay, close to your child.', attendingTitle: 'For families', attending: [{ title: 'Parents & caregivers', text: 'Discounted rooms within a mile of the hospital, with shuttles.' }, { title: 'Visiting family', text: 'Flexible stays that change as plans change.' }], benefits: ['Hospital-negotiated rates', 'Free shuttle', 'Flexible check-out', 'Kitchenettes available'] },
    prompts: {
      logo: 'Children’s hospital emblem: a soft rounded-square badge filled deep teal (#0E4D64) with a gentle heart-and-house mark in light teal (#4FB0C6) and a small peach (#F3B391) star, the words "ST. BRIELLE" in friendly rounded sans-serif capitals in white and "CHILDREN’S HOSPITAL" in small letter-spaced capitals below.',
      photo: 'A bright, calm modern hospital atrium with tall windows, indoor trees and soft natural light, softly out of focus, no people, peaceful and welcoming, airy teal and warm tones.',
      photo2: 'A quiet hospital healing garden at morning light with benches and flowering plants at the edges, a calm stone path in the center, soft focus, serene.',
      abstract: 'Minimal abstract background: solid deep teal field with soft, rounded flowing shapes in slightly lighter teal along the bottom right and one thin peach line, gentle and calm, large plain area.',
    },
  },
  {
    id: 'travel-nursing', group: 'healthcare', label: 'Travel nursing & healthcare staffing', icon: 'medical_services',
    pitch: 'Housing for contract nurses and clinicians — short notice, near the facility.',
    event: { name: 'Northstar Travel Nurse Housing 2027', category: 'other', venue: 'Partner facilities', city: 'Denver', region: 'CO', startDate: '2027-01-04', endDate: '2027-12-27', attendance: '13-week assignments' },
    organizer: { firstName: 'Elena', lastName: 'Sato', email: 'elena@northstarstaffing.example.com', organization: 'Northstar Healthcare Staffing', role: 'Clinician Housing Lead' },
    colors: { primary: '#1D3557', secondary: '#E76F51', accent: '#A8DADC', ink: '#122339' },
    typography: { heading: 'montserrat', body: 'inter' }, direction: 'signature', keywords: ['supportive', 'flexible', 'professional'],
    copy: { tagline: 'Assignment housing near your facility, ready on short notice.', attendingTitle: 'Who’s staying?', attending: [{ title: 'Travel nurses', text: 'Extended stays with kitchens, 15 minutes from your unit.' }, { title: 'Allied clinicians', text: 'Flexible 4- to 13-week stays.' }], benefits: ['13-week rates', 'Near partner facilities', 'Kitchens and laundry', 'Night-shift friendly'] },
    prompts: {
      logo: 'Healthcare staffing emblem: a circular badge filled deep navy (#1D3557) with a bold north-star mark in coral (#E76F51) inside a thin light-aqua (#A8DADC) ring, the word "NORTHSTAR" in modern bold sans-serif capitals in white and "TRAVEL NURSING" in small aqua letter-spaced capitals below.',
      photo: 'A city skyline at sunrise seen softly through a calm apartment window, mountains on the horizon, warm light at the edges, calm sky in the center, peaceful morning mood.',
      photo2: 'A modern hospital exterior at dawn, softly out of focus, glass facade reflecting a pastel sky, trees at the edges, empty plaza in the center.',
      abstract: 'Minimal abstract background: solid deep navy field with a few thin aqua concentric rings radiating from the right edge and one coral line, large plain calm area.',
    },
  },

  // ── Life & community ──────────────────────────────────────────────────
  { id: 'weddings', group: 'community', category: 'wedding', label: 'Weddings & celebrations', icon: 'favorite', sample: 'wedding',
    pitch: 'Held rooms for wedding guests, with an elegant page that matches your invitations.' },
  {
    id: 'funeral', group: 'community', label: 'Funeral homes & memorial services', icon: 'local_florist',
    pitch: 'A simple, respectful way for families to arrange lodging for out-of-town guests.',
    event: { name: 'Whitmore Family Funeral Home · Guest Lodging', category: 'other', venue: 'Whitmore Family Funeral Home', city: 'Lexington', region: 'KY', startDate: '2027-03-12', endDate: '2027-03-14', attendance: 'Family and guests' },
    organizer: { firstName: 'James', lastName: 'Whitmore', email: 'james@whitmorefuneralhome.example.com', organization: 'Whitmore Family Funeral Home', role: 'Funeral Director' },
    colors: { primary: '#2F3E46', secondary: '#A3B18A', accent: '#EDE6DB', ink: '#1F2A30' },
    typography: { heading: 'lora', body: 'lora' }, direction: 'premium', keywords: ['respectful', 'calm', 'compassionate'],
    copy: { tagline: 'Nearby rooms have been arranged for family and guests.', attendingTitle: 'For family and guests', attending: [{ title: 'Family', text: 'Quiet rooms close to the service, with flexible dates.' }, { title: 'Out-of-town guests', text: 'Simple booking, with help available by phone.' }], benefits: ['Close to the service', 'Flexible dates', 'Quiet, comfortable rooms', 'Help by phone'] },
    prompts: {
      logo: 'Funeral home emblem, respectful and understated: an oval medallion filled deep slate (#2F3E46) with a fine sage (#A3B18A) border and a single delicate olive branch in soft cream (#EDE6DB), the word "WHITMORE" in a refined classic serif in cream and "FAMILY FUNERAL HOME" in tiny letter-spaced capitals below.',
      photo: 'A serene lake at early morning with soft mist, distant trees at the left and right edges, still water and pale sky in the center, very calm, muted slate and sage tones, quiet and respectful.',
      photo2: 'A quiet garden with white flowers and soft morning light, gentle bokeh, an empty stone bench softly out of focus at one edge, peaceful and dignified, muted tones.',
      abstract: 'Minimal abstract background: solid deep slate field with delicate sage botanical line art along the outer edges, very calm and understated, large plain center.',
    },
  },
  {
    id: 'family-reunion', group: 'community', label: 'Family reunions', icon: 'diversity_1',
    pitch: 'Keep the whole family under one roof with a shared booking page.',
    event: { name: 'The Okafor Family Reunion 2027', category: 'other', venue: 'Lakewood Commons', city: 'Atlanta', region: 'GA', startDate: '2027-07-30', endDate: '2027-08-01', attendance: '160 relatives' },
    organizer: { firstName: 'Grace', lastName: 'Okafor', email: 'grace.okafor@example.com', organization: 'Okafor Family', role: 'Reunion Organizer' },
    colors: { primary: '#6A1E55', secondary: '#F4A261', accent: '#FFE8D6', ink: '#3E1132' },
    typography: { heading: 'poppins', body: 'work-sans' }, direction: 'premium', keywords: ['joyful', 'warm', 'together'],
    copy: { tagline: 'Rooms are held so the whole family can stay together.', attendingTitle: 'For the family', attending: [{ title: 'Families with kids', text: 'Suites with pools near the park.' }, { title: 'Elders', text: 'Accessible rooms close to the reunion venue.' }], benefits: ['Family block rate', 'Suites and connecting rooms', 'Near the park', 'Free breakfast'] },
    prompts: {
      logo: 'Family reunion emblem: a round badge filled deep plum (#6A1E55) with a warm orange (#F4A261) family-tree mark of interlocking leaves, the words "OKAFOR FAMILY" in friendly bold capitals in cream (#FFE8D6) arched at the top and "REUNION 2027" in small letter-spaced capitals below.',
      photo: 'A park picnic area under big oak trees at golden hour with string lights and long tables softly blurred at the left and right edges, warm glow, open lawn in the center, joyful but calm.',
      photo2: 'A generic modern city skyline at sunset seen across a lake in a park, no recognizable landmark buildings, warm orange and plum sky, trees at the edges, calm water in the center.',
      abstract: 'Minimal abstract background: solid deep plum field with warm orange interlocking circle linework along the right edge, large plain calm area.',
    },
  },
  {
    id: 'faith', group: 'community', label: 'Faith gatherings & retreats', icon: 'church',
    pitch: 'Lodging for annual gatherings, retreats and conventions — easy for every member.',
    event: { name: 'Grace Fellowship Annual Gathering 2027', category: 'conference', venue: 'Riverfront Convention Hall', city: 'Nashville', region: 'TN', startDate: '2027-06-24', endDate: '2027-06-27', attendance: '5,000 members' },
    organizer: { firstName: 'Daniel', lastName: 'Mercer', email: 'daniel@gracefellowship.example.org', organization: 'Grace Fellowship', role: 'Gathering Coordinator' },
    colors: { primary: '#2B2D42', secondary: '#E9C46A', accent: '#EDF2F4', ink: '#1B1C2B' },
    typography: { heading: 'playfair', body: 'inter' }, direction: 'premium', keywords: ['uplifting', 'welcoming', 'peaceful'],
    copy: { tagline: 'Official hotels for this year’s Gathering.', attendingTitle: 'Who’s attending?', attending: [{ title: 'Members & families', text: 'Hotels walkable to the hall, with group rates.' }, { title: 'Volunteers & speakers', text: 'Rooms near the riverfront for early mornings.' }], benefits: ['Walkable to the hall', 'Group rates', 'Family rooms', 'Free cancellation'] },
    prompts: {
      logo: 'Faith community emblem: a circular badge filled deep indigo-charcoal (#2B2D42) with a simple warm-gold (#E9C46A) rising sun and dove mark, the words "GRACE FELLOWSHIP" in an elegant serif in soft white arched at the top and "ANNUAL GATHERING" in small gold letter-spaced capitals below.',
      photo: 'A large auditorium stage with soft warm light beams through gentle haze, empty rows of seats dissolving into darkness at the edges, calm glowing center, peaceful and uplifting.',
      photo2: 'A riverfront at sunrise with a pedestrian bridge softly out of focus, warm golden light breaking through soft clouds, calm water in the center.',
      abstract: 'Minimal abstract background: solid deep indigo-charcoal field with fine warm-gold radiating light lines from the top right corner, large plain calm area.',
    },
  },

  // ── Education & culture ───────────────────────────────────────────────
  {
    id: 'commencement', group: 'education', label: 'University commencement & visits', icon: 'school',
    pitch: 'Graduation weekend, orientation and campus-visit hotels for students’ families.',
    event: { name: 'Westbrook University Commencement Weekend 2027', category: 'other', venue: 'Westbrook University Stadium', city: 'Ann Arbor', region: 'MI', startDate: '2027-05-01', endDate: '2027-05-02', attendance: '6,000 graduates · 25,000 guests' },
    organizer: { firstName: 'Priya', lastName: 'Natarajan', email: 'priya.natarajan@westbrook.example.edu', organization: 'Westbrook University', role: 'Commencement Office' },
    colors: { primary: '#7A0019', secondary: '#FFCC33', accent: '#F5F5F5', ink: '#4A0010' },
    typography: { heading: 'montserrat', body: 'inter' }, direction: 'signature', keywords: ['proud', 'traditional', 'celebratory'],
    abstractModel: 'flare', // Recraft snaps deep crimson to bright red
    copy: { tagline: 'Celebrate your graduate. Official hotels for Commencement weekend.', attendingTitle: 'Who’s attending?', attending: [{ title: 'Families of graduates', text: 'Rooms near campus with shuttle service to the stadium.' }, { title: 'Guests & alumni', text: 'Stays near downtown dining and campus tours.' }], benefits: ['Shuttle to the stadium', 'University rates', 'Near campus', 'Book early, rooms go fast'] },
    prompts: {
      logo: 'University emblem: a classic shield filled deep crimson (#7A0019) with a gold (#FFCC33) open book and laurel wreath, the word "WESTBROOK" in a bold traditional serif in white on a gold banner and "UNIVERSITY · 1891" in small letter-spaced capitals below.',
      photo: 'A historic university quad at golden hour with stone gothic buildings at the left and right edges, a wide green lawn and calm sky in the center, warm and proud, softly out of focus.',
      photo2: 'An empty college stadium field set with rows of white chairs for commencement at early morning, a stage softly blurred at the far end, calm open sky.',
      abstract: 'Minimal abstract background: solid deep crimson field with fine gold laurel and line ornaments along the outer edges, large plain calm center.',
    },
  },
  {
    id: 'music-festival', group: 'education', label: 'Music festivals & concerts', icon: 'music_note',
    pitch: 'Fan and artist hotels for multi-day festivals, with shuttle and late check-out.',
    event: { name: 'Riverbend Music Festival 2027', category: 'festival', venue: 'Riverbend Park', city: 'Austin', region: 'TX', startDate: '2027-10-01', endDate: '2027-10-03', attendance: '45,000 fans' },
    organizer: { firstName: 'Kai', lastName: 'Moreno', email: 'kai@riverbendfest.example.com', organization: 'Riverbend Festivals', role: 'Hospitality Manager' },
    colors: { primary: '#231942', secondary: '#FF5D8F', accent: '#FFD166', ink: '#160F2B' },
    typography: { heading: 'barlow-condensed', body: 'inter' }, direction: 'energy', keywords: ['vibrant', 'nocturnal', 'joyful'],
    copy: { tagline: 'Stay close to the stages. Shuttles run all weekend.', attendingTitle: 'Plan your weekend', attending: [{ title: 'Fans', text: 'Shuttle-connected hotels and late check-out on Sunday.' }, { title: 'Artists & crew', text: 'Quiet rooms near the artist entrance.' }], benefits: ['Festival shuttle stops', 'Late check-out', 'Walkable to the park', 'Instant confirmation'] },
    prompts: {
      logo: 'Music festival emblem: a round badge filled deep violet night (#231942) with a hot pink (#FF5D8F) and yellow (#FFD166) sunset over a river with sound-wave lines, the word "RIVERBEND" in bold condensed capitals in white arched at the top and "MUSIC FESTIVAL" in small yellow letter-spaced capitals below.',
      photo: 'A music festival main stage at dusk seen from far away across a park, stage lights and lasers glowing pink and violet, crowd silhouettes only at the far left and right edges, calm twilight sky in the center.',
      photo2: 'A ferris wheel and festival lights at dusk softly out of focus along a river, pink and gold bokeh at the edges, calm water and sky in the center.',
      abstract: 'Minimal abstract background: solid deep violet field with flowing pink sound-wave lines along the bottom right and one thin yellow line, large plain calm area.',
    },
  },
]

export const getVertical = (id) => VERTICALS.find((v) => v.id === id) || null

/** Intake event type → the verticals it covers (first = default). */
export const verticalsForCategory = (category) =>
  category ? VERTICALS.filter((v) => (v.category || v.event?.category) === category) : []
export const verticalsInGroup = (groupId) => VERTICALS.filter((v) => v.group === groupId)
