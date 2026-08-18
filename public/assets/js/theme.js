/* public/assets/js/theme.js — Stage 6.
 *
 * The write half of the read contract already implemented by the frozen
 * inline <head> script in base.liquid: that script applies whatever is in
 * localStorage.theme on every load, before first paint. This file is what
 * puts something there — it never resolves or stamps a mode on load itself
 * (rejected in the Stage 6 contract: that would make dark mode require
 * JavaScript). It only reacts to a click on the toggle, and keeps the
 * button's aria-label in sync with the theme that's actually in effect,
 * explicit or inherited from the OS.
 *
 * data-theme and the icon glyph it shows are never touched from here beyond
 * setting the attribute — which glyph is visible is decided entirely by
 * toggle.css's attribute selectors, so the icon can't drift out of sync with
 * the palette that's actually applied.
 */
(function () {
  "use strict";

  var toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function effectiveTheme() {
    var stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return media.matches ? "dark" : "light";
  }

  function labelFor(theme) {
    var next = theme === "dark" ? "light" : "dark";
    return "Switch to " + next + " theme";
  }

  function syncLabel() {
    toggle.setAttribute("aria-label", labelFor(effectiveTheme()));
  }

  syncLabel();

  toggle.addEventListener("click", function () {
    var next = effectiveTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
    syncLabel();
  });

  // No explicit choice stored — the OS preference still drives the label
  // (and, via toggle.css's media query, the icon and palette) live.
  media.addEventListener("change", function () {
    if (!localStorage.getItem("theme")) syncLabel();
  });
})();
