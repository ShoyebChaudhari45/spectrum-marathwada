/* =====================================================
   TITLE SLIDE — click to re-tint the wordmark
   -----------------------------------------------------
   Clicking anywhere on the slide toggles "Spectrum" between
   plain white and the full seven-colour gradient, animated
   into a flowing wave. Same seven hues as the bottom wave
   and the seven bands on the next slide, so the deck's
   palette is consistent.
   ===================================================== */

(() => {
  "use strict";

  const slide = document.querySelector(".title-slide");
  const word = slide && slide.querySelector("h1");
  if (!word) return;

  // Two full colour cycles back to back, so animating background-position
  // across exactly half the gradient's width loops with no visible seam —
  // that's what turns the static fill into a flowing wave.
  const RAINBOW =
    "linear-gradient(100deg," +
    " #ff3b30 0%, #ff9500 8.5%, #ffd60a 16.5%," +
    " #34c759 25%, #0a84ff 33.5%, #5e5ce6 42%, #ff2d92 50%," +
    " #ff3b30 50%, #ff9500 58.5%, #ffd60a 66.5%," +
    " #34c759 75%, #0a84ff 83.5%, #5e5ce6 92%, #ff2d92 100%)";

  // false = plain white, the state the slide loads in.
  let isWave = false;

  function paint() {
    // Always clear the gradient trio first, so plain white never
    // inherits a leftover clip and paints as a filled box.
    word.style.removeProperty("background-image");
    word.style.removeProperty("background-clip");
    word.style.removeProperty("-webkit-background-clip");
    word.style.removeProperty("-webkit-text-fill-color");
    word.classList.remove("is-wave");

    if (!isWave) return; // back to the stylesheet's own white

    // The gradient has to be clipped to the glyphs AND the fill made
    // transparent — without the clip it paints the whole element box.
    // .is-wave (slides.css) sizes and animates it into a flowing wave.
    word.style.backgroundImage = RAINBOW;
    word.style.setProperty("background-clip", "text");
    word.style.setProperty("-webkit-background-clip", "text");
    word.style.setProperty("-webkit-text-fill-color", "transparent");
    word.classList.add("is-wave");
  }

  slide.addEventListener("click", (e) => {
    // the deck's own controls keep their own jobs
    if (e.target.closest(".page-nav, .fs-btn")) return;
    isWave = !isWave;
    paint();
  });
})();
