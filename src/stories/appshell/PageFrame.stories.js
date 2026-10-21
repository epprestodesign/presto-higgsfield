// APP SHELL / Page Frame — the full-page shell: Global Nav header + a Hotel
// Listings hero banner + body slot + footer. Every journey step renders inside
// this frame. `cartMode` is 'reserve' (Book Reservation) or 'hold' (Group Block).
import PageFrame from '../../components/PageFrame.vue'
import defaultBg from '../../../background-img/defaultBackgroundImage.png'
import epLogoWhite from '../../assets/eventpipe logos/eventpipe-logo-fff.svg'

export default {
  title: 'App Shell/Page Frame',
  component: PageFrame,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

// Hotel Listings hero banner (event name + date range over the default imagery).
const EVENT_NAME = 'Summer Soccer Classic 2027'
const EVENT_DATES = 'Wed, 6/16/2027 - Sat, 6/19/2027'
const scrim = 'linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.5))'
const heroStyle = {
  backgroundImage: `${scrim}, url(${defaultBg})`,
  backgroundColor: '#000',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: '#fff',
  width: '100%',
  aspectRatio: '1440 / 200',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
}

const hero = `
    <section :style="heroStyle">
      <div style="padding:0 24px; max-width:760px">
        <img :src="epLogoWhite" alt="EventPipe" style="height:30px;width:auto;display:block;margin:0 auto 12px" />
        <div class="text-h5" style="font-weight:700; line-height:1.15; margin:0">{{ EVENT_NAME }}</div>
        <div class="text-body1" style="margin-top:6px">{{ EVENT_DATES }}</div>
      </div>
    </section>`

const body = `
    <div style="max-width:1180px;margin:0 auto;padding:48px 24px;min-height:420px">
      <h1 class="text-h4" style="margin:0 0 12px">Page body</h1>
      <p style="color:var(--ds-color-text-subtle)">Any journey step renders inside this frame — Global Nav header and hero above, footer below.</p>
    </div>`

const make = (cartMode) => () => ({
  components: { PageFrame },
  setup: () => ({ heroStyle, EVENT_NAME, EVENT_DATES, epLogoWhite }),
  template: `<page-frame cart-mode="${cartMode}">${hero}${body}</page-frame>`,
})

// Book Reservation books directly — no running cart, so the cart button is hidden
// (GlobalNav shows the cart only for the Group Block 'hold' flow).
export const BookReservation = { name: 'Book Reservation', render: make('reserve') }
export const GroupBlock = { name: 'Group Block', render: make('hold') }
