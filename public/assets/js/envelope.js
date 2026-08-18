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

    // Navigate when the opening actually finishes, not on a timer. A hardcoded
    // duration was either felt as lag (900ms, even after the spin had ended) or
    // cut the animation off entirely (0ms) — and either way it silently drifts
    // from --spin-lg the moment that token changes.
    //
    // The top half's transform is the longest-running of the three transitions
    // and the one that reads as "opening", so it is the one worth waiting for.
    // prefers-reduced-motion collapses every duration to 0.01ms globally
    // (styles/base.css), so transitionend fires almost immediately for that
    // visitor and navigation stays effectively instant.
    var top = envelope.querySelector(".envelope-half--top");
    var gone = false;
    function go() {
      if (gone) return;
      gone = true;
      location.assign("/rsvp/");
    }

    if (top) {
      top.addEventListener("transitionend", function (e) {
        if (e.propertyName === "transform") go();
      });
    }

    // Safety net: transitionend does not fire if the transition never starts —
    // a display change, a browser that drops it, or transitions disabled
    // outright. Without this the seal would be a dead link in those cases,
    // which is exactly what criterion 2 forbids. 1200ms is a ceiling, not a
    // schedule: it only ever runs when the event did not.
    setTimeout(go, 1200);
  });
})();
