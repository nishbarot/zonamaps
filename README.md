<div align="center">

# zōna

**What does the new zoning draft mean for my lot?**

A plain-language 3D map of State College Borough's draft zoning ordinance.

[**Open the map**](https://zona-zeta.vercel.app) · [Report a wrong answer](../../issues/new?template=correction.md) · [Data sources](DATA.md)

[![Code: MIT](https://img.shields.io/badge/code-MIT-12585C)](LICENSE)
[![Footprints: ODbL](https://img.shields.io/badge/footprints-ODbL-0E2340)](DATA.md)
![No build tools](https://img.shields.io/badge/install-none-C85400)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/overview-dark.jpg">
  <img src="docs/overview.jpg" alt="zōna overview: a 3D map of State College Borough with lots colored by how much the draft changes their height limit, and a side panel saying the typical change is +3 ft on 2,164 of 3,125 lots">
</picture>

</div>

## Why this exists

State College Borough is rewriting its zoning ordinance. The second draft (June 2026) runs hundreds of pages across PDFs, use tables and a district map. Most people only want to know a few things: what changes on my street, can I do the thing I'm planning, and who decides.

zōna starts from those questions, not from the ordinance's structure. It answers in plain words, shows the answer on a map, and cites the section it came from.

## What it does

- **Shows the typical change.** Most lots see the height limit rise about 3 ft, about the height of a kitchen counter. The map highlights the smaller set of lots that change a lot more.
- **Starts from your life, not the code.** You pick "A parent is moving in with me" or "I want to open a café", and zōna turns that into the zoning question underneath it.
- **Answers "Where can I…" with real counts.** For example, "Add a small second home: 2,632 lots", split by who says yes.
- **Says who decides.** Every answer is one of four: *Yes* (Borough staff issue a permit), *Yes, after a hearing* (the Zoning Hearing Board or Borough Council), *No*, or *Not decided yet*.
- **Explains any lot.** Search an address or parcel number to see today's and the draft's height limits, a summary of the block, and what you could do there.
- **Points you to the process.** It gives the draft timeline and how to send a public comment.
- **Works on phones.** The map comes with a bottom sheet you can drag to any height. Phones open in light mode.

<table>
<tr>
<td width="62%"><img src="docs/where-can-i.jpg" alt="Where can I add a small second home: 2,632 lots, with the matching lots highlighted on the map"></td>
<td width="38%"><img src="docs/phone.jpg" alt="zōna on a phone: map on top, overview in a draggable bottom sheet"></td>
</tr>
</table>

## Run it locally

There's nothing to install. It's one HTML page plus a few JSON files, so any static server works.

```sh
git clone https://github.com/nishbarot/zonamaps.git
cd zonamaps/app
python3 -m http.server 8000
# open http://localhost:8000/simple.html
```

The page loads [MapLibre GL JS](https://maplibre.org) 4.7.1 from cdnjs. A copy is also kept in `app/vendor/` in case you need to work offline.

## How it works

```
app/
  simple.tpl.html   the explorer: layout, styles, page logic (edit this)
  page.src.html     older console page; shared pieces are copied from it
  build_simple.py   builds simple.html from the two files above
  simple.html       the built page that gets served (don't edit by hand)
  data/
    parcels.json    3,125 lots: shape, today's and draft district, height limits
    rules.json      today's and draft rules per district (uses, heights, parking)
    addresses.json  parcel number -> street address
    buildings.json  building footprints (Microsoft, ODbL)
  vercel.json       serves simple.html at /
tools/
  screenshots.js    Playwright screenshots at laptop, tablet and phone sizes
  get_footprints.py how buildings.json was cut from the statewide file
```

- **No framework and no backend.** The page fetches four JSON files and draws them with MapLibre. Everything else, including counts, block summaries and answers, is computed in the browser.
- **Colors are tokens.** Light and dark palettes sit at the top of `simple.tpl.html`. Orange only ever means "changes".
- **Rebuild after you edit:**

  ```sh
  cd app && python3 build_simple.py   # writes simple.src.html and simple.html
  ```

  `build_simple.py` copies some shared code out of `page.src.html` by line range. If you move code in that file, update the line numbers, and the script's checks will tell you if a piece is missing.

## Adapt it for your town

Most of zōna isn't specific to State College. To point it at another place:

1. **Parcels.** Export your county's parcels as GeoJSON polygons into `data/parcels.json`. Each feature needs an `id` (parcel number), `cur` and `draft` district codes, and the height limits `h_cur`, `h_draft` and `h_draft_max` in feet. A lot with no height on file can leave them `null`.
2. **Rules.** In `data/rules.json`, describe each district under `current` and `draft`: a `name`, `ft`, `stories`, and a `use` map whose values are `"P"` (permitted), `"S"` (special exception), `"C"` (conditional use) or `null` (not listed), plus optional `parking` and `incentives`.
3. **Addresses.** Map parcel numbers to site addresses in `data/addresses.json`. Use parcel number and address only. Leave out owner names and sale data.
4. **Footprints (optional).** Run `tools/get_footprints.py` on your state's file from [Microsoft's footprints](https://github.com/microsoft/USBuildingFootprints) and keep the ODbL credit.
5. **Words.** The questions, life events, timeline and footer text are constants near the top of the script in `simple.tpl.html` (`USEQ`, `EVENTS`, `CATCH`, `FOOT`). Rewrite them for your ordinance and cite your own sections.

If you build one, open an issue and tell us about it.

## Contributing

Corrections matter most here. If an answer is wrong for a lot, [open a correction](../../issues/new?template=correction.md) with the parcel number and the draft section that says otherwise.

Code changes are welcome too. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to run, check and screenshot your change, and for the writing rules every answer follows:

- Verified facts only, and label any guess.
- The draft is never "official", and the traced district map is never "the Borough's GIS".
- Use made-up examples ("123 Main Street", "Jane Doe"), never real people or real addresses.

## Status and limits

- The draft is **not law**. This is the second draft from June 2026. A third draft is expected, and the Council hearing is tentatively set for early 2027.
- The draft district lines were **traced by hand** from the Borough's PDF map and are approximate.
- Today's rules are plain-language summaries with section citations. They have not all been checked line by line yet.
- Setbacks, lot coverage, density and overlays are not applied.
- **Nothing here is legal advice.** The Borough Planning and Zoning Department decides what applies to a lot.

zōna is an independent, nonpartisan project. It is not made by or for State College Borough.

## License and credits

- **Code:** [MIT](LICENSE).
- **Data:** keeps its own terms, listed source by source in [DATA.md](DATA.md). Building footprints are © Microsoft under the ODbL. Parcels come from Centre County via PASDA. Zoning and addresses come from the Borough of State College.
- **Map:** [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) (BSD-3-Clause).

Built by Nish Barot.
