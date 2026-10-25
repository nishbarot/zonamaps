# Data sources and terms

The sample data in `app/data/` covers one place: State College Borough, Pennsylvania, using its second zoning draft (June 2026). If you set zōna up for another town, replace these files and this table with your own sources.

The code in this repository is MIT licensed (see `LICENSE`). The MIT license does not cover the data in `app/data/`. Each dataset keeps the terms of its source, listed below. Data was retrieved in October 2026.

| File or field | Source | Terms | Credit |
|---|---|---|---|
| `parcels.json` shapes, parcel numbers, acres | Centre County parcels, via PASDA (Pennsylvania Spatial Data Access). [Metadata](https://www.pasda.psu.edu/uci/FullMetadataDisplay.aspx?file=CentreCounty_Parcels202501.xml) | No license is stated. Access constraints: none. The county's use constraints are a liability disclaimer. | Centre County, PA via PASDA |
| `parcels.json` today's districts (`cur`, `cur_name`, `cur_class`) | State College Borough zoning districts, ArcGIS Online item [4539737f654f4966a0e452124efc98e3](https://www.arcgis.com/home/item.html?id=4539737f654f4966a0e452124efc98e3) | No license is stated. The Borough provides it "as is" and says boundaries are approximations. | Borough of State College |
| `addresses.json` | State College Borough parcels layer, ArcGIS Online item [2fa5544a4dca472cbf2e95788b83abc4](https://www.arcgis.com/home/item.html?id=2fa5544a4dca472cbf2e95788b83abc4) (from county records) | No terms are stated. Only the parcel number and site address are used. No owner names, mailing addresses or sale data are included. | Borough of State College, Centre County |
| `parcels.json` draft districts (`draft`, `draft_name`, `draft_class`) | Traced from the Borough's DRAFT zoning map PDF dated 6/15/2026, on the [new zoning ordinance page](https://www.statecollegepa.us/new-zoning-ordinance) | Public document with no copyright notice. The traced lines record facts and are approximate. **This is not the official map and not the Borough's GIS.** | Borough of State College, draft, June 2026 |
| `rules.json` draft heights, uses, parking | The Borough's second draft (June 2026): incentive schedule, use tables, Part E parking table | Our own summaries of facts, with section references | Borough of State College, draft, June 2026 |
| `rules.json` today's rules | The Borough's current zoning ordinance, read on [eCode360](https://ecode360.com/32909719) | Our own plain-language summaries with section citations. No text, formatting or headings are copied from eCode360. | State College Borough Code, cited by section |
| `buildings.json`, and the `bld_n` and `bld_sqft` fields in `parcels.json` | [Microsoft US Building Footprints](https://github.com/microsoft/USBuildingFootprints) (2019) | **ODbL 1.0.** These are a derivative database and are shared under the [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/). They were made by clipping the Pennsylvania file to the study area (`tools/get_footprints.py`) and counting footprint area per parcel. | Building footprints &copy; Microsoft, ODbL |
| `vendor/maplibre-gl.css` | [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) 4.7.1 | BSD 3-Clause | MapLibre contributors |

## Disclaimers that travel with the data

- Centre County and the Borough of State College provide their GIS data as is, without warranty. Boundaries are approximate. Do not use this data for legal, survey or engineering decisions.
- The draft ordinance is not law and is still changing. A third draft is expected.
- Nothing in zōna is legal advice. The Borough Planning and Zoning Department decides what applies to a lot.

## Found a problem with a source?

If you hold rights in any of this data and want it credited differently or removed, open an issue and it will be fixed.
