# zōna

A plain-language 3D map of State College Borough's **draft** zoning ordinance (second draft, June 2026). Start from a question you actually have, like "a parent is moving in with me" or "can I open a restaurant", and see which lots the draft allows it on, who says yes, and what changes from today.

zōna is an independent, nonpartisan project. It is not made by or for State College Borough. The draft is not law, the draft district map here was traced from the Borough's PDF and is approximate, and nothing here is legal advice. The Borough Planning and Zoning Department decides what applies to a lot.

Built by Nish Barot.

## What it shows

- The typical change to the height limit, and how many lots change more.
- "Where can I" questions with lot counts, and who decides: Borough staff, the Zoning Hearing Board, or Borough Council.
- For any lot: the height limit today and in the draft, a summary of its block, and answers in four states (Yes, Yes after a hearing, No, Not decided yet).
- The draft timeline and how to send a public comment.

The orange block on the map is the most an owner could build. Nothing is built unless an owner chooses to.

## Run it

No install is needed. The page loads MapLibre GL 4.7.1 from cdnjs and reads the JSON files in `app/data/`, so serve it over http:

```sh
cd app
python3 -m http.server 8000
# open http://localhost:8000/simple.html
```

## Change it

`app/simple.html` is a built file. Edit the sources, then rebuild:

```sh
cd app
python3 build_simple.py   # writes simple.src.html and simple.html
```

- `app/simple.tpl.html`: the explorer's layout, styles (colors are tokens at the top, light and dark) and page logic.
- `app/page.src.html`: an older console page. `build_simple.py` copies shared pieces from it by line range (data constants, map dots and paint, search, height section, map layers). If you move code there, update the line numbers in `build_simple.py`.
- `app/data/`: `parcels.json` (3,125 parcels with today's and draft districts and heights), `buildings.json` (footprints), `rules.json` (today's and draft rules per district), `addresses.json` (street addresses for 3,088 parcels).
- `tools/screenshots.js`: Playwright screenshots at laptop, mid and phone sizes, light and dark.
- `tools/get_footprints.py`: how `buildings.json` was cut from the Microsoft footprints file.

## Data and credits

The code is MIT licensed ([LICENSE](LICENSE)). The data keeps its own terms: see [DATA.md](DATA.md). Building footprints come from Microsoft and are shared under the ODbL.

## Writing rules

Verified facts only, and label any guess. Never call the draft "official" or the traced map "the Borough's GIS". Use made-up placeholders such as "123 Main Street" in examples, never real people or real addresses.

## Corrections

Found something wrong? Open an issue with the parcel number and the draft section that says otherwise.
