// Cursor shapes for the quick-tour animations. All are drawn around (0, 0):
// the arrow's tip, and the centre of the hand (its hotspot when panning).
export const ARROW = 'M0 0V17.5L4.4 13.4L7.3 20.2L10.4 18.9L7.6 12.3H13.4Z'

// 24×24 hand (open = ready to grab, closed = dragging), offset by −12 so the
// middle of the palm sits on (0, 0).
export const HAND_OPEN =
  'M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z'
export const HAND_CLOSED =
  'M23 10V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V9c0-.83.67-1.5 1.5-1.5S11 8.17 11 9v2h1V8.5c0-.83.67-1.5 1.5-1.5S15 7.67 15 8.5V11h1V9c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1v-1c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z'

// A simple crest used as the stand-in event logo.
export const SHIELD = 'M0-30L26-21V2C26 18 14 28 0 34C-14 28-26 18-26 2V-21Z'
