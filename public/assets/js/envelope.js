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

    // Warm /rsvp/ now, so the ~900ms opening covers the round trip instead of
    // running before it: navigation below does not start until the halves have
    // finished clearing, and without this the network only begins at that
    // point. Same-origin and our own page — the stylesheet and fonts /rsvp/
    // needs are already in this document's cache, so its HTML is the only
    // thing left to fetch. Approved by Sarah, 2026-08-18: CLAUDE.md's "the
    // page fetches nothing" governs external origins, which this is not.
    //
    // Failures are swallowed on purpose. This is an optimisation and the
    // navigation must never depend on it having succeeded — an unhandled
    // rejection here would be a console error on every visit for anyone
    // offline or behind a blocker.
    try {
      fetch("/rsvp/", { credentials: "same-origin" }).catch(function () {});
    } catch (e) {}

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

  // Coming BACK to "/" (Stage 12). The opening state was left on deliberately —
  // the page navigates away, so there is nothing to reset. That holds going
  // forward and fails coming back: a back navigation is served from the
  // browser's back/forward cache, which restores this DOM exactly as it was
  // left. Without the reset below, "/" returns with both halves still
  // translated off-viewport and the seal at opacity 0 with pointer-events
  // none — and "/" carries no header, no footer and no nav, so what the
  // visitor gets is a blank field with no route anywhere. That is the same
  // dead end the sessionStorage flag was withdrawn for on 2026-08-18, arriving
  // through a different door.
  //
  // Unconditional rather than branching on event.persisted: on an ordinary
  // load the class is absent and the attribute unset, so both calls do
  // nothing, and pageshow fires only at load or restore — never mid-click.
  //
  // No counter-spin to guard against: the transitions are declared INSIDE
  // .envelope.is-opening (envelope.css:187, 199, 204, 211), so dropping the
  // class drops the transitions with the transforms and the revert is instant.
  window.addEventListener("pageshow", function () {
    envelope.classList.remove("is-opening");
    seal.removeAttribute("tabindex");
  });
})();
