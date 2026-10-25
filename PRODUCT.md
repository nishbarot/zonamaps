# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Plain static HTML, CSS and JavaScript: one built page (`app/simple.html`) plus JSON data, MapLibre GL JS, no framework and no backend. Deployed on Vercel. Confirmed by the user.

## Users
Primary: residents of a town rewriting its zoning (homeowners, renters, neighbors), mostly lay readers, many on phones, checking what the draft means for their own lot and what they can do there. Also confirmed by the user: town officials and staff who use it to explain the draft to the public, and journalists and advocates who cite or share it.

## Product Purpose
zōna answers "What does the new zoning mean for my lot?" in plain language. It shows the answer on a 3D map and cites the section it came from. Success is a resident leaving knowing what changes on their street, whether they can do the thing they plan, and who decides.

## Positioning
It starts from residents' questions rather than the ordinance's structure, and any town can run it by editing `app/town.js` and the files in `app/data/`.

## Operating Context
A town publishes a zoning draft as hundreds of pages of PDFs, use tables and a district map. The sample data covers State College Borough, Pennsylvania, second draft, June 2026. The draft is not law and a third draft is expected.

## Capabilities and Constraints
- Leads with the typical change (for example "+3 ft") and highlights the smaller set of lots that change a lot more.
- Starts from life situations ("A parent is moving in with me") and "Where can I…" questions, with real lot counts split by who says yes.
- Every answer is one of four: *Yes* (staff issue a permit), *Yes, after a hearing*, *No*, or *Not decided yet*. Confirmed by the user as non-negotiable.
- Address or parcel search explains any lot: today's and draft height limits, a block summary, what is possible there.
- Points to the draft timeline and how to send a public comment.
- Works on phones with a draggable bottom sheet. Light mode is the default on every device; dark mode only when explicitly set.
- Place-specific facts live in `app/town.js` and `app/data/`.
- Data terms, disclaimers and credits are in `DATA.md`. The draft districts are traced and approximate, and the map is not the official map or the Borough's GIS.
- Not decided: other copy or visual rules, such as whether orange is reserved for change. The user did not mark these binding.

## Brand Commitments
Name: zōna. MIT-licensed code, ODbL building footprints.

## Evidence on Hand
Real sample data for one borough in `app/data/` (parcels, rules, addresses, building footprints), screenshots in `docs/`, and a live demo at https://zona-zeta.vercel.app. No testimonials or usage metrics exist; do not invent any.

## Product Principles
1. Start from the resident's question, not the ordinance's structure.
2. Answer in plain words and cite the section.
3. Say who decides, using only the four answers.
4. Be honest about uncertainty: drafts change, and the map is approximate and unofficial.
5. Stay place-neutral so any town can run it.

## Accessibility & Inclusion
Audience is lay residents on phones. No formal standard has been stated; plain-language copy and legible text are product requirements.
