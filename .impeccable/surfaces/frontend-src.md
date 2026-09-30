---
version: 1
slug: "frontend-src"
primary_target: "frontend/src"
related_targets: []
---

# Airway web app (whole frontend)

Mode: Operate. Scope: every passenger and admin screen in `frontend/`.

Audience: viva examiners watching a projected laptop; Indian domestic passengers; airline admins.
Task: search → flight plate → book → ticket with PNR; trips, PNR lookup, cancel; admin flights + bookings.
Demo focus: the PNR reveal. Other states (sold-out, departed, refusals) honest but unstaged.
Anti-goals (user): AI slop, generic OTA look, clutter, weak states. No gradients, glass, soft shadow cards, icon tiles, marketing heroes, filter walls.

## Direction contract

THESIS: Every flight is published like an aeronautical approach plate — briefing strip, plan-view route, index number. Refuses the OTA arrangement of a gradient hero with a rounded search widget over fare cards.

OWN-WORLD: Chart-paper ground, black ink, 1px ruled boxes with square corners, tabular numerals, uppercase tracked chart labels. Magenta is the only accent and only action colour; blue is information; tan terrain hatching marks unavailable (sold-out, departed, inactive). No shadows, no rounded cards.

STORY: The visitor sees seven Indian airports on a chart, draws a route by picking two, gets a list of flights ruled along that route, opens one as a plate, books it, and receives a PNR set as the chart's index number — huge, unmistakable, never shrinking.

FIRST VIEWPORT: Top: a briefing strip across the full width (FROM / TO / DATE / SEARCH as ruled cells, magenta Search). Below, filling the viewport: the plan-view chart of BLR DEL BOM MAA HYD CCU GOI at true relative positions, graticule lines, and the magenta airway drawn between the chosen pair. Right margin: chart legend and index box.

FORM: Aeronautical chart / approach plate; candidate 7 of 7 on the ordered list (seed key 89fe79fd). Raises: single route axis; magenta = actionable; state by hatching; last search restored; PNR never shrinks; choosing a city lights its airways. Signature interaction: the airway draws itself (stroke-dashoffset) when both ends are chosen; PNR reveal on ticket. Both disabled under prefers-reduced-motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
