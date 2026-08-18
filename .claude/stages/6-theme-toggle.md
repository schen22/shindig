# STAGE 6 — Theme toggle

## GOAL

Build the viewer's light/dark control — the write half of the read contract the
frozen inline script already implements.

## START STATE

- `_includes/theme-toggle.liquid` is a Stage 0 placeholder rendering nothing.
- `public/assets/js/theme.js` does not exist, so `localStorage.theme` is read by
  the inline script and written by nothing.
- `header.liquid` already includes the toggle. **That include line is frozen.**
- The inline `<head>` script already adds a `js` class to `<html>` and applies
  `data-theme`. **Frozen. Do not touch it.**

## END STATE

- A single two-state icon button in the header, right of the nav links.
- **The sun is the light theme, the crescent moon is the dark theme** — each
  glyph bound to a state, never swapped by the click handler, so the icon cannot
  drift out of sync with the palette.
- Clicking sets `data-theme` on `<html>` and writes `localStorage.theme`.
- **The palette repaints on the same frame as the state change.** The outgoing
  glyph's exit trails the change; it never gates it.
- The toggle is absent — `display: none` — without the `js` class.
- `npm run build` passes.

## MOTION — SHARED WITH THE SEAL

The toggle reuses the envelope's choreography from common tokens, so the site
has one motion signature rather than two:

```css
--ease-envelope: cubic-bezier(0.65, 0, 0.35, 1);
--spin-lg: 900ms;  --fade-lg: 700ms;   /* the seal   */
--spin-sm: 400ms;  --fade-sm: 300ms;   /* the toggle */
```

Same curve, same spin-360°-and-fade. The shorter pair exists because the seal's
timing on a 17px glyph reads as lag rather than ceremony.

**Both glyphs stay in the DOM**, stacked and absolutely positioned. Neither may
be `display: none` — a hidden element cannot animate out, which is the effect.

## TWO DOCUMENTED DECISIONS — DO NOT "FIX" THESE

- **The ring is decorative; the glyph is the affordance.** The 1px `--t-line`
  border measures ~1.3:1 and does not satisfy WCAG 1.4.11 on its own. The icon
  at ~13.9:1 is what identifies the control, which is what the criterion asks
  for. Do not darken the ring into a second competing outline.
- **The label names the action, not the state** — `aria-label="Switch to dark
  theme"`, updated on toggle. A button labelled "Dark" is ambiguous about
  whether that describes the current mode or the next one.

## IN SCOPE

- `_includes/theme-toggle.liquid` — overwrite the placeholder entirely
- `styles/components/toggle.css`
- `public/assets/js/theme.js`

## NOT INCLUDED

- `_includes/header.liquid`, including its include line — **frozen**.
- `_includes/base.liquid` and its inline script — **frozen**.
- Any route back to "follow my system" after an explicit choice. Accepted
  consequence; correct for a party invite.
- Placing the toggle on `/`. The header is hidden there and the envelope is one
  uninterrupted moment.
- Resolving the mode in JavaScript and stamping `data-theme` on every load. That
  was proposed and rejected — it makes dark mode require JavaScript.
- Any party-palette switching. The viewer gets light/dark and nothing else.

## DEPENDENCIES

Stages 0, 2.

## AGENT

implementer

## REQUIRED READING

- this file
- `_includes/theme-toggle.liquid`, `_includes/base.liquid` (read only — for the
  read half of the contract), `_includes/header.liquid` (read only)
- `styles/tokens.css`

## VALIDATION

`npm run build`

## REVIEW LEVEL

L2 — validation + code review, then panel at the group boundary

## ACCEPTANCE CRITERIA

1. If JS is disabled, the toggle is absent — not in the tab order nor the
   accessibility tree. The OS dark preference still resolves through the media
   query.
2. For any error: do not display a control that can't do anything.
3. Each glyph is bound to a state in CSS; the click handler does not swap icons.
4. Neither glyph uses `display: none`.
5. The `aria-label` names the next action and updates on toggle.
6. Decorative SVG carries `aria-hidden="true"`.
7. The palette flips on the same frame as the click.
8. `npm run build` passes.
9. No file outside IN SCOPE is touched.

## STOP

Return when all nine acceptance criteria are true. Do not begin another stage.
