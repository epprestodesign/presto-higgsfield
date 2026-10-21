<script setup>
// ConfirmationPage — the post-checkout success screen, structured to match the
// production booking confirmation: a compact success banner, a Summary section
// (contact + booking ID + Book-in-Block / Copy-Link / Print actions + a
// reserved/organization/contact meta grid + one block per hotel with the rooms
// held per night), and a per-hotel Policies section.
//
// Three data modes share this structure:
//   hold         → Group Block   ("Group Block Summary", Group ID + release date,
//                  "Book in Block", rooms shown as "(N rooms held)")
//   reserve      → single stay    ("Reservation Summary", Confirmation #)
//   reservations → multiple stays ("Reservations Summary", one block per stay)
// Controls are presentational (visual states only). Accents use the DS primary.
import { computed, onMounted, ref } from 'vue'
import { loadImagery } from '../../lib/imagery'
import { normalizeSecondaryFees, feeTooltip } from '../../lib/secondaryFees'

const props = defineProps({
  mode: { type: String, default: 'reserve' }, // reserve | hold | reservations
  data: { type: Object, default: () => ({}) },
})

const isHold = computed(() => props.mode === 'hold')
const d = computed(() => props.data || {})

// --- Banner / labels ---------------------------------------------------------
const bannerTitle = computed(() =>
  d.value.bannerTitle ||
  (isHold.value
    ? 'Success! Your Group Block is being held.'
    : props.mode === 'reservations'
      ? 'Success! Your reservations are confirmed.'
      : 'Success! Your reservation is confirmed.')
)
const bannerCta = computed(() =>
  d.value.bannerCta || (isHold.value ? 'Hold Another Group Block' : 'Book Another Reservation')
)
const summaryLabel = computed(() =>
  isHold.value ? 'Group Block Summary' : props.mode === 'reservations' ? 'Reservations Summary' : 'Reservation Summary'
)
const idLabel = computed(() => (isHold.value ? 'Group ID' : 'Confirmation #'))
const bookingId = computed(() => d.value.groupId || d.value.confirmationId || d.value.itinerary || '')
const contactName = computed(() => d.value.contactName || '')
const releaseDate = computed(() => (isHold.value ? d.value.releaseDate : ''))

// Meta grid rows (label → value). Group blocks surface the organization + group
// contact; single/multiple reservations surface the booking guest.
const metaRows = computed(() => {
  const rows = []
  if (d.value.reservedOn) rows.push({ label: 'Reserved On', value: d.value.reservedOn })
  if (isHold.value) {
    if (d.value.organizationName) rows.push({ label: 'Organization Name', value: d.value.organizationName })
    if (d.value.groupContact) rows.push({ label: 'Group Contact', value: d.value.groupContact })
  } else if (d.value.guest) {
    rows.push({ label: 'Guest', value: d.value.guest })
  }
  if (d.value.email) rows.push({ label: 'Email', value: d.value.email })
  return rows
})

// --- Hotels ------------------------------------------------------------------
// Every mode normalizes to a list of hotel blocks:
//   { name, stars, address, seed, checkIn, checkOut,
//     rooms: [{ type, note, nights: [{ date, qty, price }] }] }
const hotels = computed(() => d.value.hotels || [])
const heldSuffix = (qty) => `${qty} ${qty === 1 ? 'room' : 'rooms'}${isHold.value ? ' held' : ''}`
const starText = (n) => (Number.isInteger(n) ? `${n}` : `${n}`)

// Thumbnails come from the imagery library, seeded per hotel.
const lib = ref(null)
onMounted(async () => { lib.value = await loadImagery() })
const thumb = (h) => {
  const arr = lib.value?.exterior
  if (!arr || !arr.length) return null
  return arr[(h.seed ?? 0) % arr.length]?.url || null
}

const policies = computed(() => d.value.policies || [])

const money = (n) => '$' + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const print = () => { if (typeof window !== 'undefined') window.print() }

// --- Totals (DES-455) --------------------------------------------------------
// The live confirmation page closes the summary with Taxes → each secondary
// custom fee → Room Cost / Amount Paid / Balance due. Group blocks are held
// rather than charged, so they get no totals block at all.
//
// Per-hotel shape, all optional — omit `totals` and the block doesn't render:
//   totals: { taxes, secondaryFees: [...], roomCost, amountPaid, balanceDue }
//
// Secondary fees are charged at booking, so they are already inside
// `amountPaid`; the component never re-adds them.
const feesFor = (h) => normalizeSecondaryFees(h?.totals?.secondaryFees, {
  nights: (h?.rooms?.[0]?.nights || []).length || 1,
  rooms: h?.totals?.rooms ?? 1,
})
const feeTip = (f) => feeTooltip(f)
const showTotals = (h) => !isHold.value && !!h?.totals
</script>

<template>
  <div class="conf">
    <div class="conf__inner">
      <!-- SUCCESS BANNER -->
      <section class="conf__banner">
        <span class="conf__banner-check"><q-icon name="check_circle" size="34px" /></span>
        <div class="conf__banner-text">
          <p class="conf__banner-title">{{ bannerTitle }}</p>
          <p class="conf__banner-sub">A confirmation email is on its way.</p>
        </div>
        <button type="button" class="conf__banner-cta">{{ bannerCta }}</button>
      </section>

      <!-- SUMMARY -->
      <h2 class="conf__sectionlabel">{{ summaryLabel }}</h2>

      <section class="conf__card conf__summary">
        <!-- header: contact + id  |  actions + release date -->
        <div class="conf__sumhead">
          <div class="conf__sumhead-left">
            <div class="conf__contact">{{ contactName }}</div>
            <div v-if="bookingId" class="conf__bookingid">{{ idLabel }} {{ bookingId }}</div>
          </div>
          <div class="conf__sumhead-right">
            <div class="conf__actions">
              <button v-if="isHold" type="button" class="conf__action"><q-icon name="open_in_new" size="16px" /> Book in Block</button>
              <button type="button" class="conf__action"><q-icon name="content_copy" size="16px" /> Copy Booking Link</button>
              <button type="button" class="conf__action" @click="print"><q-icon name="print" size="16px" /> Print</button>
            </div>
            <div v-if="releaseDate" class="conf__release">
              <span>Group Block Release Date:</span> <strong>{{ releaseDate }}</strong>
            </div>
          </div>
        </div>

        <hr class="conf__rule" />

        <!-- meta grid -->
        <dl v-if="metaRows.length" class="conf__metagrid">
          <div v-for="m in metaRows" :key="m.label" class="conf__metarow">
            <dt>{{ m.label }}:</dt>
            <dd>{{ m.value }}</dd>
          </div>
        </dl>

        <!-- per-hotel blocks -->
        <div v-for="(h, hi) in hotels" :key="hi" class="conf__hotel">
          <hr class="conf__rule" />
          <header class="conf__hotelhead">
            <img v-if="thumb(h)" :src="thumb(h)" alt="" class="conf__thumb" />
            <div v-else class="conf__thumb conf__thumb--empty"><q-icon name="image" size="22px" /></div>
            <div class="conf__hotelmeta">
              <h3 class="conf__hotelname">{{ h.name }}</h3>
              <div v-if="h.stars" class="conf__stars"><q-icon name="star" size="16px" /> {{ starText(h.stars) }} Stars</div>
              <div v-if="h.address" class="conf__addr">{{ h.address }}</div>
            </div>
          </header>

          <div v-for="(r, ri) in h.rooms || []" :key="ri" class="conf__room">
            <div class="conf__roomtype">{{ r.type }}</div>
            <div v-if="r.note" class="conf__roomnote">{{ r.note }}</div>

            <div class="conf__ci">
              <div class="conf__cirow"><span>Check In</span><strong>{{ h.checkIn }}</strong></div>
              <div class="conf__cirow"><span>Check Out</span><strong>{{ h.checkOut }}</strong></div>
            </div>

            <ul class="conf__nights">
              <li v-for="(n, ni) in r.nights || []" :key="ni">
                <span class="conf__nightdate">{{ n.date }}</span>
                <span class="conf__nightheld">({{ heldSuffix(n.qty) }})</span>
                <span class="conf__nightprice">{{ money(n.price) }}</span>
              </li>
            </ul>
          </div>

          <!-- DES-455: totals — Taxes, up to three secondary custom fees, then
               what was charged now vs. owed at the property. -->
          <dl v-if="showTotals(h)" class="conf__totals">
            <div v-if="h.totals.taxes != null" class="conf__totalrow">
              <dt>Taxes</dt><dd>{{ money(h.totals.taxes) }}</dd>
            </div>
            <div v-for="(f, fi) in feesFor(h)" :key="'fee' + fi" class="conf__totalrow">
              <dt>
                {{ f.name }}
                <button v-if="feeTip(f)" type="button" class="conf__info" :aria-label="`About ${f.name}`">
                  <q-icon name="info" size="15px" />
                  <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 8]" max-width="320px">{{ feeTip(f) }}</q-tooltip>
                </button>
              </dt>
              <dd>{{ money(f.total) }}</dd>
            </div>

            <div v-if="h.totals.roomCost != null" class="conf__totalrow conf__totalrow--strong conf__totalrow--ruled">
              <dt>Room Cost</dt><dd>{{ money(h.totals.roomCost) }}</dd>
            </div>
            <div v-if="h.totals.amountPaid != null" class="conf__totalrow conf__totalrow--strong">
              <dt>Amount Paid (at time of booking)</dt><dd>{{ money(h.totals.amountPaid) }}</dd>
            </div>
            <div v-if="h.totals.balanceDue != null" class="conf__totalrow conf__totalrow--strong conf__totalrow--ruled">
              <dt>Balance due</dt><dd>{{ money(h.totals.balanceDue) }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- POLICIES -->
      <section v-if="policies.length" class="conf__card conf__policies">
        <div v-for="(p, pi) in policies" :key="pi" class="conf__policyhotel">
          <h3 class="conf__policyname">{{ p.hotel }}</h3>
          <div v-for="(it, ii) in p.items || []" :key="ii" class="conf__policyitem">
            <h4 class="conf__policytitle">{{ it.title }}</h4>
            <p class="conf__policybody">{{ it.body }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.conf { background: var(--ds-color-surface-sunken); min-height: 100vh; padding: 32px 24px 64px; }
.conf__inner { max-width: 800px; margin: 0 auto; }

/* cards */
.conf__card { background: var(--ds-color-surface); border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); padding: 28px 32px; margin-bottom: 20px; }
.conf__rule { border: 0; border-top: 1px solid var(--ds-color-border); margin: 20px 0; }

/* success banner */
.conf__banner { display: flex; align-items: center; gap: 18px; background: var(--ds-color-surface); border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); padding: 20px 24px; margin-bottom: 24px; }
.conf__banner-check { color: var(--ds-color-text-success); display: flex; flex: none; }
.conf__banner-text { flex: 1; min-width: 0; }
.conf__banner-title { margin: 0; font-size: 1.125rem; font-weight: 800; color: var(--ds-color-text-success); }
.conf__banner-sub { margin: 2px 0 0; color: var(--ds-color-text-subtle); font-size: 0.9375rem; }
.conf__banner-cta { flex: none; height: 44px; padding: 0 20px; border: 0; border-radius: var(--ds-radius-button); background: var(--ds-color-background-brand-bold); color: #fff; font-family: inherit; font-weight: 700; font-size: 0.9375rem; cursor: pointer; }
.conf__banner-cta:hover { background: var(--ds-palette-navy-800); }

/* section label */
.conf__sectionlabel { margin: 0 0 12px; font-size: 1.375rem; font-weight: 800; color: var(--ds-color-link); }

/* summary header */
.conf__sumhead { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.conf__contact { font-size: 1.25rem; font-weight: 800; color: var(--ds-color-text); }
.conf__bookingid { margin-top: 4px; font-weight: 700; font-size: 0.9375rem; color: var(--ds-color-text-success); }
.conf__sumhead-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; text-align: right; }
.conf__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 18px; }
.conf__action { display: inline-flex; align-items: center; gap: 6px; background: none; border: 0; padding: 0; color: var(--ds-color-link); font-family: inherit; font-weight: 700; font-size: 0.9375rem; cursor: pointer; }
.conf__action:hover { text-decoration: underline; }
.conf__release { font-size: 0.875rem; color: var(--ds-color-text-subtle); }
.conf__release strong { color: var(--ds-color-text); font-weight: 700; }

/* meta grid */
.conf__metagrid { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: 8px 24px; }
.conf__metarow { display: contents; }
.conf__metarow dt { color: var(--ds-color-text-subtle); font-size: 0.9375rem; }
.conf__metarow dd { margin: 0; font-weight: 700; color: var(--ds-color-text); font-size: 0.9375rem; }

/* hotel block */
.conf__hotelhead { display: flex; align-items: flex-start; gap: 16px; }
.conf__thumb { width: 92px; height: 72px; flex: none; border-radius: var(--ds-radius-md); object-fit: cover; display: block; }
.conf__thumb--empty { display: flex; align-items: center; justify-content: center; background: var(--ds-palette-slate-100); color: var(--ds-color-text-subtlest); }
.conf__hotelmeta { min-width: 0; }
.conf__hotelname { margin: 0; font-size: 1.1875rem; font-weight: 800; color: var(--ds-color-text); }
.conf__stars { display: inline-flex; align-items: center; gap: 4px; margin-top: 4px; font-size: 0.875rem; font-weight: 700; color: var(--ds-color-text); }
.conf__stars .q-icon { color: var(--ds-palette-orange-500, #f59e0b); }
.conf__addr { margin-top: 4px; color: var(--ds-color-text-subtle); font-size: 0.8125rem; }

.conf__room { margin-top: 18px; }
.conf__roomtype { font-size: 1.0625rem; font-weight: 700; color: var(--ds-color-link); }
.conf__roomnote { margin-top: 2px; color: var(--ds-color-text-subtle); font-size: 0.875rem; }
.conf__ci { margin-top: 12px; display: flex; flex-direction: column; gap: 4px; }
.conf__cirow { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; font-size: 0.9375rem; }
.conf__cirow span { color: var(--ds-color-text-subtle); }
.conf__cirow strong { color: var(--ds-color-text); font-weight: 700; }
.conf__nights { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.conf__nights li { display: grid; grid-template-columns: 1fr auto auto; align-items: baseline; gap: 16px; font-size: 0.9375rem; }
.conf__nightdate { color: var(--ds-color-text); }
.conf__nightheld { color: var(--ds-color-text); font-weight: 700; text-align: right; }
.conf__nightprice { color: var(--ds-color-text-success); font-weight: 700; min-width: 84px; text-align: right; }

/* totals (DES-455) — taxes + secondary custom fees, then the charged/owed rows.
   Same two-column rhythm as the nights list so the amounts stay right-aligned. */
.conf__totals { margin: 14px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.conf__totalrow { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; font-size: 0.9375rem; }
.conf__totalrow dt { margin: 0; display: inline-flex; align-items: center; gap: 5px; color: var(--ds-color-text-subtle); }
.conf__totalrow dd { margin: 0; color: var(--ds-color-text); font-variant-numeric: tabular-nums; }
.conf__totalrow--strong dt, .conf__totalrow--strong dd { color: var(--ds-color-text); font-weight: 700; }
.conf__totalrow--ruled { border-top: 1px solid var(--ds-color-border); padding-top: 12px; margin-top: 6px; }
.conf__info { display: inline-flex; align-items: center; padding: 0; border: 0; background: none; color: inherit; cursor: pointer; }
.conf__info:hover { color: var(--ds-color-text); }

/* policies */
.conf__policyhotel + .conf__policyhotel { margin-top: 24px; }
.conf__policyname { margin: 0 0 12px; font-size: 1.1875rem; font-weight: 800; color: var(--ds-color-link); }
.conf__policyitem { margin-bottom: 14px; }
.conf__policytitle { margin: 0; font-size: 0.9375rem; font-weight: 700; color: var(--ds-color-text); }
.conf__policybody { margin: 4px 0 0; color: var(--ds-color-text-subtle); font-size: 0.875rem; line-height: 1.5; }

@media (max-width: 620px) {
  .conf__sumhead-right { align-items: flex-start; text-align: left; }
  .conf__actions { justify-content: flex-start; }
}
/* Phones: tighter gutters + a fully top-down stack — nothing sits side-by-side.
   Success banner, summary header, meta pairs and the hotel head all stack; the
   hotel photo goes full-width. */
@media (max-width: 600px) {
  .conf { padding: 24px 16px 48px; }
  .conf__card { padding: 20px 16px; }
  /* Success banner → icon + text, then a full-width action button. */
  .conf__banner { flex-direction: column; align-items: flex-start; padding: 16px 18px; gap: 12px; }
  .conf__banner-cta { width: 100%; }
  /* Summary header → contact block above the actions/release. */
  .conf__sumhead { flex-direction: column; gap: 14px; }
  .conf__actions { justify-content: flex-start; }
  /* Meta pairs → label above value, one per row. */
  .conf__metagrid { display: block; }
  .conf__metarow { display: block; margin-bottom: 12px; }
  .conf__metarow dt { margin-bottom: 2px; }
  /* Hotel head → full-width photo above the name/stars/address. */
  .conf__hotelhead { flex-direction: column; }
  .conf__thumb { width: 100%; height: 180px; }
}
</style>
