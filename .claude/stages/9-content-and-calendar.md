# STAGE 9 — Content and calendar file

## GOAL

Write the calendar file, and confirm it agrees with the page by hand — the
repo's only by-hand agreement.

## START STATE

- `/details` renders fully against the mock set (Stage 8).
- `public/assets/details.ics` does not exist.

## END STATE

- `public/assets/details.ics` exists, linked from `/details` as "Add to
  calendar", plus a Google Calendar template link for people who will not
  download a file.
- The `.ics` carries **the same date and time as `src/details.md`**.
- `npm run build` passes.

## THE FILE, EXACTLY

RFC 5545, minimal — no `RRULE`, no `ATTENDEE`, no `VALARM`. Someone else's
calendar is not the place to be clever.

```text
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//A Shindig Thingamajig//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:shindig-2026-09-05@shindig-thingamajig.netlify.app
DTSTAMP:20260816T000000Z
DTSTART:20260905T210000Z
DTEND:20260906T010000Z
SUMMARY:A Shindig Thingamajig
DESCRIPTION:Hang out with Sarah and friends. Details: https://shindig-thingamajig.netlify.app/details/
LOCATION:TBC — address in the group chat
URL:https://shindig-thingamajig.netlify.app/details/
END:VEVENT
END:VCALENDAR
```

## FOUR THINGS THAT ARE EASY TO GET WRONG

In the order they will bite:

1. **Times are UTC with a trailing `Z`, converted by hand.** `2pm PT` on Sep 5
   2026 is inside daylight saving, so Pacific is UTC−7 and 2pm becomes
   `210000Z`. Get it wrong and the invite lands in everyone's calendar an hour
   out. Using UTC deliberately avoids needing a `VTIMEZONE` block, which is the
   other way to do this and requires far more to be correct.
2. **`DTEND` is required.** Omit it and clients guess — some assume 30 minutes,
   some assume all day. Four hours is the assumed default; change it with the
   date.
3. **Line endings must be CRLF.** RFC 5545 requires it and some clients reject
   LF-only files outright. A file that opens fine on a Mac and fails silently on
   Outlook is exactly the bug nobody finds before the party.
4. **`UID` must change if the event moves.** Reusing a `UID` makes calendars
   treat the new file as an *update* to the old event — right for a reschedule,
   wrong for a different party.

Served as `text/calendar`; Netlify infers this from the extension.

## IN SCOPE

- `public/assets/details.ics`
- `src/details.md` — the "Add to calendar" link and the Google Calendar template
  link only

## NOT INCLUDED

- Replacing the mock values with real ones. That is a human step on Stage 10 —
  build against the same mock date the `.ics` above uses.
- Any build step, generator, or script that emits the `.ics`. It is a static
  text file; that is the point.
- Closing the Google Form, or anything that tries to enforce the deadline.
- Any other page or component.

## DEPENDENCIES

Stage 8.

## AGENT

content-worker

## REQUIRED READING

- this file
- `src/details.md`

## VALIDATION

`npm run build`, plus: open the `.ics` in a real calendar and read the time back.

## REVIEW LEVEL

L1 — validation + code review

## ACCEPTANCE CRITERIA

1. The `.ics` date and time match `src/details.md` exactly.
2. Line endings are CRLF throughout.
3. `DTSTART` and `DTEND` are both present, both UTC with a trailing `Z`.
4. The "Add to calendar" link resolves, and a Google Calendar template link is
   present alongside it.
5. `npm run build` passes.
6. No file outside IN SCOPE is touched.

## STOP

Return when all six acceptance criteria are true. Do not begin Stage 10.
