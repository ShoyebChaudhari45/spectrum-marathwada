/* =====================================================
   AUTO-REVEAL — seek slides (08-national-demands, 09-commitments)
   -----------------------------------------------------
   Three-stage entrance:
     1. Logos   — visible immediately (deck.js chrome, no animation)
     2. Heading — fades up from t=0.5s, done at t=1.1s  (slides.css)
     3. Image   — curtain-drop starts at t=1.4s here, after heading lands

   The .seek-mask divs are the same colour as the page background so
   they hide the image without any opacity trick on the stage itself.
   Each mask slides translateY(100%) when .is-in is added, uncovering
   its panel from top to bottom.
   ===================================================== */

(() => {
  "use strict";

  const slide = document.querySelector(".slide");
  if (!slide) return;

  const items = [...slide.querySelectorAll(".reveal-item")];
  if (!items.length) return;

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 0.5s heading delay + 0.6s heading duration = 1.1s for heading to land.
  // 1.4s gives a clean 0.3s beat before the curtains drop.
  const START_DELAY = reduceMotion ? 0 : 1400;

  setTimeout(() => {
    items.forEach((el) => el.classList.add("is-in"));
  }, START_DELAY);
})();
