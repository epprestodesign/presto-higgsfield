// Brand typography options. Every family here is loaded from Google Fonts in
// .storybook/preview-head.html (and later the app's index.html), so it is
// safe to offer in the Brand Kit picker. All are SIL Open Font License.
// `weights` lists exactly the weights we load, so pickers never offer a
// weight the browser would have to fake.
export const FONT_OPTIONS = [
  { id: 'pt-sans', label: 'PT Sans', family: "'PT Sans', sans-serif", category: 'sans', weights: [400, 700], italic: true, note: 'Presto default' },
  { id: 'inter', label: 'Inter', family: "'Inter', sans-serif", category: 'sans', weights: [400, 600, 700] },
  { id: 'montserrat', label: 'Montserrat', family: "'Montserrat', sans-serif", category: 'sans', weights: [500, 700, 800] },
  { id: 'poppins', label: 'Poppins', family: "'Poppins', sans-serif", category: 'sans', weights: [400, 600, 700] },
  { id: 'work-sans', label: 'Work Sans', family: "'Work Sans', sans-serif", category: 'sans', weights: [400, 600, 700] },
  { id: 'oswald', label: 'Oswald', family: "'Oswald', sans-serif", category: 'display', weights: [500, 700] },
  { id: 'barlow-condensed', label: 'Barlow Condensed', family: "'Barlow Condensed', sans-serif", category: 'display', weights: [600, 700] },
  { id: 'playfair', label: 'Playfair Display', family: "'Playfair Display', serif", category: 'serif', weights: [500, 600, 700] },
  { id: 'dm-serif', label: 'DM Serif Display', family: "'DM Serif Display', serif", category: 'serif', weights: [400] },
  { id: 'lora', label: 'Lora', family: "'Lora', serif", category: 'serif', weights: [400, 600], italic: true },
]

export const DEFAULT_FONT_ID = 'pt-sans'

export const getFont = (id) => FONT_OPTIONS.find((f) => f.id === id) || FONT_OPTIONS[0]
