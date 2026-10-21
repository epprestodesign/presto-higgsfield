// HOTEL DETAILS / Policies & Property — the property policies block plus the
// "More about the property" description block from the detail screen.
import PoliciesSection from '../../components/details/PoliciesSection.vue'
import AboutProperty from '../../components/details/AboutProperty.vue'

const policies = [
  // Property policies
  { title: 'Check-in', body: 'Check-in from 3 PM – 2:00 AM' },
  { title: 'Check-out', body: 'Check-out before noon' },
  { title: 'Children and extra beds', body: 'Extra beds depend on the room you choose. All children are welcome. When booking more than 5 rooms, different policies and additional supplements may apply.' },
  { title: 'Pets', body: 'Pets are not allowed, with the exception of service animals.' },
  // Booking policies (GrandStay + hotel) — mirror the checkout policy set.
  { title: 'GrandStay Refund Policy', body: "All refunds are subject to GrandStay's standard refund terms. Approved refunds will be processed within 5–10 business days to the original form of payment. Refunds will not be issued for no-shows or early departures unless otherwise stated at the time of booking." },
  { title: 'GrandStay Cancellation Policy', body: "Reservations may be cancelled in accordance with GrandStay's cancellation guidelines. Standard cancellations must be submitted no later than 72 hours prior to the scheduled arrival date. Cancellations submitted after this window may be subject to a penalty equal to one night's room rate plus applicable taxes." },
  { title: 'Hotel Cancellation Policy', body: "Individual hotel cancellation policies apply and may supersede GrandStay's standard guidelines where more restrictive. Please review the property's specific cancellation terms, which are confirmed in your booking confirmation email." },
  { title: 'Deposit', body: "A deposit equal to the first night's room rate plus taxes will be charged to the credit card on file at the time of booking. The remaining balance will be charged upon check-in or as otherwise specified in your booking confirmation." },
  { title: 'Additional Policies & Amenities', body: 'Additional policies may apply based on the specific property, including but not limited to minimum night stay requirements, age restrictions, and occupancy limits. Amenity availability may vary by property and is subject to change without notice.' },
  { title: 'Amenities Notice', body: 'Amenities listed are subject to availability and may not be accessible at all times during your stay. Scheduled maintenance or seasonal closures may temporarily affect access to certain facilities. The hotel reserves the right to substitute comparable amenities when necessary.' },
  { title: 'Incidental Fees', body: "Hotels may require a credit card authorization hold for incidental charges upon check-in. The hold amount varies by property and will be released within 3–5 business days after check-out, provided no charges are incurred. GrandStay is not responsible for incidental charges assessed directly by the hotel." },
]

const about = `Located in the heart of Lake Buena Vista, this resort is an ideal base for tournament weekends — minutes from the pitch, with top attractions, dining, and shopping just steps away. Relax in a newly renovated room after match day, unwind at the heated pool and spa, or refuel at one of three on-site restaurants. Complimentary premium Wi-Fi and a 24-hour fitness centre round out a stay built for teams and families alike.`

export default {
  title: 'Hotel Details/Components/Policies & Property',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Overview
Two sibling blocks from the lower half of the hotel detail screen:

- **About the Property** (\`AboutProperty\`) — a heading + body copy with an
  optional "See more" expander.
- **Property Policies** (\`PoliciesSection\`) — labelled policy terms
  (check-in/out, children & extra beds, pets, …); heading reuses DsSectionHeader.
` } } },
}

/** The "More about the property" description block, with See more. */
export const About = {
  render: () => ({
    components: { AboutProperty },
    setup: () => ({ about }),
    template: `<div style="max-width:760px"><about-property :text="about" /></div>`,
  }),
}

/** The property policies block. */
export const Policies = {
  render: () => ({
    components: { PoliciesSection },
    setup: () => ({ policies }),
    template: `<div style="max-width:760px"><policies-section :policies="policies" /></div>`,
  }),
}

/** Both blocks stacked, as they appear on the detail screen. */
export const Combined = {
  render: () => ({
    components: { AboutProperty, PoliciesSection },
    setup: () => ({ about, policies }),
    template: `<div style="max-width:760px;display:flex;flex-direction:column;gap:40px"><about-property :text="about" /><policies-section :policies="policies" /></div>`,
  }),
}
