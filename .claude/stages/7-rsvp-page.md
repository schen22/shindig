# STAGE 7 — RSVP page

## GOAL

Embed the Google Form with enough of our own copy that the page does not read as
a naked iframe, and a fallback that works when the embed does not.

## START STATE

- `src/rsvp.liquid` is a Stage 0 stub already carrying the fallback link.
- `styles/components/form-embed.css` does not exist.

## END STATE

- The form is embedded in a responsive container: container `width: 100%;
max-width: 640px`, iframe at `width: 100%`, `height: 1400px`,
  `title="RSVP form"`. Google's iframe does not auto-size to its content.
- **A direct link to the form sits below the embed, always visible** — not only
  as an error state.
- Page titles and callout copy come from `_data/themes.js`.
- `npm run build` passes.

## WHY THE FALLBACK LINK IS ALWAYS VISIBLE

Content blockers, strict privacy modes and Google outages all render the iframe
as a blank box with no route forward, and **the page cannot detect any of them.**
One always-visible link covers every case and costs nothing.

```html
<p class="form-fallback">
  Form not loading?
  <a href="https://forms.gle/3fsynXeHFPaYjCmX6">Open it directly</a>.
</p>
```

## THE IFRAME IS OUTSIDE OUR CONTROL

Its questions are Google's and **cannot be restyled** — only the frame around
them is ours. Its internal keyboard behaviour is Google's; tab order passes into
it and back out. **Do not attempt to manage focus inside it.** Ensure the
surrounding page is navigable and the iframe carries a `title`.

## IN SCOPE

- `src/rsvp.liquid`
- `styles/components/form-embed.css`

## NOT INCLUDED

- Any attempt to restyle, resize-detect, or script the form's contents.
- Any other external origin. The form is the one exception; nothing else.
- Tracking the form's questions or candidate dates in a repo file. There is
  nothing to keep in sync — this was proposed and rejected.
- Any other page.
- A new copy key.

## DEPENDENCIES

Stages 0, 2, 4.

## AGENT

implementer

## REQUIRED READING

- this file
- `src/rsvp.liquid`, `styles/tokens.css`

## VALIDATION

`npm run build`

## REVIEW LEVEL

L2 — validation + code review, then panel at the group boundary

## ACCEPTANCE CRITERIA

1. The iframe carries a `title` attribute.
2. The fallback link is visible without any error condition.
3. The page carries enough of its own copy not to read as a bare iframe.
4. Nothing scripts or restyles the iframe's contents.
5. `npm run build` passes.
6. No file outside IN SCOPE is touched.

## NOTE FOR STAGE 10

The 1400px height is **a measurement with a shelf life.** It must be re-checked
whenever the form gains or loses a question — too short and the submit button
ends up behind a nested scrollbar on mobile, which breaks the only conversion on
the site.

## STOP

Return when all six acceptance criteria are true. Do not begin another stage.
