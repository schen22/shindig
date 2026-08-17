# AGENTS.md — Execution Plan & File Ownership

**Spec:** [`plans/CLAUDE.md`](plans/CLAUDE.md) is the product requirements document and the only source of truth for _what_ to build. This file governs _how the work is divided_ so several agents can build it at once without colliding.

If the two disagree, `plans/CLAUDE.md` wins on requirements and this file wins on ownership. Report the contradiction rather than picking one.

---

## 1. The one rule

**Exactly one agent may write any given file. Every agent may read every file.**

Merge conflicts between agents are always a symptom of two agents writing the same file. They are not solved by careful merging — they are solved by ownership being disjoint in the first place. If ownership is disjoint, merging parallel worktrees is clean every time, because there is nothing to reconcile.

Three corollaries, and they are not optional:

1. **If you need to change a file you do not own, stop and report it.** Do not edit it, do not work around it, do not copy it. An unowned edit is how a clean parallel build turns into a three-way conflict nobody can untangle.
2. **When several agents must contribute to one concept, it is a globbed directory, never a shared file.** See §2.
3. **Frozen files (§5) are not editable by anyone after Wave 0**, including their original author.

---

## 2. Structural requirements

Two layouts in `plans/CLAUDE.md` §3.2 were written for a single author and make disjoint ownership impossible. Both are amended here, and the amendments are the reason parallel work is safe at all.

### 2.1 Component CSS is a globbed directory

```text
styles/components/
├── envelope.css
├── toggle.css
├── callout.css
└── form-embed.css
```

**Not** a single `styles/components.css`. Four feature agents all need to write component CSS; one file means a guaranteed four-way conflict. The generator (`src/assets/site.css.11ty.js`) globs `styles/components/*.css` in sorted order rather than naming partials, so adding a component never edits a shared file.

Sorted order matters: component CSS must not depend on source order for correctness. If two components fight over specificity, fix the selectors — do not rely on the glob.

### 2.2 Client JS is split per feature

```text
public/assets/js/
├── envelope.js     # §5.1 — seal click, door animation, second-visit flag
└── theme.js        # §4.7.3 — the toggle's write path
```

**Not** a single `site.js`. `plans/CLAUDE.md` §4.7.3 and §5.1 both specify code destined for it, from two different agents. Both files load `defer`; two ~1KB requests is not a cost worth a merge conflict.

The **read** half of both features stays in the inline `<head>` script in §8.2, which belongs to Wave 0 and is frozen.

---

## 3. Waves

Waves are sequential. Agents within a wave run in parallel, in **separate git worktrees**, and are merged at the wave boundary.

A wave is not done when its agents report done. It is done when the gate for that boundary passes (§4) — and for Waves 1 and 2 that includes an expert panel review at ≥ 90 with no unresolved critical issues (§4.3).

### 3.0 Branching, merging, and the rule about pushing

**`main` is Sarah's. No agent pushes anything, ever.**

Netlify deploys `main` on push (PRD §3.1). An agent pushing mid-wave puts a half-built site on the live URL friends have been given, so the safety property here is absolute rather than a matter of care:

| Branch | Who writes it | What it is |
| :--- | :--- | :--- |
| `main` | **Sarah only** | What Netlify deploys. Receives from `alpha`, when Sarah decides. |
| `alpha` | Claude merges into it | The integration branch. Every wave lands here. Created by Sarah or Claude, never by an agent. |
| `waveN/<agent>` | one agent each | A worktree branch, e.g. `wave2/2a`. Deleted after merge. |

**The flow:** agents branch from `alpha` → work in their own worktree → **commit** → pass per-agent review (§4.3.1) → Claude merges to `alpha` → the wave gate runs on `alpha` → Sarah merges `alpha` to `main` when she wants it live.

Three consequences worth stating plainly:

- **Agents commit but never push.** A worktree with uncommitted changes has nothing to merge; a worktree that pushes bypasses every gate in §4.
- **Nothing an agent does can reach the live site.** That is the entire point of the split.
- **`alpha` may be pushed by Claude** so Netlify can build a branch deploy for gate verification (headers, fonts, built CSS). That preview lives at a branch URL, is covered by `robots.txt` and the `noindex` meta, and is never the address given to anyone.

### Wave 0 — Scaffold (solo, blocking)

One agent, no parallelism. Everything downstream imports from it, so splitting it is negative value.

**Owns:** `package.json`, `.nvmrc`, `.gitignore`, `eleventy.config.js`, `_data/site.js`, `_data/nav.js`, `_includes/base.liquid`, `_includes/header.liquid`, `_includes/footer.liquid`, `_includes/theme-toggle.liquid` _(placeholder only)_, and stub `src/index.liquid`, `src/rsvp.liquid`, `src/details.md`.

**This job is larger than `eleventy init`.** `base.liquid` must ship complete — every include slot, the full §8.2 inline script, the skip link, the `{% unless page.url == "/" %}` guards — so that no later agent ever reopens the shell. Wave 0 writes slots for features that do not exist yet.

`_includes/theme-toggle.liquid` ships as a placeholder because `header.liquid` includes it and a missing include fails the build. Wave 2b overwrites the file; it never edits the include line.

**Exit:** `npx eleventy --serve` renders three pages, unstyled. Nav shows correct `aria-current`. Header and footer are both absent on `/`.

### Wave 1 — Foundation (3 parallel)

| Agent                            | Owns                                                                                                                                                                                            | Exit condition                                                                                                                                                  |
| :------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1a · Colour pipeline & tests** | `_data/palettes.js`, `utils/theme-css.js`, `utils/contrast.js`, `src/assets/site.css.11ty.js`, and all of `tests/` — `contrast.js`, `copy.js`, `build.js`, `conformance.js`, `output.js` (§4.1) | Break a palette on purpose → `npm run build` exits non-zero. Restore → passes. Built `site.css` contains exactly one palette and zero `[data-party]` selectors. |
| **1b · Type & base CSS**         | `styles/tokens.css`, `styles/base.css`, `styles/layout.css`, `public/assets/fonts/`                                                                                                             | Headline renders in Fraunces, not Georgia. Global `:focus-visible` rule present, matching §4.6.2 verbatim.                                                      |
| **1c · Netlify & access**        | `netlify.toml`, `_headers`, `public/robots.txt`                                                                                                                                                 | Deploy preview serves all three headers; `robots.txt` resolves at site root.                                                                                    |

**1a and 1b are genuinely parallel because §4.1's token contract is a written interface.** 1b writes `var(--t-primary)` without knowing or caring who defines it. That contract is what makes parallel CSS safe; do not weaken it by having any component define its own colour.

**1a must check all four themes even though only one ships** (§3.4). The generator reads one palette; the checker reads all of them.

### Wave 2 — Features (4 parallel worktrees)

| Agent                 | Owns                                                                                         | Spec       |
| :-------------------- | :------------------------------------------------------------------------------------------- | :--------- |
| **2a · Envelope**     | `src/index.liquid`, `styles/components/envelope.css`, `public/assets/js/envelope.js`         | §5.1, §8.1 |
| **2b · Theme toggle** | `_includes/theme-toggle.liquid`, `styles/components/toggle.css`, `public/assets/js/theme.js` | §4.7.3     |
| **2c · RSVP page**    | `src/rsvp.liquid`, `styles/components/form-embed.css`                                        | §5.2       |
| **2d · Details page** | `src/details.md`, `styles/components/callout.css`, `_data/themes.js`                         | §5.3, §4.5 |

Every path above is owned by exactly one agent. No file appears twice. Merging these four worktrees cannot conflict.

Recurring failure modes worth naming, all of them already specified and all of them easy to get wrong:

- **2a:** static fallbacks before every `cqw` (§4.4) — without them the seal clearance collapses to zero and text runs under the seal. The spin plays on opening only; a reset must suppress transitions for a frame.
- **2b:** each glyph is bound to a state, never `display: none`, and the palette flips on the same frame as the click — the outgoing icon animates _after_ the theme has already changed.
- **2c:** the direct form link is always visible, not an error state.
- **2d:** every key in the §4.5 copy contract is defined for **all four** themes, not just Taskmaster. `tests/copy.js` enforces this; a missing key renders as empty string and Liquid says nothing.

### Wave 3 — Real values (not a code task, and blocks nothing)

**Owns:** the date, venue, bring/wear/plus-ones text inside `src/details.md`, and `public/assets/details.ics`.

**This is content, not code, and it is not on the critical path.** Wave 2d builds and ships the whole `/details` page — layout, themed bullets, callout, photo, last-updated line — against mock data, so everything is verifiable before a single real value exists.

**Build against this mock set. Do not leave fields blank, and do not invent your own.**

| Field        | Mock value                                                              |
| :----------- | :---------------------------------------------------------------------- |
| Date         | `Saturday, Sep 5 · 2pm PT`                                              |
| Venue        | `TBD`                                                                   |
| Bring        | `Just yourself`.                                                        |
| Wear         | `Whatever you'd wear to a park`                                         |
| Plus-ones    | `Yeee, just make sure to specify in the form or give Sarah a head's up` |
| Photo        | `public/assets/images/details-placeholder.jpg`                          |
| Last updated | the date the page was written                                           |

One note on the mock set which matter because placeholders get copied into production:

- **The photo is a file committed to the repo**, at the fixed `aspect-ratio` §5.3 requires, not a hotlinked stock URL. An external image adds a third-party request the site otherwise doesn't make (§1, §4.0.6) and turns into a broken box the day it 404s.

`details.ics` carries the same date as `details.md`, mock or real — that pair is the only thing in the repo that must agree with itself by hand (§11).

---

## 4. Verification gates

**Verification is not a final wave. A gate runs at every boundary, checking what exists at that point.**

An audit that only runs at the end tells you which agent was wrong _after_ all of them have finished — and a bug in the Wave 0 shell found at that stage has three features built on top of it. The cheapest verification is the earliest.

### 4.1 Mechanical checks are tests, not agents

Most of what an audit agent would do is a grep with an exit code. Those belong in `tests/`, where they run on **every build by every agent**, catching a regression the moment it is introduced rather than at a boundary:

| Check                                                                                                                                                                           | Lives in               |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------- |
| Pages render; expected markers present                                                                                                                                          | `tests/build.js`       |
| Contrast, all four themes, both modes                                                                                                                                           | `tests/contrast.js`    |
| Every theme defines every copy key                                                                                                                                              | `tests/copy.js`        |
| No hard-coded hex outside `_data/palettes.js`; no `outline: none`; no positive `tabindex`; no `[data-party]` in output CSS; both copies of the §4.6.2 focus rule byte-identical | `tests/conformance.js` |
| Exactly one palette in built `site.css`; minified in prod, readable in dev; fonts present and preloaded                                                                         | `tests/output.js`      |

Agents are reserved for what needs judgment: whether the tab order makes sense, whether the page is usable without scripts, whether the thing actually looks right.

### 4.2 The gates

| Boundary          | Automated                                                 | Agent review                                                                                                                                                                                                                     |
| :---------------- | :-------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Every agent, pre-merge** | its own `npm run build`                          | **Per-agent review (§4.3.1)** — diff against spec, ownership respected, exit condition actually met. Nothing merges until this passes.                                                                                            |
| **After Wave 0**  | `build.js`                                                | **Keyboard & a11y on the bare shell.** Most of §4.6 is Wave 0's work and is fully verifiable here — skip link first, tab order, `aria-current`, header/footer guards on `/`. Do not wait for CSS.                                |
| **After Wave 1**  | `+ contrast.js`, `copy.js`, `conformance.js`, `output.js` | **Type & colour spot check** — fonts loading, focus ring visible and contrast-checked in both modes. **Plus expert panel review (§4.3).**                                                                                        |
| **After Wave 2**  | full suite                                                | **Keyboard & a11y, round two** (nothing invisible focusable, `inert` behind the closed doors, the toggle's label naming the action) and **no-JS** (seal navigates, toggle absent not broken, OS dark preference still honoured). **Plus expert panel review (§4.3).** |
| **Before launch** | full suite                                                | Re-run both agents, then walk §11 of the PRD.                                                                                                                                                                                    |

The Wave 0 gate is the one most worth not skipping. It is the cheapest audit in the project and it is the only point where fixing the shell costs nothing.

### 4.3 Three layers of review

Per-agent review and panel review are **not alternatives**. They catch different classes of defect, and neither one substitutes for the other:

| Layer | Runs | Scope | Catches |
| :--- | :--- | :--- | :--- |
| **Tests** (§4.1) | Every build, every agent | Whole repo, mechanical | Regressions, the moment they appear |
| **Per-agent review** (§4.3.1) | Every agent, before its merge | That agent's diff | Local defects — missing fallback, wrong ARIA, spec deviation |
| **Expert panel** (§4.3.2) | Once per wave, after merge | The integrated result | What only exists once the parts are together |

The distinction that matters: **a per-agent reviewer cannot see the defects that this project has actually suffered from.** A seal with no working link when JavaScript is off, a toggle rendered as a dead control, seal sizing coupled to its own gap, a motion signature that disagrees with itself across two components — none of those are visible in one file's diff. They only appear when you ask whether the whole thing holds together. Conversely, a wave-boundary panel is a slow, expensive way to catch a missing `cqw` fallback that a reviewer would have flagged in seconds, before the merge even happened.

So: push the cheap, local, high-volume review left to per-agent, and shrink the panel to what genuinely needs integration.

#### 4.3.1 Per-agent review (every agent, before merge)

Every agent's work is reviewed **in its own worktree, before it merges**. One reviewer, not a panel — this is a code review, not a symposium.

**Scope is deliberately narrow:**

1. Does the diff satisfy the spec sections that agent was given, clause by clause?
2. Does it stay inside its declared ownership? Any file touched outside the row is a hard stop (§1).
3. Does it repeat something the token contract already provides — a raw hex, an ad-hoc percentage, a hand-tuned number that should be derived?
4. Does the stated exit condition actually hold, or is it a self-report?

**Routing is trivial here, which is the point.** The reviewer is looking at one agent's diff while that agent is still alive and still owns those files. Findings go straight back to it; it fixes them in the same worktree; nothing merges until it is clean. No cross-agent routing, no reopening closed work, no chance of a fix landing in someone else's file.

A merge only happens after this passes. **A dirty worktree never reaches the integration branch.**

#### 4.3.2 Expert panel (Waves 1 and 2, after merge)

Waves 1 and 2 do not close on tests passing. Each runs the **`expert-review-panel` skill** on the integrated result, iterating until the average is **≥ 90/100**, and findings must be *fixed*, not merely filed.

Tests catch what someone thought to check for. The panel is for what nobody thought to check — and on this project it has a track record: two WCAG contrast failures, the no-JS seal, the dead toggle, the seal-hierarchy regression, four keyboard bugs. No test and no diff review would have caught any of them.

**When:** on the integration branch, **after the wave's worktrees merge and the full suite passes**, before the wave is declared done. Reviewing unmerged worktrees reviews code in isolation from what it has to work with, which is exactly where the interesting defects hide.

**Composition.** Run the lenses that have something to bite on. Ten experts on a three-page static site produces padding, and padding is what makes a review get skipped next time.

| Wave | Lenses | What they are judging |
| :--- | :--- | :--- |
| **1 · Foundation** | Software Architect · Code Quality · Maintainability · Performance · Reliability · Security | A build pipeline, a token contract, hosting config. Duplication, the single-source-of-colour claim, whether a bad palette really does fail the build, whether adding theme 05 touches only `_data/`. |
| **2 · Features** | UX · Accessibility · Code Quality · Performance · Reliability · Domain (event invites) · Software Architect | Everything a visitor touches. Hierarchy, motion, focus behaviour, the no-JS path, and whether the page does the job a party invite exists to do. |

Accessibility is a standing lens on both, not a sub-point of UX. It is the requirement this project has failed most often.

**Routing findings.** The panel writes nothing but a report; it holds no ownership (§1). By this point the wave's agents have merged, so:

1. Report groups findings **by owning agent**, not by expert.
2. Each routes to the agent that owns the file. **Continue the original agent** so it keeps its context, rather than spawning a fresh one that re-derives everything and guesses at intent.
3. That agent fixes it in its own worktree, passes §4.3.1 again, re-merges.
4. Panel re-reviews only what changed. Iterate to ≥ 90.

A finding spanning files owned by two agents is a design problem, not a bug — escalate it rather than letting either agent reach across the line.

#### What is not a finding

- **Anything contradicting `plans/CLAUDE.md` is escalated, not fixed.** The spec wins on requirements (see the header of this file). If an expert argues the seal should be a `<button>`, or that the toggle's 1.3:1 ring fails 1.4.11, that is a conversation to have with Sarah — both are documented decisions with recorded reasoning, and an agent must not quietly reverse them.
- **Score alone does not close a wave.** A 91 average with an unresolved critical issue is not a pass. Critical issues are fixed regardless of average.

---

## 5. Frozen files

After Wave 0 merges, **nobody edits these** — not even the agent that wrote them. They are the shell every other agent builds against, and a change here invalidates work already in flight.

- `_includes/base.liquid` — including the inline `<head>` script
- `_includes/header.liquid`, `_includes/footer.liquid`
- `eleventy.config.js`
- `_data/site.js`, `_data/nav.js`

Single-writer for a different reason:

- **`_data/palettes.js`** — the single source of colour (§4.4). Two writers reintroduces exactly the drift that architecture exists to eliminate. 1a owns it permanently.

Need one changed? Stop, report, and let it be done between waves.

---

## 6. Prerequisites

These block or silently corrupt agent execution and are resolved before Wave 0 starts.

1. **`netlify.toml` is unspecified in the PRD.** Needs publish directory (`_site`), build command (`npm run build`), and `NODE_ENV=production`. The last one matters: §3.3 gates minification on it, so getting it wrong ships unminified CSS and nothing complains. → Wave 1c.

2. **Three of the five test files do not exist, and they are the single most valuable addition for agent execution.** The PRD specifies only `contrast.js` and `copy.js`; `build.js`, `conformance.js` and `output.js` (§4.1) are new here. Without them an agent reports success and leaves the build broken for the next wave, and every mechanical audit has to be re-run by hand at each boundary instead of on every build. This is what turns an exit condition from a self-report into a check. → Wave 1a.

3. ~~**Font files cannot be produced by an agent.**~~ **Resolved:** ship **full `woff2`, unsubsetted**, committed to `public/assets/fonts/` — Fraunces, Plus Jakarta Sans, Courier Prime. Roughly 3× the bytes of a Latin subset, which is acceptable for now and revisited before launch. §4.8's other requirements are unchanged: self-hosted, `font-display: swap`, preload the display face only. Subsetting needs `pyftsubset`/`glyphhanger`, so it stays a human step whenever it happens. → Wave 1b.

4. **`src/assets/site.css.11ty.js` reads `styles/${n}.css` relative to `process.cwd()`** (§3.3). Fine when Netlify runs from the repo root; breaks anywhere else. Resolve from the repo root explicitly.

5. **`lightningcss` `targets` is a placeholder comment** in §3.3. Supply the literal value or an agent will guess.

6. **No `.gitignore`.** Without it `_site/` and `node_modules/` land in every worktree and turn clean merges into noisy ones. → Wave 0.

---

## 7. Rules for every agent

1. Read `plans/CLAUDE.md` before writing anything. It is the requirements; this file is only the division of labour.
2. Write **only** the paths listed in your row. Read anything.
3. Do not edit a frozen file (§5). Stop and report instead.
4. Do not create files outside your ownership to "work around" a missing dependency. Report the dependency.
5. Meet your exit condition and say plainly whether you did. If part of the work is blocked, finish everything else and state exactly what you left and why.
6. `npm run build` must pass when you finish. If it does not, that is the report — not a silent handoff.
7. If a panel finding comes back against a file you own (§4.3), fix it in your own worktree and re-merge. Do not fix a finding in someone else's file, and do not reverse a documented decision in `plans/CLAUDE.md` because an expert disagreed with it — escalate instead.

---

## 8. Honest sizing

This is three pages of static HTML. Wave 2's parallelism saves perhaps twenty minutes, and the coordination overhead is a real fraction of that.

The sequencing in Waves 0 and 1 is what actually matters — get the shell or the token pipeline wrong and every downstream agent builds on sand. **The gates in §4 are where the real return is**, and most of that return comes from §4.1: a check that runs on every build catches a regression the moment it is introduced, which no amount of agent fan-out at the end can match.

Spend the setup effort on ownership discipline and on prerequisite #2. Do not spend it on maximising agent count.
