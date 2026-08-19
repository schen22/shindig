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

import fs from "node:fs";
import { fileURLToPath } from "node:url";

import palettes from "../_data/palettes.js";
import { contrastRatio, floorTo, mixSrgb } from "../utils/contrast.js";
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

// ── Layer 3 (§4.4) ───────────────────────────────────────────────────────
//
// styles/tokens.css derives four surfaces from --t-ink via color-mix(). Read
// the percentages out of that file rather than re-typing them here — a copy
// this test owns can drift from the page and pass while the page fails
// (that is exactly how --t-faint shipped: it was measured nowhere).
//
// Every --t-* color-mix() token found there must land in exactly one of the
// two sets below. A token in neither set fails the build below, on purpose:
// silence is how the last one got through.
const TEXT = new Set(["muted"]); // all secondary text, without exception (§4.4)
// Decorative, exempt from the 4.5 floor — and why:
//   faint — never carries text (styles/base.css enforces this; this file
//     fails the build if any `color:` resolves to it). At 56% ink on bg it
//     measures 3.50–3.65 in light mode, below AA. Raising it was considered
//     and rejected: it clears AA by only 0.03 in forest and collapses the
//     gap between --t-faint and --t-muted, which exist to be visibly
//     different. Right for a dot, a ring or a divider — not for text.
//   line, rule — mix with `transparent`, not `--t-bg`. That is alpha
//     compositing over an unknown ground, which this checker's opaque-hex
//     model does not represent (Stage 3 NOT INCLUDED), so they are excluded
//     rather than silently measured wrong.
const DECORATIVE = new Set(["faint", "line", "rule"]);

const tokensCssPath = fileURLToPath(new URL("../styles/tokens.css", import.meta.url));
const tokensCss = fs.readFileSync(tokensCssPath, "utf8");

// Matches e.g. `--t-muted: color-mix(in srgb, var(--t-ink) 72%, var(--t-bg));`
const LAYER3_RE =
  /--t-([a-z]+):\s*color-mix\(in srgb,\s*var\(--t-ink\)\s*(\d+)%,\s*(var\(--t-bg\)|transparent)\s*\)/g;

const layer3Tokens = [...tokensCss.matchAll(LAYER3_RE)].map((m) => ({
  name: m[1],
  percent: Number(m[2]),
  against: m[3] === "transparent" ? "transparent" : "bg",
}));

if (layer3Tokens.length === 0) {
  throw new Error(
    "tests/contrast.js: found no `--t-* color-mix()` declarations in styles/tokens.css — " +
      "the parser and the file have drifted apart."
  );
}

for (const token of layer3Tokens) {
  if (!TEXT.has(token.name) && !DECORATIVE.has(token.name)) {
    throw new Error(
      `tests/contrast.js: --t-${token.name} in styles/tokens.css is classified as neither ` +
        "TEXT nor DECORATIVE (§4.4). A layer-3 token must be classified, not silently " +
        "unmeasured — that silence is how --t-faint shipped failing AA."
    );
  }
}

const failures = [];
let checked = 0;
let layer3Checked = 0;

// ── §4.4: no `color:` may resolve to --t-faint ──────────────────────────
//
// The measurement above proves --t-faint is too low-contrast for text; it
// says nothing about whether some stylesheet still points `color:` at it —
// that is exactly how it shipped failing AA the first time (this file's
// header). So scan every stylesheet directly, rather than trusting nothing
// points there again.
const stylesDir = fileURLToPath(new URL("../styles/", import.meta.url));
const cssFiles = fs
  .readdirSync(stylesDir, { recursive: true })
  .filter((f) => f.endsWith(".css"))
  .map((f) => `${stylesDir}${f}`);

const FAINT_TEXT_RE = /(?<![-\w])color\s*:\s*var\(--t-faint\)/;
for (const file of cssFiles) {
  const css = fs.readFileSync(file, "utf8");
  if (FAINT_TEXT_RE.test(css)) {
    failures.push(`${file}: \`color:\` resolves to --t-faint — decorative only, never text (§4.4).`);
  }
}

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

    // Layer 3: the TEXT-classified derived tokens, resolved via the same
    // color-mix() formula as styles/tokens.css (utils/contrast.js's mixSrgb),
    // then measured against bg exactly like any other pair above.
    for (const token of layer3Tokens) {
      if (!TEXT.has(token.name) || token.against !== "bg") continue;
      const mixed = mixSrgb(tokens.ink, token.percent, tokens.bg);
      const ratio = floorTo(contrastRatio(mixed, tokens.bg));
      const pass = ratio >= 4.5;
      checked++;
      layer3Checked++;
      if (!pass) {
        failures.push(
          `${name}.${mode}: --t-${token.name} on bg — ${mixed} (${token.percent}% ink on bg) ` +
            `measures ${ratio}, needs 4.5`
        );
      }
      cells.push(`t-${token.name}/bg=${ratio.toFixed(2)}${pass ? "" : " FAIL"}`);
    }

    const focusNote = `focus=${focusKeyFor(mode)}`;
    console.log(`  ${name.padEnd(11)} ${mode.padEnd(6)} ${cells.join("  ")}  (${focusNote})`);
  }
}

console.log(
  `\n${checked} checks across ${Object.keys(palettes).length} themes ` +
    `(${checked - layer3Checked} §4.3 pairs, ${layer3Checked} layer-3 text tokens).`
);

if (failures.length) {
  console.error(`\nFAIL — ${failures.length} check(s) below threshold (§4.3, §4.4):`);
  for (const f of failures) console.error(`  · ${f}`);
  console.error(
    "\nContrast is measured, not judged (§4.0.7). Fix _data/palettes.js; for a layer-3 " +
      "failure, the derived token's percentage in styles/tokens.css; for a --t-faint-on-" +
      "text failure, the `color:` declaration that points at it."
  );
  process.exit(1);
}

console.log("PASS — every §4.3 pair and every layer-3 text token clears its threshold.");
