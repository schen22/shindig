# A Shindig Thingamajig

A themed static invite for one casual gathering, with RSVPs collected by an
embedded Google Form. Eleventy v3 + Liquid, vanilla CSS, hosted free on Netlify.

**Three pages, and only three:** `/` (the envelope), `/rsvp/` (the form),
`/details/` (hand-written prose). A fourth page is a change of scope, not a task.

The site is themed to match the party. One theme is live at a time, chosen at
build in `_data/site.js`. Four are designed; Taskmaster is theme 01 and ships.

## Hard constraints

- **Zero cost.** Hosting, services and APIs sit in non-expiring free tiers.
  Build-time devDependencies are not a cost and are not covered by this rule.
- **Nothing personal reaches the page.** Responses live in a private Google
  Sheet that only Sarah opens. Nothing on the site is derived from them.
- **The build fetches nothing and the page fetches nothing** — with exactly one
  exception, below. No CDN, no hotlinked image, no analytics, no API, no
  serverless function, no database. Fonts are npm packages copied at build time.
- **No secrets exist.** A task that appears to need one has been misread.
- **Browser floor: Baseline 2023** — Safari 16.4+, Chrome/Edge 111+, Firefox
  113+. A decision, not a description: it is fed to the minifier as a target.
- **Single sources of truth.** Colour: `_data/palettes.js`. Themed copy:
  `_data/themes.js`. Nav: `_data/nav.js`. Live theme: `_data/site.js`.
  A second copy of any of these is a defect, not a convenience.
- **WCAG 2.2 AA.** Keyboard-operable throughout. Contrast is measured, never
  judged. Motion is a reveal, never a gate, and honours `prefers-reduced-motion`.
- **Mobile-first**, vanilla CSS, no frameworks.
- **`main` is Sarah's.** Netlify deploys it on push. Nothing in this repository
  may merge to `main`.

## The Google Form is the one external thing

`/rsvp/` embeds `https://forms.gle/3fsynXeHFPaYjCmX6` in an iframe. This is the
single deliberate exception to "the page fetches nothing", and it is bounded:

- The form is authored in Google's UI. **The repository does not track its
  shape** — not its questions, not its candidate dates. There is nothing to keep
  in sync and no file to add for it.
- **Its questions cannot be restyled.** Only the frame around them is ours.
- **Its internal keyboard behaviour is Google's.** Do not manage focus inside
  it. Ensure the surrounding page is navigable and the iframe carries a `title`.
- **A direct link to the form is always visible** beside the embed — content
  blockers and outages render the iframe as a blank box with no route forward.
- Any *other* external origin, anywhere, is out of scope. Report it.

## Scope rules — every task, no exceptions

1. **Prefer the smallest implementation that satisfies the current stage.**
2. **Do not implement future stages.** A stage's NOT INCLUDED list is binding.
3. **Do not infer requirements.** Build what the contract states. If it is
   silent, it is out of scope — ask, do not fill the gap. "The spec implies",
   "we will probably need", and "this makes it easier later" are not
   requirements.
4. **Do not add abstractions for requirements that do not exist yet.** Three
   pages and four themes are the whole of it. A component system, a plugin
   layer, or a generalised helper for one call site is over-building.
5. **Dependencies are authorised, never assumed.** `package.json` is closed.
   Report a missing dependency and stop; do not install it, do not vendor it,
   and do not work around it with a hand-rolled copy.
6. **Context discipline.** Read your stage contract and its REQUIRED READING.
   Do not read the whole repository, do not read other stages' contracts, and do
   not quote long files back — cite `path:line`. Return the structured report.
7. **Finish or say so.** If part of your task is blocked, complete the rest and
   state exactly what you left and why. Silence reads as done.

## Ownership

**Exactly one agent writes any given file. Every agent may read every file.**

Write only the paths your stage contract lists under IN SCOPE. Anything else —
report it. The coordination rules behind this, including which files are frozen,
are in `.claude/workflows/parallel-execution.md` and are the orchestrator's.

## Validation

`npm run build` must pass before you report done. It runs the checks in `tests/`
and fails on any of them.

## Authority

| Question | Decided by |
| :--- | :--- |
| What we are building | this file |
| What must be done now | the stage contract in `.claude/stages/` |
| Where work stands | `.claude/project-state.yaml` |
| How work is sequenced | `.claude/workflows/stage-execution.md` |
| How parallel work is coordinated | `.claude/workflows/parallel-execution.md` |
| Whether a stage is approved | the orchestrator (Opus) — nobody else |
| Whether it reaches `main` | Sarah, by hand |

If this file and a stage contract disagree, this file wins on requirements and
the contract wins on scope. **Report the contradiction; do not pick one.**
