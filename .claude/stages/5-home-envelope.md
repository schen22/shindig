# STAGE 5 — Home envelope

## GOAL

Build `/` as the envelope: a full-height split with a seal on the seam that
opens into `/rsvp/`.

## START STATE

- `src/index.liquid` is a Stage 0 stub linking to `/rsvp/`.
- `styles/components/` does not exist.
- `public/assets/js/` does not exist.
- `base.liquid` already guards header and footer off `/`, and its inline
  `<head>` script already sets `envelope-open` on `<html>` from
  `sessionStorage`. **That script is frozen. Do not touch it.**

## END STATE

- `/` renders: `min-height: 100dvh`, seam centred, no header, no footer.
- Top half carries the theme's eyebrow and headline; bottom half the
  sub-headline and tagline. **Each half's text runs to the seam and stops one
  `--seal-gap` short of the seal** — it is not centred in its half.
- The seal is an `<a href="/rsvp/">`. With JavaScript off it still navigates.
- Clicking it spins the seal in a circular motion while fading it out, center line disappears, parts the halves, and at ~900ms calls `location.assign("/rsvp/")`.
- Parting page half split is transform-only. Both halves animate
  on translateY — no layout thrash, so it stays smooth on an old phone. Reduced motion respected. Under prefers-reduced-motion the halves cut away instantly and navigation happens immediately.
- `prefers-reduced-motion: reduce` collapses the transitions; navigation still
  happens.
- `npm run build` passes.

## THE CLEARANCE RULE

The seal and its gap both scale with container width. Static floors first, then
the container-query upgrade:

```css
.envelope {
  --seal-size: 6rem;
  --seal-gap: 1rem;
}
@supports (container-type: inline-size) {
  .envelope {
    container-type: inline-size;
    --seal-size: clamp(6rem, 19cqw, 7.5rem);
    --seal-gap: clamp(1rem, 4cqw, 1.75rem);
  }
}
```

`--seal-clear` stays **derived** — `calc(var(--seal-size) / 2 + var(--seal-gap))`
— computed once, outside the guard, so it follows whichever pair won.

**`@supports` is required here and the failure is not cosmetic.** An unsupported
`cqw` invalidates `--seal-size`, which invalidates the `calc()`, which drops
padding to `0` — and the headline runs underneath the seal. **No text may pass
under the seal at any width.**

**Size and gap are deliberately not one formula.** The gap is a spacing
relationship, so it scales. The seal is an ornament with a fixed identity, so it
has a floor of 96px and only ever grows — it must never shrink on a phone, the
screen where it has the least competition and the most work to do. An earlier
revision coupled them and the seal fell to 64px at phone width. Touch-target
minimums are not the binding constraint; hierarchy is.

Use `cqw`, not `vw`, so the rule holds inside any container.

## IN SCOPE

- `src/index.liquid`
- `styles/components/envelope.css`
- `public/assets/js/envelope.js`

## NOT INCLUDED

- The theme toggle. It does not appear on `/` and is Stage 6.
- Any other page.
- `_includes/base.liquid` and its inline script — **frozen**.
- Writing the second-visit flag anywhere but `sessionStorage`. `localStorage`
  would retire the animation permanently after one use.
- Any new copy key. The words come from `_data/themes.js`.
- A shared `site.js`. Client JS is split per feature.
- Any animation beyond the specified spin-and-part.

## DEPENDENCIES

Stages 0, 2, 4.

## AGENT

implementer

## REQUIRED READING

- this file
- `src/index.liquid`, `_includes/base.liquid` (read only — for the inline
  script's contract), `styles/tokens.css`
- `src/assets/site.css.11ty.js` — for how components are globbed

## VALIDATION

`npm run build`

## REVIEW LEVEL

L2 — validation + code review, then panel at the group boundary

## ACCEPTANCE CRITERIA

1. With JavaScript disabled, the seal navigates to `/rsvp/`.
2. For any error: do not display a control that can't do anything.
3. No text passes under the seal at any viewport width, including with the
   headline wrapped to three lines.
4. Once open, the seal is not focusable — `opacity: 0` and `pointer-events` are
   not sufficient on their own.
5. With `prefers-reduced-motion`, navigation still happens.
6. The spin plays on opening only; no counter-spin on reset.
7. `npm run build` passes.
8. No file outside IN SCOPE is touched.

## STOP

Return when all eight acceptance criteria are true. Do not begin another stage.
