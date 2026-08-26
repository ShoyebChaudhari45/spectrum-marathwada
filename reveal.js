/* =====================================================
   CLICK-TO-REVEAL — shared by the card-grid slides
   -----------------------------------------------------
   Any slide whose content carries .reveal-item children
   starts with them hidden; clicking anywhere on the slide
   brings the next one in, one per click, in document order.

   Once they are all up, further clicks do nothing — the
   grid can't be clicked away by accident mid-presentation,
   which is the same rule the spectrum slide follows.
   Reload the slide to run it again.
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

  let shown = 0;

  function advance() {
    if (shown >= items.length) return;
    // Under reduced motion, bring the whole grid up at once rather than
    // making someone click through an animation they asked not to see.
    if (reduceMotion) {
      items.forEach((el) => el.classList.add("is-in"));
      shown = items.length;
      return;
    }
    items[shown].classList.add("is-in");
    shown += 1;
  }

  slide.addEventListener("click", (e) => {
    // the deck's own controls keep their own jobs
    if (e.target.closest(".page-nav, .fs-btn")) return;
    advance();
  });

  // Space and Enter advance too, for presenters driving from a clicker.
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      advance();
    }
  });
})();
