/* =====================================================
   AUTO-REVEAL — seek slides (08-national-demands, 09-commitments)
   -----------------------------------------------------
   Two-stage entrance, both firing at once on load:
     1. Heading — fades up (slides.css)
     2. Image   — curtain-drop starts here, alongside it

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

  // This script runs synchronously as the page parses, before the browser
  // has painted the masks' starting position (transform: translateY(0%)).
  // Adding .is-in in that same tick sometimes fires the transition and
  // sometimes doesn't — the browser can coalesce the style change with
  // the initial one if it hasn't painted a frame yet, so the curtain-drop
  // just snaps straight to revealed instead of animating. A double rAF
  // guarantees a real paint of the starting state lands first, so the
  // transition reliably plays every time.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      items.forEach((el) => el.classList.add("is-in"));
    });
  });
})();
