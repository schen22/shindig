# STAGE 10 — Launch verification

## GOAL

Establish that the site is _true_, not merely self-consistent, and hand Sarah a
merge she can make with confidence.

`npm run build` passing means the code agrees with itself. It cannot tell whether
the venue is right, whether the `.ics` lands at the correct hour, or whether the
form still fits its iframe. That is what this stage is for.

## START STATE

All of Stages 0–9 merged to `alpha`. The build passes.

## END STATE

- Every check below has been walked and recorded, pass or fail.
- The orchestrator has approved, committed, and pushed `alpha`.
- Sarah has what she needs to decide about `main`.

## AGENT

The orchestrator (Opus), directly. Items marked **[human]** are Sarah's.

## REVIEW LEVEL

L3 — validation + code review + panel + orchestrator integration approval

## ACCEPTANCE CRITERIA

### Correctness — nothing can check these automatically

- [ ] `public/assets/details.ics` carries the proposed date written in `src/details.md`,
      including the time.
- [ ] **Add the `.ics` to a real calendar and read the time back.** The UTC
      conversion is by hand; an hour's error is invisible in the file and obvious
      to every guest.
- [ ] The "last updated" line on `/details` reflects today.
- [ ] `site.domain` is `shindig-thingamajig.netlify.app` and the OG preview
      resolves — paste the URL into a chat and confirm the seal image and title
      appear, not a bare link.

### The form

- [ ] Iframe height still fits the form with no nested scrollbar, checked on a
      phone.
- [ ] The submit button is reachable without scrolling inside the iframe.
- [ ] "Allow responders to edit after submit" is on.
- [ ] The fallback link opens the form directly.
- [ ] With cookies blocked, load `/rsvp/` and confirm what a guest actually
      sees: if the iframe is blank or refuses to submit, the direct link is
      visible without scrolling and reaches the form.
- [ ] **[human]** A test response lands in the private Sheet, and the Sheet is
      still private.

### Build and access

- [ ] `npm run build` passes, including contrast across all four themes.
- [ ] Only the live theme's palette appears in the built `/assets/site.css`.
- [ ] Netlify publishes `_site` from an empty base directory, production branch
      `main`.

### Behaviour

- [ ] Fonts load — the headline is Fraunces, not Georgia.
- [ ] With JavaScript disabled: the seal still navigates, the toggle is absent,
      the page is readable.
- [ ] With cookies and storage blocked (Safari → Settings → Privacy → Block All
      Cookies): the seal still navigates to `/rsvp/`, and the toggle still
      switches the palette for the session. No control anywhere is displayed
      but unable to do anything.
- [ ] Tab through every page: skip link first, focus always visible, nothing
      invisible receives focus.
- [ ] At 200% browser zoom and at 320px width: no horizontal scrolling, no
      clipped text, and the seal never overlaps the headline.
- [ ] With `prefers-reduced-motion`, the seal still navigates.

### After Sarah merges to `main` — no preview deploy exists to check these on

Netlify builds production only, so these cannot be verified before the merge.
Walk them against the live site immediately after.

- [ ] `robots.txt`, the `noindex` meta and `_headers` are all live on the
      deployed site.
- [ ] `Referrer-Policy: no-referrer` is present on a real response. Every
      outbound link otherwise hands the destination the address of the party
      site, which is the one thing the access measures protect.
- [ ] The three font files are served from `/assets/fonts/` and the display face
      is preloaded.

### After the party is scheduled

- [ ] **[human]** Close the Google Form by hand on the deadline. Nothing does
      this for you.

## NOT INCLUDED

- Merging to `main`. **That is Sarah's, by hand, and nothing here does it.**
- Any code change. A failure here opens a new stage; it is not fixed in place.
- Any new feature, page, or polish pass.

## STOP

Return when every criterion is recorded as passed, failed, or deferred with a
reason. Do not merge to `main`.
