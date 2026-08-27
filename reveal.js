/* =====================================================
   AUTO-REVEAL — shared by the card-grid slides
   -----------------------------------------------------
   Any slide whose content carries .reveal-item children
   starts with them hidden; on load they come in on their
   own, one at a time in document order, no click needed.

   The items' shared parent gets .is-active the moment the
   first one starts revealing — lets that container itself
   (e.g. a card shadow/frame) stay invisible until there is
   something inside it to show, instead of sitting there as
   an empty box while nothing has appeared yet.

   Once they are all up, that's it — reload the slide to
   run it again.
   ===================================================== */

(() => {
  "use strict";

  const slide = document.querySelector(".slide");
  if (!slide) return;

  const items = [...slide.querySelectorAll(".reveal-item")];
  if (!items.length) return;

  const stage = items[0].parentElement;

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Under reduced motion, bring the whole grid up at once rather than
  // stepping through an animation someone asked not to see.
  if (reduceMotion) {
    if (stage) stage.classList.add("is-active");
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const START_DELAY = 600;  // lets the slide itself settle in first
  const STEP_DELAY = 950;   // gap between each item appearing

  items.forEach((el, i) => {
    setTimeout(() => {
      if (i === 0 && stage) stage.classList.add("is-active");
      el.classList.add("is-in");
    }, START_DELAY + i * STEP_DELAY);
  });
})();
