# STAGE 1 — Colour pipeline and build checks

**Status: complete.** Merged to `alpha` at `c5c0e7c`.

## GOAL

Make colour a single source with a machine-checked contract, and give every
later stage a build that fails loudly.

## END STATE

- `_data/palettes.js` is the only place colour exists.
- `utils/theme-css.js` emits only the live palette; `utils/contrast.js` holds
  the WCAG maths, imported rather than re-implemented.
- `src/assets/site.css.11ty.js` emits one stylesheet containing one palette.
- Five checks exist and run on every build: `contrast.js`, `copy.js`,
  `conformance.js`, `build.js`, `output.js`.
- Breaking a palette on purpose makes `npm run build` exit non-zero.

## KNOWN GAP, CLOSED BY STAGE 3

`tests/contrast.js` measures the §4.3 palette pairs only — 40 pairs across four
themes and two modes. It does **not** measure layer 3's derived text tokens.
Stage 3 closes that.
