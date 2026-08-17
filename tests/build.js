// tests/build.js — the three pages rendered, with the expected markers present
// (PRD §3.4.4, AGENTS.md §4.1).
//
// Without this, a build can "succeed" having emitted nothing, and every
// downstream check passes vacuously: no pages means no hex to find, no palette to
// duplicate and no focus rule to contradict.
//
// ── What it asserts, and what it deliberately does not ───────────────────────
// The markers below are the FROZEN Wave 0 shell (AGENTS.md §5): the skip link
// first, #main, nav aria-current derived from page.url, and header/footer both
// absent on "/". The three pages are still Wave 0 stubs — Wave 2 replaces their
// contents — so nothing here asserts on envelope, form or details copy. Adding
// those markers now would make this file fail for two waves and then be edited
// under pressure, which is how a check stops meaning anything.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import site from "../_data/site.js";
import nav from "../_data/nav.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "_site");

const PAGES = [
  { url: "/", file: "index.html", chrome: false },
  { url: "/rsvp/", file: path.join("rsvp", "index.html"), chrome: true },
  { url: "/details/", file: path.join("details", "index.html"), chrome: true },
];

const failures = [];
const fail = (page, msg) => failures.push(`${page}: ${msg}`);

if (!existsSync(SITE)) {
  console.error("FAIL — _site/ does not exist. Run `eleventy` before tests/build.js.");
  process.exit(1);
}

for (const page of PAGES) {
  const file = path.join(SITE, page.file);
  if (!existsSync(file)) {
    fail(page.url, `not rendered — ${path.relative(ROOT, file)} is missing`);
    continue;
  }

  const html = readFileSync(file, "utf8");
  const body = html.slice(html.indexOf("<body"));

  // ── the shell ─────────────────────────────────────────────────────────────
  if (!/<html lang="en"/.test(html)) fail(page.url, 'missing <html lang="en"> (§8.2)');

  // data-party is informational — it tells you which party is live from
  // view-source — and must match the one build-time switch (§4.4, §6).
  if (!html.includes(`data-party="${site.partyTheme}"`)) {
    fail(page.url, `data-party is not "${site.partyTheme}" (_data/site.js → partyTheme)`);
  }

  const title = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!title || !title[1].trim()) fail(page.url, "empty or missing <title>");

  if (!html.includes('<link rel="stylesheet" href="/assets/site.css">')) {
    fail(page.url, "does not link /assets/site.css — the page would render unstyled");
  }

  // ── §4.6.1 · the skip link is the FIRST focusable element ─────────────────
  // Not merely present: a skip link that is second is a skip link that does not
  // do its job, and the /rsvp embed is a long iframe where skipping matters.
  const firstFocusable = body.match(/<(?:a|button|input|select|textarea|summary)\b[^>]*>/i);
  if (!firstFocusable) {
    fail(page.url, "no focusable element in <body> at all");
  } else if (!/class="skip-link"/.test(firstFocusable[0]) || !/href="#main"/.test(firstFocusable[0])) {
    fail(
      page.url,
      `the first focusable element is not the skip link (§4.6.1) — found ${firstFocusable[0].trim()}`
    );
  }

  // ── §4.6.1 · the target the skip link jumps to ────────────────────────────
  if (!/id="main"/.test(html)) fail(page.url, 'no id="main" for the skip link to reach (§4.6.1)');
  if (!/<main\b[^>]*id="main"/.test(html)) fail(page.url, "#main is not the <main> element");

  // ── §4.7.1 / §4.7.2 · chrome guards ──────────────────────────────────────
  const hasHeader = /<header\b/.test(body);
  const hasFooter = /<footer\b/.test(body);

  if (page.chrome) {
    if (!hasHeader) fail(page.url, "no <header> — it is required on every subpage (§4.7.1)");
    if (!hasFooter) fail(page.url, "no <footer> — it is required on every subpage (§4.7.2)");

    // aria-current is not decoration: the underline is not available to a screen
    // reader (§4.6.4). Exactly one link carries it, and it is the current page's.
    const flagged = [...body.matchAll(/<a\b[^>]*aria-current="page"[^>]*>/g)];
    if (flagged.length !== 1) {
      fail(page.url, `expected exactly 1 aria-current="page", found ${flagged.length} (§4.6.4)`);
    } else if (!flagged[0][0].includes(`href="${page.url}"`)) {
      fail(page.url, `aria-current="page" is on the wrong link: ${flagged[0][0].trim()}`);
    }

    // Every nav link from _data/nav.js reached the markup — the nav is data, and a
    // template that stopped looping it would still render a valid page (§3.3).
    for (const item of nav) {
      if (!body.includes(`href="${item.url}"`)) {
        fail(page.url, `nav link ${item.url} (_data/nav.js) is missing from the header`);
      }
    }
  } else {
    // Home carries no chrome at all: the envelope is the entire page, and §4.7.3's
    // argument for keeping the toggle off "/" cannot hold while a footer sits
    // under the envelope (§4.7.2, §5.1).
    if (hasHeader) fail(page.url, "<header> is present on Home — it must be absent (§4.7.1)");
    if (hasFooter) fail(page.url, "<footer> is present on Home — it must be absent (§4.7.2)");
  }

  // ── the page actually said something ─────────────────────────────────────
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);
  if (!main || !main[1].replace(/<[^>]*>/g, "").trim()) {
    fail(page.url, "<main> rendered empty — the layout resolved but the page did not");
  }
}

// The generated stylesheet is a page of its own (src/assets/site.css.11ty.js) and its
// absence is invisible in the HTML: the <link> above still resolves to a 404.
if (!existsSync(path.join(SITE, "assets", "site.css"))) {
  failures.push("_site/assets/site.css: not emitted — src/assets/site.css.11ty.js did not run");
}

console.log(`tests/build.js — ${PAGES.length} pages, frozen Wave 0 shell markers`);
for (const page of PAGES) console.log(`  ${page.url.padEnd(11)} ${page.file}`);

if (failures.length) {
  console.error(`\nFAIL — ${failures.length} build assertion(s):`);
  for (const f of failures) console.error(`  · ${f}`);
  process.exit(1);
}

console.log("PASS — three pages rendered; skip link first, #main present, chrome guards correct.");
