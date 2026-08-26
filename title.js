/* =====================================================
   TITLE SLIDE — click to re-tint the wordmark
   -----------------------------------------------------
   Clicking anywhere on the slide steps "Spectrum" through
   the seven spectrum colours and then the full gradient,
   before returning to plain white. Same seven hues as the
   bottom wave and the seven bands on the next slide, so
   the deck's palette is consistent.
   ===================================================== */

(() => {
  "use strict";

  const slide = document.querySelector(".title-slide");
  const word = slide && slide.querySelector("h1");
  if (!word) return;

  const RAINBOW =
    "linear-gradient(100deg," +
    " #ff3b30 0%, #ff9500 17%, #ffd60a 33%," +
    " #34c759 50%, #0a84ff 67%, #5e5ce6 84%, #ff2d92 100%)";

  // null = plain white, the state the slide loads in.
  const TINTS = [
    null,
    "#ff3b30", // red      — Funding & Trade
    "#ff9500", // orange   — Education & Skills
    "#ffd60a", // yellow   — Creativity
    "#34c759", // green    — Hospitality
    "#0a84ff", // blue     — Value Addition
    "#5e5ce6", // violet   — Engineering
    "#ff2d92", // magenta  — Legacy
    RAINBOW,   // all seven at once
  ];

  let i = 0;

  function paint(tint) {
    // Always clear the gradient trio first, so a solid tint can never
    // inherit a leftover clip and paint as a filled box.
    word.style.removeProperty("background-image");
    word.style.removeProperty("background-clip");
    word.style.removeProperty("-webkit-background-clip");
    word.style.removeProperty("-webkit-text-fill-color");
    word.style.removeProperty("color");

    if (tint === null) return; // back to the stylesheet's own colour

    if (tint === RAINBOW) {
      // The gradient has to be clipped to the glyphs AND the fill made
      // transparent — without the clip it paints the whole element box.
      word.style.backgroundImage = tint;
      word.style.setProperty("background-clip", "text");
      word.style.setProperty("-webkit-background-clip", "text");
      word.style.setProperty("-webkit-text-fill-color", "transparent");
      return;
    }

    word.style.color = tint;
  }

  slide.addEventListener("click", (e) => {
    // the deck's own controls keep their own jobs
    if (e.target.closest(".page-nav, .fs-btn")) return;
    i = (i + 1) % TINTS.length;
    paint(TINTS[i]);
  });
})();
