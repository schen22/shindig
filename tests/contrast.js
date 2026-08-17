// tests/contrast.js — every §4.3 pair, ALL FOUR THEMES, both modes (PRD §3.4.1).
//
// Runs on every build. A failing check fails the deploy: a validation step you
// have to remember to run is one that gets skipped, and both contrast failures in
// this project's history were found by tooling, not by looking (§3.4).
//
// It checks themes that are not shipping, deliberately. Otherwise theme 02's
// palette fails contrast silently for months and you find out on the day you
// switch to it. The generator reads one palette; the checker reads all of them —
// same module, two consumers.
//
// The pair table below is §4.3, restated nowhere else. The MATHS is in
// utils/contrast.js and the light/dark focus mapping is in utils/theme-css.js, both
// imported rather than re-implemented.

import palettes from "../_data/palettes.js";
import { contrastRatio, floorTo } from "../utils/contrast.js";
import { MODES, resolveTokens, assertPalette, focusKeyFor } from "../utils/theme-css.js";

// §4.3, verbatim. "primary on bg" and "bg on primary" are separate rows because
// they are separate design intents — a heading, and the seal label. The ratio is
// symmetric, so they always measure the same; both rows stay so that changing the
// threshold on one cannot silently move the other.
const PAIRS = [
  { label: "ink on bg", fg: "ink", bg: "bg", min: 4.5 },
  { label: "primary on bg", fg: "primary", bg: "bg", min: 4.5 },
  { label: "primary on card", fg: "primary", bg: "card", min: 4.5 },
  { label: "bg on primary (seal label, buttons)", fg: "bg", bg: "primary", min: 4.5 },
  // WCAG 2.2 §2.4.13. --t-focus is primary in light and accent in dark (§4.1);
  // an accent-gold focus ring measured 2.12 on parchment and is why.
  { label: "focus against bg", fg: "focus", bg: "bg", min: 3.0 },
];

// Not checked, by design: waxLit / waxDark. They are decorative surface and never
// carry text (§4.4). Their presence is enforced by utils/theme-css.js's assertPalette,
// which this file calls for every theme — so a theme missing them still fails here
// rather than rendering a flat circle in silence.

const failures = [];
let checked = 0;

console.log("tests/contrast.js — §4.3 pairs, all themes, both modes\n");

for (const [name, palette] of Object.entries(palettes)) {
  assertPalette(name, palette);

  for (const mode of MODES) {
    const tokens = resolveTokens(palette, mode);
    const cells = [];

    for (const pair of PAIRS) {
      const ratio = floorTo(contrastRatio(tokens[pair.fg], tokens[pair.bg]));
      const pass = ratio >= pair.min;
      checked++;
      if (!pass) {
        failures.push(
          `${name}.${mode}: ${pair.label} — ${tokens[pair.fg]} on ${tokens[pair.bg]} ` +
            `measures ${ratio}, needs ${pair.min.toFixed(1)}`
        );
      }
      cells.push(`${pair.fg}/${pair.bg}=${ratio.toFixed(2)}${pass ? "" : " FAIL"}`);
    }

    const focusNote = `focus=${focusKeyFor(mode)}`;
    console.log(`  ${name.padEnd(11)} ${mode.padEnd(6)} ${cells.join("  ")}  (${focusNote})`);
  }
}

console.log(`\n${checked} pairs checked across ${Object.keys(palettes).length} themes.`);

if (failures.length) {
  console.error(`\nFAIL — ${failures.length} pair(s) below threshold (§4.3):`);
  for (const f of failures) console.error(`  · ${f}`);
  console.error("\nContrast is measured, not judged (§4.0.7). Fix _data/palettes.js.");
  process.exit(1);
}

console.log("PASS — every §4.3 pair clears its threshold.");
