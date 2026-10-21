// Banner brief — the questionnaire an organizer answers, and the prompt it
// becomes. Kept as data so the same questions can drive the Storybook
// workbench, the prototype and (later) the server-side generator.
import { categoryLabel, formatDateRange, locationLabel } from '../../models/event.js'
import { getDirection } from '../../models/brandKit.js'

export const BRIEF_QUESTIONS = [
  {
    id: 'subject',
    label: 'What should the artwork show?',
    type: 'single',
    options: [
      { value: 'venue', label: 'The venue & atmosphere', prompt: 'the event venue and its atmosphere, wide establishing view' },
      { value: 'action', label: 'Participants in action', prompt: 'participants in dynamic action, motion and energy, faces not prominent' },
      { value: 'crowd', label: 'Fans & families', prompt: 'an excited crowd of fans and families, celebratory, faces softly out of focus' },
      { value: 'city', label: 'The host city', prompt: 'the host city skyline and streets, inviting travel mood' },
      { value: 'hotel', label: 'Hotel stay', prompt: 'a welcoming modern hotel room and lobby, comfortable travel stay' },
      { value: 'graphic', label: 'Abstract graphic', prompt: 'an abstract graphic composition of shapes, lines and texture, no photography' },
    ],
    default: 'action',
  },
  {
    id: 'mood',
    label: 'Pick up to three moods',
    type: 'multi',
    max: 3,
    options: ['Energetic', 'Family-friendly', 'Premium', 'Celebratory', 'Calm', 'Bold', 'Warm', 'Modern'].map((m) => ({ value: m.toLowerCase(), label: m })),
    default: ['energetic', 'family-friendly'],
  },
  {
    id: 'light',
    label: 'Time & light',
    type: 'single',
    options: [
      { value: 'golden', label: 'Golden hour', prompt: 'golden hour sunlight, warm glow' },
      { value: 'day', label: 'Bright daytime', prompt: 'bright natural daylight, crisp and clear' },
      { value: 'night', label: 'Night under lights', prompt: 'night time under bright stadium or city lights, dramatic contrast' },
      { value: 'studio', label: 'Studio / graphic', prompt: 'clean studio lighting, controlled and even' },
    ],
    default: 'golden',
  },
  {
    id: 'space',
    label: 'Leave room for your headline',
    type: 'single',
    options: [
      { value: 'left', label: 'Left side', prompt: 'keep the left third calm and uncluttered for a headline' },
      { value: 'right', label: 'Right side', prompt: 'keep the right third calm and uncluttered for a headline' },
      { value: 'center', label: 'Center', prompt: 'keep the center calm and uncluttered for a centered headline' },
      { value: 'none', label: 'Fill the frame', prompt: '' },
    ],
    default: 'left',
  },
  {
    id: 'text',
    label: 'Text in the artwork?',
    type: 'single',
    options: [
      { value: 'none', label: 'No: keep text editable (recommended)', prompt: 'No text, no letters, no logos, no watermarks.' },
      { value: 'headline', label: 'Yes: bake the headline in (Ideogram)', prompt: '' },
    ],
    default: 'none',
  },
  {
    id: 'logo',
    label: 'How should we use the logo?',
    type: 'single',
    options: [
      { value: 'style', label: 'As a style & color reference', prompt: 'Use the attached logo only as a reference for color and graphic style; do not reproduce the logo itself.' },
      { value: 'place', label: 'Place it in the artwork', prompt: 'Place the attached logo cleanly and legibly in the composition, undistorted.' },
      { value: 'skip', label: 'Don’t use it', prompt: '' },
    ],
    default: 'style',
  },
]

export const defaultAnswers = () =>
  Object.fromEntries(BRIEF_QUESTIONS.map((q) => [q.id, Array.isArray(q.default) ? [...q.default] : q.default]))

const opt = (qid, value) => BRIEF_QUESTIONS.find((q) => q.id === qid)?.options.find((o) => o.value === value)

/**
 * Build the generation prompt from the brief.
 * ctx: { event, brandKit, target, model, headline, sponsor }
 */
export function buildBannerPrompt(answers, { event = {}, brandKit = {}, target, model, headline, sponsor } = {}) {
  const direction = getDirection(brandKit.direction)
  const typography = answers.text === 'headline' && model?.typography
  const placingLogo = answers.logo === 'place' && model?.references > 0
  const noText = placingLogo ? 'No text or letters other than the supplied logo, no watermarks.' : 'No text, no letters, no logos, no watermarks.'
  const colors = sponsor ? Object.values(sponsor.colors || {}) : Object.values(brandKit.colors || {}).slice(0, 3)
  const kind = sponsor
    ? `Sponsored display ad (${target?.label || 'banner'}) for ${sponsor.name}, shown on the booking page of ${event.name || 'an event'}.`
    : `${target?.label || 'Wide website hero banner'} for the official hotel booking page of ${event.name || 'an event'}, a ${categoryLabel(event.category).toLowerCase()} in ${locationLabel(event) || 'the host city'}.`
  const parts = [
    kind,
    `Show ${opt('subject', answers.subject)?.prompt || 'the event'}.`,
    answers.mood?.length && `Mood: ${answers.mood.join(', ')}.`,
    `Creative direction: ${direction.name}. ${direction.summary}`,
    opt('light', answers.light)?.prompt && `Lighting: ${opt('light', answers.light).prompt}.`,
    colors.length && `Color palette: ${colors.join(', ')}.`,
    opt('space', answers.space)?.prompt && `Composition: ${opt('space', answers.space).prompt}.`,
    brandKit.keywords?.length && `Brand keywords: ${brandKit.keywords.join(', ')}.`,
    answers.logo !== 'skip' && model?.references > 0 && opt('logo', answers.logo)?.prompt,
    typography
      ? `Render this headline as bold, perfectly spelled typography: "${headline || event.name}". Add the dates "${formatDateRange(event.startDate, event.endDate)}" in smaller type. No other text, no watermarks.`
      : noText,
    'Photorealistic, high detail, professional advertising quality.',
  ]
  if (answers.subject === 'graphic') parts.splice(parts.length - 1, 1, 'Crisp vector-like graphic style, high detail.')
  return parts.filter(Boolean).join(' ')
}
