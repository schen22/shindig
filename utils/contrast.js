// utils/contrast.js — WCAG 2.x relative-luminance maths, shared by tests/ (PRD §3.2, §4.3).
//
// This module holds the ARITHMETIC only. The §4.3 pair table and its thresholds
// live in tests/contrast.js, because they are the requirement; and the light/dark
// token resolution (which palette key becomes --t-focus in which mode) lives in
// utils/theme-css.js, because that is layer 2's job. Both are imported by the
// checker rather than restated here — a second copy of either is exactly the
// drift §4.4 exists to prevent.
//
// No colour value appears in this file. Ever.

/**
 * Parse a `#rgb` / `#rrggbb` hex string into 8-bit channels.
 * Throws rather than returning a default: a palette typo must fail the build
 * (§3.4), not silently measure as black.
 */
export function parseHex(hex) {
  if (typeof hex !== "string") {
    throw new TypeError(`expected a hex colour string, got ${typeof hex}: ${JSON.stringify(hex)}`);
  }
  const raw = hex.trim().replace(/^#/, "");
  if (!/^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
    throw new Error(`not a #rgb or #rrggbb colour: ${JSON.stringify(hex)}`);
  }
  const full = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

/** Expand any accepted hex form to lowercase `#rrggbb`. Used by tests/output.js. */
export function normaliseHex(hex) {
  const [r, g, b] = parseHex(hex);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

/** sRGB channel → linear light. WCAG 2.1 relative-luminance definition. */
function linearise(channel8bit) {
  const c = channel8bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of a hex colour, 0 (black) → 1 (white). */
export function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map(linearise);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two hex colours, 1 → 21.
 *
 * The ratio is symmetric: `contrastRatio(a, b) === contrastRatio(b, a)`. §4.3
 * lists "primary on bg" and "bg on primary" as separate rows because they are
 * separate design intents (heading text vs the seal label), not because they
 * measure differently. tests/contrast.js keeps both rows so a future threshold
 * change to one cannot silently move the other.
 */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Round the way a report should: down, so 4.4999 never prints as "4.50". */
export function floorTo(ratio, places = 2) {
  const f = 10 ** places;
  return Math.floor(ratio * f) / f;
}
