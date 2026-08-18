# STAGE 0 — Static scaffold

**Status: complete.** Merged to `alpha` at `60df7cd`. Kept as the record of what
this stage owned and why the shell is frozen.

## GOAL

Create the minimum Eleventy project structure supporting the three approved
pages, complete enough that no later stage reopens the shell.

## END STATE

- `npx eleventy --serve` renders three pages, unstyled.
- Home, RSVP and Details routes exist.
- Shared `base.liquid` layout exists, with every include slot, the inline
  `<head>` script, and the skip link.
- Nav shows correct `aria-current`; header and footer are both absent on `/`.
- `netlify.toml`, `_headers` and `robots.txt` present and valid.

## OWNED

`package.json` · `.nvmrc` · `.gitignore` · `eleventy.config.js` ·
`netlify.toml` · `_headers` · `public/robots.txt` · `_data/site.js` ·
`_data/nav.js` · `_includes/base.liquid` · `_includes/header.liquid` ·
`_includes/footer.liquid` · `_includes/theme-toggle.liquid` (placeholder) ·
stub `src/index.liquid`, `src/rsvp.liquid`, `src/details.md`

## WHY THESE ARE NOW FROZEN

Everything downstream imports from this shell. `package.json` in particular is
the most conflict-prone file in any JS project and the one several agents would
otherwise all want to touch — every dependency the project will ever need was
installed here. See `workflows/parallel-execution.md`.
