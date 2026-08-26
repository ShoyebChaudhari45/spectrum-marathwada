/* =====================================================
   THE SPECTRUM OF MARATHWADA — interaction layer
   Runs on the spectrum slide only.
   -----------------------------------------------------
   The slide is a click-through sequence. Clicking anywhere
   on it advances one step:

     on load  the artwork is on screen at rest — logos, the baked
              title block, the map/prism, the landscape strip. No
              ray, no colour, nothing to click for.
     click 1  the ray draws in from the left and hits the prism;
              the baked title block fades out to make room
     click 2  red      — Funding & Trade
     click 3  orange   — Education & Skills
     click 4  yellow   — Creativity
     click 5  green    — Hospitality
     click 6  blue     — Value Addition
     click 7  violet   — Engineering
     click 8  magenta  — Legacy
     click 9  Legacy closes, leaving all seven as ribbons

   That last click matters: without it Legacy would stay open forever,
   since it is the final band and nothing follows to displace it. After
   it, further clicks do nothing — the full spectrum cannot be clicked
   away by accident. Reload the slide to run it again.

   Colours ACCUMULATE: each click adds the next band and
   leaves the previous ones in place, so the spectrum builds
   to the full seven. The newest band is the one expanded
   with its body copy; the earlier ones sit back as ribbons.
   ===================================================== */

(() => {
  "use strict";

  const SECTIONS = [
    "industry",
    "agriculture",
    "heritage",
    "education",
    "connectivity",
    "innovation",
    "trade",
  ];

  // Beam / accent colors per section (mirrors the --c1/--c2/--c3 vars set
  // inline on each .section-panel in 02-spectrum.html).
  const COLORS = {
    industry:     ["#7a1414", "#c0392b", "#ff5a3c"],
    agriculture:  ["#7a3c10", "#c1440e", "#ff9d3c"],
    heritage:     ["#7a5c10", "#c9a227", "#ffd35c"],
    education:    ["#124a12", "#2e8b3e", "#6be07a"],
    connectivity: ["#0e3a5c", "#1f6fbd", "#5cc2ff"],
    innovation:   ["#2a1a5c", "#5a3d9e", "#9a7cff"],
    trade:        ["#3c1450", "#7a1f8c", "#ff5ce0"],
  };

  // Reference artwork is 1536x1024 — the SVG viewBox matches it 1:1, so we
  // can hand-place beam geometry in the same pixel space the image was
  // authored in, and it will always line up with the 3:2 inset panel.
  const VB_W = 1536;
  const VB_H = 1024;

  // The prism's light point — where every beam starts. The only hand-placed
  // coordinate left; the far end of each beam is measured off its card.
  const ORIGIN = { x: VB_W * 0.342, y: VB_H * 0.49 };

  // ---- the step sequence ----
  // Step 1 is the ray/title-fade entrance (see playRayEntrance()); steps
  // 2..8 open a band each; step 9 closes the last one and leaves all seven
  // sitting as ribbons.
  const RAY_STEP = 1;
  const FIRST_COLOR_STEP = RAY_STEP + 1;                        // 2
  const ALL_OPEN_STEP = FIRST_COLOR_STEP + SECTIONS.length - 1; // 8
  const LAST_STEP = ALL_OPEN_STEP + 1;                          // 9

  // ---- how far the newest card outgrows the rest -----------------------
  // It grows on both axes: GROW_* drive the height (flex-grow within the
  // stack) and ACTIVE_BLEED pulls its left edge back out over the beam
  // feeding it, widening it by ~30%.
  // Retuned for 26px type. At that size the longest body copy wraps to
  // three lines, so the open card needs a lot more height than the resting
  // ones - hence the wide ratio. The cards are also wider now, so a smaller
  // bleed already reaches back over the beam feeding them.
  const GROW_ACTIVE = 5.2;
  const GROW_RESTING = 0.8;
  const ACTIVE_BLEED = "-15%";

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------
  // DOM references
  // ---------------------------------------------------
  const svg = document.getElementById("beamsSvg");
  if (!svg) return;

  const stage = document.getElementById("stage");
  const ray = document.getElementById("lightRay");
  const mapGlow = document.getElementById("mapGlow");
  const mapCore = document.getElementById("mapCore");
  const leftMask = document.querySelector(".left-content-mask");

  const panelEls = {};
  const toggleEls = {};
  const contentEls = {};
  const beamEls = {};
  const overlayEls = {};

  SECTIONS.forEach((id) => {
    panelEls[id] = document.querySelector(`.section-panel[data-section="${id}"]`);
    toggleEls[id] = document.getElementById(`toggle-${id}`);
    contentEls[id] = document.getElementById(`content-${id}`);
    beamEls[id] = svg.querySelector(`.beam[data-section="${id}"]`);
    overlayEls[id] = document.querySelector(`.map-overlay[data-section="${id}"]`);
  });

  // ---------------------------------------------------
  // Build the beam gradients once. The wedge geometry is NOT fixed —
  // see syncBeams(), which measures the cards every frame.
  // ---------------------------------------------------
  function buildBeams() {
    const defs = svg.querySelector("defs");

    SECTIONS.forEach((id, i) => {
      const [c1, c2, c3] = COLORS[id];
      const gradId = `grad-${id}`;

      const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
      grad.setAttribute("id", gradId);
      grad.setAttribute("x1", "0%");
      grad.setAttribute("y1", "0%");
      grad.setAttribute("x2", "100%");
      grad.setAttribute("y2", "0%");
      grad.innerHTML = `
        <stop offset="0%" stop-color="${c1}" stop-opacity="0" />
        <stop offset="35%" stop-color="${c1}" stop-opacity=".85" />
        <stop offset="70%" stop-color="${c2}" />
        <stop offset="100%" stop-color="${c3}" />
      `;
      defs.appendChild(grad);
      beamEls[id].setAttribute("fill", `url(#${gradId})`);
    });
  }

  // ---------------------------------------------------
  // Glue each beam to its own card.
  //
  // The cards move: the open one grows on both axes, which shifts its
  // centre away from the slot the band started in. A beam aimed at the
  // original slot therefore lands off the card's edge, and the colour
  // reads as misaligned with the border. So instead of fixed geometry,
  // every beam is rebuilt from the card's measured rectangle — its wedge
  // ends exactly on that card's left edge, spanning its full height.
  //
  // Called from the timeline's onUpdate, so the beams track the cards
  // while they are still animating, and from a ResizeObserver so they
  // survive the panel changing size.
  // ---------------------------------------------------
  function syncBeams() {
    const sr = stage.getBoundingClientRect();
    if (!sr.width || !sr.height) return;

    const sx = VB_W / sr.width;
    const sy = VB_H / sr.height;

    SECTIONS.forEach((id) => {
      const r = panelEls[id].getBoundingClientRect();
      // a hair of overshoot so no hairline shows between beam and card
      const xEnd = (r.left - sr.left) * sx + 2;
      const top = (r.top - sr.top) * sy;
      const bottom = (r.bottom - sr.top) * sy;

      const cx1 = ORIGIN.x + (xEnd - ORIGIN.x) * 0.55;
      const cx2 = ORIGIN.x + (xEnd - ORIGIN.x) * 0.86;

      beamEls[id].setAttribute(
        "d",
        `M ${ORIGIN.x} ${ORIGIN.y}` +
          ` C ${cx1} ${ORIGIN.y}, ${cx2} ${top}, ${xEnd} ${top}` +
          ` L ${xEnd} ${bottom}` +
          ` C ${cx2} ${bottom}, ${cx1} ${ORIGIN.y}, ${ORIGIN.x} ${ORIGIN.y} Z`
      );
    });
  }

  // The ray is drawn on with stroke-dashoffset, so it needs its own length
  // as the dash pattern before it can be animated. Just the setup here —
  // the slide arrives at rest, ray undrawn; playRayEntrance() below fires
  // it on the first click.
  function prepareRay() {
    if (!ray) return;
    const rayLength = ray.getTotalLength();
    ray.style.strokeDasharray = String(rayLength);
    ray.style.strokeDashoffset = String(rayLength);
  }

  // ---- step 1: the ray hits the prism, the baked title block fades ----
  // A one-time entrance, not part of renderStep()'s per-band timeline —
  // nothing here is undone by later clicks.
  function playRayEntrance() {
    const durScale = reduceMotion ? 0.25 : 1;

    if (ray) {
      gsap.to(ray, {
        opacity: 1,
        strokeDashoffset: 0,
        duration: 1.1 * durScale,
        ease: "power2.inOut",
      });
    }

    if (leftMask) {
      // A dim, not a hide: the title has done its job once the light
      // reaches the prism, but this is a fade, not a disappearance.
      gsap.to(leftMask, {
        opacity: 0.45,
        duration: 0.9 * durScale,
        ease: "sine.inOut",
        delay: 0.3 * durScale,
      });
    }

    // the light point at the prism switches on — both start at opacity 0
    // (see spectrum.css), so this is a reveal, not a flare. Settles at the
    // same resting opacity the source art used (.8 / 1), then each later
    // band-open step (renderStep) flares brighter and back down to this.
    gsap.fromTo(
      mapGlow,
      { opacity: 0, scale: 0.85 },
      { opacity: 0.8, scale: 1, duration: 0.6 * durScale, ease: "sine.out", delay: 0.85 * durScale }
    );
    gsap.fromTo(
      mapCore,
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, duration: 0.5 * durScale, ease: "sine.out", delay: 0.85 * durScale }
    );
  }

  // ---------------------------------------------------
  // State
  // ---------------------------------------------------
  // No band is open when the slide arrives; the first click opens one.
  let step = 0;
  let currentTimeline = null;

  function measureContentHeight(el) {
    const prevHeight = el.style.height;
    el.style.height = "auto";
    const h = el.scrollHeight;
    el.style.height = prevHeight;
    return h;
  }

  // ---------------------------------------------------
  // Render a step — ONE coordinated GSAP timeline, so rapid
  // clicks interrupt gracefully (kill + rebuild from whatever
  // the current rendered values are).
  //
  // Card visibility is CSS's job, driven by the .is-revealed and
  // .is-active classes, so GSAP never writes an inline opacity that
  // would then outrank the stylesheet for the rest of the session.
  // GSAP owns the sizing, the beams, the ray and the map reaction.
  // ---------------------------------------------------
  function renderStep(n) {
    const revealed = Math.max(
      0,
      Math.min(SECTIONS.length, n - FIRST_COLOR_STEP + 1)
    );
    // Past the last band nothing is expanded, so every revealed card
    // settles back to an equal-height ribbon.
    const activeIdx = n <= ALL_OPEN_STEP ? revealed - 1 : -1;

    if (currentTimeline) currentTimeline.kill();

    const durScale = reduceMotion ? 0.25 : 1;
    const tl = gsap.timeline({
      defaults: { ease: "sine.inOut" },
      // the cards are still moving while this runs, and the beams have to
      // stay glued to their edges
      onUpdate: syncBeams,
      onComplete: () => {
        currentTimeline = null;
        syncBeams();
        if (n === LAST_STEP) playFinalAnimation();
      },
    });
    currentTimeline = tl;

    // the prism flares each time a band opens
    if (revealed > 0) {
      tl.to(
        mapGlow,
        { scale: 1.12, opacity: 1, duration: 0.4 * durScale, yoyo: true, repeat: 1 },
        0.25 * durScale
      );
      tl.to(
        mapCore,
        { scale: 1.3, duration: 0.35 * durScale, yoyo: true, repeat: 1, ease: "sine.out" },
        0.25 * durScale
      );
    }

    // ---- the bands -----------------------------------------------------
    SECTIONS.forEach((id, i) => {
      const inSet = i < revealed;
      const isActive = i === activeIdx;

      panelEls[id].classList.toggle("is-revealed", inSet);
      panelEls[id].classList.toggle("is-active", isActive);
      toggleEls[id].setAttribute("aria-expanded", String(isActive));

      tl.to(
        panelEls[id],
        {
          flexGrow: isActive ? GROW_ACTIVE : GROW_RESTING,
          marginLeft: isActive ? ACTIVE_BLEED : "0%",
          duration: 0.8 * durScale,
        },
        0.15 * durScale
      );

      // Already-revealed beams stay lit but sit back, so the newest one
      // still reads as the one being talked about.
      beamEls[id].classList.toggle("is-active", isActive);
      tl.to(
        beamEls[id],
        {
          opacity: inSet ? (isActive ? 0.82 : activeIdx < 0 ? 0.6 : 0.42) : 0,
          duration: 0.7 * durScale,
        },
        0.1 * durScale
      );

      tl.to(
        overlayEls[id],
        { opacity: isActive ? 0.42 : 0, duration: 0.8 * durScale },
        0.25 * durScale
      );

      // body copy belongs to the newest band only
      const content = contentEls[id];
      if (isActive) {
        const h = measureContentHeight(content);
        tl.fromTo(
          content,
          { height: 0, opacity: 0 },
          { height: h, opacity: 1, duration: 0.6 * durScale, ease: "sine.out" },
          0.4 * durScale
        );
      } else {
        tl.to(
          content,
          { height: 0, opacity: 0, duration: 0.4 * durScale },
          0.1 * durScale
        );
      }
    });
  }

  // ---------------------------------------------------
  // ===================================================
  // FUTURE FINAL ANIMATION
  // User will provide the animation specification later.
  // ===================================================
  // ---------------------------------------------------
  function playFinalAnimation() {
    // TODO: final animation will be provided later
  }

  // ---------------------------------------------------
  // Advance on click anywhere on the slide
  // ---------------------------------------------------
  function initSequence() {
    const slide = document.querySelector(".slide");
    if (!slide) return;

    function advance() {
      // Clamped, not wrapped: once the full spectrum is up, clicking again
      // must not clear it.
      if (step >= LAST_STEP) return;
      step += 1;
      if (step === RAY_STEP) playRayEntrance();
      renderStep(step);
    }

    slide.addEventListener("click", (e) => {
      // the deck's own controls keep their own jobs
      if (e.target.closest(".page-nav, .fs-btn, .spectrum-expand")) return;
      advance();
    });

    // The cards are real buttons, so Enter/Space on a focused one should
    // advance too rather than doing nothing.
    SECTIONS.forEach((id) => {
      toggleEls[id].addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          advance();
        }
      });
    });

    renderStep(step);
  }

  // ---------------------------------------------------
  // Expand / restore — lets the artwork step out of the
  // template frame and take the whole slide.
  // ---------------------------------------------------
  function initExpand() {
    const btn = document.getElementById("spectrumExpand");
    const slide = document.querySelector(".slide");
    if (!btn || !slide) return;

    btn.addEventListener("click", () => {
      const full = slide.classList.toggle("spectrum-full");
      btn.setAttribute("aria-pressed", String(full));
      btn.setAttribute(
        "aria-label",
        full ? "Restore the spectrum into the slide frame" : "Expand the spectrum to fill the slide"
      );
    });

    // Esc always returns to the framed view.
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && slide.classList.contains("spectrum-full")) {
        btn.click();
      }
    });
  }

  // ---------------------------------------------------
  // Subtle mouse parallax on the map + background
  // ---------------------------------------------------
  function initParallax() {
    if (reduceMotion) return;

    const mapWrap = document.getElementById("mapWrap");
    const bg = document.querySelector(".bg-image");

    const mapX = gsap.quickTo(mapWrap, "x", { duration: 0.6, ease: "power3.out" });
    const mapY = gsap.quickTo(mapWrap, "y", { duration: 0.6, ease: "power3.out" });
    const bgX = gsap.quickTo(bg, "x", { duration: 0.9, ease: "power3.out" });
    const bgY = gsap.quickTo(bg, "y", { duration: 0.9, ease: "power3.out" });

    stage.addEventListener("mousemove", (e) => {
      const rect = stage.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5;

      mapX(nx * 8);
      mapY(ny * 6);
      bgX(nx * -3);
      bgY(ny * -2);
    });

    stage.addEventListener("mouseleave", () => {
      mapX(0);
      mapY(0);
      bgX(0);
      bgY(0);
    });
  }

  // ---------------------------------------------------
  // Init
  // ---------------------------------------------------
  buildBeams();
  prepareRay();
  initSequence();
  initExpand();
  initParallax();

  // Keep the beams on their cards when the panel itself changes size —
  // the expand toggle, or the window being resized.
  if (window.ResizeObserver) new ResizeObserver(syncBeams).observe(stage);
  window.addEventListener("resize", syncBeams);
})();
