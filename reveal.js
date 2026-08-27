/* =====================================================
   AUTO-REVEAL — shared by the card-grid slides
   -----------------------------------------------------
   Any slide whose content carries .reveal-item children
   starts with them hidden; on load they all come in
   together, no click needed.

   The items' shared parent gets .is-active at the same
   moment — lets that container itself (e.g. a card shadow/
   frame) stay invisible until there is something inside it
   to show, instead of sitting there as an empty box while
   nothing has appeared yet.
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

  // Long enough that the logos + heading (already on screen at load) read
  // as showing up first, with the image animation following after them —
  // not the two feeling simultaneous.
  const START_DELAY = reduceMotion ? 0 : 1400;

  setTimeout(() => {
    if (stage) stage.classList.add("is-active");
    items.forEach((el) => el.classList.add("is-in"));
  }, START_DELAY);
})();
