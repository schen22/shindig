# STAGE 12 — The back button lands on a blank page

## GOAL

Pressing Back from `/rsvp/` returns to `/` with the envelope closed and the seal
usable, instead of an empty field with no route forward.

One defect. Four lines. It blocks launch.

## START STATE

- Stages 0–11 merged to `alpha`; the build passes.
- Sarah found this testing the deployed site on 2026-08-18.
- `envelope.js` adds `.is-opening` on click and never removes it.
- Nothing in the repository handles `pageshow`, `persisted` or bfcache — grepped
  across `public/assets/js/` and `_includes/`, zero hits.

## THE DEFECT

`envelope.js:29` adds `.is-opening`. `styles/components/envelope.css:180` states
the assumption that makes never removing it safe:

> envelope.js adds .is-opening on click and never removes it: the page
> navigates away before removal would matter

True going forward. False coming back. A back navigation is served from the
browser's back/forward cache, which restores the DOM exactly as it was left, so
`/` comes back still wearing `.is-opening`:

- `.envelope-half--top` at `translateY(-102%)` and `--bottom` at `translateY(102%)`
  — both halves are off-viewport (`envelope.css:199-209`)
- `.seal` at `opacity: 0` with `pointer-events: none` (`envelope.css:187-192`)
- `tabindex="-1"` on the seal, set by `envelope.js:50`

and `/` carries no header, no footer and no nav — the built `index.html` has
zero of each. What is left is a blank `--t-bg` field with nothing visible,
nothing clickable and nothing focusable.

**This is the same failure the `sessionStorage` flag was withdrawn for on
2026-08-18** — "a return visit left the page with no route to `/rsvp/` at all".
It returned through a different door. The persisted state is gone; the browser
is now the thing doing the persisting.

## END STATE

- Back from `/rsvp/` shows the closed envelope with a working seal.
- The reset causes no reverse animation — no counter-spin, no halves sliding
  back in.
- `npm run build` passes.

## IN SCOPE

- `public/assets/js/envelope.js` — **the reset only.**
- `styles/components/envelope.css` — **the comment block at :179-186 only**, which
  currently asserts the false thing. No rule changes. No property changes.

## THE SHAPE OF THE FIX

A `pageshow` listener that removes `.is-opening` and the `tabindex`.

Reset unconditionally rather than branching on `event.persisted`. On an ordinary
load the class is not there and the attribute is not set, so both calls are
no-ops — the branch buys nothing and costs a line. `pageshow` fires only at load
and at restore, never mid-interaction.

Two things that look like problems and are not, so nobody re-solves them:

- **No counter-spin.** The `transition` declarations live *inside*
  `.envelope.is-opening` (`envelope.css:187, 199, 204, 211`). Removing the class
  removes the transitions along with the transforms, so the revert is instant.
- **The stale `setTimeout(go, 1200)`.** A timer frozen by bfcache resumes on
  restore, but `gone` is already `true` from the navigation that happened, so
  `go()` returns immediately. Do not add a clearTimeout.

## NOT INCLUDED

- A test. Nothing in Node can exercise bfcache, and an assertion that the source
  text contains "pageshow" is theatre, not a guard. Stage 11's guard earned its
  place because the build could actually check the thing; this one cannot.
- Any change to the opening animation, its durations, or its tokens.
- Any change to what `.is-opening` does while it is on.
- Restoring scroll position, or any other bfcache concern beyond this one.
- The frozen inline script in `_includes/base.liquid`. It reads a flag that is
  never set and stays exactly as it is.
- Any other page, component, style or dependency.

## DEPENDENCIES

Stage 11.

## AGENT

The orchestrator, directly — under the one-writer exception Sarah authorised on
2026-08-18. The `implementer` agent type was withdrawn mid-project and
`envelope.js`'s owner is unreachable, so there is nobody to route this to.
Recorded in `project-state.yaml` as `one-writer-exception-stage-12`.

## REQUIRED READING

- this file
- `public/assets/js/envelope.js`
- `styles/components/envelope.css:176-226`

## VALIDATION

`npm run build`, plus a by-hand walk of the acceptance criteria in a real
browser. The build cannot see this defect and will not see the fix.

## ACCEPTANCE CRITERIA

1. Click the seal on `/`, wait for `/rsvp/`, press Back. The envelope is closed,
   the headline is visible, and the seal is clickable.
2. Do it again from the restored page — the seal still opens the envelope and
   still navigates.
3. Tab to the seal on the restored page. It takes focus and shows a focus ring.
4. No reverse animation on restore: the envelope is simply closed when it
   appears, with no halves sliding in and no counter-spin.
5. With `prefers-reduced-motion`, Back behaves the same.
6. `npm run build` passes.
7. Nothing outside IN SCOPE is touched.

## REVIEW LEVEL

L1 — validation + code review. **The `code-reviewer` agent type was also
withdrawn.** If no independent review can be run, record that in the stage note
rather than pretending the level was met.

## STOP

Return when criteria 1–7 are true. Do not merge to `main`.
