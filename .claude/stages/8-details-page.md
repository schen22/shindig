# STAGE 8 — Details page

## GOAL

Build the whole `/details` page — layout, themed bullets, callout, photo,
last-updated line — against mock values, so everything is verifiable before a
single real value exists.

## START STATE

- `src/details.md` is a Stage 0 stub.
- `styles/components/callout.css` does not exist.

## END STATE

- `/details/` renders from `src/details.md` — Markdown with front matter,
  `layout: base.liquid`. Prose belongs in Markdown, not a template.
- An expectation-setting callout carries the deadline — the one thing on the
  page anyone must act on.
- A themed bullet list of details: when / where / bring / wear / plus-ones.
- Optionally one photo at a **fixed `aspect-ratio`**, so it reserves its space
  and nothing below it jumps.
- A hand-set "last updated" line at the foot of the content.
- `npm run build` passes.

## BUILD AGAINST THIS MOCK SET

Do not leave fields blank, and do not invent your own.

| Field | Mock value |
| :--- | :--- |
| Date | `Saturday, Sep 5 · 2pm PT` |
| Venue | `TBD` |
| Bring | `Just yourself` |
| Wear | `Whatever you'd wear to a park` |
| Plus-ones | `Yeee, just make sure to specify in the form or give Sarah a head's up` |
| Photo | `public/assets/images/details-placeholder.jpg` |
| Last updated | the date the page was written |

**The date format is fixed:** `Saturday, Sep 5 · 2pm PT`. The year is implied
and omitted. **"PT", not "PST"** — September falls inside daylight saving, so
Pacific is technically PDT; "PST" in September is an hour wrong to anyone
reading it literally. "PT" is correct year-round and is what people say.

**The photo is a file committed to the repo**, not a hotlinked URL. An external
image adds a third-party request the site otherwise does not make, and turns
into a broken box the day it 404s.

## COMPONENTS

- **Themed bullets:** `--t-primary` core with an `--t-accent` ring, drawn with
  `::before`. `::marker` cannot take a `box-shadow`, which is what makes the ring.
- **Callout card:** `--t-card` surface, soft shadow, seal emblem straddling the
  top edge.

**One ornament per screen.** The seal appears once per page and never competes
with itself.

## IN SCOPE

- `src/details.md`
- `styles/components/callout.css`

## NOT INCLUDED

- `public/assets/details.ics`. That is Stage 9.
- Real party values. Stage 9 replaces the mock set; do not chase them now.
- Any stats, aggregation, dynamic friend breakdown, or Apps Script. The build
  fetches nothing.
- Any other page.
- A new copy key.

## DEPENDENCIES

Stages 0, 2, 4.

## AGENT

implementer

## REQUIRED READING

- this file
- `src/details.md`, `styles/tokens.css`

## VALIDATION

`npm run build`

## REVIEW LEVEL

L2 — validation + code review, then panel at the group boundary

## ACCEPTANCE CRITERIA

1. Every mock field is filled — no blanks, no invented values.
2. The photo reserves its space via a fixed `aspect-ratio`.
3. The date reads `PT`, not `PST`.
4. The callout carries the deadline.
5. A "last updated" line is present.
6. `npm run build` passes.
7. No file outside IN SCOPE is touched.

## STOP

Return when all seven acceptance criteria are true. Do not begin another stage.
