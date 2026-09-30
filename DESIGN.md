---
name: Airway
description: Domestic flight booking drawn as an aeronautical approach plate.
colors:
  chart-paper: "#f4f3ee"
  margin-paper: "#eae8e0"
  blank-field: "#ffffff"
  chart-ink: "#15171a"
  secondary-ink: "#474a50"
  caption-ink: "#62656b"
  graticule: "#c9c6bb"
  airway-magenta: "#a51f63"
  airway-magenta-deep: "#871650"
  magenta-wash: "#f3e3eb"
  on-magenta: "#ffffff"
  information-blue: "#1f5e99"
  blue-wash: "#e2ebf3"
  terrain: "#ddd3b7"
  terrain-line: "#b3a57f"
  field-alert: "#9a2b16"
typography:
  display:
    fontFamily: "Bahnschrift, 'DIN Alternate', D-DIN, 'Roboto Condensed', 'Arial Narrow', sans-serif"
    fontSize: "6rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  route:
    fontFamily: "Bahnschrift, 'DIN Alternate', D-DIN, 'Roboto Condensed', 'Arial Narrow', sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Bahnschrift, 'DIN Alternate', D-DIN, 'Roboto Condensed', 'Arial Narrow', sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Bahnschrift, 'DIN Alternate', D-DIN, 'Roboto Condensed', 'Arial Narrow', sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Bahnschrift, 'DIN Alternate', D-DIN, 'Roboto Condensed', 'Arial Narrow', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  fix: "50%"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
  s8: "64px"
components:
  button-primary:
    backgroundColor: "{colors.airway-magenta}"
    textColor: "{colors.on-magenta}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.airway-magenta-deep}"
    textColor: "{colors.on-magenta}"
  button-secondary:
    backgroundColor: "{colors.chart-paper}"
    textColor: "{colors.chart-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.margin-paper}"
    textColor: "{colors.chart-ink}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.airway-magenta}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "40px"
  button-quiet-hover:
    backgroundColor: "{colors.magenta-wash}"
    textColor: "{colors.airway-magenta-deep}"
  button-large:
    padding: "0 24px"
    height: "52px"
  input:
    backgroundColor: "{colors.blank-field}"
    textColor: "{colors.chart-ink}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  briefing-search:
    backgroundColor: "{colors.airway-magenta}"
    textColor: "{colors.on-magenta}"
    rounded: "{rounded.none}"
    padding: "0 24px"
  pnr-cell:
    textColor: "{colors.chart-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    width: "0.78em"
    height: "1.12em"
  status-tag-info:
    backgroundColor: "transparent"
    textColor: "{colors.information-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "1px 7px"
---

# Design System: Airway

## Overview

**Creative North Star: "The Approach Plate"**

Every screen is published the way an aeronautical chart publishes an approach: a ruled briefing strip of facts across the top, a plan view of the route, and one index number that identifies the whole sheet. The ground is pale chart paper, everything is drawn in black ink with 1px ruled boxes and square corners, and labels are small, uppercase and tracked like frequency boxes. Density is that of a working document: many facts, each in its own cell, none floating.

Colour carries meaning the way it does on a chart, never decoration. Magenta is the airway: the route you have chosen and the one thing you can act on. Blue is information. Tan terrain hatching is ground you cannot fly through: sold-out, departed, withdrawn and cancelled. Depth is not simulated; the sheet is flat and structure comes from rules. The system refuses the online-travel-agency arrangement of a gradient hero, a rounded search widget and floating fare cards.

Motion is reserved for two moments: the chosen airway drawing itself between two airports, and the PNR printing into its cells after booking. Both collapse to instant under reduced motion.

**Key Characteristics:**
- Chart-paper ground, black ink, 1px ruled boxes, square corners.
- Magenta is the only accent and the only action colour.
- Blue means information; tan hatching means unavailable.
- Tabular numerals and uppercase tracked chart lettering for every named value.
- Every route is drawn on one axis: origin left, destination right, joined by the airway.
- The PNR is the sheet's index number: huge, ruled into six cells, never shrinking.
- Flat: no elevation shadows, no rounded cards, no gradients as surface.

## Colors

A chart palette: paper and ink carry nearly everything, and three semantic colours each hold exactly one meaning.

### Primary
- **Airway Magenta** (`airway-magenta`): the chosen route on every chart, inset and route line, and the fill of the single main action on a screen (Search, Select, Book). Also the focus ring, text selection, caret, and the active-page underline in the masthead. 6.9:1 on chart paper.
- **Deep Airway Magenta** (`airway-magenta-deep`): hover state of magenta actions and links only.
- **Magenta Wash** (`magenta-wash`): hover and focus-within ground for magenta-owned controls (briefing cells, the swap button, quiet buttons, airport rings).

### Secondary
- **Information Blue** (`information-blue`) with **Blue Wash** (`blue-wash`): confirmations and plain information. Info notices, the booking banner, the CONFIRMED status word, upcoming/on-sale/confirmed status tags, the admin role tag, and the compass rose on the chart. Never on a button.

### Tertiary
- **Terrain** (`terrain`) and **Terrain Line** (`terrain-line`): the hatch (a -45deg 1px line every 7px over terrain) marking anything that cannot be booked. A lighter, wider hatch (every 11px over a paler terrain) is used under large type on a cancelled ticket so it stays legible.
- **Field Alert** (`field-alert`): inline form-field errors only.

### Neutral
- **Chart Paper** (`chart-paper`): the page ground and default surface of every sheet.
- **Margin Paper** (`margin-paper`): panels in the chart margin: the index column, table heads, the fare box, ticket status, footer, disabled controls.
- **Blank Field** (`blank-field`): typing surfaces (inputs, the briefing strip, PNR entry), so a field reads as blank paper to write on.
- **Chart Ink** (`chart-ink`): all primary text, and every hairline rule (the rule colour is the ink colour).
- **Secondary Ink** (`secondary-ink`): supporting text and labels, 8.1:1 on paper.
- **Caption Ink** (`caption-ink`): hints, captions, graticule numbers, 5.4:1 on paper.
- **Graticule** (`graticule`): soft rules: row dividers inside a ruled box, graticule lines on the chart.

### Named Rules
**The One Airway Rule.** Magenta means "this is your route" or "you can act on this". It never decorates, never marks status, and fills at most one main action per screen.

**The Terrain Rule.** Anything the backend refuses (sold out, departed, withdrawn, cancelled) is drawn as hatched terrain, with its text lifted onto solid terrain patches so it stays readable. Refusals are never red; red is only for a field the user typed wrong.

**The Blue Is Information Rule.** Blue states facts and confirmations. It is never a link, button or route.

## Typography

**Display / Chart Font:** Bahnschrift (with DIN Alternate, D-DIN, Roboto Condensed, Arial Narrow, sans-serif)
**Body Font:** Segoe UI Variable Text (with Segoe UI, system-ui, -apple-system, Helvetica Neue, sans-serif)

**Character:** A narrow, engineered DIN for everything that is chart lettering (headings, labels, codes, times, fares, the PNR) over a plain humanist UI face for running text. Both are system stacks by project constraint; no font files are shipped.

### Hierarchy
- **Display** (700, 6rem, 4.5rem under 720px, line-height 1, tabular): the PNR only, one character per ruled cell.
- **Route** (700, 2.5rem, 2rem under 720px, line-height 1, 0.02em): three-letter airport codes on the route axis and the plate's fare total.
- **Headline** (600, 1.75rem, line-height 1.15): page h1, flight times on result rows, ticket status word.
- **Title** (600, 1.3125rem, line-height 1.15): h2, briefing-strip values, fares on rows, the Airway wordmark (700, 0.14em tracked, uppercase).
- **Body** (400, 0.9375rem, line-height 1.5, max 68ch): running text. 0.8125rem for hints and table cells, 1.0625rem for input values and h3.
- **Label** (600, 0.75rem, 0.08em, uppercase): the name of a value: field labels, fact-strip terms, table heads, legend and index titles. Buttons and nav use the same lettering at 0.8125rem, 0.06em.

### Named Rules
**The Tabular Rule.** Every number that can sit in a column (times, seats, fares, flight numbers, PNRs) is set in the chart font with tabular numerals.

**The Label Names A Value Rule.** Uppercase tracked lettering labels a field, fact or panel it sits on. It is never a free-floating tag line above a heading.

## Layout

Content sits in a column of 1240px max with a 32px gutter (16px under 720px); the search page runs full width. Spacing follows a 4px step (4, 8, 12, 16, 24, 32, 48, 64). Structure is a grid of ruled cells sharing borders: adjacent cells draw one rule between them, never two (cells overlap by -1px or clip the doubled edge).

The search page is a briefing strip (FROM / swap / TO / DATE / SEARCH as one ruled row) over a desk: the plan-view chart on the left and a 320px index margin on the right. Results rule each flight along the route axis, departure left and arrival right, with a 260px plan-view inset beside the list on wide screens. The flight plate stacks a fact strip, the profile (times along the leg) beside a 240px plan inset, and then the booking form beside the fare box.

Responsive behaviour reflows cells rather than hiding facts: the briefing strip becomes a two-column grid under 720px with Search full width; the desk stacks under 960px; result rows regroup into named grid areas at 1100px and 640px; the plate and trips rows stack under 860px; the masthead nav drops to its own ruled row under 860px. Touch targets stay at least 44px on narrow screens.

## Elevation & Depth

The system is flat. There are no drop shadows, no elevation levels and no layered cards. Depth is conveyed by ruling (a 1px ink hairline around every box, a 2px ink border for the PNR and the cancel confirmation) and by tonal panels (margin paper against chart paper). The only `box-shadow` uses are structural, not elevation: an inset 3px magenta underline for the active nav item, an inset 4px magenta bar for the next PNR entry cell, an inset 1px alert ring on an invalid field, and a solid terrain spread that lifts text off hatching.

### Named Rules
**The Ruled Sheet Rule.** If something needs separating, rule it. Never float it on a shadow.

## Shapes

Every box, button, field, tag and panel has square corners (0px). The only circles are chart symbols: airport fixes at each end of a route line (9px on the route axis, 7px on result rows), the airport rings and compass rose on the chart. The recurring silhouette is the route axis: a straight line, magenta when open and ink-grey when cancelled or departed, capped by two hollow fixes. Chart symbols are inline SVG (the obstacle triangle for "few seats", the Airway mark of two fixes joined by a magenta airway).

## Components

### Buttons
Engineered and square; one magenta per screen.
- **Shape:** square corners (0px), 1px ink hairline, 40px min height (52px large).
- **Primary:** magenta fill and border, white chart lettering, uppercase 0.06em. Hover deepens to Deep Airway Magenta.
- **Secondary:** chart-paper fill with ink hairline; hover shifts to margin paper.
- **Quiet:** borderless magenta text; hover gets the magenta wash.
- **Press / Focus:** 1px downward nudge on press; 2px magenta outline offset 2px on focus.
- **Disabled:** margin paper, soft rule border, caption ink, not-allowed cursor.

### Inputs / Fields
- **Style:** 44px, blank white field, 1px ink hairline, square, 1.0625rem text, magenta caret. Label above in chart lettering.
- **Focus:** 2px magenta outline set 1px inside the edge.
- **Error:** alert-red border plus an inset 1px alert ring, bold alert message below.
- **Disabled / Read-only:** margin paper with secondary ink.
- **Segmented choices** (gender, admin filters): adjoining ruled cells; the selected cell inverts to ink with paper text.

### Navigation
The masthead is one ruled row: the wordmark cell, nav links separated by soft rules, and the account cell. Links are chart lettering in secondary ink; hover darkens to ink on margin paper; the current page carries a 3px magenta underline, like the active leg on a chart. Under 860px the nav moves to its own row and scrolls horizontally.

### Notices and Tags
- **Refusal notice:** ruled box on the hatch, text on solid terrain patches.
- **Info notice / banner:** blue border on blue wash, blue title.
- **Status tags:** 1px current-colour border, label lettering. Blue for on sale, confirmed and upcoming; hatched for sold out, withdrawn and cancelled; secondary ink for departed.

### Briefing Strip (signature)
The search form as one ruled row of cells: FROM, a 48px swap cell, TO, DATE, and a magenta SEARCH cell flush at the right. Values are set at title size in the chart font. A cell with focus takes the magenta wash. A compact variant repeats it on the results page.

### Plan-View Chart (signature)
Seven airports at true relative positions on a graticule inside a neatline. Choosing an origin lights its airways as dashed magenta and circles it with a blue compass rose; choosing a destination settles the others to hairlines and draws the chosen airway in 4px magenta from origin to destination (700ms stroke-dashoffset), followed by a boxed route label. The same world recurs as a small inset on results, the plate and the ticket.

### Flight Row
One flight ruled along the route axis: departure time and city, duration over the route line, arrival, carrier, seats, fare, action. The route line is magenta when bookable. Few seats shows the obstacle triangle in bold ink. Unavailable rows are hatched with a bordered state word and a secondary Details button instead of Select.

### PNR Mark (signature)
Six ruled cells inside a 2px ink frame, one character each at display size. After booking the cells print left to right (520ms each, 110ms stagger), wiping up from the baseline on a magenta ground that settles to ink. The PNR entry on Find a booking draws the same six cells, so what you type looks exactly like the ticket.

## Do's and Don'ts

### Do:
- **Do** rule every box with a 1px ink hairline and keep every corner square (0px).
- **Do** reserve magenta for the chosen route and the single main action on a screen.
- **Do** mark every backend refusal (sold out, departed, withdrawn, cancelled) with terrain hatching and keep its text on solid terrain patches.
- **Do** draw every route on one axis, origin left and destination right, joined by the airway line with a hollow fix at each end.
- **Do** set times, fares, seats and PNRs in the chart font with tabular numerals.
- **Do** keep the PNR at display size in six ruled cells on every ticket view.
- **Do** disable the airway draw and PNR print under prefers-reduced-motion.

### Don't:
- **Don't** use drop shadows, elevation or floating cards; separate with rules and tonal panels.
- **Don't** round the corners of boxes, buttons, fields or tags; circles belong only to chart symbols.
- **Don't** use gradients as a surface or backdrop; the only repeating gradient is the terrain hatch.
- **Don't** use magenta for status or decoration, or blue for anything clickable.
- **Don't** show a backend refusal in red; red is for a field the user typed wrong.
- **Don't** shrink, truncate or restyle the PNR to fit a layout.
