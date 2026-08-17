// utils/theme.js — _data/palettes.js → the live theme's CSS (PRD §4.4, §8.3).
//
// Layer 1 (registry, one palette, both modes) and layer 2 (the four-block --t-*
// switch). Layer 3 — derived surfaces --t-muted/--t-faint/--t-line/--t-rule — is
// NOT here: it is hand-written in styles/tokens.css (Wave 1b). This output is
// concatenated first so layer 3 can reference these tokens.
//
// Why this is generated at all, since it looks like something CSS could do:
//   · Only ONE palette may reach the browser and there are no [data-party]
//     selectors (§4.4). Selecting a palette at build time is the requirement; CSS
//     cannot import _data/palettes.js, so layer 1 has to be generated.
//   · tests/contrast.js imports the SAME module. A checker that re-types the
//     hexes is a copy, and copies drift (§4.4).
//   · light-dark() cannot replace layer 2. It is Baseline 2024 (Chrome 123,
//     Safari 17.5, Firefox 120), below §3.1's Baseline 2023 floor — and a browser
//     at the floor does not degrade, it drops the whole declaration and every
//     var() downstream collapses with it. It also keys off color-scheme, while the
//     viewer's choice is data-theme (§4.7.3). Rejected on review; these four
//     blocks are the mechanism, not a fallback beneath a newer one.

import palettes from "../_data/palettes.js";
import { parseHex } from "./contrast.js";

/** Per-mode colour keys every palette must define, in emission order. */
export const COLOUR_KEYS = ["bg", "ink", "primary", "accent", "card", "waxLit", "waxDark"];

/** The two authored modes — dark is authored, never derived (§4.2). */
export const MODES = ["light", "dark"];

/** camelCase palette key → kebab-case custom-property suffix. */
const cssName = (key) => key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

/**
 * Layer 2's only judgement, in one place: --t-focus is primary in light and
 * accent in dark (§4.1), never inherited from accent blindly. Not a palette key,
 * because it is a function of the mode rather than a free choice — and keeping it
 * here means tests/contrast.js measures the ring the stylesheet actually ships.
 */
export const focusKeyFor = (mode) => (mode === "dark" ? "accent" : "primary");

/** One palette + mode → the --t-* colour set, focus included. Shared with tests/. */
export function resolveTokens(palette, mode) {
  if (!MODES.includes(mode)) throw new Error(`unknown mode: ${JSON.stringify(mode)}`);
  const src = palette[mode];
  const out = Object.fromEntries(COLOUR_KEYS.map((k) => [k, src[k]]));
  out.focus = src[focusKeyFor(mode)];
  return out;
}

/**
 * Validate one palette's shape, throwing on anything that would otherwise ship as
 * a silent visual bug — a missing key generates `--l-bg: undefined`, which the
 * browser drops, taking every downstream var() with it.
 *
 * Exported so tests/contrast.js can check all four themes; the generator only
 * ever sees the live one (§3.4).
 */
export function assertPalette(name, palette) {
  const at = `_data/palettes.js → ${name}`;
  if (!palette || typeof palette !== "object") throw new Error(`${at}: not an object`);

  for (const mode of MODES) {
    const src = palette[mode];
    if (!src || typeof src !== "object") throw new Error(`${at}.${mode}: missing mode block`);

    const missing = COLOUR_KEYS.filter((k) => !(k in src));
    if (missing.length) throw new Error(`${at}.${mode}: missing ${missing.join(", ")}`);

    const extra = Object.keys(src).filter((k) => !COLOUR_KEYS.includes(k));
    if (extra.length) {
      throw new Error(
        `${at}.${mode}: unexpected key(s) ${extra.join(", ")}. The §4.1 token contract ` +
          `is fixed — a theme needing another token means the component needs changing.`
      );
    }

    for (const key of COLOUR_KEYS) {
      try {
        parseHex(src[key]);
      } catch (err) {
        throw new Error(`${at}.${mode}.${key}: ${err.message}`);
      }
    }
  }

  if (!/^\d+(?:\.\d+)?(?:px|rem)$/.test(String(palette.radius ?? ""))) {
    throw new Error(`${at}.radius: expected a px/rem length, got ${JSON.stringify(palette.radius)}`);
  }
  if (typeof palette.display !== "string" || !palette.display.trim() || /[{};]/.test(palette.display)) {
    throw new Error(`${at}.display: expected a font stack with no CSS syntax in it`);
  }
  return palette;
}

/** `--l-bg: #faf6f0;  --l-ink: …` — one registry line per mode. */
const registry = (prefix, mode, palette) =>
  COLOUR_KEYS.map((k) => `--${prefix}-${cssName(k)}: ${palette[mode][k]};`).join("  ");

/** One layer-2 block body: every --t-* mapped to that mode's registry half. */
const mapping = (mode, indent) =>
  [...COLOUR_KEYS.map((k) => `--t-${cssName(k)}: var(--${mode === "dark" ? "d" : "l"}-${cssName(k)});`),
   `--t-focus: var(--t-${focusKeyFor(mode)});`]
    .map((decl) => indent + decl)
    .join("\n");

/**
 * The live theme's CSS. `themeKey` is site.partyTheme (_data/site.js, §6) — the
 * whole build-time switch.
 */
export function liveThemeCSS(themeKey) {
  if (typeof themeKey !== "string" || !themeKey) {
    throw new Error(`site.partyTheme is not set in _data/site.js — got ${JSON.stringify(themeKey)}`);
  }
  const palette = palettes[themeKey];
  if (!palette) {
    throw new Error(
      `site.partyTheme is "${themeKey}", which is not in _data/palettes.js. ` +
        `Known themes: ${Object.keys(palettes).join(", ")}`
    );
  }
  assertPalette(themeKey, palette);

  return `/* layer 1 · GENERATED from _data/palettes.js by utils/theme.js.
   Theme "${themeKey}" only — no other palette is in this bundle (§4.4).
   Do not hand-edit; edit _data/palettes.js. */
:root {
  ${registry("l", "light", palette)}
  ${registry("d", "dark", palette)}
  --t-radius: ${palette.radius};
  --t-display: ${palette.display};
}

/* layer 2 · switch. Four blocks, forever, however many themes the registry has. */
:root {
${mapping("light", "  ")}
}
/* Not redundant: resolving the mode in JS would delete this block and make dark
   mode require scripts, against §4.0.4. */
@media (prefers-color-scheme: dark) {
  :root {
${mapping("dark", "    ")}
  }
}
/* The viewer's explicit choice wins over the media query, both ways (§4.7.3). */
:root[data-theme="dark"] {
${mapping("dark", "  ")}
}
:root[data-theme="light"] {
${mapping("light", "  ")}
}
`;
}
