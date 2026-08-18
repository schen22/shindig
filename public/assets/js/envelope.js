// public/assets/js/envelope.js — Stage 5. The seal on "/".
//
// The seal is a plain <a href="/rsvp/">, so with this script absent, failed,
// or JavaScript disabled it still navigates (§4.0.4) — that is why the click
// handler below only ever intercepts, never replaces, the link. Split per
// feature: no shared site.js (5-home-envelope.md NOT INCLUDED).
//
// This file writes NO storage. It previously set sessionStorage
// "envelopeOpened", which the FROZEN inline script in _includes/base.liquid
// reads before first paint to add the "envelope-open" class. That persistence
// was removed (Sarah, 2026-08-18): with the seal hidden in the opened state
// and header and footer both suppressed on "/", a return visit left the page
// with no route to /rsvp/ at all. The flag is now never set, so the frozen
// read is always falsy and the envelope always renders closed.

(function () {
  var seal = document.querySelector(".seal");
  var envelope = seal && seal.closest(".envelope");
  if (!seal || !envelope) return;

  seal.addEventListener("click", function (event) {
    // Already playing — ignore a second activation rather than restart the
    // transform mid-flight, which would read as a counter-spin.
    if (envelope.classList.contains("is-opening")) return;

    event.preventDefault();

    envelope.classList.add("is-opening");

    // Invisible must not mean focusable: the seal starts fading/spinning
    // immediately (or, under reduced motion, is already visually gone within
    // 0.01ms — see below), so it comes out of the tab order for whatever
    // window it still occupies the page. The click already happened; there is
    // nothing left for a keyboard user to do with it.
    seal.setAttribute("tabindex", "-1");

    // prefers-reduced-motion collapses the CSS transition to 0.01ms globally
    // (styles/base.css), so a reduced-motion visitor sees the seal vanish and
    // the halves part instantly, then nothing — the page would otherwise sit
    // visibly unchanged for the rest of the 900ms with no animation left to
    // finish. That full duration exists to let the (non-reduced) spin play out
    // before navigating out from under it; with no animation there is no race
    // to protect, so reduced motion navigates immediately instead of waiting
    // on a timer whose only job just went away.
    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(function () {
      location.assign("/rsvp/");
    }, reduced ? 0 : 900);
  });
})();
