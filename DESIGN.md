---
name: zōna
description: A plain-language 3D zoning map. Warm paper, navy text, teal for controls, orange only for what changes.
colors:
  warm-paper: "#E3DFD6"
  panel-white: "#FCFCFA"
  panel-linen: "#F2EFE9"
  navy-ink: "#0E2340"
  slate-muted: "#56606B"
  hairline: "#E2DDD3"
  control-stroke: "#857F73"
  deep-teal: "#12585C"
  teal-wash: "#E1EEED"
  change-orange: "#C85400"
  orange-text: "#A34200"
  orange-wash: "#FBE1CF"
typography:
  body:
    fontFamily: "Geist, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  headline:
    fontFamily: "Geist, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  display:
    fontFamily: "Geist, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "clamp(4.25rem, 9vw, 6rem)"
    fontWeight: 300
    lineHeight: 0.95
    letterSpacing: "-0.055em"
  label:
    fontFamily: "Geist Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.09em"
rounded:
  sm: "6px"
  md: "12px"
  lg: "14px"
  sheet: "22px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "22px"
components:
  chip:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 16px"
  chip-selected:
    backgroundColor: "{colors.deep-teal}"
    textColor: "#FFFFFF"
  card-quiet:
    backgroundColor: "{colors.panel-linen}"
    rounded: "{rounded.lg}"
    padding: "16px"
  delta-badge:
    backgroundColor: "{colors.orange-wash}"
    textColor: "{colors.orange-text}"
    rounded: "{rounded.pill}"
    padding: "1px 8px"
---

# Design System: zōna

## Overview

**Creative North Star: "The Town Hall Counter"**

A knowledgeable clerk who slides the one page you need across warm paper and says it in plain words. The map is the room, the panel is the counter. Nothing is dressed up: type is calm, color is rationed, and every claim sits next to the thing that proves it.

Density is moderate and phone-first: the map fills the screen, search and controls float on it, and the lot or overview lives in a draggable bottom sheet. Text is never small by default (14px minimum at normal size) and grows with the A+ control. Light is the default on every device; a dark palette exists but is opt-in only.

**Key Characteristics:**
- Warm paper ground, white panel, navy text.
- Teal marks everything you can operate or have selected.
- Orange appears only where the draft changes something.
- Big light numerals for the headline change, quiet medium weights elsewhere.
- Status is shown by glyph and outline style, never color alone.

## Colors

A restrained warm-neutral palette with one operating color (teal) and one signal color (orange).

### Primary
- **Deep Teal** (#12585C): controls, selected chips, active tabs, links, "Yes" glyphs, "today" envelope on the map.

### Secondary
- **Change Orange** (#C85400, text #A34200, wash #FBE1CF): the draft's changes, "after a hearing" answers, increases on the map. Text and borders use the darker orange; fills use the wash.

### Neutral
- **Warm Paper** (#E3DFD6): page and map ground.
- **Panel White** (#FCFCFA): cards, sheets, floating controls.
- **Panel Linen** (#F2EFE9): grouped blocks inside the panel.
- **Navy Ink** (#0E2340): all body text and the selected-lot outline.
- **Slate Muted** (#56606B): secondary text.
- **Hairline** (#E2DDD3) and **Control Stroke** (#857F73): dividers, and borders of interactive controls.

### Named Rules
**The Orange Means Change Rule.** Orange never decorates. If a thing is orange, the draft changes it.
**The Never Color Alone Rule.** Yes / hearing / no / not decided differ by glyph and line style (solid, outlined, dashed) as well as hue.

## Typography

**Display and Body Font:** Geist (with Helvetica Neue, Arial, system-ui)
**Label/Mono Font:** Geist Mono

**Character:** A neutral grotesque that stays out of the way, with mono used only for tiny uppercase labels and addresses.

### Hierarchy
- **Display** (300, clamp(4.25rem,9vw,6rem), 0.95): the one headline number, such as "+3 ft".
- **Headline** (600, 1.5rem, 1.2): lot name and page questions.
- **Title** (600, 1rem): section headings inside panels.
- **Body** (400, 1rem, 1.5; prose capped near 62–70ch): answers and explanations.
- **Label** (500 mono, 0.75rem, +0.09em, uppercase): small category labels.

### Named Rules
**The One Big Number Rule.** Only one display-size numeral per view.

## Layout

Phone first. The map fills the viewport; the search field and map controls float at the top; the content is a bottom sheet that peeks at about 46% of the height and can be dragged to any height. On wide, tall screens (about 900×620 and up) the same content becomes a side card. Gutters are at least 16px and respect safe-area insets. Spacing runs on 8, 12, 16, 22px. Tap targets are at least 44px. A text-size toggle scales the whole root.

## Elevation & Depth

Hybrid: panels are tonal (white on linen on paper) with hairline dividers, and only floating controls carry a shadow.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 10px 30px rgba(14,35,64,.12), 0 2px 6px rgba(14,35,64,.06)`): search, map controls, popovers, modal.
- **Sheet lift** (`box-shadow: 0 -8px 28px rgba(14,35,64,.16)`): the bottom sheet's top edge.

### Named Rules
**The Float Only Rule.** Shadows mean "this sits above the map." Cards inside the panel use borders or tone, not shadows.

## Shapes

Soft but not toy-like. Controls and cards use 12–14px corners, the bottom sheet 22px at the top, status and delta badges are full pills, and map legend swatches are small circles or 3px squares. Borders are 1–1.5px; dashed borders mean "not decided" or "not applicable."

## Components

### Chips and event buttons
- **Style:** white fill, 1.5px control-stroke border, full pill (chips) or 14px radius (life-event buttons), 44px minimum height.
- **State:** selected is solid teal with white text; hover darkens the border to navy.

### Segmented controls and tabs
- White or linen trough with 3–4px padding; the active segment is teal (map mode) or white with a faint lift (tabs).

### Answer cards
- 14px radius, 1px hairline border, a circular glyph (filled teal = yes, orange outline = after a hearing, gray outline = no, dashed gray = not decided) followed by the answer and the section it came from.

### Delta badge
- Orange wash pill with dark-orange text for increases; teal wash for decreases.

### Search
- 48px field, 14px radius, float shadow, teal caret, results list in a floating panel.

### Bottom sheet
- 22px top corners, 44×5px grab handle, content scrolls inside, drags by pointer and by arrow keys.

## Do's and Don'ts

### Do:
- **Do** keep orange for changes only.
- **Do** pair every status color with a glyph and line style.
- **Do** keep body text at least 14px and tap targets at least 44px.
- **Do** cite the source section next to an answer.

### Don't:
- **Don't** open in dark mode by default; dark is opt-in via `data-theme="dark"`.
- **Don't** add shadows to cards inside the panel.
- **Don't** introduce a fifth answer state beyond yes, hearing, no, not decided.
- **Don't** add a second display-size number to a view.
