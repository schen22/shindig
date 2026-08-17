// tests/copy.js — every theme defines every §4.5 copy key (PRD §3.4.2).
//
// A missing key is not an error in Liquid; it renders as an empty string. So a
// theme ships with no footer line, or an <a> with no accessible name and an href
// that resolves to the current page, and nothing complains.
//
// ── The copy-key contract is fixed by Wave 0's frozen templates ───────────────
// base.liquid, header.liquid and footer.liquid already read these names. Adding a
// key here without a template that reads it is dead data; renaming one silently
// empties the markup that reads it. Nav labels are deliberately NOT themed (§4.5)
// — they stay in _data/nav.js, and must not appear below.
//
// ── Why this file can skip ───────────────────────────────────────────────────
// _data/themes.js belongs to Wave 2d (AGENTS.md §3, Wave 2). This check runs in
// `npm test`, which runs on every build by every agent from Wave 1 onward, so a
// hard failure on the absent file would make the build red for all of Wave 1 and
// block 1a's own exit condition. It therefore SKIPS WITH A NOTICE while the file
// does not exist and FAILS HARD the moment it does. The tolerance retires itself.

import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import palettes from "../_data/palettes.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const THEMES_FILE = path.join(ROOT, "_data", "themes.js");

// §4.5, in template-reading order. All 15, every theme.
const REQUIRED_KEYS = [
  "wordmark",        // header.liquid
  "eyebrow",         // §5.1 top half
  "headline",
  "subheadline",     // §5.1 bottom half
  "tagline",
  "sealLabel",       // the seal's label; its colour is --t-bg, not a new token (§4.4)
  "titleHome",       // base.liquid <title>, via each page's titleKey
  "titleRsvp",
  "titleDetails",
  "calloutTitle",
  "calloutBody",
  "detailsIntro",
  "footerLine",      // footer.liquid
  "footerLinkText",
  "footerLinkUrl",
];

if (!existsSync(THEMES_FILE)) {
  console.log(
    "tests/copy.js — SKIPPED: _data/themes.js does not exist yet (Wave 2d owns it).\n" +
      `  The §4.5 contract this file will enforce, for every theme in _data/palettes.js\n` +
      `  (${Object.keys(palettes).join(", ")}):\n` +
      `    ${REQUIRED_KEYS.join(" ")}\n` +
      "  Nav labels are deliberately not themed (§4.5) and belong in _data/nav.js.\n" +
      "  This skip disappears the moment the file lands."
  );
  process.exit(0);
}

const themes = (await import(pathToFileURL(THEMES_FILE).href)).default;

const failures = [];
const fail = (msg) => failures.push(msg);

if (!themes || typeof themes !== "object") {
  fail("_data/themes.js: default export is not an object");
} else {
  // Every theme in the palette registry needs copy — all four, not just the live
  // one (§4.5). A theme whose colours exist and whose words do not is a theme that
  // cannot be switched to.
  for (const name of Object.keys(palettes)) {
    if (!(name in themes)) {
      fail(`_data/themes.js: no copy for theme "${name}", which exists in _data/palettes.js`);
    }
  }
  // And the reverse: copy for a theme with no palette is a theme that cannot render.
  for (const name of Object.keys(themes)) {
    if (!(name in palettes)) {
      fail(`_data/themes.js → ${name}: no matching palette in _data/palettes.js`);
    }
  }

  for (const [name, copy] of Object.entries(themes)) {
    if (!copy || typeof copy !== "object") {
      fail(`_data/themes.js → ${name}: not an object`);
      continue;
    }

    for (const key of REQUIRED_KEYS) {
      if (!(key in copy)) {
        fail(`_data/themes.js → ${name}: missing "${key}"`);
        continue;
      }
      // Present-but-empty fails identically to absent, because Liquid renders both
      // as nothing. Checking presence alone would pass a theme with an empty
      // footer line, which is the exact bug this file exists to catch.
      if (typeof copy[key] !== "string" || !copy[key].trim()) {
        fail(`_data/themes.js → ${name}.${key}: empty or not a string — renders as nothing`);
      }
    }

    const extra = Object.keys(copy).filter((k) => !REQUIRED_KEYS.includes(k));
    if (extra.length) {
      fail(
        `_data/themes.js → ${name}: unexpected key(s) ${extra.join(", ")}. The contract is ` +
          `exactly the 15 keys in §4.5. A key added for one theme and not the others is the ` +
          `silent-empty bug wearing a different hat; if the key is real, add it to ` +
          `REQUIRED_KEYS here AND to every theme. Nav labels belong in _data/nav.js.`
      );
    }

    // footerLinkUrl is an href. An empty string was caught above; a non-URL here
    // resolves relative to the current page and looks like it works.
    const url = copy.footerLinkUrl;
    if (typeof url === "string" && url.trim() && !/^(?:https?:\/\/|\/)/.test(url.trim())) {
      fail(`_data/themes.js → ${name}.footerLinkUrl: "${url}" is not an absolute URL or root path`);
    }
  }
}

const themeCount = themes && typeof themes === "object" ? Object.keys(themes).length : 0;
console.log(
  `tests/copy.js — ${REQUIRED_KEYS.length} §4.5 keys × ${themeCount} theme(s) in _data/themes.js`
);

if (failures.length) {
  console.error(`\nFAIL — ${failures.length} copy-contract violation(s) (§4.5):`);
  for (const f of failures) console.error(`  · ${f}`);
  process.exit(1);
}

console.log("PASS — every theme defines every key.");
