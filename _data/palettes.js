// _data/palettes.js — THE SINGLE SOURCE OF COLOUR (PRD §4.4).
//
// Colour exists here and nowhere else. Not in a CSS file: a CSS file cannot be
// imported by tests/contrast.js, and a checker that re-types the hexes is a copy,
// which is the precise thing this architecture exists to prevent. Copies drift.
//
// Single-writer forever: Wave 1a owns this file (AGENTS.md §5). Two writers
// reintroduces the drift the architecture eliminates.
//
// Every value below is checked on every build:
//   tests/contrast.js  — every §4.3 pair, all four themes, both modes
//   tests/conformance.js — no hex literal exists outside this file
//   tests/output.js    — exactly one of these palettes reaches the browser
//
// ── Keys, and why each one is here ────────────────────────────────────────────
//   bg ink primary accent card   §4.1 token contract, authored per mode
//   waxLit waxDark               the seal's two wax shades (§4.4) — see below
//   radius display               theme-level, mode-independent
//
// `--t-body` and `--t-mono` are global, not per theme (§4.1); they live in
// styles/tokens.css. `--t-focus` is NOT a palette key — it is primary in light
// and accent in dark, resolved once in utils/theme.js so the generator and
// the contrast checker cannot disagree about it.
//
// ── Dark mode is authored, never derived (§4.2) ───────────────────────────────
// Inverting Taskmaster's parchment produces grey, not velvet.
//
// ── waxLit / waxDark ─────────────────────────────────────────────────────────
// Palette keys rather than derived tokens because they cannot be mechanically
// derived in CSS: the seal's radial-gradient runs lit → primary → shadowed, and
// a color-mix() of primary with white desaturates toward pink rather than toward
// the warmer, oranger red that reads as wax (§4.4). They are decorative surface
// and never carry text, so tests/contrast.js does not check them — but every
// theme must define both in both modes, or the seal renders as a flat circle and
// nothing complains.
//
// Taskmaster's four values are the specified ones (§4.4). Themes 02–04 were
// derived by the same relationship, measured off Taskmaster in HSL and applied
// to each primary — the derivation reproduces Taskmaster's four values exactly,
// which is what makes it a relationship rather than four taste calls:
//
//        waxLit                                  waxDark
//   light  L +11.8   S ×0.873   hue warmed 3.7°   L −8.2    S ×1.062   hue held
//   dark   L  +8.2   S ×1.050   hue warmed 1.1°   L −19.8   S ×0.623   hue held
//
// "Warmed" means moved toward 40° (orange) along the shorter arc — which warms a
// green toward yellow and a pink toward red, rather than adding red to everything.
// Saturation is a MULTIPLIER, not an offset: Taskmaster's dark rim drops 23
// points of saturation to read as shadow, and subtracting that from a green
// primary produces grey mush. The results are literals here, not computed at
// build time, because a value nobody can read in this file is a value nobody
// reviews. THEMES 02–04's WAX VALUES ARE AWAITING SARAH'S REVIEW.
//
// ── What is NOT specified in the PRD, and was chosen here ─────────────────────
//   · `ink` for themes 02–04 — §4.2 gives primary, accent, bg and card only.
//     Each is a near-black tinted toward its own theme (green-black, violet-
//     black, olive-black) rather than one shared #222, so dark mode reads as
//     velvet per §4.2. All clear 4.5 on their own bg with large headroom.
//   · `display` for themes 02–04 — §4.2 describes the faces in prose ("a softer
//     old-style serif", "a rounded sans", "a humanist sans with no serif") but
//     names none, and package.json is frozen (AGENTS.md §5) with font packages
//     for theme 01 only. Each stack therefore leads with the intended webfont as
//     a record of design intent and falls through to faces that genuinely exist
//     on the platform. Shipping theme 02–04 means a coordinated package.json
//     change; that is a between-waves decision, not an agent's. Also flagged for
//     Sarah.
//
// Adding theme 05 touches this file and _data/themes.js. No CSS file, ever.

export default {
  // ── 01 · Taskmaster — SHIPPING (_data/site.js → partyTheme) ────────────────
  // Parchment, crimson, charcoal, brass (§7 Q2). The dark crimson is #de7a72,
  // not the original #ce5a54 — that measured 4.21/3.68 and was caught by this
  // pipeline, not by looking (§4.3).
  taskmaster: {
    light: {
      bg: "#faf6f0",
      ink: "#2b2625",
      primary: "#8b1e1e",
      accent: "#d4a359",
      card: "#ffffff",
      waxLit: "#b33a32",
      waxDark: "#6b1414",
    },
    dark: {
      bg: "#221b1a",
      ink: "#f2e9de",
      primary: "#de7a72",
      accent: "#e0b673",
      card: "#2e2624",
      waxLit: "#e89a92",
      waxDark: "#a34f48",
    },
    radius: "2px",
    display: '"Fraunces", Georgia, serif',
  },

  // ── 02 · Forest bathing — DESIGNED ─────────────────────────────────────────
  forest: {
    light: {
      bg: "#f2f4ee",
      ink: "#1f2a24",
      primary: "#2f5d45",
      accent: "#96ae4e",
      card: "#fbfcf8",
      waxLit: "#47815f",
      waxDark: "#204230",
    },
    dark: {
      bg: "#101915",
      ink: "#e6ede7",
      primary: "#74ab8b",
      accent: "#b8ce6b",
      card: "#19241e",
      waxLit: "#8dbca0",
      waxDark: "#4f6b5b",
    },
    radius: "3px",
    display: '"Newsreader", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
  },

  // ── 03 · Birthday — DESIGNED ───────────────────────────────────────────────
  // Light primary/bg measures 4.93 — the tightest pair in the registry, and the
  // reason tests/contrast.js checks themes that are not shipping.
  birthday: {
    light: {
      bg: "#fff8f2",
      ink: "#2a2230",
      primary: "#c8305f",
      accent: "#e8a800",
      card: "#ffffff",
      waxLit: "#d0647f",
      waxDark: "#aa244d",
    },
    dark: {
      bg: "#17122a",
      ink: "#efeaf7",
      primary: "#ff6e96",
      accent: "#ffc93d",
      card: "#221b3c",
      waxLit: "#ff95b1",
      waxDark: "#d13762",
    },
    radius: "14px",
    display: '"Baloo 2", ui-rounded, "Trebuchet MS", "Segoe UI", system-ui, sans-serif',
  },

  // ── 04 · Picnic in the park — DESIGNED ─────────────────────────────────────
  picnic: {
    light: {
      bg: "#f7f6ee",
      ink: "#26231a",
      primary: "#b8402f",
      accent: "#5f8f3e",
      card: "#ffffff",
      waxLit: "#ca6e59",
      waxDark: "#9a3223",
    },
    dark: {
      bg: "#15190f",
      ink: "#eaeddd",
      primary: "#e4796c",
      accent: "#9ac46a",
      card: "#1e2417",
      waxLit: "#ed998d",
      waxDark: "#a84e43",
    },
    radius: "6px",
    display: '"Source Sans 3", Optima, "Gill Sans", "Trebuchet MS", system-ui, sans-serif',
  },
};
