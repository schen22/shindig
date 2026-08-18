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

    // Navigate immediately (Sarah, 2026-08-18). This was a 900ms timer matching
    // --spin-lg, so the seal's turn could finish before the page changed under
    // it — but a hardcoded guess at an animation's duration is felt as lag on
    // every visit, and it drifts the moment --spin-lg changes. Backlog item
    // envelope-navigation-listener replaces this with a transitionend /
    // animationend listener, which navigates when the spin actually ends.
    setTimeout(function () {
      location.assign("/rsvp/");
    }, 0);
  });
})();
