// _data/themes.js — THE SINGLE SOURCE OF THEMED COPY (PRD §4.5, §3.4.2).
//
// Party-specific words live here and nowhere else — a template that hard-codes
// a line for one theme strands it the moment the site switches themes. Every
// theme below defines all fifteen keys tests/copy.js checks for; a missing key
// renders as silent empty markup in Liquid; see that file for the full list and
// the rationale.
//
// Nav labels ("RSVP", "Details") are deliberately NOT themed — they live in
// _data/nav.js and must not appear here.
//
// No real party details (date, venue, bring, wear, plus-ones) belong in this
// file — those land in Stage 9. Everything here is atmosphere, not logistics.

export default {
  // ── 01 · Taskmaster — SHIPPING ──────────────────────────────────────────
  // eyebrow/headline/subheadline/tagline/wordmark/footerLine/footerLinkText/
  // footerLinkUrl are fixed by the Stage 4 contract, verbatim.
  taskmaster: {
    wordmark: "TM",
    eyebrow: "Task #1",
    headline: "Partake in a Shindig Thingamajig",
    subheadline: "i.e. come and have fun!",
    tagline: "Sarah edition",
    sealLabel: "RSVP",
    titleHome: "RSVP",
    titleRsvp: "Task #2: Reply",
    titleDetails: "What to expect",
    calloutTitle: "Hangout with awesome friends (i.e. me)",
    calloutBody:
      " Respond when you get this, or latest by Sunday, 8/22 pl0x. If the form's stuck, there's a link to it directly below the embedded attempt lulz.",
    detailsIntro:
      "Good vibes. Honestly just show up and see what happens. This website is an entirely extra and unnecessary use of time and resources given I could've just sent the google form, but shhh. This all is kind of an experiment. Anyways, here's what to expect:",
    footerLine: "Comethru and play!! Inspired by ",
    footerLinkText: "Taskmaster UK",
    footerLinkUrl: "https://www.taskmaster.tv/",
  },

  // ── 02 · Forest bathing ──────────────────────────────────────────────────
  // Voice: quiet, unhurried, sensory. Wordmark is a placeholder — flagged in
  // the stage report, not a real design decision.
  forest: {
    wordmark: "[WORDMARK]",
    eyebrow: "An Invitation Outdoors",
    headline: "Come wander into the woods with Sarah",
    subheadline: "Bring your quiet and your curiosity",
    tagline: "Sarah, among the trees",
    sealLabel: "RSVP",
    titleHome: "The Clearing",
    titleRsvp: "Sign the Trail Log",
    titleDetails: "Trail Notes",
    calloutTitle: "Lost the Signal?",
    calloutBody:
      "Deep woods, spotty reception — if the form won't settle in, the direct link just below will get you there all the same.",
    detailsIntro:
      "A few notes before you set out — nothing that can't wait until the trailhead, but worth a slow read all the same.",
    footerLine: "Wander in, wander out, and thank you for the quiet company.",
    footerLinkText: "Shinrin-yoku, explained",
    footerLinkUrl: "https://en.wikipedia.org/wiki/Shinrin-yoku",
  },

  // ── 03 · Birthday ─────────────────────────────────────────────────────────
  // Voice: bright, celebratory, a little breathless. Wordmark is a
  // placeholder — flagged in the stage report, not a real design decision.
  birthday: {
    wordmark: "[WORDMARK]",
    eyebrow: "It's A Birthday Thing",
    headline: "Come celebrate with Sarah and friends",
    subheadline: "Cake, candles, and good company",
    tagline: "Sarah's birthday edition",
    sealLabel: "RSVP",
    titleHome: "You're Invited",
    titleRsvp: "RSVP for Cake",
    titleDetails: "What To Know",
    calloutTitle: "Form Being Shy?",
    calloutBody:
      "If it's hiding, don't blow out the candles yet — just tap the direct link below and RSVP that way instead.",
    detailsIntro:
      "The important bits are all below — read through before you RSVP, then start counting down the days.",
    footerLine:
      "Thanks for celebrating with us — see you when the candles are lit.",
    footerLinkText: "the history of birthdays",
    footerLinkUrl: "https://en.wikipedia.org/wiki/Birthday",
  },

  // ── 04 · Picnic in the park ──────────────────────────────────────────────
  // Voice: sunny, unhurried, low-key. Wordmark is a placeholder — flagged in
  // the stage report, not a real design decision.
  picnic: {
    wordmark: "[WORDMARK]",
    eyebrow: "An Afternoon Outside",
    headline: "Come picnic with Sarah and friends",
    subheadline: "Blankets on the grass, baskets to share",
    tagline: "Sarah's picnic edition",
    sealLabel: "RSVP",
    titleHome: "The Invite",
    titleRsvp: "Claim Your Spot",
    titleDetails: "Picnic Notes",
    calloutTitle: "Form Stuck in the Grass?",
    calloutBody:
      "If the embed won't unfold like a picnic blanket, the direct link right below opens it just fine.",
    detailsIntro:
      "Everything you need to picture the day is right below — give it a read before the day arrives.",
    footerLine:
      "Thanks for coming out to the grass with us — see you out there.",
    footerLinkText: "the history of picnics",
    footerLinkUrl: "https://en.wikipedia.org/wiki/Picnic",
  },
};
