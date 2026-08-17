// eleventy.config.js — Eleventy v3, ESM. PRD §3.3.
export default function (eleventyConfig) {
  // Without this, nothing in public/ is emitted and every page renders unstyled.
  //
  // Target is "/" — the output ROOT — not "assets". public/ already contains its
  // own assets/ directory (§3.2), and robots.txt must land at /robots.txt or it
  // does nothing (§7 Q3). Mapping public/ -> /assets would produce
  // /assets/assets/fonts/ and /assets/robots.txt, and nothing would complain.
  // See the Wave 0 handoff note; §3.3's code block says "assets" and is wrong
  // for the §3.2 source layout.
  eleventyConfig.addPassthroughCopy({ public: "/" });

  // Fonts are copied straight out of node_modules at build time (§4.8), not
  // committed into public/assets/fonts/. Additive — this does not replace the
  // rule above.
  //
  // The "-wght-" file is the WEIGHT AXIS ONLY. Fontsource's "-full-" infix means
  // all four variable axes (opsz+wght+soft+wonk), NOT the full character set:
  // fraunces-latin-full-normal.woff2 is 118.2 KB against 35.8 KB for -wght-, on
  // the one face that is preloaded and render-blocking. Copying by rule instead
  // of by hand removes the chance of picking the wrong one.
  //
  // The fraunces.woff2 output name is frozen together with the preload href in
  // _includes/base.liquid. Changing either alone silently breaks the preload.
  eleventyConfig.addPassthroughCopy({
    "node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2":
      "assets/fonts/fraunces.woff2",
    "node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2":
      "assets/fonts/plus-jakarta-sans.woff2",
    "node_modules/@fontsource/courier-prime/files/courier-prime-latin-400-normal.woff2":
      "assets/fonts/courier-prime.woff2",
  });

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
