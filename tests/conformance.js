// tests/conformance.js — the rules in plans/CLAUDE.md that are mechanically
// checkable, enforced rather than remembered (PRD §3.4.3, AGENTS.md §4.1).
//
// This project is built by several agents in parallel. A rule that lives only in
// prose is a rule that holds until someone doesn't read that paragraph.
//
// Five checks:
//   1. No hard-coded hex outside _data/palettes.js       (§4.4)
//   2. No `outline: none`                                (§4.6.2)
//   3. No positive tabindex                              (§4.6)
//   4. No [data-party] selector reaches the output CSS   (§4.4)
//   5. Both copies of the §4.6.2 focus rule byte-identical
//
// ── Scope, and why it is drawn exactly here ──────────────────────────────────
// Scanned:   styles/  _includes/  src/  public/assets/js/
// Not scanned:
//   · node_modules/ and _site/ — dependencies and build output.
//   · tools/ — tools/make-og-assets.py legitimately contains the seal's hex
//     constants. It generates the favicon and OG image offline; it is not shipped
//     code and it is not a stylesheet, so §4.4's single-source rule does not reach
//     it. Adding it would fail a correct file.
//   · utils/ and _data/ — utils/*.js interpolate palette values without
//     containing any, and _data/palettes.js IS the source.
//
// Check 1 is scoped to `#` literals only, deliberately. Functional notations —
// rgba(), color-mix(), oklch() — are how layer 3's derived surfaces are written in
// styles/tokens.css, and a rule that flagged "any literal colour" would fail Wave
// 1b's correct code. What §4.4 forbids is a SECOND SOURCE of colour, and a hex
// literal is the form that takes.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildCSS } from "../src/assets/site.css.11ty.js";
import site from "../_data/site.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DIRS = ["styles", "_includes", "src", path.join("public", "assets", "js")];
const TEXT_EXT = new Set([".css", ".js", ".mjs", ".liquid", ".html", ".md", ".njk"]);

const failures = [];
const notices = [];
const fail = (msg) => failures.push(msg);
const rel = (abs) => path.relative(ROOT, abs);

/** Every text file under the scanned directories, sorted, absolute paths. */
function collect() {
  const out = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir).sort()) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (TEXT_EXT.has(path.extname(entry))) out.push(full);
    }
  };
  for (const d of SCAN_DIRS) walk(path.join(ROOT, d));
  return out;
}

/**
 * Blank out comments, preserving line numbers and byte offsets so reported lines
 * stay true. Comments are excluded because a hex quoted in prose ("the original
 * #ce5a54 measured 4.21") is documentation, not a hard-coded colour — and this
 * codebase comments heavily on purpose.
 */
function stripComments(source, ext) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  let out = source;
  if (ext === ".css" || ext === ".js" || ext === ".mjs") {
    out = out.replace(/\/\*[\s\S]*?\*\//g, blank);
  }
  if (ext === ".js" || ext === ".mjs") {
    // Line comments, but not the // in a URL: require a non-colon before it.
    out = out.replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + blank(m.slice(p.length)));
  }
  if (ext === ".liquid" || ext === ".html" || ext === ".md" || ext === ".njk") {
    out = out.replace(/<!--[\s\S]*?-->/g, blank);
    out = out.replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, blank);
  }
  return out;
}

const lineOf = (source, index) => source.slice(0, index).split("\n").length;

const files = collect();

// ── 1 · No hard-coded hex outside _data/palettes.js ─────────────────────────
//
// #rgb / #rgba / #rrggbb / #rrggbbaa. Two exclusions, both real:
//   · `url(#gradientId)` — an SVG fragment reference, not a colour.
//   · `&#8212;` — a numeric HTML entity; the digits are hex-shaped by accident.
const HEX = /#([0-9a-fA-F]{3,8})\b/g;
const HEX_LENGTHS = new Set([3, 4, 6, 8]);

for (const file of files) {
  const ext = path.extname(file);
  const source = readFileSync(file, "utf8");
  const code = stripComments(source, ext);

  for (const m of code.matchAll(HEX)) {
    if (!HEX_LENGTHS.has(m[1].length)) continue;
    if (code[m.index - 1] === "&") continue; // numeric HTML entity
    const before = code.slice(Math.max(0, m.index - 5), m.index);
    if (/url\($/.test(before)) continue; // url(#id)
    fail(
      `${rel(file)}:${lineOf(code, m.index)} — hard-coded hex ${m[0]}. Colour exists ` +
        `in exactly one place, _data/palettes.js (§4.4); reach it through a --t-* token.`
    );
  }
}

// ── 2 · No `outline: none` ──────────────────────────────────────────────────
//
// §4.6.2: never `outline: none` without an equivalent replacement. `outline: 0`
// is the same declaration spelled differently, so it is caught too. A reviewer
// cannot see the replacement from a grep, so this is deliberately absolute — if a
// component genuinely needs it, that is an escalation, not a workaround.
for (const file of files) {
  const ext = path.extname(file);
  if (ext !== ".css" && ext !== ".liquid" && ext !== ".html") continue;
  const code = stripComments(readFileSync(file, "utf8"), ext);
  for (const m of code.matchAll(/outline\s*:\s*(none|0)\b/gi)) {
    fail(
      `${rel(file)}:${lineOf(code, m.index)} — "${m[0]}" (§4.6.2). One global focus ` +
        `style, never removed: per-component focus styles only ever cover what ` +
        `someone remembered to style.`
    );
  }
}

// ── 3 · No positive tabindex ────────────────────────────────────────────────
//
// §4.6: tab order follows DOM order on every page. If visual order and DOM order
// disagree, fix the layout. `tabindex="-1"` (the <main> target) and `"0"` are fine.
for (const file of files) {
  const ext = path.extname(file);
  const code = stripComments(readFileSync(file, "utf8"), ext);
  for (const m of code.matchAll(/tabindex\s*=\s*["']?\s*\+?([1-9]\d*)/gi)) {
    fail(
      `${rel(file)}:${lineOf(code, m.index)} — positive tabindex="${m[1]}" (§4.6). ` +
        `Fix the layout, not the tab index.`
    );
  }
}

// ── 4 · No [data-party] selector reaches the output CSS ─────────────────────
//
// Earlier revisions shipped all four palettes and selected one with an attribute;
// every visitor downloaded eight palettes to use two. data-party stays on <html>
// as an informational marker and styles NOTHING (§4.4).
//
// Checked against the CSS this build actually generates — imported and run here
// rather than read off disk, so the result cannot be a stale _site/. Sources are
// scanned too, because a selector written in styles/ that happens to be minified
// away is still a rule someone believed in.
for (const file of files.filter((f) => path.extname(f) === ".css")) {
  const code = stripComments(readFileSync(file, "utf8"), ".css");
  for (const m of code.matchAll(/\[data-party[^\]]*\]/g)) {
    fail(
      `${rel(file)}:${lineOf(code, m.index)} — ${m[0]} selector (§4.4). data-party is ` +
        `informational and styles nothing; the live palette is chosen at build time.`
    );
  }
}

let generated = null;
try {
  generated = buildCSS(site.partyTheme, { minify: false });
} catch (err) {
  fail(`generated CSS could not be built: ${err.message}`);
}
if (generated) {
  for (const m of generated.matchAll(/\[data-party[^\]]*\]/g)) {
    fail(`generated site.css — ${m[0]} selector reaches the output CSS (§4.4).`);
  }
  // The other half of the same claim: the switch must still be there. A generator
  // that emitted nothing would pass every "must not contain" check above.
  for (const expected of [":root", "--t-bg", "--t-focus", '[data-theme="dark"]']) {
    if (!generated.includes(expected)) {
      fail(`generated site.css is missing ${expected} — layer 1/2 did not emit (§4.4).`);
    }
  }
}

// ── 5 · Both copies of the §4.6.2 focus rule byte-identical ─────────────────
//
// One global focus style, and the spec and the stylesheet must not drift apart.
// Compared after removing each block's COMMON leading indentation — the PRD's copy
// sits inside a numbered list and is indented three spaces by Markdown, which is
// the document's formatting rather than part of the rule. Everything after the
// dedent is compared byte for byte, whitespace included.
const dedent = (text) => {
  const lines = text.replace(/\s+$/, "").split("\n");
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^[ \t]*/)[0].length);
  const common = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(common)).join("\n");
};

/** Slice the focus rule out of any text: `:where(a, button` … first `}`. */
function extractFocusRule(text, label) {
  const found = text.indexOf(":where(a, button");
  if (found === -1) return null;
  const end = text.indexOf("}", found);
  if (end === -1) throw new Error(`${label}: focus rule has no closing brace`);
  // Start at the beginning of the line, or the first line carries no indentation
  // and dedent() then measures the common indent as zero.
  const start = text.lastIndexOf("\n", found) + 1;
  return dedent(text.slice(start, end + 1));
}

const PRD = path.join(ROOT, "plans", "CLAUDE.md");
const BASE_CSS = path.join(ROOT, "styles", "base.css");

const prdText = readFileSync(PRD, "utf8");
// §4.6.2 only — the section from "### 4.6" up to the next "### ".
const sectionStart = prdText.indexOf("### 4.6 ");
const sectionEnd = prdText.indexOf("\n### ", sectionStart + 1);
const section46 = prdText.slice(sectionStart, sectionEnd === -1 ? undefined : sectionEnd);
const specRule = extractFocusRule(section46, "plans/CLAUDE.md §4.6.2");

if (!specRule) {
  fail("plans/CLAUDE.md §4.6.2 — could not find the focus rule to compare against.");
} else if (!existsSync(BASE_CSS)) {
  // styles/base.css belongs to Wave 1b, running in parallel with 1a (AGENTS.md §3).
  notices.push(
    "check 5 SKIPPED: styles/base.css does not exist yet (Wave 1b owns it). The rule " +
      "it must contain, byte for byte:\n" +
      specRule.split("\n").map((l) => "      " + l).join("\n")
  );
} else {
  const cssRule = extractFocusRule(readFileSync(BASE_CSS, "utf8"), "styles/base.css");
  if (!cssRule) {
    fail(
      "styles/base.css — the global §4.6.2 focus rule is absent. Everything focusable " +
        "on the site depends on this one selector list."
    );
  } else if (cssRule !== specRule) {
    fail(
      "the §4.6.2 focus rule differs between plans/CLAUDE.md and styles/base.css " +
        "(§3.4.3 requires them byte-identical after dedent):\n" +
        `    plans/CLAUDE.md §4.6.2:\n${specRule.split("\n").map((l) => "      " + l).join("\n")}\n` +
        `    styles/base.css:\n${cssRule.split("\n").map((l) => "      " + l).join("\n")}`
    );
  }
}

// The PRD states the rule twice — §4.6.2 and §8.3 — and requires it "verbatim
// wherever it appears". A mismatch there is a spec contradiction to report, not an
// agent's to fix (plans/CLAUDE.md is Sarah's), so it is a notice.
const section83 = prdText.slice(prdText.indexOf("### 8.3"));
const rule83 = extractFocusRule(section83, "plans/CLAUDE.md §8.3");
if (specRule && rule83 && rule83 !== specRule) {
  notices.push(
    "plans/CLAUDE.md states the focus rule differently in §4.6.2 and §8.3. §4.6.2 is " +
      "normative and is what styles/base.css is checked against. Escalate; do not edit the PRD."
  );
}

// ── report ──────────────────────────────────────────────────────────────────
console.log(
  `tests/conformance.js — 5 checks over ${files.length} file(s) in ` +
    `${SCAN_DIRS.filter((d) => existsSync(path.join(ROOT, d))).join(", ") || "no scanned dirs yet"}`
);
for (const n of notices) console.log(`  NOTICE: ${n}`);

if (failures.length) {
  console.error(`\nFAIL — ${failures.length} conformance violation(s):`);
  for (const f of failures) console.error(`  · ${f}`);
  process.exit(1);
}

console.log("PASS — no hard-coded hex, no outline removal, no positive tabindex, no [data-party] in CSS.");
