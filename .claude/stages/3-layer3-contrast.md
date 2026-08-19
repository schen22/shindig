# STAGE 3 — Layer-3 contrast enforcement

## GOAL

Make the contrast checker measure the derived text tokens, and move the one
piece of text currently using a token that fails WCAG AA.

## START STATE

- `tests/contrast.js` checks the palette pairs only — it reports "40 pairs
  checked across 4 themes" and stops there.
- `styles/base.css` sets `small { color: var(--t-faint) }`.
- `utils/contrast.js` exports `contrastRatio` and `floorTo`, with no way to
  resolve a `color-mix()` expression.
- `npm run build` passes, over a page that fails AA.

## THE RULING THIS STAGE ENFORCES

Layer 3 names four derived surfaces once, so components never carry raw
percentages:

| Token | Classification |
| :--- | :--- |
| `--t-muted` | **Text.** All secondary text, without exception. |
| `--t-faint` | **Decorative only.** Never carries text. |
| `--t-line` | Decorative. Hairline borders. |
| `--t-rule` | Decorative. Form outlines. |

`--t-faint` was labelled "labels, captions" until it was measured. At 56% ink on
bg it gives **3.54 / 3.50 / 3.64 / 3.65** in taskmaster / forest / birthday /
picnic **light** modes, against AA's 4.5. The dark modes pass at 5.26–5.50 —
which is exactly why looking at it in one mode found nothing. `--t-muted` at 72%
clears 4.5 in all eight combinations, at 5.61–8.40.

**Raising `--t-faint` to 65% was considered and rejected:** it clears AA by 0.03
in forest, and it collapses the gap between two tokens that exist to be visibly
different. The token stays, decorative, because a tint too low-contrast for text
is exactly right for a dot, a ring or a divider.

This is the third contrast failure in this project's history, and like the first
two nothing but arithmetic would have caught it — the pair table lists palette
colours, and a *derived* value never enters it.

## END STATE

- `utils/contrast.js` exports a function reproducing
  `color-mix(in srgb, a N%, b)` in gamma-encoded sRGB.
- `tests/contrast.js` measures every layer-3 token classified as text, in every
  theme and both modes, against 4.5.
- The decorative three are exempt, and the exemption is **explicit and
  justified in the file** — not a silent omission.
- `styles/base.css` no longer sets `color` to `--t-faint` anywhere.
- `styles/tokens.css` states which layer-3 tokens may carry text.
- `npm run build` passes, and reports the layer-3 checks alongside the pairs.
- Reverting the `small` fix makes the build fail.

## IN SCOPE

- `utils/contrast.js` — the mix function.
- `tests/contrast.js` — the layer-3 measurement.
- `styles/base.css` — the `small` rule.
- `styles/tokens.css` — comments recording the classification.

## NOT INCLUDED

- Any change to `_data/palettes.js`. The palette values are correct; this is
  about derived tokens.
- Any new token, or any change to a percentage. Do not "fix" `--t-faint` by
  raising it — that was decided against.
- Contrast checking for `--t-line` or `--t-rule`. They are decorative and mix
  with `transparent`, which is alpha compositing this checker does not model.
- Any page, component, or client JS.
- Refactoring the existing pair checks.

## DEPENDENCIES

Stages 1 and 2.

## AGENT

implementer

## REQUIRED READING

- this file
- `utils/contrast.js`, `tests/contrast.js`, `styles/tokens.css`,
  `styles/base.css`

Nothing else.

## VALIDATION

`npm run build`

## REVIEW LEVEL

L1 — validation + code review

## ACCEPTANCE CRITERIA

1. The layer-3 text tokens are measured in all four themes, both modes.
2. **The percentages are read out of `styles/tokens.css`, not re-typed in the
   test.** A test holding its own copy of `72` passes while the page fails; a
   green check over a broken page is worse than no check.
3. A layer-3 token the test does not classify **fails the build** rather than
   going unmeasured — that silence is how `--t-faint` shipped.
4. No `color:` anywhere resolves to `--t-faint`.
5. `npm run build` passes.
6. No file outside IN SCOPE is touched.

## STOP

Return when all six acceptance criteria are true. Do not begin Stage 4.
