# The lot view: system design

The lot view answers one question for one lot: **how many homes could go here, and what would that look like?** A resident opens any lot in town and sees it as a small 3D model. They tap "Backyard cottage", "Duplex", "Townhomes" or "With bonus floors" and the model changes, with a plain answer and the draft section beside it.

This note records how it is built, what it assumes, and what to change as zōna grows. The sample numbers come from the data in `app/data/` (see [DATA.md](../DATA.md)).

<img src="lot-view.jpg" alt="The lot view: a house and an orange backyard cottage on a real lot, inside a dashed frame that marks where a new building may stand">

## 1. Requirements

### What it does

- Draws the lot a person opened, with its real shape, today's buildings and the neighbors around it.
- Offers the kinds of building the draft lists for that district, each as one tap: Today, Backyard cottage, House (empty lots only), Duplex, Fourplex, Townhomes, Apartment building. Downtown and in the commercial districts there is one choice for a new building, and one more for the same building with the bonus floors an owner can earn.
- Opens for every lot. Where the shape of the lot or the text of the draft gives too little to draw, it shows the lot as it is today, lists the choices as "No drawing here" and gives the reason.
- Gives each type one of zōna's existing answers: **Yes**, **Yes, after a hearing**, **No**, or a dashed "we can't tell" with the reason.
- Shows the rule as a shape: a dashed teal frame for where a new building may stand and how tall it may be.
- Counts homes as numbered front doors. There is no money, floor area ratio or unit yield anywhere.
- Lets people compare with "Hold to see today" and four fixed views (Street, Corner, Backyard, Above).

### What it must hold to

| Need | Target |
|---|---|
| Honest | Never draw an answer the data cannot support. County lot lines are rounded to about 1 m, so anything within 5 ft of a width limit or 3% of a size limit is "too close to call". |
| Light | The home page must not get heavier. The 3D code loads only when a lot with a model is opened. |
| Works everywhere | Phone first. If WebGL or the 3D library is missing, a flat plan of the same lot takes its place. |
| Simple | One tap per choice, 44 px targets, no free camera to get lost in. |
| No backend | Static files only, like the rest of zōna. All geometry runs in the browser. |
| Portable | Another town turns it on by adding numbers to `rules.json`. No town words in the code. |

### Constraints

- No build step beyond `build_simple.py`, no framework, no server.
- The data has lot shapes and building outlines only. There are no street centerlines, building heights, driveways or unit counts.
- The draft is not law. Every number is cited and every guess is labelled.

## 2. High-level design

```
                    loaded with the page                     loaded when a lot opens
              +----------------------------+            +-----------------------------+
 parcels.json |                            |            |                             |
 buildings.json --> lotmath.js  (geometry) |            |  three.js r128 (cdnjs)      |
 rules.json   |      index(), analyse()    |            |  lot3d.js  (drawing only)   |
              |            |               |            |      mount(), setModel(),   |
              |            v               |   model    |      pick(), view(), peek() |
              |     the lot model  --------+----------->|                             |
              |            |               |            +-----------------------------+
              |            v               |
              |  page script in            |
              |  simple.tpl.html:          |
              |  words, choice tray,       |
              |  flat SVG plan (fallback)  |
              +----------------------------+
```

Three parts, each with one job:

| Part | File | Job | Knows about |
|---|---|---|---|
| Lot math | `app/lotmath.js` | Turns one parcel into a **lot model**: which side faces the street, the yard lines, what fits. Pure functions, no DOM. Also runs in Node. | Geometry and the numbers in `rules.json` |
| Page script | `app/simple.tpl.html` | Writes the sentences, the choice tray and the flat plan. Decides when the lot view is open. | The lot model, `town.js` wording |
| 3D drawing | `app/lot3d.js` + three.js | Draws the model and animates between choices. Makes no decisions. | The lot model only |

**Data flow for one tap on a lot**

1. `select(id)` asks `lotModel(id)`, which calls `ZonaLot.analyse(index, id, rules.draft[district].lot)`. The result is cached for the open lot.
2. If the model is `ok`, the lot view opens over the map. The page script fills the tray, the answer card and the flat plan straight away.
3. The first time, the page fetches three.js and then `lot3d.js`. When they arrive the flat plan is swapped for the 3D canvas.
4. Tapping a choice calls `lvPick(k)`: the answer card, the plan and the 3D model all follow `state.pick`.
5. If the model is not `ok`, the lot keeps today's page and one line says why ("This lot has an irregular shape, so it has no lot model yet.").

## 3. Deep dive

### The rules block

A district gets a lot view when its draft entry in `rules.json` has a `lot` block. Only numbers and citations live there:

```json
"lot": {
  "cite": "Draft C.3.3(c)", "max_acres": 1,
  "height": {"ft": 28, "stories": 2},
  "rear": {"pct_depth": 15, "min_ft": 10}, "max_depth_ft": 50,
  "types": {
    "house":    {"width_ft": 40, "front_ft": 25, "side_ft": 8, "cover_pct": 30, "parking": 1},
    "duplex":   {"width_ft": 40, "front_ft": 25, "side_ft": 8, "cover_pct": 30, "parking": 4},
    "fourplex": {"width_ft": 40, "area_sqft": 10000, "cover_pct": 40, "parking": 4, "catch": "...", "cite": "..."},
    "adu":      {"sep_ft": 10, "max_sqft": 800, "max_share_pct": 25, "catch": "...", "cite": "Draft D.3.4(a)"}
  },
  "not_here": ["apartments"],
  "cites": {"yards": "...", "rear": "...", "width": "...", "block": "...", "cover": "...", "parking": "...", "corner": "..."}
}
```

Beyond the house districts, the same block takes a few more keys:

| Key | Meaning |
|---|---|
| `types.townhomes`, `types.apartments`, `types.block` | A row of homes, an apartment building, and one building of any listed use (`label`, `say` and `use` give it its name, its sentence and the row of the use table that decides Yes or No; `ground: "shops"` draws a glass ground floor) |
| `side_res_ft`, `rear_res_ft`, `alley_ft`, `corner_side_ft` | A yard that changes next to residential land, along an alley, or on the inside line of a corner lot |
| `front_block` | The front yard is set by the buildings next door (`tol_pct`, and `min_ft`/`max_ft` for a block with too few buildings) |
| `bonus` | Extra stories an owner can earn: `of` (the type they sit on), `stories`, `ft`, `cite`. The list of ways to earn them comes from the district's `incentives`. |
| `stepback` | `[[story, ft], ...]`: above that story the front wall moves back that far |
| `kind: "street"`, `flat_today` | A district of street-wall buildings: no pitched roofs, and today's buildings are drawn as flat boxes |
| `max_sqft`, `parking_txt`, `notes`, `info` | A cap on one building's ground area, parking in words, sentences for "How to read the model", and a district described in words only |

The sample data fills this in for every district that has a table of dimensions in the Borough's second draft (June 2026; its pages are headed "Public Hearing Draft"): C.3.3(c) to C.3.6(c), C.4.3(c) and C.4.5(c) to C.4.12(c) with their notes, D.3.4(a) for accessory dwelling units, Table E.1.6(a) for parking, and H.2.1 and H.3 for how lots are measured. Institutional and Park get `info` only, because their yards depend on the district next door. The University Planned District's section says only "[Placeholder]", so it has no numbers at all.

### The lot model

`analyse()` returns `{ok:false, why, text}` only for a lot over 25 acres. Every other lot gets:

```
{ ok, id,
  lot      the lot outline, in metres, street side at the bottom
  sides    [{a, b, len, kind: lot|alley|street|open, role: front|side|rear, set_ft}]
  build    the outline a new building must stay inside (the lot minus its yards)
  bld      today's building outlines, largest first
  ped, around, aroundB    the patch of ground drawn, with neighbor lots and buildings
  width_ft, depth_ft, sqft, acres, set:{front_ft, side_ft, rear_ft}
  corner, through, outside, height_ft, stories
  choices  [{k, state: now|may|no|nd, homes, checks, ex or poly, build, set, sqft, cover, cover_max, park,
             stories, height_ft, ground, bonus, tight, full, nodraw}]
  most     the largest number of homes any "may" choice gives
  plain, why, text    set when the lot is drawn as it is today, with the reason
}
```

`ex` is the example building: a rectangle placed inside `build`. Where the draft has no lot cover limit and no depth limit, the example fills the yard lines instead and `poly` holds that outline. Each choice carries its own `build` and `set`, because townhomes and apartments have wider yards than a duplex on the same lot. `checks` holds each test with what the lot has and what the draft asks for, so the page can write the sentence without redoing any math.

### Finding the street with no street map

The data has no streets. Lots tile a block, so whatever lies past a lot line tells us what that line faces. For each side, `lotmath.js` walks outward from three points on it:

| Found within | The side faces |
|---|---|
| 2.5 m, another lot | a neighbor |
| 10 m, another lot | an alley |
| 32.5 m, another lot | a street |
| nothing | open land or the edge of the data |

Street sides that point the same way are grouped into a frontage. One frontage is the front. With two or more, the shorter one is the front (a corner lot's narrow end), unless they are within 15% of each other, when the one nearest the main building wins. Clipped corners under 6 m are never the front. Corner lots give every street side the front yard distance, and through lots get a front yard at both ends, as the draft says in H.2.1(d).

If no side faces a street, the lot gets the plain model.

### Yards, width and what fits

- **Yards.** Each side is moved inward by its distance: front 25 ft, sides 8 ft, rear 15% of the lot's depth or 10 ft, whichever is greater. What is left is `build`.
- **Lot width** is measured where the draft measures it: at the front yard line, and held for 30 ft behind it (H.2.1(c)).
- **Example buildings** are plain rectangles placed at the front of `build`, sized like an ordinary building of that type (a duplex up to 48 ft wide, a fourplex up to 60 ft), no deeper than 50 ft, and kept to 80% of the lot cover limit so there is room left for a driveway.
- **Backyard cottage.** Scanned from the back of the lot: inside `build`, 10 ft from the house, not in front of it, clear of other buildings. Its size is capped at 800 sq ft or 25% of the house's floor area. We do not know floor area, so the drawing assumes the house has two floors and says so.
- **Lot cover** adds building footprints only. The draft also counts driveways and paving, and the card says that.
- **Townhomes** are a row of 20 ft wide, two-story homes, three to eight of them, as many as the yard lines and lot cover allow. The draft sets no number, so the card calls the row an example.
- **Apartment and downtown buildings** are stacked floor by floor to the height limit, one orange line per story. The draft sets no number of homes for them, so no doors are counted.
- **Bonus floors** are the same building with the extra stories drawn see-through above a label for the height without them. The card lists each way to earn them and keeps the ones Council has asked to drop, marked as such, because they are still in the draft text.
- **Front yards set by the block.** Three districts set the front yard by the buildings next door. The model averages the distance from the street to the neighbors' outlines on the same side and labels it "about". With no neighbor to measure, it uses where today's building stands, and says so.
- **Build-to lines.** Downtown, Mixed Use and West End measure the front wall from the curb. The data has no curb, so the building is drawn from the front lot line and "How to read the model" gives the draft's distance.
- **Buildings that share walls.** Downtown, one outline often covers several lots. A lot there also gets the part of any outline that stands on it, and the neighbors keep the rest.

<img src="lot-view-downtown.jpg" alt="A downtown lot: seven stories with a glass ground floor, a step back above the fourth story, and two see-through bonus floors">

### Answers and precision

| State | Shown as | When |
|---|---|---|
| `may` | Yes, orange building, numbered doors | Every check clears its limit with room to spare |
| `no` | No, grey outline | The lot is clearly under a size limit, or the draft does not list the use |
| `nd` | Dashed "can't tell", grey outline, the reason in words | A check is too close to call, the lot is narrower than the draft asks (the block average may still allow it, H.3.2), there is no clear spot, or the lot may be too full |

Width within 5 ft of the limit and size within 3% are too close to call. This is the main honesty rule: the model would rather say "check with the Borough" than flip a household's answer on a rounding error.

### Drawing

- An orthographic camera with four named views. A sideways drag turns the model and snaps to the nearest view, so nobody ends up under the ground.
- The camera fits itself to the lot and leaves room for the floating buttons, at any screen size.
- White is today, orange is change (the same meaning orange has everywhere in zōna), dashed teal is the rule, grey is "not here".
- Labels are HTML placed over the canvas: door numbers, the height limit, yard distances in the Above view. Screen readers get the choice and its answer on the canvas label, and the full answer is ordinary text in the panel.
- When the map's background is the aerial photo, the same photo is laid on the ground under the model: one picture for the patch, asked for by its four corners (`ped.ll` in the lot model). It fades in when it arrives, and the drawn neighbors step aside because the photo shows the real ones. If it never arrives, the drawn lawn and street stay.
- Rendering is on demand. A still model costs nothing.
- People who ask for reduced motion get instant changes and no autoplay.

### Loading and fallback

| Situation | What the person sees |
|---|---|
| Home page, any tab | No 3D code is fetched. `lotmath.js` is 18 KB. |
| First lot with a model | The flat plan at once, then the 3D model once three.js (604 KB, about 121 KB compressed) and `lot3d.js` (19 KB) arrive. |
| Later lots | 3D straight away. |
| No WebGL, or the CDN is blocked | The flat plan stays. Every choice and answer still works. |
| Lot with no model | Today's lot page, with one line saying why. |
| District with no `lot` block | Today's lot page, unchanged. |
| Aerial photo server slow or down | The drawn ground. The photo can take from under a second to 20 seconds, because the public server cuts each picture on request. |

## 4. Scale and reliability

Measured on the sample data with `node tools/check_lots.js`:

| | |
|---|---|
| Lots | 3,125 |
| Lots that open a model | **3,119** |
| With yard lines and examples | **2,327** (1,750 of them in Residence 2) |
| Plain model: irregular shape | 339 |
| Plain model: no street side found | 155 |
| Plain model: too small, or over the size the yard math is trusted for | 139 |
| Plain model: the draft gives no numbers (Institutional, Park, University Planned District, no district) | 132 |
| Plain model: condo units | 27 |
| No model: over 25 acres | 6 |
| Building the index | about 25 ms, once per page load |
| One lot | well under 1 ms (all 3,125 take about 0.7 s) |

Each lot is worked out when it is opened, so cost does not grow with town size. A town with 50,000 lots would spend more on downloading `parcels.json` than on any of this. The index is a 60 m grid, so neighbor lookups stay constant time.

**What can go wrong, and what catches it**

| Failure | Guard |
|---|---|
| A change to the math puts an example building outside the yard lines | `tools/check_lots.js` checks every example on every lot and exits 1 |
| The wrong side is picked as the front | The model draws a person and a car on the street side, and "How to read the model" says the front is worked out from lot lines. A correction issue fixes the data. |
| three.js fails to load | The promise rejects and the flat plan stays |
| `analyse()` throws on an odd shape | Caught in `lotModel()`. The lot falls back to today's page. |
| A neighbor's outline is a poor guide to the block's front yard | The distance is labelled an estimate on the card, with the draft's rule beside it |

There is no server, so there is nothing to monitor beyond the static host.

## 5. Trade-offs

| Decision | Why | Cost |
|---|---|---|
| three.js, loaded on demand from cdnjs | Real depth, roofs and doors read at a glance, and it is the one library most contributors already know | About 121 KB on the first lot, and a second CDN dependency. Not yet vendored like MapLibre. |
| Geometry in the browser, not precomputed | No pipeline to rerun when a rule changes. Change a number in `rules.json` and reload. | The same math runs on every visit (it is fast enough not to matter) |
| Infer the street from lot lines | Needs no new dataset, so any town with parcels gets it | 155 lots get the plain model, and a few corner lots may have the wrong front |
| Yard lines on simple (convex) lots only | The yard math is exact and easy to check | 339 flag lots, L shapes and curves get the plain model |
| A plain model instead of no model | Every lot opens the same way, and the reason is in words | 792 lots show today only |
| Draw downtown buildings from the lot line | The data has no curb | The real front wall can sit a few feet off the drawing, and the card says so |
| Example buildings are plain rectangles | Nobody mistakes them for a design proposal | Less charming than a real house plan |
| "Too close to call" bands | A wrong Yes is worse than an honest "check" | In Residence 2 alone, 143 cottage answers, 128 duplex answers and 45 fourplex answers are "can't tell" |
| Count homes, leave out money | Homes and stories are facts in the draft. Prices are guesses. | No answer to "what is it worth" |
| Four fixed views | Nothing to learn, nothing to get lost in | No free orbit or zoom |

## 6. Assumptions

- A lot's neighbors in `parcels.json` are complete enough that a gap means a street or an alley.
- Building outlines are from 2019 and are rough. The largest one on a lot is the house.
- Today's buildings are drawn at a typical house height. The data has no heights and no count of homes inside.
- The backyard cottage answer assumes the house is a one-family home, which the draft requires and the data cannot confirm. The card says so.
- The draft text read for the sample data is the second draft from June 2026. A new draft means re-reading the cited sections and updating `rules.json`.

## 7. What to revisit

1. **Street centerlines and curbs.** Adding them would replace the inference, give fronts to the 155 lots without one, let the model measure block-face averages (H.3.2 and H.3.3) properly, and put downtown buildings on the draft's build-to line.
2. **Irregular lots.** Inward offsetting for non-convex shapes would cover most of the 339.
3. **The next draft.** A third draft is expected. Every `lot` block needs re-reading against it, starting with the two open questions in [DATA.md](../DATA.md): the 48 or 52 ft height in Mixed Use and West End, and townhouse parking.
4. **Paving and open space.** With a driveway layer, lot cover and the 45% open space rule could be applied instead of described.
5. **Host the town's aerial photo ourselves.** The photos are free to copy. A set of tiles for one borough is roughly 70 to 100 MB, and serving it from our own static host would make the photo instant and take the load off the public server.
6. **Vendor three.js** in `app/vendor/` once the lot view has settled, so the page works offline like the map does.
7. **Triplex and cottage courts.** The Residence 2 table covers triplexes alongside fourplexes, and H.3.1(a) mentions cottage courts. Neither has its own choice yet.
8. **A unit test file.** `check_lots.js` is a whole-town check. A few fixed lots with expected answers would catch a wording or rule regression sooner.
