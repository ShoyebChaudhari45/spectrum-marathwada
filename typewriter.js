/* =====================================================
   TYPEWRITER — closing slide's Hindi/English line
   -----------------------------------------------------
   Types out .typewriter's own text content one character
   at a time, starting from empty. Works on the element's
   real text (not a hardcoded copy), so editing the line in
   the HTML needs no matching change here — and it degrades
   fine with no script at all, since the full line is what's
   already sitting in the markup before this runs.
   ===================================================== */

(() => {
  "use strict";

  const el = document.querySelector(".typewriter");
  if (!el) return;

  const full = el.textContent;

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) return; // leave the full line showing, no animation

  const START_DELAY = 500; // lets the slide itself settle in first
  const STEP_DELAY = 45;   // ms per character

  el.textContent = "";
  // A blinking caret while typing, removed once the line is complete —
  // a plain CSS border-right on .typewriter, toggled by this class.
  el.classList.add("is-typing");

  let i = 0;
  function typeNext() {
    i += 1;
    el.textContent = full.slice(0, i);
    if (i < full.length) {
      setTimeout(typeNext, STEP_DELAY);
    } else {
      el.classList.remove("is-typing");
    }
  }

  setTimeout(typeNext, START_DELAY);
})();
