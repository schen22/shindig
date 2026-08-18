// public/assets/js/envelope.js — Stage 5. The seal on "/".
//
// The seal is a plain <a href="/rsvp/">, so with this script absent, failed,
// or JavaScript disabled it still navigates (§4.0.4) — that is why the click
// handler below only ever intercepts, never replaces, the link. Split per
// feature: no shared site.js (5-home-envelope.md NOT INCLUDED).
//
// This file does not read sessionStorage.getItem("envelopeOpened") — the
// FROZEN inline script in _includes/base.liquid already does that, before
// first paint, and sets the "envelope-open" class on <html> that
// styles/components/envelope.css reads. This file only ever WRITES that key,
// on the click that opens the envelope.

(function () {
  var seal = document.querySelector(".seal");
  var envelope = seal && seal.closest(".envelope");
  if (!seal || !envelope) return;

  seal.addEventListener("click", function (event) {
    // Already playing — ignore a second activation rather than restart the
    // transform mid-flight, which would read as a counter-spin.
    if (envelope.classList.contains("is-opening")) return;

    event.preventDefault();

    sessionStorage.setItem("envelopeOpened", "1");
    envelope.classList.add("is-opening");

    // ~900ms matches --spin-lg (styles/tokens.css) — the seal's full turn.
    // prefers-reduced-motion collapses the CSS transition (styles/base.css)
    // but never touches this timer, so navigation still happens on schedule
    // (criterion 5) rather than racing an animation that no longer plays.
    setTimeout(function () {
      location.assign("/rsvp/");
    }, 900);
  });
})();
