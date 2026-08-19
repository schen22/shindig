# Review bindings — shindig-thingamajig

Loaded by the `review` skill at phase 1. **These outrank the skill's defaults.**
If a binding and `CLAUDE.md` disagree, report the contradiction rather than
picking one.

## Spec precedence

`CLAUDE.md` wins on *what* to build. The stage contract in `.claude/stages/`
wins on *scope* — what is in, what is explicitly out, and when to stop.

## Scope — what is not a finding

Beyond the skill's own list, none of these are findings on this project:

- **An abstraction with no current requirement.** Three pages and four themes
  are the whole of it.
- **Architecture for a hypothetical future** theme, page, or feature.
- **An unrelated refactor**, or work belonging to a later stage.
- **Anything on the contract's NOT INCLUDED list.** Its absence is correct.

Maintainability is judged against **a three-page static site**, not a platform.
"This would not scale" is not a finding unless the contract asks it to scale.

Anything contradicting `CLAUDE.md`, a stage contract, or a recorded decision in
`project-state.yaml` is **escalated as a Question, never edited**.

## Ownership and frozen files → `structure` part 1

Exactly one agent writes any given file. **A file touched outside the stage
contract's IN SCOPE list is a Blocker** — report it; do not edit, work around,
or copy it.

Frozen, uneditable by anyone including the original author: `_includes/base.liquid` ·
`header.liquid` · `footer.liquid` · `eleventy.config.js` · `_data/site.js` ·
`_data/nav.js` · `package.json` · `netlify.toml` · `_headers` ·
`public/robots.txt` · `_data/palettes.js`

Full rules, including the two files that legitimately appear twice, are in
`.claude/workflows/parallel-execution.md`.

**New surface is a hard stop.** `package.json` is frozen, so a missing
dependency is **reported, never added**. Zero client runtime dependencies. The
build fetches nothing and the page fetches nothing — a font CDN, hotlinked
image, or analytics call is a Blocker.

## Build and the CI gate → phase 3

- Build + tests: `npm run build` · Serve: `npx eleventy --serve`
- Gate 1 is `npm run build`. It runs `contrast.js`, `copy.js` and
  `conformance.js` before the build, then `build.js` and `output.js` against the
  emitted site. Read its exit code; do not substitute manual greps for it.
- There is **no preview deploy**. Netlify builds production only, so any claim
  needing a live URL is unverified until Stage 10.

## Single sources of truth → `coupling`, `structure`

| Fact | Lives only in | Anywhere else |
| :--- | :--- | :--- |
| Colour | `_data/palettes.js` | Blocker |
| Themed copy | `_data/themes.js` | Blocker |
| Nav links | `_data/nav.js` | Blocker |
| Live theme | `_data/site.js` → `partyTheme` | Blocker |

No component may hard-code a colour, radius, typeface, or piece of party copy —
everything themeable arrives through the token contract.

**Every theme must define every copy key — all four, not just the live one.**
Liquid renders a missing key as an empty string and says nothing, so this fails
silently and invisibly. A new key added for one theme and not the others is a
Blocker.

## Contrast → `accessibility`

Computed, never eyeballed. `tests/contrast.js` enforces the thresholds; these
are here so a reviewer can recognise a violation in a diff.

| Pair | Minimum |
| :--- | :--- |
| `ink` on `bg` · `primary` on `bg` · `primary` on `card` · `bg` on `primary` | 4.5 |
| `focus` against `bg` | 3.0 |

**Decorative-only tokens never carry text:** `--t-accent`, `--t-wax-lit`,
`--t-wax-dark`, `--t-faint`, `--t-line`, `--t-rule`. `color:` resolving to any
of them is a Blocker. **All** secondary text takes `--t-muted`.

## Modern CSS → `structure` part 2

Browser floor is **Baseline 2023** (Safari 16.4+, Chrome/Edge 111+, Firefox
113+). `color-mix()`, `clamp()`, `:where()` and `inert` are inside it.

**Layer-3 colour tokens take the `color-mix()` declaration alone** — no fallback
declaration, no `@supports`. The two-declaration fallback pattern was tried and
withdrawn: a custom property's value is an arbitrary token stream, so the
`color-mix()` parses and wins the cascade even where unsupported, leaving the
preceding fallback unreachable — and `lightningcss` deletes it in production
anyway. **A two-declaration fallback pair is itself a finding.**

**`--seal-size` / `--seal-clear` take `@supports`**, because there the failure is
not cosmetic: an unsupported `cqw` invalidates the `calc()`, padding drops to
`0`, and the headline runs under the seal. Static floors unconditionally, then
raise them inside `@supports (container-type: inline-size)`.

## Accessibility — the no-JS path → `accessibility`

Two documented cases, both of which this project has shipped broken before:

1. **The seal** must sit on a plain working `<a href>` — the animation is a
   reveal, never a gate. With scripts off it navigates.
2. **The theme toggle** must be **absent, not dead**, when scripts are off. The
   OS dark preference still resolves in CSS via the media query, which is why
   that block is not redundant.

Also: nothing invisible may be focusable · no positive `tabindex` · never
`outline: none` without a replacement · decorative SVG takes `aria-hidden` and
the control carries a label naming the **action**, not the state.

## Hand-agreement pairs → `coupling`

`src/details.md` and `public/assets/details.ics` must carry the same date — the
repo's only by-hand agreement, guarded by nothing. Check it whenever either
file changes.

## Publish surface → `security-privacy`

`public/` is passthrough-copied verbatim to the Netlify CDN. **Anything
committed there is published**, including image EXIF and the contents of
`details.ics`. `robots.txt` + `noindex` are obscurity, not access control. Guest
names, RSVP contents, and anything from the private Sheet are Blockers anywhere
in the repo.

## Gate 3 triggers → `security-privacy`

Load Gate 3 when the diff touches any of these:

- `src/rsvp.liquid` — the Google Form `<iframe>`: `title`, `referrerpolicy`, and
  whether the embed can reach the parent page.
- `_headers` — and whether `unsafe-inline` is genuinely required by the inline
  `<head>` script.
- Any Liquid `| safe`/`raw` filter, or `innerHTML` in `public/assets/js/`.
- **Any new external origin anywhere.** The Google Form is the one permitted
  exception; everything else is a Blocker.

## Branch policy → `--fix`

**Never push.** `main` is Sarah's and Netlify deploys it on push. Pushing
`alpha` is the orchestrator's call, never this skill's. `--fix` applies changes
in the current worktree, commits nothing, and stops there.
