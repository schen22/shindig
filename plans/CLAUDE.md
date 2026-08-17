# CLAUDE.md — Product Requirements Document & Agent Directives

**Project:** A Shindig Thingamajig
**Current theme:** Taskmaster (theme 01)
**Version:** 1.3.0
**Status:** Draft / Ready to scaffold
**Author:** Sarah Chen

---

## 1. Executive Summary & Purpose

`A Shindig Thingamajig` is a lightweight, zero-cost web application for organising casual gatherings and tracking friend RSVPs.

The site is **themed to match the party it is advertising**. Themes change with creator sentiment; the first is inspired by Taskmaster UK. One theme is live at a time, chosen at build (see §4 and §6).

The application is a Jamstack static site: Eleventy (11ty) with Liquid templates, hosted on Netlify, using a Google Form for low-friction response collection and zero-maintenance persistence.

**Privacy position.** No response data is ever rendered on the site. The build fetches nothing, the client fetches nothing, and the site holds **no Google API keys at build or runtime**. Responses live in a private Google Sheet that only Sarah opens. Anything shown on `/details` is hand-written by Sarah.

**Live form:** https://forms.gle/3fsynXeHFPaYjCmX6 — a checkbox list of candidate dates plus a few group questions.

---

## 2. LLM / Claude Operating Directives

When working on this repository, Claude MUST adhere to the following workflow before generating or modifying code:

1. **Architecture & Strategy Approval:** Prior to coding any net-new feature or data pipeline, propose a clear architecture plan. Highlight trade-offs (cost, privacy, maintenance) and wait for human confirmation.
2. **Component & Mock Presentation:** Suggest UI/UX mockups using standard CSS layout concepts and semantic HTML/Liquid components. Ensure design components are modular, reusable, mobile-first and web compatible. Adhere to the design principles in §4.0.
3. **No Unvalidated Assumptions:** If technical requirements (e.g. state management, privacy safety, theme scope) are ambiguous, explicitly state options and ask clarifying questions.
4. **Zero-Cost Constraint Enforcement:** All suggested *hosting, services, APIs and databases* must fit strictly within non-expiring free tiers. Hosting is **Netlify Free** — GitHub Pages is not a fallback, pick one and stay there. Build-time `devDependencies` are not a cost and are not covered by this rule.
5. **Question Resolution:** Every major architectural task output must conclude with a dedicated "Open Questions & Decisions" section.
6. **Theme Neutrality:** No component may hard-code a colour, radius, typeface or piece of party-specific copy. Everything themeable arrives through the tokens in §4.1 and the copy data in §4.5. A change that requires editing a template to add a theme is the wrong change.
7. **Contrast is measured, not judged.** Any new or altered palette value must be computed against §4.3's thresholds before it ships — and §3.4 makes that automatic rather than remembered.

---

## 3. System Requirements & Folder Structure

### 3.1 Tech Stack Constraints

| Concern | Decision | Why pinned |
| :--- | :--- | :--- |
| Static site generator | **Eleventy v3** (`@11ty/eleventy@^3`) | v2 and v3 differ in config format — v3 is ESM-first. An unpinned major silently invalidates §3.3. |
| Templating | **Liquid** for layouts and pages; Markdown for `/details` prose | |
| Node | **≥ 20**, via `engines` in `package.json` **and** `.nvmrc` | Netlify's default Node moves; Eleventy v3 requires ≥18. |
| Hosting | **Netlify Free**, continuous deployment on push to `main` | |
| Styling | Custom CSS (vanilla), mobile-first, no frameworks | |
| CSS build | Generated + minified by Eleventy (§3.3, §4.4) | |
| Data layer | Google Form → **private** Google Sheet. The site never reads from either. | |

**Browser support floor: Baseline 2023** — Safari 16.4+, Chrome/Edge 111+, Firefox 113+.

This is a *decision*, not a description. It is what makes "does this need a fallback?" answerable, and it is fed to the minifier as a build target (§3.3) so it is enforced rather than aspirational. Features that sit on this line and are load-bearing here: container queries (`cqw`), `color-mix()`, `inert`, `:where()`, `:focus-visible`. See §4.4 for the fallback rule that covers them.

### 3.2 Directory Hierarchy

```text
/
├── _includes/
│   ├── base.liquid           # Core layout wrapper (head, nav, footer)
│   ├── header.liquid
│   ├── footer.liquid
│   └── theme-toggle.liquid   # §4.7.3
├── _data/
│   ├── site.js               # { partyTheme, domain }  <- the one switch (§6)
│   ├── palettes.js           # ALL themes' colours. The only place colour exists (§4.4)
│   ├── themes.js             # Per-theme copy (§4.5)
│   └── nav.js                # The nav links. 11ty owns wayfinding, not the templates.
├── styles/                   # CSS source partials — NOT served directly (§4.4)
│   ├── tokens.css  base.css  layout.css
│   └── components/           # Globbed, never a single components.css
│       ├── envelope.css  toggle.css  callout.css  form-embed.css
├── public/                   # Passthrough-copied verbatim to the output
│   └── assets/
│       ├── fonts/            # Self-hosted (§4.8)
│       ├── icons/  images/
│       ├── js/
│       │   ├── envelope.js   # §5.1 — seal, doors, second-visit flag
│       │   └── theme.js      # §4.7.3 — the toggle's write path
│       └── details.ics       # §5.3
├── src/                      # Source pages
│   ├── index.liquid
│   ├── rsvp.liquid
│   ├── details.md            # Hand-written prose, not a template
│   └── assets/site.css.11ty.js   # Emits the one stylesheet (§3.3)
├── tests/                    # Validation, wired into the build (§3.4)
├── utils/
│   ├── theme-css.js          # palettes.js -> the live theme's CSS block
│   └── contrast.js           # WCAG ratio maths, shared by tests/
├── _headers                  # §7 Q3
├── netlify.toml              # §3.5
├── eleventy.config.js
└── package.json
```

**Two directories are globbed, not enumerated, and this is load-bearing** — see `AGENTS.md` §2. `styles/components/` and `public/assets/js/` are each written by several different authors; a single `components.css` or `site.js` is a file they would all have to edit at once. A globbed directory means adding a component never touches a shared file.

`public/` no longer contains stylesheets — CSS is generated, and having both a passthrough copy and a generated copy is exactly the kind of duplication §4.4 exists to prevent.

### 3.3 Eleventy Configuration Requirements

```js
// eleventy.config.js — Eleventy v3, ESM.
export default function (eleventyConfig) {
  // Without this, nothing in public/ is emitted and every page renders unstyled.
  eleventyConfig.addPassthroughCopy({ public: "assets" });

  // CSS lives outside the input dir, so Eleventy won't notice edits without this.
  eleventyConfig.addWatchTarget("./styles/");

  return {
    dir: {
      input: "src",
      // _includes sits at the repo root, not inside src/, so this must be relative.
      includes: "../_includes",
      data: "../_data",
    },
  };
}
```

**The stylesheet is a build output, not a served file.** One template emits it:

```js
// src/assets/site.css.11ty.js — ONE sheet, containing ONE palette.
import { readFileSync } from "node:fs";
import { transform } from "lightningcss";
import { liveThemeCSS } from "../../utils/theme-css.js";

const PARTIALS = ["tokens", "base", "layout"];   // then styles/components/*.css, globbed & sorted
const read = (n) => readFileSync(`styles/${n}.css`, "utf8");

export default class {
  data() {
    return { permalink: "/assets/site.css", eleventyExcludeFromCollections: true };
  }
  render({ site }) {
    // liveThemeCSS emits ONLY the selected palette + the §4.4 layer-2 switch.
    const css = [liveThemeCSS(site.partyTheme), ...PARTIALS.map(read)].join("\n");
    if (process.env.NODE_ENV !== "production") return css;   // readable in dev
    return transform({ filename: "site.css", code: Buffer.from(css), minify: true,
                       targets: /* the §3.1 floor */ }).code.toString();
  }
}
```

`lightningcss` takes the §3.1 browser floor as an input, which is why the floor is written as a decision — it becomes a machine-checked build target instead of a comment.

**Navigation is data, not markup.** `_data/nav.js` is the source; `header.liquid` loops it and derives `aria-current` by comparing `page.url`. Labels are deliberately unthemed (§4.5), so this file is global.

```js
// _data/nav.js
export default [
  { label: "RSVP",    url: "/rsvp/" },
  { label: "Details", url: "/details/" },
];
```

**Why not `@11ty/eleventy-navigation`.** Its value is hierarchy — `parent` keys, breadcrumbs, nested ordering — and this nav is two flat links. The deciding reason is §4.5: nav labels are deliberately constant across themes, and the plugin scatters each label into its own page's front matter, where nothing makes that constancy visible or checkable. One data file makes the rule enforceable by looking. The loop is hand-written either way, because `aria-current` plus the underline (§4.6.4) needs markup control the plugin's `toHtml` doesn't hand over cleanly — so the plugin would be contributing ordering and little else. Revisit if a third level of nav ever appears.

### 3.4 Validation

`tests/` runs on every build. **A failing check fails the deploy** — a validation step you have to remember to run is one that gets skipped, and both contrast failures in this project's history were found by tooling, not by looking.

```json
"scripts": {
  "start":         "NODE_ENV=development eleventy --serve",
  "test":          "node tests/contrast.js && node tests/copy.js && node tests/conformance.js",
  "build":         "npm test && NODE_ENV=production eleventy && node tests/build.js && node tests/output.js",
  "build:netlify": "npm run build"
}
```

`build:netlify` is the command configured in the Netlify UI. It exists as an alias so the deploy pipeline has a stable name even if the local build script changes shape.

Note the ordering: `test` runs the checks that can run **before** a build; `build.js` and `output.js` inspect the emitted site and therefore run after.

1. **`tests/contrast.js`** — imports `_data/palettes.js` and computes every pair in §4.3, for **every theme, in both modes**. Exits non-zero on any failure.

   **It checks all four themes even though only one ships.** Otherwise theme 02's palette fails contrast silently for months and you find out on the day you switch to it. The generator reads one palette; the checker reads all of them. Same module, two consumers.

2. **`tests/copy.js`** — asserts every theme in `_data/themes.js` defines every key in the §4.5 contract. A missing key is not an error in Liquid; it renders as empty string, so a theme ships with no footer line and nothing complains.

3. **`tests/conformance.js`** — the rules in this document that are mechanically checkable, enforced rather than remembered: no hard-coded hex outside `_data/palettes.js`; no `outline: none`; no positive `tabindex`; no `[data-party]` selector reaching the output CSS; both copies of the §4.6.2 focus rule byte-identical.

4. **`tests/build.js`** — asserts the three pages actually rendered, with expected markers present. Without it a build can "succeed" having emitted nothing, and every downstream check passes vacuously.

5. **`tests/output.js`** — asserts exactly one palette in the built `site.css`, minified in production and readable in development, fonts present and preloaded.

**Checks 3–5 exist because this project is built by several agents in parallel** (`AGENTS.md`). A rule that lives only in prose is a rule that holds until someone doesn't read that paragraph.

### 3.5 Netlify Configuration

Committed as `netlify.toml` so the deploy config is in the repo and diffable, rather than living only in a UI:

```toml
[build]
  command = "npm run build:netlify"
  publish = "_site"

[build.environment]
  NODE_ENV = "production"
  NODE_VERSION = "20"

[context.production]
  # main is the only branch that reaches the live URL.
```

Three settings are easy to get wrong and each fails differently:

- **Publish is `_site`, not `public/`.** Eleventy emits to `_site`; `public/` is the *source* passthrough folder. Publishing `public/` serves the fonts, CSS and JS with **no HTML at all** — no pages, no index.
- **Base directory stays empty** (the repo root, where `package.json` is). A non-root base makes Netlify look for `package.json` — and for this `netlify.toml` — somewhere it isn't.
- **Production branch is `main`.** `alpha` is the integration branch (`AGENTS.md` §3.0) and must never deploy to the live URL.

No environment variables beyond the two above. The site holds no secrets by design (§1), so there is nothing else to configure and nothing to leak.

### 3.6 Definition of Done

`npm run build` passing is necessary, not sufficient. See the launch checklist in §11.

---

## 4. Design System

The design system is a **fixed token contract** plus a **registry of themes** that fill it. Taskmaster is theme 01, not the design system itself.

### 4.0 Design Principles

1. **One ornament per screen.** The seal is the whole identity. It appears once per page — as the button, the callout emblem, the bullet — and never competes with itself.
2. **Themes are data, never markup.** No component knows which party it is dressed for.
3. **Display for voice, mono for instruction.** The display face carries warmth; the monospace carries anything that sounds like a rule. That split is the joke; consistency is what makes it land.
4. **Motion is a reveal, never a gate.** The one animated moment sits on top of a plain link that already works.
5. **Nothing personal reaches the page.** Enforced by architecture — the build fetches nothing — rather than by care.
6. **Boring where it's load-bearing.** The form is Google's, the host is Netlify's, the data is a sheet. Charm is spent on the frame around them.
7. **Contrast is measured, not judged.** Gold on parchment always looks better than it measures.

### 4.1 Token Contract

Every theme defines exactly these. A theme that needs a tenth token is a signal that the *component* needs changing, not the theme.

| Token | Role |
| :--- | :--- |
| `--t-bg` | Page ground |
| `--t-ink` | Body text, borders, seam rule |
| `--t-primary` | Headings, links, seal, active nav underline, anything that must read as the theme |
| `--t-accent` | **Decorative only** — rings, dot outlines, tints. Never carries text. |
| `--t-card` | Raised surfaces (callout card, form container) |
| `--t-radius` | Corner language (2px sharp → 14px soft) |
| `--t-focus` | Focus ring. Primary in light modes, accent in dark. Never inherits from accent blindly. |
| `--t-display` | Display / heading face |
| `--t-mono` | Instructional face — task numbers, labels, deadlines |

`--t-body` is global, not per-theme.

### 4.2 Theme Registry

Themes ship in order. **One is live at a time, and only that one reaches the browser** (§4.4).

| # | Theme | Primary | Accent | Light bg | Dark bg | Status |
| :-- | :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | **Taskmaster** | `#8B1E1E` / dark `#DE7A72` | `#D4A359` / dark `#E0B673` | `#FAF6F0` | `#221B1A` | Shipping |
| 02 | **Forest bathing** | `#2F5D45` / dark `#74AB8B` | `#96AE4E` / dark `#B8CE6B` | `#F2F4EE` | `#101915` | Designed |
| 03 | **Birthday** | `#C8305F` / dark `#FF6E96` | `#E8A800` / dark `#FFC93D` | `#FFF8F2` | `#17122A` | Designed |
| 04 | **Picnic in the park** | `#B8402F` / dark `#E4796C` | `#5F8F3E` / dark `#9AC46A` | `#F7F6EE` | `#15190F` | Designed |

Card surfaces: `#FFFFFF` / `#2E2624` (01), `#FBFCF8` / `#19241E` (02), `#FFFFFF` / `#221B3C` (03), `#FFFFFF` / `#1E2417` (04).
Radius: 2px (01), 3px (02), 14px (03), 6px (04).

**Typography.** Theme 01 uses `Fraunces` (display) and `Courier Prime` (mono); body is `Plus Jakarta Sans` throughout. Themes 02–04 vary the display face — 02 a softer old-style serif, 03 a rounded sans, 04 a humanist sans with no serif at all.

**Dark mode is authored per theme, never derived.** Inverting Taskmaster's parchment produces grey, not velvet.

### 4.3 Contrast Requirements

Computed, not eyeballed. Thresholds:

| Pair | Minimum |
| :--- | :--- |
| `ink` on `bg` | 4.5 |
| `primary` on `bg` | 4.5 |
| `primary` on `card` | 4.5 |
| `bg` on `primary` (seal label, buttons) | 4.5 |
| `focus` against `bg` | 3.0 (WCAG 2.2 §2.4.13) |

Two failures were caught this way and are already fixed above: Taskmaster's original dark crimson `#CE5A54` measured 4.21/3.68, and an accent-gold focus ring measured 2.12 on parchment. **The accent can never carry text on a light ground** — that is why it is decorative-only in §4.1.

### 4.4 Stylesheet Architecture (required)

**Colour exists in exactly one place: `_data/palettes.js`.** It is not in a CSS file, because a CSS file cannot be imported by the contrast checker, and a checker that re-types the hexes is a copy — the precise thing this architecture is built to prevent. Copies drift.

```js
// _data/palettes.js — the single source of colour.
export default {
  taskmaster: {
    light: { bg: "#faf6f0", ink: "#2b2625", primary: "#8b1e1e", accent: "#d4a359", card: "#ffffff" },
    dark:  { bg: "#221b1a", ink: "#f2e9de", primary: "#de7a72", accent: "#e0b673", card: "#2e2624" },
    radius: "2px",
    display: '"Fraunces", Georgia, serif',
  },
  forest: { /* … */ },
};
```

**Layer 1 — registry, generated, one theme only.** `utils/theme-css.js` emits the selected palette straight onto `:root`. Both modes side by side, which is the only way to review a theme's two modes together:

```css
/* generated from palettes.taskmaster — no other theme is in the bundle */
:root {
  --l-bg: #faf6f0;  --l-ink: #2b2625;  --l-primary: #8b1e1e;  --l-accent: #d4a359;  --l-card: #ffffff;
  --d-bg: #221b1a;  --d-ink: #f2e9de;  --d-primary: #de7a72;  --d-accent: #e0b673;  --d-card: #2e2624;
  --t-radius: 2px;
  --t-display: "Fraunces", Georgia, serif;
}
```

**There are no `[data-party]` selectors.** Earlier revisions shipped all four palettes and selected one with an attribute; that meant every visitor downloaded eight palettes to use two. Generating one removes ~75% of the colour CSS and removes the selector layer entirely. `data-party` stays on `<html>` as an **informational** marker — it tells you which party is live from view-source, and styles nothing.

**Layer 2 — switch.** Maps one palette onto the `--t-*` contract components read. **Four blocks, and this layer never grows** no matter how many themes exist:

```css
:root                     { --t-bg: var(--l-bg); /* … */  --t-focus: var(--t-primary); }
@media (prefers-color-scheme: dark) {
  :root                   { --t-bg: var(--d-bg); /* … */  --t-focus: var(--t-accent); }
}
:root[data-theme="dark"]  { --t-bg: var(--d-bg); /* … */  --t-focus: var(--t-accent); }
:root[data-theme="light"] { --t-bg: var(--l-bg); /* … */  --t-focus: var(--t-primary); }
```

**The media query stays, and is not redundant.** Resolving the mode in JavaScript and stamping `data-theme` on every load would delete this block and halve the icon selectors in §4.7.3 — it was proposed and rejected, because it makes dark mode require JavaScript, against §4.0.4. A visitor with scripts off gets their OS preference honoured, and that is worth four lines.

**Adding a theme touches `_data/palettes.js` and `_data/themes.js` only** — no CSS file changes, ever.

**Layer 3 — derived surfaces.** Components must never carry raw percentages. Name them once:

```css
--t-muted: color-mix(in srgb, var(--t-ink) 72%, var(--t-bg));  /* secondary text  */
--t-faint: color-mix(in srgb, var(--t-ink) 56%, var(--t-bg));  /* labels, captions */
--t-line:  color-mix(in srgb, var(--t-ink) 15%, transparent);  /* hairline borders */
--t-rule:  color-mix(in srgb, var(--t-ink) 40%, transparent);  /* form outlines    */
```

Thirteen ad-hoc `color-mix` values had accumulated across components, with 70%, 72% and 78% all meaning "muted text". Four tokens replaced fifteen call sites.

#### The fallback rule (applies to every modern feature, not just colour)

**Any custom property whose value uses a feature at the §3.1 support floor must be preceded by a static fallback declaration.** An unsupported unit or function makes the *whole declaration* invalid at computed-value time — the property is not "ignored", it resolves to its initial value, and everything downstream that references it collapses too.

```css
--t-line: rgba(43, 38, 37, 0.15);                              /* fallback first */
--t-line: color-mix(in srgb, var(--t-ink) 15%, transparent);

--seal-size: 6rem;                                             /* fallback first */
--seal-size: clamp(6rem, 19cqw, 7.5rem);
```

This rule was originally written about `color-mix` alone, and the gap was real: **the seal clearance in §5.1 is built entirely on `cqw`.** Without a fallback, an unsupported `cqw` invalidates `--seal-size`, which invalidates the `calc()` for `--seal-clear`, which drops `padding` to `0` — and the headline runs underneath the seal, the one outcome §5.1 forbids. The failure is not degraded styling; it is the layout the spec exists to prevent.

### 4.5 Themed Copy

Party-specific words live in `_data/themes.js`, not in templates: home eyebrow, headline, sub-headline, tagline, seal label, wordmark, page titles, callout title and body, the `/details` intro, and the footer line. Swapping to Picnic while "Comethru and play!!" stays in the footer leaves the joke stranded.

Every theme must define every key — enforced by `tests/copy.js` (§3.4), because Liquid renders a missing key as empty string and says nothing.

**Navigation labels are deliberately not themed.** "RSVP" and "Details" stay constant across all themes — wayfinding is the one thing that shouldn't change costume. They live in `_data/nav.js` (§3.3).

### 4.6 Keyboard & Accessibility Requirements

Target: **WCAG 2.2 level AA**. Everything on this site must be reachable and operable with a keyboard alone — it is three pages and one form, so there is no excuse for it not to be.

**Tab order** follows DOM order on every page: skip link → wordmark → nav → theme toggle → main content → footer. Never use positive `tabindex` values; if the visual order and DOM order disagree, fix the layout, not the tab index.

**Required on every page:**

1. **Skip link** — first focusable element, visually hidden until focused, jumping to `#main`. WCAG 2.4.1. The nav is short, but the `/rsvp` embed is a long iframe and skipping it matters.
2. **One global focus style**, not per-component rules. This exact selector list, used verbatim wherever it appears in this document:

   ```css
   :where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
     outline: 3px solid var(--t-focus);
     outline-offset: 3px;
   }
   ```

   Per-component focus styles only ever cover what someone remembered to style. `--t-focus` is contrast-checked in both modes per §4.3. **Never `outline: none`** without an equivalent replacement.
3. **Nothing invisible may be focusable.** Fading or sliding something out of view leaves it in the tab order, and a keyboard user then tabs to a control they cannot see:
   - The seal, once the envelope opens, takes `visibility: hidden` (delayed so the fade still plays) — `opacity: 0` and `pointer-events: none` are not enough on their own.
   - Anything positioned behind the closed doors takes `inert`, removed only when opened.
   - On second visit (§5.1), the seal is **removed**, not hidden.
4. **`aria-current="page"`** on the active nav link — the underline is not available to a screen reader. Derived by `header.liquid` from `page.url` (§3.3).
5. **Decorative SVG takes `aria-hidden="true"`** and the button carries the label. Icon-only controls need an `aria-label` naming the action.
6. **`scroll-margin-top`** on scroll targets wherever a sticky element could cover a focused item.

**The Google Form iframe is outside our control.** Its internal keyboard behaviour is Google's; tab order will pass into the iframe and back out. Do not attempt to manage focus inside it. Ensure the surrounding page is navigable and the iframe carries a `title` attribute.

**Motion** honours `prefers-reduced-motion` globally (§5.1), and no information is conveyed by animation alone.

### 4.7 Base Components

1. **Header (`header.liquid`)**
   - Left: the theme's wordmark, set in `--t-display` (theme 01: "TM"). Text, not a circular badge.
   - Right: the links from `_data/nav.js`, then the theme toggle.
   - Active link gains a 2px `--t-primary` underline and `aria-current="page"`. No pills, no background highlights.
   - **Hidden on Home (`/`)**; visible on all subpages.

2. **Footer (`footer.liquid`)**
   - Theme-supplied line plus link. Theme 01: `"Comethru and play!! Inspired by Taskmaster UK"` → https://www.taskmaster.tv/
   - **Also hidden on Home**, for the same reason the header is (§5.1). A footer is chrome; §4.7.3 argues the toggle can't sit on `/` because the envelope must stay uninterrupted, and that argument cannot hold while a footer sits under the envelope.

3. **Theme toggle (`theme-toggle.liquid`)** — the viewer's light/dark control, and the only theming a visitor can change.

   - **Placement:** in the header, right of the nav links. **It therefore does not appear on Home**, because the header is hidden there. That is deliberate: the envelope is one uninterrupted moment and should not carry chrome. On `/` the OS preference governs, and the choice persists once the visitor reaches any subpage.
   - **A single two-state icon button.** The **sun is the light theme, the crescent moon is the dark theme** — each glyph is bound to a state, not swapped by the click handler, so the icon can never drift out of sync with the palette.
   - **Consequence, accepted:** the page still starts in `auto` (following `prefers-color-scheme`) but once the visitor clicks, the choice is explicit and there is no route back to "follow my system" short of clearing site data. Correct for a party invite; not what you'd ship on a site people live in.
   - **Write path:** sets `data-theme` on `<html>` and writes `localStorage.theme`. The inline script in §8.2 is the read half of this contract — without the toggle it reads a key nothing ever writes.
   - **Hidden until JavaScript confirms it can work.** The inline `<head>` script adds a `js` class to `<html>`; the toggle is `display: none` without it. Unlike the seal — an anchor that functions with script off — a toggle has no no-JS fallback, and rendering a control that cannot do anything is worse than omitting it. Setting the class in the same inline script that reads the theme keeps it from flashing in.
   - **Focus:** `--t-focus`, per §4.3.
   - **The ring is decorative, the glyph is the affordance.** The 1px `--t-line` border measures ~1.3:1 and does not satisfy WCAG 1.4.11 on its own; the icon at ~13.9:1 is what identifies the control, which is what the criterion asks for. Deliberate — do not "fix" the ring by darkening it into a second competing outline.
   - **Label names the action, not the state** — `aria-label="Switch to dark theme"`, updated on toggle. A button labelled "Dark" is ambiguous about whether that describes the current mode or the next one.

   **Motion — shared with the seal.** The toggle reuses the envelope's choreography from common tokens, so the site has one motion signature rather than two:

   ```css
   --ease-envelope: cubic-bezier(0.65, 0, 0.35, 1);
   --spin-lg: 900ms;  --fade-lg: 700ms;   /* the seal   */
   --spin-sm: 400ms;  --fade-sm: 300ms;   /* the toggle */
   ```

   Same curve, same spin-360°-and-fade; the shorter pair exists because the seal's timing on a 17px glyph reads as lag rather than ceremony.

   - **Both glyphs stay in the DOM, stacked and absolutely positioned.** Neither may be `display: none` — a hidden element cannot animate out, which is the whole effect.
   - **The palette repaints on the same frame as the state change**, so the theme has already turned over while the outgoing glyph is still spinning away. The icon's exit trails the change; it never gates it.

   ```js
   // public/assets/js/theme.js — the write half
   function resolvedMode() {
     return document.documentElement.dataset.theme
       || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
   }

   toggle.addEventListener("click", function () {
     var next = resolvedMode() === "dark" ? "light" : "dark";
     document.documentElement.dataset.theme = next;   // palette flips now
     localStorage.setItem("theme", next);
     toggle.setAttribute("aria-label",
       next === "dark" ? "Switch to light theme" : "Switch to dark theme");
   });
   ```

   ```css
   /* Each glyph bound to a state — no display:none, so both can animate. */
   .mode-toggle svg {
     position: absolute; top: 50%; left: 50%; margin: -8.5px 0 0 -8.5px;
     opacity: 0; transform: rotate(360deg) scale(0.85);
     transition: transform var(--spin-sm) var(--ease-envelope),
                 opacity var(--fade-sm) ease;
   }
   :root:not([data-theme="dark"]) .icon-sun,
   :root[data-theme="light"] .icon-sun,
   :root[data-theme="dark"] .icon-moon { opacity: 1; transform: rotate(0deg) scale(1); }

   @media (prefers-color-scheme: dark) {
     :root:not([data-theme]) .icon-sun  { opacity: 0; transform: rotate(360deg) scale(0.85); }
     :root:not([data-theme]) .icon-moon { opacity: 1; transform: rotate(0deg) scale(1); }
   }
   ```

   **The two theming axes never meet in the UI.** The viewer gets light/dark and nothing else. The party palette is Sarah's, set before the build in `_data/site.js`, and is not switchable at runtime by anyone (§6).

4. **Reusable elements**
   - **Wordmark:** text in the display face, per theme.
   - **Themed bullets:** `--t-primary` core with an `--t-accent` ring, drawn with `::before` — `::marker` cannot take a `box-shadow`, which is what makes the ring.
   - **Callout card:** `--t-card` note, soft shadow, seal emblem straddling the top edge.

### 4.8 Typography Loading

The three faces *are* the identity, and a silent fallback to Georgia and system-ui makes the site look like nothing while rendering "correctly". This must be specified, not assumed.

- **Self-hosted**, `woff2`, in `public/assets/fonts/`. Not Google Fonts: a third-party render-blocking request sits badly against §1's privacy position and §4.0.6, and it is the only external dependency the page would otherwise have.
- **Sourced as npm packages, not downloaded.**

  ```
  @fontsource/fraunces   @fontsource/plus-jakarta-sans   @fontsource/courier-prime
  ```

  The build copies the `woff2` files into `public/assets/fonts/`. Fetching from Google's CDN instead means guessing `gstatic` URLs behind a User-Agent-sensitive API — fragile, and it grants network access for a one-off task. Packages are version-pinned in the lockfile and produce the same self-hosted result.

- **Ship the full face, unsubsetted, for now.** Roughly 3× the bytes of a Latin subset. Subsetting needs `pyftsubset`/`glyphhanger`, which is a human step, so it is deferred rather than faked — revisit before launch (§11). Getting the faces *loading* is what matters; getting them small is an optimisation with a known method.
- **`font-display: swap`** on every `@font-face` — a flash of fallback text beats invisible text on a page whose first paint is the whole point.
- **Preload the display face only** (`<link rel="preload" as="font" crossorigin>`). It sets the headline; body and mono can swap in.
- The `@font-face` block lives in `styles/tokens.css` and is therefore part of the single generated sheet.

---

## 5. Detailed Page Specifications & User Flows

```
               [ Home Page ('/') ]
                        │
             (Click 'RSVP' Seal)
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
    [ RSVP Page ('/rsvp') ]   [ Details Page ('/details') ]
    - Embedded Google Form    - Hand-written details
    - Direct-link fallback    - Calendar file
    - Edit-link expectations  - Expectation setting
```

### 5.1 Home Page (`/`)

- **Route:** `/`
- **Chrome:** none. No header, **no footer** (§4.7.2). The envelope is the entire page.
- **Height:** `min-height: 100dvh`, seam centred on the viewport. `dvh`, not `vh` — mobile browser chrome otherwise pushes the seam off-centre as the address bar collapses.
- **Layout:** Split vertically in half. Two horizontal rules extend left and right from a centred circular seal button, forming the seam.
  - **Top half:** the theme's eyebrow (01: _"Task #1"_) and headline (01: _"Hang out with Sarah and friends"_).
  - **Bottom half:** the theme's sub-headline (01: _"Come through and have fun!"_) and tagline (01: _"Sarah edition"_).
- **Copy meets the fold.** Each half's text runs to the seam and stops one `--seal-gap` short of the seal. It is **not** centred in its half — centring strands the copy in the middle of the page and reads as an unrelated block floating above an unrelated button.

- **Seal clearance (required).** The seal and its gap both scale with container width, so the spacing looks identical at every size rather than tight on a phone and lost on a desktop. **Static fallbacks first, per §4.4** — without them the clearance collapses to zero and text runs under the seal:

  ```css
  .envelope {
    container-type: inline-size;
    --seal-size: 6rem;                         /* fallback: the floor */
    --seal-size: clamp(6rem, 19cqw, 7.5rem);   /*  96px → 120px */
    --seal-gap: 1rem;                          /* fallback: the floor */
    --seal-gap: clamp(1rem, 4cqw, 1.75rem);    /*  16px →  28px */
    --seal-clear: calc(var(--seal-size) / 2 + var(--seal-gap));
  }
  .envelope__half--top    { align-items: flex-end;   padding-bottom: var(--seal-clear); }
  .envelope__half--bottom { align-items: flex-start; padding-top:    var(--seal-clear); }
  ```

  **Size and gap are deliberately not one formula.** The gap is a spacing relationship, so it scales. The seal is an ornament with a fixed identity, so it has a **floor of 96px and only ever grows** — it must never shrink on a phone, which is the screen where it has the least competition and the most work to do. An earlier revision coupled them and the seal fell to 64px at phone width (19% of the seam, down from 29%); it cleared every touch-target guideline and still read as a demoted button. Touch-target minimums are not the binding constraint here — hierarchy is.

  Clearance is **derived** — `seal ÷ 2 + gap` — never a hand-tuned number, so it still holds when a theme's headline wraps to three lines. **No text may pass under the seal at any width.** Use `cqw`, not `vw`: the rule then holds inside any container it's placed in.

- **The seal is an `<a href="/rsvp/">`.** Not a button, not a div.
  - **Interaction:** JavaScript intercepts the click, spins the seal 360° while fading it out, and slides the top half up and the bottom half down. At ~900ms it calls `location.assign("/rsvp/")`.
  - **The spin plays on opening only.** Any reset must clear the state with transitions suppressed for a frame; letting it transition back counter-spins the seal, which makes the rotation mean "closing" as often as "opening".
  - **With JavaScript off or broken, the seal is still a working link.** The animation is an enhancement and must never be the only route to `/rsvp/`.
  - `prefers-reduced-motion: reduce` collapses the transitions; navigation still happens.

- **Second visit — open the envelope on arrival.** On first open, set `sessionStorage.envelopeOpened = "1"`. On any later load in the same session, render `/` with the doors already parted and the seal absent, so a friend who has already RSVP'd isn't made to click through the flourish again to reach anything.
  - **Read it in the inline `<head>` script, not the deferred bundle** (§8.2). Read late, the page paints closed and then snaps open after parse — a visible pop on the one page that exists to feel composed. It is the same class of flash as the theme read, and it gets the same fix.
  - **Session, not local:** the charm should return on a fresh visit days later. `localStorage` would retire the animation permanently after one use.
  - The seal must be **removed from the flow, not just faded** — an invisible element left in place is still focusable and still announced by a screen reader.
  - This is progressive enhancement in the same direction as the seal: with JS off the flag is never set, and the visitor simply gets the normal envelope, which works.

### 5.2 RSVP Page (`/rsvp`)

- **Route:** `/rsvp/`
- **Content:**
  - Embedded Google Form (https://forms.gle/3fsynXeHFPaYjCmX6) in a responsive container: `width: 100%; max-width: 640px`, iframe at `width: 100%`, `height: 1400px`, `title="RSVP form"`. Google's iframe does not auto-size to its content.
  - **The height is a measurement with a shelf life.** It must be re-checked whenever the form gains or loses a question — too short and the submit button ends up behind a nested scrollbar on mobile, which breaks the only conversion on the site. Listed in §11.
  - **A direct link to the form sits below the embed, always visible**, not only as an error state:

    ```html
    <p class="form-fallback">Form not loading?
      <a href="https://forms.gle/3fsynXeHFPaYjCmX6">Open it directly</a>.</p>
    ```

    Content blockers, strict privacy modes and Google outages all render the iframe as a blank box with no route forward, and the page cannot detect any of them. One always-visible link covers every case and costs nothing.
  - Questions are Google's and **cannot be restyled** — only the frame around them is ours. The page must carry enough of its own copy that the embed doesn't read as a naked iframe.
  - Primary questions: a **checkbox list of candidate dates** (Forms has no Doodle-style date poll — the dates must be chosen before the form is built), plus group/fun questions.
  - **Editability:** Google emails a unique per-response edit link on submission; it cannot be printed on the page. Set that expectation in a callout rather than promising a link that can't exist.

### 5.3 Details Page (`/details`)

- **Route:** `/details/`
- **Source: `src/details.md`** — Markdown with front matter, `layout: base.liquid`. This page is hand-written prose that changes more often than anything else on the site, and prose belongs in Markdown, not a template. Themed chrome comes from the layout; the words come from the file.
- **Content is static and hand-written.** No stats, no aggregation, no dynamic friend breakdown, no Apps Script. The build fetches nothing.
  - Expectation-setting callout carrying the deadline — the one thing on the page anyone must act on.
  - Themed bullet list of details (when / where / bring / wear / plus-ones).
  - Optionally one photo, at a fixed `aspect-ratio` so it reserves its space and nothing below it jumps.

- **Date format is fixed:** `Saturday, Sep 12 · 2pm PT`. The year is implied and omitted.

  **"PT", not "PST".** September falls inside daylight saving, so Pacific time is technically PDT; "PST" in September is an hour wrong to anyone reading it literally. "PT" is correct year-round and is what people actually say.

- **Calendar file.** `/assets/details.ics`, hand-written alongside the copy, linked as "Add to calendar", plus a Google Calendar template link for people who won't download a file. A static `.ics` is a text file — no service, no cost, no build step — and it is the single highest-value thing an event page can offer.

  The `.ics` carries the same date as the page. It is a second copy, so it is on the §11 checklist.

  **Exact contents.** RFC 5545, minimal — no `RRULE`, no `ATTENDEE`, no `VALARM`. Someone else's calendar is not the place to be clever:

  ```text
  BEGIN:VCALENDAR
  VERSION:2.0
  PRODID:-//A Shindig Thingamajig//EN
  CALSCALE:GREGORIAN
  BEGIN:VEVENT
  UID:shindig-2026-09-05@shindig-thingamajig.netlify.app
  DTSTAMP:20260816T000000Z
  DTSTART:20260905T210000Z
  DTEND:20260906T010000Z
  SUMMARY:A Shindig Thingamajig
  DESCRIPTION:Hang out with Sarah and friends. Details: https://shindig-thingamajig.netlify.app/details/
  LOCATION:TBC — address in the group chat
  URL:https://shindig-thingamajig.netlify.app/details/
  END:VEVENT
  END:VCALENDAR
  ```

  Four things that are easy to get wrong, in the order they will bite:

  1. **Times are UTC with a trailing `Z`, converted by hand.** `2pm PT` on Sep 5 2026 is inside daylight saving, so Pacific is UTC−7 and 2pm becomes `210000Z`. This is the PST/PDT trap from §5.3's date format, wearing a different hat — get it wrong and the invite lands in everyone's calendar an hour out. **Using UTC deliberately avoids needing a `VTIMEZONE` block**, which is the other way to do this and requires far more to be correct.
  2. **`DTEND` is required.** Omit it and clients guess — some assume 30 minutes, some assume all day. Four hours is the assumed default here; change it with the date.
  3. **Line endings must be CRLF.** RFC 5545 requires it and some clients reject LF-only files outright. A file that opens fine on a Mac and fails silently on Outlook is exactly the bug nobody finds before the party.
  4. **`UID` must change if the event moves.** Reusing a `UID` makes calendars treat the new file as an *update* to the old event, which is right for a reschedule and wrong for a different party.

  Served as `text/calendar` — Netlify infers this from the extension; if a client ever downloads it as `.txt`, add the type to `_headers`.

- **"Last updated" line**, hand-set, at the foot of the content. The site deliberately cannot know whether it agrees with the Google Form (§6), so the honest move is to tell a reader how old what they're looking at is, and let them judge. Cheap, and it is the only defence against silently stale details.

- **The RSVP deadline is not enforced by anything.** Google Forms can auto-close on a schedule only via Apps Script, which §5.3 rules out. **Sarah closes the form by hand** on the deadline — a manual step, written down here because an unwritten manual step is one that doesn't happen. §11.

---

## 6. Architecture

```
Google Form  →  private Google Sheet  →  Sarah reads it herself
                                          │
                                          ▼
                        hand-written copy in src/ and _data/
                                          │
push to GitHub  →  Netlify build (11ty)  →  static site
```

No API keys, no build-time fetch, no client-side fetch, no serverless functions. The only dynamic thing on the site is the CSS, and it is dynamic at build time only.

**Theme switching is one value, edited once, before the build:**

```js
// _data/site.js
export default {
  partyTheme: "taskmaster",                // <- the whole switch
  domain: "shindig-thingamajig.netlify.app", // absolute OG URLs break without it (§8.2)
};
```

Change `partyTheme`, push, and the site becomes the next party: Eleventy regenerates the stylesheet with **only that palette in it** (§4.4), and `_data/themes.js` supplies the matching copy. No stylesheet is edited by hand, no JavaScript is involved, there is no flash of the wrong palette, and the live site cannot disagree with the party it is advertising.

```liquid
<!-- _includes/base.liquid — informational only; nothing is styled by it -->
<html lang="en" data-party="{{ site.partyTheme }}">
```

**Light/dark is the only theming the viewer touches**, and it is a separate axis that never meets the first one in the UI: a tiny inline script in `<head>`, before the stylesheet, reads `localStorage` and sets `data-theme`. It must stay inline and first, or dark-mode visitors get a parchment flash.

**The site knows nothing about the Google Form, by design.** The form is authored in Google's UI and lives entirely there; `/rsvp` embeds a URL and that is the whole of the relationship. `/details` is hand-written by Sarah and is **not** derived from the form, does not mirror its questions, and has nothing to reconcile against it. No file in this repo tracks the form's contents (§7 Q6).

---

## 7. Resolutions

### Q1: Home page wording

**Chosen:** _"Task #1: Hang out with Sarah and friends. Come through and have fun!"_ — split across the seam as described in §5.1, with "Sarah edition" as the tagline. This copy is theme 01's; it lives in `_data/themes.js`.

### Q2: Font & colour

Theme 01: `Fraunces` headings, `Plus Jakarta Sans` body, `Courier Prime` accents, self-hosted per §4.8. Parchment `#FAF6F0`, crimson `#8B1E1E`, charcoal `#2B2625`, brass `#D4A359`. Dark mode per §4.2.

### Q3: Access control

No auth, no password gate — it adds friction for friends without adding real security. **Decided:** URL obscurity **plus** all three of the following, since Netlify sites are indexable by default and the subdomain pattern is guessable, so obscurity alone is not obscurity.

1. `public/robots.txt`, copied to the site root by the passthrough in §3.3:

   ```text
   User-agent: *
   Disallow: /
   ```

2. `<meta name="robots" content="noindex, nofollow">` in `base.liquid` (already in §8.2).

3. `_headers` at the repo root:

   ```text
   /*
     Referrer-Policy: no-referrer
     X-Content-Type-Options: nosniff
   ```

`robots.txt` asks crawlers not to *fetch*; the meta tag asks them not to *index* a page they fetched anyway — including one reached from a link rather than a crawl.

**`Referrer-Policy` closes a real hole in this specific model.** The secret here *is* the origin — the Netlify subdomain. Browsers send the origin on cross-origin navigations by default, so a friend clicking the footer link hands `taskmaster.tv` the address of the party site. Every outbound link leaks the one thing §7 Q3 is protecting. `no-referrer` stops it.

**No CSP.** The Google Forms iframe would need `frame-src`, `script-src` and `style-src` allowances that Google changes without notice, turning a party invite into a maintenance burden the first time the form breaks silently. Deliberate omission, not an oversight.

**The live address is `https://shindig-thingamajig.netlify.app`.** Worth being straight about what that name is doing: it is memorable and sayable, which is what you want for an address read aloud to friends — it is not obscure. It is the project's own name, so anyone who knows the project can guess it. That is a fine trade, but it means the three measures above are carrying the whole load, not backing up a secret URL.

None of this is enforcement; a URL shared into a group chat is public to that chat. Say the address out loud rather than posting it anywhere indexable.

### Q4: Database, editability, security

- **Custom DB?** No. The private Sheet is the database.
- **Can friends edit responses?** Yes — Google Forms' native "allow responders to edit after submit", which emails a unique link.
- **Security:** no keys are exposed because no keys exist. The Sheet stays private and no aggregate of it is ever published. If the form collects email addresses, that data never leaves the Sheet.

### Q5: One live party, no archive

**Decided.** Past parties come down. This is what makes a single build-time theme switch the right shape — no per-event routes, no stale RSVP forms live on the internet.

### Q6: Is the Google Form's shape tracked in the repo?

**No, and deliberately.** It was proposed that `_data/form.js` hold the candidate dates so `/details` could render from the same source. Rejected on two counts. The form is authored in Google's UI, so a repo file cannot be its source of truth — it would be a second copy that drifts too, with more ceremony. And the premise was wrong: `/details` announces the **one** date Sarah picks after reading the Sheet; it never lists the candidates. There is no shared data between the two pages to factor out. See §6.

---

## 8. Reference Implementation Notes

### 8.1 Home layout

```text
+-------------------------------------------------------------+
|                                                             |
|                                                             |
|                        Task #1                              |
|          Hang out with Sarah and friends                    |   ← one --seal-gap
|   ===================== ( RSVP ) =====================      |   ← seam
|              Come through and have fun!                     |   ← one --seal-gap
|                     Sarah edition                           |
|                                                             |
|                                                             |
+-------------------------------------------------------------+
   no header, no footer — min-height: 100dvh, seam centred
```

### 8.2 `_includes/base.liquid`

```html
<!doctype html>
<html lang="en" data-party="{{ site.partyTheme }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>{{ title | default: "A Shindig Thingamajig" }}</title>
    <meta name="author" content="Sarah Chen">
    <meta name="description" content="Organise and host a hangout with friends">
    <meta name="robots" content="noindex, nofollow">

    <meta property="og:title" content="A Shindig Thingamajig">
    <meta property="og:description" content="Organise and host a hangout with friends">
    <!-- OG URLs must be absolute or link previews break. site.domain is defined
         in _data/site.js — without it these render as https:/// and fail silently. -->
    <meta property="og:image" content="https://{{ site.domain }}/assets/images/seal.png">
    <meta property="og:image:alt" content="A Shindig Thingamajig wax seal">
    <meta property="og:url" content="https://{{ site.domain }}{{ page.url }}">
    <meta property="og:site_name" content="A Shindig Thingamajig">

    <!-- Inline and before the stylesheet, or dark-mode users see a parchment flash.
         Three jobs, all of which must happen before first paint:
           1. the js class, which gates the theme toggle (§4.7.3)
           2. the viewer's light/dark choice (§4.7.3)
           3. the second-visit envelope flag (§5.1) — read here, not in the
              deferred bundle, or / paints closed and then snaps open. -->
    <script>
      var d = document.documentElement;
      d.classList.add("js");
      var t = localStorage.getItem("theme");
      if (t) d.dataset.theme = t;
      if (sessionStorage.getItem("envelopeOpened")) d.classList.add("envelope-open");
    </script>

    <!-- One sheet, generated, containing one palette (§3.3, §4.4). -->
    <link rel="stylesheet" href="/assets/site.css">
    <link rel="preload" as="font" type="font/woff2" crossorigin
          href="/assets/fonts/fraunces-subset.woff2">

    <link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg">
    <!-- Split per feature (§3.2) so two authors never share one file. -->
    <script src="/assets/js/envelope.js" defer></script>
    <script src="/assets/js/theme.js" defer></script>
  </head>
  <body>
    {% unless page.url == "/" %}
      {% include "header.liquid" %}
    {% endunless %}

    <a class="skip-link" href="#main">Skip to content</a>
    <main id="main" class="main-content" tabindex="-1">{{ content }}</main>

    {% unless page.url == "/" %}
      {% include "footer.liquid" %}
    {% endunless %}
  </body>
</html>
```

### 8.3 Token and theme CSS

Structure per §4.4 — generated registry, then switch, then derived surfaces.

```css
/* ── layer 1 · GENERATED by utils/theme-css.js from _data/palettes.js.
      Only the live theme is here. Do not hand-edit; edit palettes.js. ── */
:root {
  --l-bg: #faf6f0;  --l-ink: #2b2625;  --l-primary: #8b1e1e;  --l-accent: #d4a359;  --l-card: #ffffff;
  --d-bg: #221b1a;  --d-ink: #f2e9de;  --d-primary: #de7a72;  --d-accent: #e0b673;  --d-card: #2e2624;
  --t-radius: 2px;
  --t-display: "Fraunces", Georgia, serif;
}

/* ── layer 2 · switch. Four blocks, forever, regardless of theme count. ── */
:root {
  --t-bg: var(--l-bg);  --t-ink: var(--l-ink);  --t-primary: var(--l-primary);
  --t-accent: var(--l-accent);  --t-card: var(--l-card);
  --t-focus: var(--t-primary);
}
@media (prefers-color-scheme: dark) {
  :root {
    --t-bg: var(--d-bg);  --t-ink: var(--d-ink);  --t-primary: var(--d-primary);
    --t-accent: var(--d-accent);  --t-card: var(--d-card);
    --t-focus: var(--t-accent);
  }
}
/* The viewer's explicit choice must win over the media query, both ways. */
:root[data-theme="dark"]  { /* the --d-* set, as above */ }
:root[data-theme="light"] { /* the --l-* set, as above */ }

/* ── layer 3 · derived surfaces. Static fallback first, per §4.4: without it a
      browser lacking color-mix drops the declaration and loses the border. ── */
:root {
  --t-line: rgba(43, 38, 37, 0.15);
  --t-line: color-mix(in srgb, var(--t-ink) 15%, transparent);
}

/* styles/tokens.css — global, not per theme */
:root {
  --t-mono: "Courier Prime", "Courier New", monospace;
  --t-body: "Plus Jakarta Sans", system-ui, sans-serif;
}

@font-face {
  font-family: "Fraunces";
  src: url("/assets/fonts/fraunces-subset.woff2") format("woff2");
  font-display: swap;     /* §4.8 — flash of fallback beats invisible text */
  font-weight: 400 900;
}

body {
  margin: 0;
  background: var(--t-bg);
  color: var(--t-ink);
  font-family: var(--t-body);
}

/* Wordmark — text, in the theme's display face. */
.wordmark {
  font-family: var(--t-display);
  font-weight: 800;
  font-size: 1.4rem;
  letter-spacing: 0.06em;
  color: var(--t-primary);
  text-decoration: none;
}

.nav-items a {
  color: var(--t-ink);
  text-decoration: none;
  font-weight: 600;
  padding-bottom: 3px;
  border-bottom: 2px solid transparent;
}
.nav-items a[aria-current="page"] { border-bottom-color: var(--t-primary); }

/* The global focus rule — §4.6.2. This selector list, verbatim. */
:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: 3px solid var(--t-focus);
  outline-offset: 3px;
}
```

---

## 9. Next Steps for Implementation

1. **Scaffold** §3.2 with the Eleventy v3 config in §3.3, Node pinned per §3.1, and the `package.json` scripts in §3.4.
2. **Build the colour pipeline** — `_data/palettes.js`, `utils/theme-css.js`, `src/assets/site.css.11ty.js`, and `tests/contrast.js` reading the same module. Get a failing palette to fail the build before writing any components.
3. **Build the token layer** — `styles/tokens.css` with the §4.8 `@font-face` blocks and self-hosted subsets.
4. **Build `base.liquid`** per §8.2, plus `_data/nav.js` and `header.liquid` with derived `aria-current`.
5. **Build the envelope** on `/` per §5.1: anchor-first, `cqw` fallbacks, seal clearance, reduced-motion, second-visit flag read inline.
6. **Build the theme toggle** per §4.7.3 — it is the write half of the inline script in §8.2.
7. **Embed the form** on `/rsvp` with the fallback link and measured height (§5.2).
8. **Write `src/details.md`** by hand, plus `public/assets/details.ics` (§5.3).
9. **Ship `robots.txt`, `_headers`, and confirm the `noindex` meta** per §7 Q3.
10. **Walk §11** before sharing the URL with anyone.

---

## 10. Open Questions & Decisions

- **Real date, venue, and photo** — hand-written into `src/details.md` once dates are finalised, along with `details.ics` carrying the same date. Format is fixed at `Saturday, Sep 12 · 2pm PT` (§5.3). _Needs Sarah._
- **Wordmark per theme** — theme 01 is "TM". 02–04 need their own. _Needs Sarah._
- ~~**Netlify site name**~~ — **resolved:** `shindig-thingamajig.netlify.app`. Set as `site.domain` in `_data/site.js` (§6); the OG tags in §8.2 now resolve.
- **Theme toggle on Home** — specified as absent from `/`, since `/` now carries no chrome at all (§4.7.2). _Decided as absent; revisit if it bothers you._

**Settled:** static `/details`, written as Markdown · one live party, no archive · anchor-first seal · seal floor 96px · second-visit `sessionStorage` flag, read inline (§5.1) · `robots.txt` + `noindex` + `_headers` (§7 Q3) · **two-state** light/dark toggle for the viewer, party palette chosen by Sarah pre-build (§4.7.3, §6) · one generated stylesheet carrying one palette (§4.4) · no CSP (§7 Q3) · no repo-side copy of the form's questions (§7 Q6).

---

## 11. Launch Checklist

`npm run build` passing means the code is consistent with itself. It cannot tell whether the site is *true* — that is what this list is for. Walk it before sharing the URL, and again after any change to the Google Form.

**Correctness — the things nothing can check automatically**

- [ ] `public/assets/details.ics` carries the date written in `src/details.md`, including the time.
- [ ] **Add the `.ics` to a real calendar and read the time back.** The UTC conversion is by hand (§5.3); an hour's error is invisible in the file and obvious to every guest.
- [ ] "Last updated" line on `/details` reflects today.
- [ ] Venue, what to bring, plus-one policy are all filled in — no placeholder text.
- [ ] `site.domain` is `shindig-thingamajig.netlify.app` and the OG preview resolves — paste the URL into a chat and confirm the seal image and title appear, not a bare link.

**The form**

- [ ] Iframe height still fits the form with no nested scrollbar, checked on a phone.
- [ ] The submit button is reachable without scrolling inside the iframe.
- [ ] "Allow responders to edit after submit" is on (§7 Q4).
- [ ] The fallback link opens the form directly (§5.2).
- [ ] A test response lands in the private Sheet, and the Sheet is still private.

**Build and access**

- [ ] `npm run build` passes, including `tests/contrast.js` across all four themes.
- [ ] Only the live theme's palette appears in the built `/assets/site.css`.
- [ ] `robots.txt`, `noindex` meta and `_headers` are all live on the deployed site.
- [ ] Netlify publishes `_site` from an empty base directory, production branch `main` (§3.5).
- [ ] **Fonts subsetted to Latin** — deferred during the build (§4.8) and worth doing before the link goes out.

**Behaviour**

- [ ] Fonts load — the headline is Fraunces, not Georgia.
- [ ] With JavaScript disabled: the seal still navigates, the toggle is absent, the page is readable.
- [ ] Tab through every page: skip link first, focus always visible, nothing invisible receives focus.
- [ ] With `prefers-reduced-motion`, the seal still navigates.
- [ ] Second visit in the same session opens the envelope with no visible snap.

**After the party is scheduled**

- [ ] Close the Google Form by hand on the deadline (§5.3 — nothing does this for you).
