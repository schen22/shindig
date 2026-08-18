# STAGE 4 — Themed copy

## GOAL

Create the per-theme copy data that the frozen shell already reads.

## START STATE

- `_data/themes.js` does not exist.
- `tests/copy.js` skips, printing the key contract it will enforce.
- The footer renders an empty `<p class="footer-line">` on `/rsvp/` and
  `/details/`.
- `base.liquid`, `header.liquid` and `footer.liquid` resolve
  `themes[site.partyTheme]` and fall through to defaults.

## END STATE

- `_data/themes.js` exists and default-exports one object per theme named in
  `_data/palettes.js`: taskmaster, forest, birthday, picnic.
- Every theme defines all fifteen keys: `wordmark`, `eyebrow`, `headline`,
  `subheadline`, `tagline`, `sealLabel`, `titleHome`, `titleRsvp`,
  `titleDetails`, `calloutTitle`, `calloutBody`, `detailsIntro`, `footerLine`,
  `footerLinkText`, `footerLinkUrl`.
- `tests/copy.js` runs and passes, with no skip line.
- `npm run build` passes.
- The footer line renders non-empty on `/rsvp/` and `/details/`.

## IN SCOPE

`_data/themes.js` — this file, and no other.

Theme 01 copy is fixed. Use it verbatim:

```
eyebrow         Task #1
headline        Hang out with Sarah and friends
subheadline     Come through and have fun!
tagline         Sarah edition
wordmark        TM
footerLine      Comethru and play!! Inspired by Taskmaster UK
footerLinkText  Taskmaster UK
footerLinkUrl   https://www.taskmaster.tv/
```

Themes 02–04 copy is yours to write, in each theme's voice: 02 Forest bathing,
03 Birthday, 04 Picnic in the park.

## NOT INCLUDED

- Page bodies. All three pages stay as Stage 0 stubs.
- Any CSS, any component, any client JavaScript.
- Real party details — date, venue, bring, wear, plus-ones. Those are Stage 9.
- Nav labels. Deliberately unthemed; they live in `_data/nav.js`.
- A sixteenth key. If a page seems to need one, report it and stop.
- Wordmarks for 02–04 you are unsure of — write a placeholder and flag it.

## DEPENDENCIES

Stage 0 — the frozen shell is what consumes this file. Stage 3 need not have
landed.

## AGENT

content-worker

## REQUIRED READING

- this file — it carries the whole contract, including theme 01's copy
- `_data/palettes.js` — for the four theme names only
- `tests/copy.js` — it prints the exact key list when it skips

Nothing else.

## VALIDATION

`npm run build`

## REVIEW LEVEL

L1 — validation + code review

## ACCEPTANCE CRITERIA

1. Four themes present; fifteen keys defined in each.
2. `tests/copy.js` passes without skipping.
3. Footer renders non-empty on both subpages.
4. No file other than `_data/themes.js` is touched.

## STOP

Return when all four acceptance criteria are true. Do not begin Stage 5.
