/* zōna town settings.
   Everything specific to one place lives here: names, who decides, the draft's
   date and timeline, links, notes and map credits. The lots and rules live in
   data/. To set zōna up for another town, edit this file and the files in data/.
   Text fields are plain text unless the name ends in Html. */
var TOWN={
  // Shown above the overview number: "Draft zoning · State College Borough".
  place:'State College Borough',
  mapLabel:'Map of State College parcels shown as dots, with 3D buildings',

  // The draft being explained. The date shows on every page.
  draft:{name:'Second draft',date:'June 2026'},

  // Who says yes, by the codes used in data/rules.json (P permitted, S special exception, C conditional use).
  deciders:{
    P:{who:'Borough staff sign off',ladder:'Allowed. You still need a permit.',answer:'Borough staff sign off with a permit.'},
    S:{who:'Zoning Hearing Board decides',ladder:'A special exception, after a public hearing.',answer:'The Zoning Hearing Board decides after a public hearing.'},
    C:{who:'Borough Council decides',ladder:'A conditional use, after a public hearing. Can take four months or longer.',answer:'Borough Council decides after a public hearing. This can take four months or longer.'}
  },
  buildingSafety:'Checked by Centre Region Code Administration',

  // Sources cited next to answers, by key.
  links:{
    memo:['https://content.civicplus.com/api/assets/6618b070-48d8-4c11-87b7-7a8696507e48','Council memo, Sept 10, 2026'],
    meet:['https://content.civicplus.com/api/assets/d9590d92-94c6-4bd9-b7e2-154dcb8ae2be','Borough meetings record, 2026'],
    slides:['https://content.civicplus.com/api/assets/pa-statecollege/852e19a0-bddf-4b9d-9fc2-e77a94f27eb3/residentialppt-2025-07-17-final.pdf','Borough slides on homes'],
    lic:['https://statecollegepa.us/218/Student-Home-License','Student home license'],
    cu:['https://statecollegepa.us/201/Conditional-Use-Permit','Conditional use permits'],
    zhb:['https://www.statecollegepa.us/518/Zoning-Hearing-Board','Zoning Hearing Board'],
    zo:['https://statecollegepa.us/225/New-Zoning-Ordinance','New zoning ordinance page'],
    code:['https://ecode360.com/32909719','Today\'s zoning ordinance']
  },

  // "The catch" notes on a Where can I page, by use. Each note is [text, link key].
  catches:{
    adu:[['Under the draft, a new small second home cannot be rented to college students.','memo'],['Whether adding one raises your property tax assessment is not decided yet.','meet']],
    two_to_four:[['Borough slides mention extra limits on students and short-term rentals for 3 and 4 home buildings in Residence 2. We have not found this in the draft text yet, so check the latest draft.','slides']],
    restaurant:[['Turning a store into a restaurant can change how much parking you need. Check the draft parking table (Part E).','zo']]
  },

  // A rule still being changed, shown on residential lots. [question, what we know, link key]
  roommate:['Can 4 friends who aren\'t family share a house?','Today the limit is 3 people who aren\'t family. Council\'s September 10, 2026 memo proposes 4. Nothing is final.','memo'],

  // "What's happening for you?" buttons. An event with a use opens that Where can I page.
  // One without a use shows its cards: c is may, no or ud (not decided yet); t is the answer.
  // Notes are [text, link key or a citation written out].
  events:[
    {k:'mom',t:'A parent is moving in with me',use:'adu',intro:'A small second home on your lot, like a backyard cottage or a basement apartment, is called an accessory dwelling unit (ADU). The draft allows them on most lots.'},
    {k:'friends',t:'I want to rent with friends',cards:[
      {c:'ud',roommate:true},
      {c:'no',q:'Can we rent a new small second home (ADU)?',t:'No, not to college students',w:'The draft does not allow a new small second home to be rented to college students.',src:'memo'}],
      notes:{lab:'Good to know',items:[['A house the Borough counts as a student home needs a $1,000 license, and new ones must be spaced apart from other student homes.','lic']]}},
    {k:'homebiz',t:'I want to run a business from home',cards:[
      {c:'may',q:'Can I run a business from my home today?',t:'Yes, with limits',w:'One business per home, no sign, at most one helper from outside the family, and no food service.',src:'code'},
      {c:'ud',q:'Can clients visit, or can I put up a sign?',w:'Council\'s September 10, 2026 memo proposes allowing clients, one small sign and two employees from outside the family.',src:'memo'}],
      notes:{lab:'Good to know',items:[['Pennsylvania law says towns must allow a "no-impact" home business in every residential area: one with no more customer visits, deliveries or traffic than a normal home.','PA Municipalities Planning Code, 53 P.S. 10603(l)']]}},
    {k:'cafe',t:'I want to open a café or restaurant',use:'restaurant',intro:'Here is where the draft allows a restaurant with a staff permit, and where you would need a public hearing first.'},
    {k:'ramp',t:'I need a ramp or an easier bathroom',cards:[],
      notes:{lab:'Ask before you build',items:[['A ramp or a bathroom change is mostly a building-safety question. Centre Region Code Administration checks the construction.'],['A ramp that reaches toward the lot line can also be a zoning question. Ask Borough planning first.'],['If zoning says no, you can ask the Zoning Hearing Board for a variance. It meets Tuesdays at 12:30 pm, usually 30 to 60 days after you apply.','zhb']]}},
    {k:'nextdoor',t:'The house next door is for sale',use:'two_to_four',intro:'In the draft, most neighborhood lots could hold a duplex, triplex or fourplex. Nothing changes next door unless the owner chooses to build.'}
  ],

  // "Example places" on the overview. title containing "likely" or "placeholder" adds a warning label.
  featured:[
    {id:'36-026-,224-,0000-',short:'Former motel site',tag:'4.25 ac',title:'Former Autoport motel (likely match)',
     note:'Matched by acreage (4.25 acres, the size in the lease listing), motel-shaped buildings and location on S. Atherton St. The Borough tax record for this parcel lists 1405 S Atherton St, zoned Planned Commercial 2. Confirm the parcel with the Borough.',
     plan:'The developer\'s preliminary plan, reported in 2026, has a 14-pump gas station with convenience store, drive-through restaurants, retail buildings and a bank with a drive-up. Council must consider conditional use permits for the drive-throughs. No housing is in that plan. Under the draft Mixed Use district, drive-throughs are not on the list of allowed uses. Gas stations would be a conditional use. Whether a pending plan is judged under today\'s rules or the draft is a question for Borough staff.'},
    {id:'36-026-,052-,0000-',short:'Shopping plaza',tag:'6.94 ac',title:'Shopping plaza across the road (likely match)',
     note:'Matched by size (6.94 acres) and the large U-shaped retail building. Confirm the parcel with the Borough.',
     plan:'In the draft, a shopping center as a use type is allowed only in Downtown Collegiate, Downtown Central and General Commercial. Individual shops, restaurants, apartments and hotels are allowed in Mixed Use.'},
    {id:'36-011-,195-,0000-',short:'Imperial Motor Inn',tag:'0.50 ac',title:'Imperial Motor Inn site, 118 S Atherton St',
     note:'The Borough tax record for this parcel lists 118 S Atherton St, a motel, hotel or inn use, 0.50 acres, in the Commercial Incentive District. No development plan is attached to this site here.',
     plan:'Shown so the downtown edge of the corridor can be compared with the Mixed Use parcels farther south.'},
    {id:'36-022-,231-,0000-',short:'Corner lot (stand-in)',tag:'1.75 ac',title:'Placeholder corner (not the gas station)',
     note:'A 1.75-acre corner parcel near the plaza. It stands in for the gas station site and is not confirmed as that site. Do not read it as the real parcel.',
     plan:'Unlike the Mixed Use parcels next to it, the draft keeps a 3-story, 40 ft limit here and offers no incentive height. In General Commercial, drive-throughs would be conditional and gas stations allowed.'}
  ],

  // "Where the draft is". s is done, now or blank.
  timeline:[
    {s:'done',t:'Second draft released',d:'June 2026'},
    {s:'now',t:'Council changes and a third draft',d:'Council\'s Sept 10, 2026 memo lists changes. A third draft is expected.'},
    {t:'Planning commission and Centre County reviews',d:'The county gets up to 45 days.'},
    {t:'Council public hearing',d:'Tentatively early 2027. Anyone can speak.'},
    {t:'Council vote',d:'Nothing changes until Council votes.'}
  ],
  comment:{note:'Comment any time by email. Comments are posted publicly, so name the section you mean.',email:'zonestatecollege@statecollegepa.us',links:['memo','zo']},

  // Bottom of every page.
  footer:{
    statusHtml:'<b>Second draft from June 2026, still under review.</b> A third draft is expected, and the Council public hearing is tentatively set for early 2027.',
    legal:'This is not legal advice. The Borough Planning and Zoning Department decides what applies to a lot.',
  },

  // Short phrases used on the lot page.
  text:{
    tierOfficial:'From the Borough\'s own layer or the ordinance text. Today\'s rules were read by hand and are still being checked.',
    tierPdf:'Read or traced from the Borough\'s PDFs, so approximate.',
    sureOfficial:'Taken from the Borough\'s own layer or the ordinance text.',
    surePdf:'Read or traced from the Borough\'s PDF files, so approximate. The draft map is not official and is not the Borough\'s GIS.',
    checkWith:'Check with the Borough.',
    likelyTip:'Not confirmed. Check the parcel with the Borough.',
    noAddress:'Not in Borough layer',
    block:'Lots are grouped by street and hundred number from Borough addresses, so a block here is approximate.',
    todaySource:'ecode360',
    draftDetail:'Duplex to fourplex, townhome and apartment listings carry extra standards in Sec. D.2.3(b)(1). Check the section before relying on a listing.'
  },

  // "What is real and what is still missing" (the help button). Each row is [state, label, html].
  // state is ok, gap or no.
  about:{
    rows:[
      ['ok','Loaded','<b>Parcels.</b> 3,125 parcels in the study area from the PASDA Centre County parcel layer. Condo units are merged into one lot.'],
      ['ok','Loaded','<b>Today\'s districts.</b> The Borough\'s zoning layer, assigned to each parcel by largest overlap. Lots on a district boundary can be wrong.'],
      ['gap','Traced','<b>Draft districts.</b> The Borough publishes the draft only as a PDF map dated 6/15/2026. District shapes were pulled from that PDF and lined up with the Borough boundary. The alignment check (0.9965 overlap) covers the PDF fit only, not each district\'s shape. These are a close read of the PDF, not official data and not the Borough\'s GIS.'],
      ['ok','Loaded','<b>Draft heights, uses and parking.</b> From the draft\'s incentive schedule, use tables and Part E parking table (second draft, June 2026). The draft can change.'],
      ['gap','Partial','<b>Today\'s rules.</b> Read from ecode360 for 13 districts, with section numbers. Overlays are not applied, and several districts, including the University Planned District, have no rule card yet.'],
      ['gap','Rule','<b>Answers.</b> "Yes" means the draft use table lists the use as permitted, so Borough staff sign off with a permit. "Yes, after a hearing" means a special exception (the Zoning Hearing Board decides) or a conditional use (Borough Council decides). "No" means the draft does not list it for that district. "Not decided yet" marks rules Council is still changing. Setbacks, lot coverage, density and overlays also apply and are not applied here. Today\'s uses are not loaded as a table, so answers cover the draft only.'],
      ['gap','Flag','<b>Next to a district line.</b> A lot that touches a lot in a different draft district gets a warning, because the draft shapes were traced from a PDF and the lot may belong to the neighbor.'],
      ['gap','Partial','<b>Street addresses.</b> Joined from the Borough\'s tax parcel layer, so 3,088 of 3,125 parcels have one. Parcels outside the Borough have none.'],
      ['gap','Partial','<b>Buildings.</b> Footprints come from Microsoft\'s 2019 US building dataset, so recent demolition or construction is missing.'],
      ['no','Missing','<b>Building heights.</b> Existing buildings are drawn low. Existing-versus-allowed comparisons are footprint only.'],
      ['no','Missing','<b>Setbacks, lot coverage, density, parking limits.</b> The block shows only the height limit over the whole lot. A real building would be smaller.']
    ],
    sources:[
      ['https://www.statecollegepa.us/new-zoning-ordinance','Borough page for the new zoning ordinance','(draft text, use tables, incentive schedule, draft map)'],
      ['https://ecode360.com/32909719','Current zoning ordinance on ecode360',''],
      ['https://mapservices.pasda.psu.edu/server/rest/services/pasda/CentreCounty/MapServer','PASDA Centre County map service','(parcels)'],
      ['https://github.com/microsoft/USBuildingFootprints','Microsoft US Building Footprints',''],
      ['https://www.statecollege.com/articles/local-news/neighboring-residents-voice-concerns-as-autoport-redevelopment-plan-gets-first-public-review/','StateCollege.com on the Autoport plan','']
    ],
    foot:'Prototype for discussion, built by Nish Barot. Plain-language summaries can be wrong. This is not legal advice or a development feasibility study. Confirm any rule with the Borough Planning and Zoning Department before relying on it.'
  },

  // Credits in the map corner. HTML allowed.
  mapCreditsHtml:'Parcels: Centre County via PASDA. Zoning, addresses: State College Borough. Building footprints &copy; Microsoft, ODbL'
};
