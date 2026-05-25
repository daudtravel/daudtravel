# Transfers Feature — Folder Structure

This document describes the file/folder layout for the transfers feature. All UI uses the Daud Travel brand palette (forest green + gold yellow + cream).

```
transfers/
│
├── page.tsx                          Main listing page (server component)
│                                     Renders: TransfersHero → TransfersList → DriversSection
│
├── [id]/
│   └── page.tsx                      Transfer detail + booking page (client component)
│                                     Two-column layout: info panel (left) + BookingPanel (right, sticky)
│                                     Opens PaymentModal on "Pay" click
│
├── order/
│   ├── page.tsx                      Booking confirmation / success page
│   └── [id]/
│       └── page.tsx                  Order status detail page
│
└── _components/
    │
    ├── shared/                       Reusable primitives — import anywhere in transfers
    │   ├── StarRating.tsx            Interactive & readonly star rating (xs/sm/md sizes)
    │   │                             Brand yellow stars (text-brand-yellow fill-brand-yellow)
    │   └── RouteTag.tsx              "From → To" display with MapPin icons
    │                                 Variants: default | light | green; sizes: sm | md | lg
    │
    ├── sections/                     Full-width page sections
    │   ├── TransfersHero.tsx         Dark green hero banner (bg-brand-green)
    │   │                             Decorative circles, gold accent text, feature pills
    │   ├── TransfersList.tsx         Grid of TransferCard components with loading/error states
    │   │                             Fetches via useTransfers hook; supports pagination
    │   └── DriversSection.tsx        Light green bg section with DriverCard grid
    │                                 Fetches via driversAPI.get(); hidden when no drivers
    │
    ├── cards/                        Individual entity cards
    │   ├── TransferCard.tsx          Single transfer route card
    │   │                             Green top accent, route display, price badge, vehicle chips
    │   │                             "Book Now" → links to /transfers/[id]
    │   └── DriverCard.tsx            Driver profile card with photo, rating, reviews
    │                                 TOP badge for rating ≥ 4.5
    │                                 Inline WriteReviewModal (submit via driversAPI.createReview)
    │
    └── booking/                      Booking flow components (used inside [id]/page.tsx)
        ├── BookingPanel.tsx          Stepped booking widget (date → vehicle → driver → pay)
        │                             Sticky sidebar on desktop; exports BookingData interface
        ├── VehicleSelector.tsx       Visual vehicle card list with emoji, capacity, price
        │                             Selection highlighted with brand-green border + check icon
        ├── DriverSelector.tsx        Driver list with photo, rating; "Any driver" default option
        │                             Max-height scroll for long lists
        └── PaymentModal.tsx          Dialog overlay for passenger details + payment initiation
                                      Booking summary in green card; yellow Pay button
                                      POSTs to /api/transfers/payments/bog/create → redirects to BOG
```

## Brand color tokens (tailwind.config.ts)

| Token                  | Hex       | Usage                          |
|------------------------|-----------|--------------------------------|
| `brand-green`          | `#1B5C35` | Primary CTA, hero bg, headings |
| `brand-green-dark`     | `#143D25` | Hover states                   |
| `brand-green-mid`      | `#2E7D52` | Secondary text, icons          |
| `brand-green-50`       | `#F0F7F3` | Section backgrounds, cards     |
| `brand-green-100`      | `#D8EFE3` | Borders, dividers              |
| `brand-yellow`         | `#F5C418` | Accent, pay button, stars      |
| `brand-yellow-dark`    | `#D4A815` | Hover for yellow elements      |
| `brand-yellow-light`   | `#FBE270` | Subtle yellow backgrounds      |
| `brand-cream`          | `#F5F0E8` | Text on dark green surfaces    |

## Data flow

```
transfers/page.tsx
  └── TransfersList (useTransfers → GET /api/transfers?publicOnly=true)
  └── DriversSection (useQuery → driversAPI.get())

transfers/[id]/page.tsx
  └── useTransferById (GET /api/transfers/:id)
  └── BookingPanel
        └── useQuery → driversAPI.get()
        └── onBook() → sets bookingData state
  └── PaymentModal
        └── POST /api/transfers/payments/bog/create
        └── window.location.href = paymentUrl (BOG redirect)
```

## Adding new components

- New reusable primitives → `_components/shared/`
- New full-width page sections → `_components/sections/`
- New entity display cards → `_components/cards/`
- New booking step widgets → `_components/booking/`
