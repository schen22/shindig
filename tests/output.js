// tests/output.js — what actually reached _site/ (PRD §3.4.5, AGENTS.md §4.1).
//
// Five claims, none of which is visible in the source:
//   1. Exactly ONE palette is in the built site.css (§4.4)
//   2. Minified in production, readable in development (§3.3)
//   3. The three faces are present, and Fraunces is preloaded (§4.8)
//   4. Each face is under 50 KB — the -full- trap (§3.4.5, §4.8)
//   5. _headers reached _site and still carries Referrer-Policy (Stage 11)
//
// Check 4 exists because both files render correctly. Fontsource's `-full-` infix
// means the full VARIABLE AXIS set (opsz+wght+soft+wonk), not the full character
// set: fraunces-latin-full-normal.woff2 is 118.2 KB against 35.8 KB for the weight
// axis, on the one face that is preloaded and render-blocking. Nothing but a size
// check tells them apart. 50 KB clears all three real files with headroom and
// fails the -full- build outright.

import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import palettes from "../_data/palettes.js";
import site from "../_data/site.js";
import { MODES, COLOUR_KEYS } from "../utils/theme-css.js";
import { normaliseHex } from "../utils/contrast.js";
import { buildCSS } from "../src/assets/site.css.11ty.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "_site");
const CSS_FILE = path.join(SITE, "assets", "site.css");

/** §4.8 — output names frozen together with the §8.2 preload href. */
const FACES = ["fraunces", "plus-jakarta-sans", "courier-prime"];
const PRELOADED = "fraunces";
const MAX_FACE_BYTES = 50 * 1024;

const PAGES = ["index.html", path.join("rsvp", "index.html"), path.join("details", "index.html")];

const failures = [];
const fail = (msg) => failures.push(msg);
const kb = (bytes) => (bytes / 1024).toFixed(1) + " KB";

if (!existsSync(CSS_FILE)) {
  console.error("FAIL — _site/assets/site.css was not emitted. Run the build first.");
  process.exit(1);
}

const built = readFileSync(CSS_FILE, "utf8");

// ── 1 · exactly one palette ─────────────────────────────────────────────────
//
// The minifier rewrites colours — #ffffff becomes #fff — so the built sheet is
// normalised to 6-digit form before anything is looked for in it. Searching for the
// literal palette strings would silently "find" nothing and pass.
const normalised = built.replace(/#([0-9a-fA-F]{3,8})\b/g, (m, hex) =>
  hex.length === 3 ? normaliseHex(m) : m.toLowerCase()
);

const valuesOf = (name) =>
  new Set(MODES.flatMap((mode) => COLOUR_KEYS.map((k) => normaliseHex(palettes[name][mode][k]))));

const liveName = site.partyTheme;
const liveValues = valuesOf(liveName);

for (const value of liveValues) {
  if (!normalised.includes(value)) {
    fail(
      `built site.css is missing ${value} from the live palette "${liveName}" — either ` +
        `layer 1 did not emit it, or the minifier rewrote it into a form this check ` +
        `does not normalise.`
    );
  }
}

for (const name of Object.keys(palettes)) {
  if (name === liveName) continue;
  // Only values this theme does not SHARE with the live one can be evidence: #ffffff
  // is taskmaster's, birthday's and picnic's card surface, and finding it proves
  // nothing about which palette shipped.
  const distinctive = [...valuesOf(name)].filter((v) => !liveValues.has(v));
  const leaked = distinctive.filter((v) => normalised.includes(v));
  if (leaked.length) {
    fail(
      `built site.css contains ${leaked.length} colour(s) from theme "${name}", which is ` +
        `not live: ${leaked.join(", ")}. Only the selected palette may reach the browser (§4.4).`
    );
  }
}

// The other half of §4.4: no attribute selector for the party theme. data-party is
// informational and styles nothing.
const partySelectors = [...normalised.matchAll(/\[data-party[^\]]*\]/g)];
if (partySelectors.length) {
  fail(`built site.css contains ${partySelectors.length} [data-party] selector(s) (§4.4).`);
}

// ── 2 · minified in production, readable in development ─────────────────────
//
// Both branches are generated here from the same module the build uses, so the
// dev path is genuinely exercised rather than assumed. The emitted file is then
// compared against the production branch — which is what catches NODE_ENV being
// wrong in netlify.toml, the failure mode that ships unminified CSS in silence.
const prod = buildCSS(liveName, { minify: true });
const dev = buildCSS(liveName, { minify: false });

if (built.trim() !== prod.trim()) {
  fail(
    "the emitted _site/assets/site.css does not match the production (minified) render. " +
      "NODE_ENV was probably not \"production\" for this build (§3.3, §3.5)."
  );
}
if (/\/\*/.test(prod) || /\n\s\s/.test(prod)) {
  fail("the production stylesheet still carries comments or indentation — it is not minified (§3.3).");
}
if (!/\n\s\s/.test(dev) || !dev.includes("/* layer 1")) {
  fail("the development stylesheet is not readable — dev builds must not be minified (§3.3).");
}
if (dev.length <= prod.length) {
  fail(`minification did not shrink the sheet (dev ${dev.length} B, prod ${prod.length} B).`);
}

// ── 3 & 4 · fonts present, preloaded, and under the byte ceiling ────────────
const faceSizes = new Map();
for (const face of FACES) {
  const file = path.join(SITE, "assets", "fonts", `${face}.woff2`);
  if (!existsSync(file)) {
    fail(
      `_site/assets/fonts/${face}.woff2 is missing. Fonts are passthrough-copied from ` +
        `node_modules by eleventy.config.js (§4.8); they are not committed.`
    );
    continue;
  }
  const bytes = statSync(file).size;
  faceSizes.set(face, bytes);
  if (bytes > MAX_FACE_BYTES) {
    fail(
      `_site/assets/fonts/${face}.woff2 is ${kb(bytes)}, over the ${kb(MAX_FACE_BYTES)} ceiling. ` +
        `This is almost certainly Fontsource's "-full-" file (all four variable axes, ` +
        `not the full character set) instead of the "-wght-" one — it renders identically ` +
        `and costs 3.3× on the preloaded, render-blocking face (§4.8).`
    );
  }
}

// The preload href and the passthrough output name are frozen together; changing
// either alone breaks the preload silently, so it is checked on every page.
for (const page of PAGES) {
  const file = path.join(SITE, page);
  if (!existsSync(file)) {
    fail(`_site/${page} is missing — tests/build.js has more to say about that.`);
    continue;
  }
  const html = readFileSync(file, "utf8");
  const preloads = [...html.matchAll(/<link\b[^>]*rel="preload"[^>]*>/g)].map((m) => m[0]);
  const fontPreloads = preloads.filter((tag) => /as="font"/.test(tag));

  if (fontPreloads.length !== 1) {
    fail(
      `_site/${page}: expected exactly 1 font preload, found ${fontPreloads.length}. ` +
        `§4.8 preloads the DISPLAY FACE ONLY — body and mono can swap in.`
    );
    continue;
  }
  const tag = fontPreloads[0];
  if (!tag.includes(`/assets/fonts/${PRELOADED}.woff2`)) {
    fail(`_site/${page}: the preloaded face is not ${PRELOADED}.woff2 — ${tag}`);
  }
  // Without crossorigin the browser fetches the font twice: fonts are always
  // requested in CORS mode, so a non-CORS preload never matches the real request.
  if (!/\bcrossorigin\b/.test(tag)) {
    fail(`_site/${page}: the font preload has no crossorigin attribute, so it is fetched twice.`);
  }
}

// ── 5 · _headers reached the publish directory ──────────────────────────────
//
// Netlify reads `_headers` from the publish directory (`_site`, netlify.toml)
// only if it is passed through by eleventy.config.js — which passes through
// `public/`, not the repository root. A `_headers` anywhere else is silently
// never deployed and never applied.
const HEADERS_FILE = path.join(SITE, "_headers");
const REQUIRED_DIRECTIVE = "Referrer-Policy: no-referrer";

let headersNote;

if (!existsSync(HEADERS_FILE)) {
  headersNote = "MISSING from _site";
  fail(
    "_site/_headers is missing. _headers must live in public/, not the " +
      "repository root, or Eleventy's passthrough copy never reaches _site."
  );
} else {
  const headers = readFileSync(HEADERS_FILE, "utf8");
  if (headers.includes(REQUIRED_DIRECTIVE)) {
    headersNote = `reached _site with "${REQUIRED_DIRECTIVE}"`;
  } else {
    // The file DID reach _site, so its location is not the problem here —
    // saying otherwise sends the next reader to the wrong place. Someone
    // edited the contents.
    headersNote = `reached _site, but "${REQUIRED_DIRECTIVE}" is gone`;
    fail(
      `_site/_headers reached the publish directory but no longer contains ` +
        `"${REQUIRED_DIRECTIVE}". The directive was removed from ` +
        "public/_headers; restore it there."
    );
  }
}

// ── report ──────────────────────────────────────────────────────────────────
console.log(`tests/output.js — built site.css ${kb(built.length)}, theme "${liveName}"`);
console.log(`  one palette      ${liveValues.size} live values present, 0 from the other ${Object.keys(palettes).length - 1} themes`);
console.log(`  minification     prod ${kb(prod.length)} · dev ${kb(dev.length)}`);
for (const [face, bytes] of faceSizes) {
  console.log(`  ${face.padEnd(17)}${kb(bytes).padStart(8)}  ${face === PRELOADED ? "(preloaded)" : ""}`);
}
const total = [...faceSizes.values()].reduce((a, b) => a + b, 0);
console.log(`  font payload     ${kb(total)} for ${faceSizes.size} faces`);
console.log(`  _headers         ${headersNote}`);

if (failures.length) {
  console.error(`\nFAIL — ${failures.length} output assertion(s):`);
  for (const f of failures) console.error(`  · ${f}`);
  process.exit(1);
}

console.log("PASS — one palette, minified in production, three faces present and under ceiling, _headers deployed.");
