# STAGE 2 — Type and base CSS

**Status: complete.** Merged to `alpha` at `c8cdecc`.

## GOAL

Fill the token contract with type and base styles, against the colour interface
Stage 1 defined.

## END STATE

- `styles/tokens.css`, `styles/base.css`, `styles/layout.css` exist.
- The headline renders in Fraunces, not Georgia.
- The global `:focus-visible` rule is present and byte-identical to the
  specified selector list.
- `@font-face` blocks live in `tokens.css`, part of the single generated sheet.

## KNOWN DEFECT, CLOSED BY STAGE 3

`styles/base.css` sets `small { color: var(--t-faint) }`. `--t-faint` measures
below WCAG AA on text in all four light modes. Stage 3 fixes it.
