// src/assets/site.css.11ty.js — ONE sheet, containing ONE palette (PRD §3.3, §4.4).
//
// The stylesheet is a build output, not a served file. public/ deliberately holds
// no CSS: a passthrough copy plus a generated copy is exactly the duplication
// §4.4 exists to prevent.
//
// Concatenation order is load-bearing:
//   1. utils/theme-css.js  — layer 1 (registry) + layer 2 (the --t-* switch)
//   2. styles/tokens.css   — layer 3 derived surfaces + @font-face + globals (1b)
//   3. styles/base.css, styles/layout.css                                   (1b)
//   4. styles/components/*.css — GLOBBED and sorted, never enumerated
//
// The glob is AGENTS.md §2.1: four Wave 2 agents write component CSS, and one
// shared components.css would be a guaranteed four-way conflict. Sorted order is
// for determinism only — component CSS must not depend on source order for
// correctness. If two components fight over specificity, fix the selectors.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { transform } from "lightningcss";
import { liveThemeCSS } from "../../utils/theme-css.js";

// Resolved from this file, NOT process.cwd() (AGENTS.md §6.4). §3.3's
// readFileSync(`styles/${n}.css`) is correct only when the build runs from the
// repo root — true on Netlify, false for a test harness, an editor task, or any
// `node` invoked from a subdirectory, and it fails as a missing stylesheet rather
// than as an error anyone can read.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STYLES = path.join(ROOT, "styles");
const COMPONENTS = path.join(STYLES, "components");

/** Hand-ordered partials. Everything after these is globbed. */
const PARTIALS = ["tokens", "base", "layout"];

// The §3.1 browser floor as a machine-checked build target: Baseline 2023 —
// Safari 16.4+, Chrome/Edge 111+, Firefox 113+. lightningcss encodes versions as
// (major << 16) | (minor << 8) | patch.
const TARGETS = {
  safari: (16 << 16) | (4 << 8),
  chrome: 111 << 16,
  firefox: 113 << 16,
  edge: 111 << 16,
};

/**
 * Read the hand-written partials.
 *
 * styles/ belongs to Wave 1b, which is running in parallel with 1a (AGENTS.md
 * §3, Wave 1). While the directory does not exist at all, the generator emits the
 * palette alone and says so on stderr — otherwise 1a could not run its own build,
 * and its exit condition is a build that passes. The moment styles/ exists, a
 * MISSING partial is a hard failure, so this tolerance retires itself instead of
 * hiding a dropped stylesheet later.
 */
function readPartials() {
  if (!existsSync(STYLES)) {
    console.warn(
      "[site.css] NOTICE: styles/ does not exist yet (Wave 1b) — emitting the " +
        "generated palette only. This tolerance disappears once styles/ lands."
    );
    return [];
  }

  const out = [];
  for (const name of PARTIALS) {
    const file = path.join(STYLES, `${name}.css`);
    if (!existsSync(file)) {
      throw new Error(
        `styles/${name}.css is missing but styles/ exists. §3.3 requires all of ` +
          `${PARTIALS.join(", ")}; it is owned by Wave 1b. Do not add it here.`
      );
    }
    out.push(readFileSync(file, "utf8"));
  }

  if (existsSync(COMPONENTS)) {
    for (const file of readdirSync(COMPONENTS).filter((f) => f.endsWith(".css")).sort()) {
      out.push(readFileSync(path.join(COMPONENTS, file), "utf8"));
    }
  }
  return out;
}

/** Build the full sheet for a given theme. Exported so tests/output.js can
 *  compare both branches without shelling out to two builds. */
export function buildCSS(partyTheme, { minify }) {
  const css = [liveThemeCSS(partyTheme), ...readPartials()].join("\n");
  if (!minify) return css; // readable in dev
  const { code, warnings } = transform({
    filename: "site.css",
    code: Buffer.from(css),
    minify: true,
    targets: TARGETS,
  });
  // A warning here is a real syntax problem in a partial — surfaced rather than
  // swallowed, since the minifier drops what it cannot parse.
  for (const w of warnings) console.warn(`[site.css] lightningcss: ${w.message}`);
  return code.toString();
}

export default class {
  data() {
    return { permalink: "/assets/site.css", eleventyExcludeFromCollections: true };
  }

  render({ site }) {
    return buildCSS(site.partyTheme, { minify: process.env.NODE_ENV === "production" });
  }
}
