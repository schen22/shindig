# Review bindings — shindig-thingamajig

Loaded by the `review` skill at phase 1. These outrank the skill's defaults. If a binding and `plans/CLAUDE.md` disagree, report the contradiction rather than picking one.

## Spec precedence

`plans/CLAUDE.md` is the product requirements document and wins on *what* to build. `AGENTS.md` wins on *how work is divided*.

## Ownership and frozen files → `structure` part 1

Exactly one agent writes any given file (`AGENTS.md` §1). A file touched outside the change's declared row is a **Blocker** — report it; do not edit, work around, or copy it.

Frozen after Wave 0, uneditable by anyone including the original author (§5): `_includes/base.liquid` · `header.liquid` · `footer.liquid` · `eleventy.config.js` · `_data/site.js` · `_data/nav.js` · `package.json` · `netlify.toml` · `_headers` · `public/robots.txt` · `_data/palettes.js`

**New surface is a hard stop.** `package.json` is frozen, so a missing dependency is **reported, never added**. Zero client runtime dependencies. The build fetches nothing and the page fetches nothing — a font CDN, hotlinked image, or analytics call is a Blocker (§4.0.5, §6).

**Two files legitimately appear twice — do not report these as ownership violations** (`AGENTS.md` Wave 0):

1. `_includes/theme-toggle.liquid` — Wave 0 ships a placeholder; **Wave 2b overwrites the file**. Editing the *include line* in `header.liquid` is still a violation.
2. `src/index.liquid`, `src/rsvp.liquid`, `src/details.md` — Wave 0 ships stubs; **Wave 2 replaces their contents**. The shell is Wave 0's, the content is Wave 2's.

## Where this skill sits

`AGENTS.md` §4.3.1 — per-agent, pre-merge, in the agent's own worktree. It does **not** replace §4.3.2: `expert-review-panel` still runs once per wave on the integrated result, iterating to ≥90.

## Build, test, and the CI gate → phase 3

- Build + tests: `npm run build` · Serve: `npx eleventy --serve`
- **No Gate 1 configured yet.** Regex/secret scanning, EXIF validation, and the conformance assertions in `AGENTS.md` §4.1 (`build.js`, `contrast.js`, `copy.js`, `conformance.js`, `output.js`) are **Wave 1a's** to write. Until they exist, report `no Gate 1 configured` once per review — do not substitute manual greps.
- Pre-Wave 0 (no `package.json`): report `RUNTIME: NOT RUNNABLE` and review statically.
- Between Wave 0 and Wave 1a: the build exists but `tests/` does not. Run the build, and **name the checks that are therefore unverified** (contrast, copy keys, conformance, output) rather than letting a green build read as a pass.

## Single sources of truth → `coupling`, `structure`

| Fact | Lives only in | Anywhere else |
| :--- | :--- | :--- |
| Colour | `_data/palettes.js` (§4.4) | Blocker |
| Themed copy | `_data/themes.js` (§4.5) | Blocker |
| Nav links | `_data/nav.js` | Blocker |
| Live theme | `_data/site.js` → `partyTheme` (§6) | Blocker |

No component may hard-code a colour, radius, typeface, or piece of party copy — everything themeable arrives through the §4.1 token contract, and `--t-accent` is decorative and never carries text.

**Every theme must define every copy key — all four, not just the live one** (§4.5). Liquid renders a missing key as an empty string and says nothing, so this fails silently and invisibly. A new key added for one theme and not the others is a Blocker.

## Hand-agreement pairs → `coupling`

`src/details.md` and `public/assets/details.ics` must carry the same date — the repo's only by-hand agreement (§11), currently guarded by nothing. Check it whenever either file changes.

## Publish surface → `security-privacy`

`public/` is passthrough-copied verbatim to the Netlify CDN. **Anything committed there is published**, including image EXIF and the contents of `details.ics`. `robots.txt` + `noindex` are obscurity, not access control (§7 Q3); the `alpha` branch deploy is publicly reachable by URL. Guest names, RSVP contents, and anything from the private Sheet are Blockers anywhere in the repo.

## Gate 3 triggers → `security-privacy`

Load Gate 3 when the diff touches any of these — the project's only surfaces that render or embed anything:

- `src/rsvp.liquid` — the Google Form `<iframe>`: `sandbox`, `referrerpolicy`, and whether the embed can reach the parent page (§5.2).
- `_headers` — CSP including `frame-ancestors`, and whether `unsafe-inline` is genuinely required by the §8.2 inline script.
- Any Liquid `| safe`/`raw` filter, or `innerHTML` in `public/assets/js/`.
- Any new external origin anywhere.

## Accessibility — the no-JS path → `accessibility`

Two documented cases, both of which this project has shipped broken before (`AGENTS.md` §4.3):

1. **The seal** must sit on a plain working `<a href>` — the animation is a reveal, never a gate (§4.0.4, §5.1). With scripts off it navigates.
2. **The theme toggle** must be **absent, not dead**, when scripts are off (§4.7.3). OS dark preference still resolves in CSS via the media query, which is why that block is not redundant (§4.4).

## Budget overrides → `structure` part 2

- Component CSS: one file per component under `styles/components/`, glob-ordered. **Order must never be load-bearing** (§2.1) — if two components fight over specificity, fix the selectors.
- Client JS: split per feature under `public/assets/js/`, never a shared `site.js` (§2.2).
- Fallback rule: any custom property using a Baseline-2023 feature (`color-mix()`, `cqw`, `clamp()`) needs a plain declaration immediately before it. **Load-bearing case: `--seal-size` → `--seal-clear`** — without it, padding drops to 0 and the headline runs under the seal, the one outcome §5.1 forbids.
- Browser floor: Baseline 2023 (Safari 16.4+, Chrome/Edge 111+, Firefox 113+).

## Branch policy → `--fix`

**Never push.** `main` is Sarah's and Netlify deploys it on push (§3.0); no agent pushes anything, ever. Pushing `alpha` for a branch-deploy check is Claude's call at a wave boundary, never this skill's. `--fix` applies changes in the current worktree, commits nothing, and stops there.
