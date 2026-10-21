// Brand typography options. Every family here is loaded from Google Fonts in
// .storybook/preview-head.html (and later the app's index.html), so it is
// safe to offer in the Brand Kit picker. All are SIL Open Font License.
export const FONT_OPTIONS = [
  { id: 'pt-sans', label: 'PT Sans', family: "'PT Sans', sans-serif", category: 'sans', note: 'Presto default' },
  { id: 'inter', label: 'Inter', family: "'Inter', sans-serif", category: 'sans' },
  { id: 'montserrat', label: 'Montserrat', family: "'Montserrat', sans-serif", category: 'sans' },
  { id: 'poppins', label: 'Poppins', family: "'Poppins', sans-serif", category: 'sans' },
  { id: 'work-sans', label: 'Work Sans', family: "'Work Sans', sans-serif", category: 'sans' },
  { id: 'oswald', label: 'Oswald', family: "'Oswald', sans-serif", category: 'display' },
  { id: 'barlow-condensed', label: 'Barlow Condensed', family: "'Barlow Condensed', sans-serif", category: 'display' },
  { id: 'playfair', label: 'Playfair Display', family: "'Playfair Display', serif", category: 'serif' },
  { id: 'dm-serif', label: 'DM Serif Display', family: "'DM Serif Display', serif", category: 'serif' },
  { id: 'lora', label: 'Lora', family: "'Lora', serif", category: 'serif' },
]

export const DEFAULT_FONT_ID = 'pt-sans'

export const getFont = (id) => FONT_OPTIONS.find((f) => f.id === id) || FONT_OPTIONS[0]
