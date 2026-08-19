# STAGE 11 — Launch blockers

## GOAL

Clear the two defects the Stage 10 walkthrough found, and make the first of them
impossible to reintroduce silently.

Both are small. Neither is interesting. Both stop the site launching.

## START STATE

- Stages 0–9 merged to `alpha`; the build passes.
- Stage 10 has been walked and recorded `walked-with-failures`.
- `_headers` is tracked at the **repository root**. `_site/_headers` does not
  exist after a build.
- `src/details.md` line 36 reads `Last updated August 17, 2026.` The file was
  last changed on 2026-08-18.

## END STATE

- `_headers` lives at `public/_headers`, and `_site/_headers` exists after
  `npm run build` with byte-identical content.
- `npm run build` **fails** if `_site/_headers` is missing or has lost
  `Referrer-Policy: no-referrer`.
- `/details` reports the date the content was last changed.
- `npm run build` passes.

## WHY THE HEADERS FILE IS WRONG WHERE IT IS

`eleventy.config.js:11` passes through `public/` to the output root. Netlify
publishes `_site` (`netlify.toml:6`) and reads `_headers` **from the publish
directory**. A `_headers` at the repository root is therefore never deployed and
never applied — `robots.txt` works only because it is correctly in `public/`.

The consequence is not cosmetic. Without it the live site sends no
`Referrer-Policy: no-referrer`, so every outbound link hands the destination the
address of the party site. `_includes/footer.liquid:8-10` states that the origin
is the thing the access measures exist to protect, and Stage 9 added an outbound
`calendar.google.com` link that carries it.

**Move the file. Do not copy it.** Two `_headers` in the tree is exactly the
"second copy is a defect, not a convenience" case in `CLAUDE.md`.

## THE GUARD IS PART OF THE FIX

This defect survived every build, both reviews and the whole of Stages 0–10,
because nothing asserts the file reaches the output. Fixing the path without
adding the assertion leaves the next person to rediscover it by hand.

`tests/output.js` already inspects the built site. Extend it: assert
`_site/_headers` exists and contains `Referrer-Policy: no-referrer`. Fail with a
message that names the cause — that `_headers` must live in `public/`, not at
the repository root — because the failure will otherwise read as mysterious to
whoever trips it.

Keep it to that. This is not an invitation to build a headers framework.

## IN SCOPE

- `_headers` → `public/_headers` (a move, via `git mv`)
- `tests/output.js` — the new assertion only
- `src/details.md` — **the `last-updated` line only.** Change nothing else in
  that file: not the date in the `When` row, not the callout, not the photo.

## NOT INCLUDED

- Changing what `_headers` contains. Its two directives are correct; only its
  location is wrong.
- Replacing the mock party values, or touching the `When` row. Sarah removed
  that requirement from `10-launch.md` on 2026-08-18 — the site launches on the
  proposed date.
- The `calendar-url-drift` guard (deferred item). It is a real gap and a
  neighbouring one, but it is not one of the two defects this stage exists for.
  Do not fold it in.
- Making `last-updated` a build-time value. Whether that string stays
  hand-written is undecided; this stage only corrects it.
- Any other page, component, style or dependency.

## DEPENDENCIES

Stage 10's walkthrough.

## AGENT

implementer

## REQUIRED READING

- this file
- `eleventy.config.js`, `netlify.toml`, `tests/output.js`
- `src/details.md`

## VALIDATION

`npm run build`

## ACCEPTANCE CRITERIA

1. `_headers` exists at `public/_headers` and **nowhere else** in the tree.
   Verify with `git ls-files | grep _headers` — exactly one result.
2. `_site/_headers` exists after a build and is byte-identical to the source.
   Show the `cmp` output; it must be silent.
3. Deleting or emptying `_site/_headers` makes `npm run build` fail, and the
   failure message names `public/` as where the file belongs. **Demonstrate
   this** — run the build against a broken state and show it failing, then
   restore. A guard nobody has seen fail is not known to work.
4. `/details` shows the date `src/details.md` was last changed.
5. `npm run build` passes.
6. No file outside IN SCOPE is touched.

## REVIEW LEVEL

L1 — validation + code review

## STOP

Return when all six acceptance criteria are true. Do not begin any other work,
and do not merge.
