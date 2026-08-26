/* =====================================================
   THE SPECTRUM OF MARATHWADA — interaction layer
   Runs on the spectrum slide only.
   -----------------------------------------------------
   The seven ribbons are revealed ONE AT A TIME by the
   stepper button in the caption column: the first click
   brings ribbon 1 in, the next takes it out and brings
   ribbon 2 in, and so on. After the seventh, the next
   click clears the artwork back to neutral so the cycle
   can start again.

   Nothing on the right-hand side is visible until the
   first click — .section-panel and .beam both start at
   opacity 0 in spectrum.css.
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

  const ORIGIN = { x: VB_W * 0.342, y: VB_H * 0.49 };
  const PANELS_TOP = VB_H * 0.122;
  const PANELS_BOTTOM = VB_H * 0.732;
  // Must track --panels-left in spectrum.css, or the beams stop short of
  // (or run under) the cards they feed.
  const PANELS_LEFT_X = VB_W * 0.705;
  const BAND_H = (PANELS_BOTTOM - PANELS_TOP) / SECTIONS.length;
  const WEDGE_HALF_H = BAND_H * 0.46;

  // ---- how far the visible card outgrows its hidden neighbours ---------
  // The open card grows on both axes: GROW_* drive the height (flex-grow
  // within the stack) and ACTIVE_BLEED pulls its left edge back out over
  // the beam feeding it, widening it by ~30%.
  const GROW_ACTIVE = 3.2;
  const GROW_RESTING = 0.7;
  const ACTIVE_BLEED = "-30%";

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------
  // DOM references
  // ---------------------------------------------------
  const svg = document.getElementById("beamsSvg");
  if (!svg) return;

  const mapGlow = document.getElementById("mapGlow");
  const mapCore = document.getElementById("mapCore");

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
  // Build beam gradients + wedge geometry once
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

      const targetY = PANELS_TOP + BAND_H * i + BAND_H / 2;
      const topY = targetY - WEDGE_HALF_H;
      const bottomY = targetY + WEDGE_HALF_H;
      const cx1 = ORIGIN.x + (PANELS_LEFT_X - ORIGIN.x) * 0.55;
      const cx2 = ORIGIN.x + (PANELS_LEFT_X - ORIGIN.x) * 0.86;

      const d = `
        M ${ORIGIN.x} ${ORIGIN.y}
        C ${cx1} ${ORIGIN.y}, ${cx2} ${topY}, ${PANELS_LEFT_X} ${topY}
        L ${PANELS_LEFT_X} ${bottomY}
        C ${cx2} ${bottomY}, ${cx1} ${ORIGIN.y}, ${ORIGIN.x} ${ORIGIN.y}
        Z
      `.trim();

      beamEls[id].setAttribute("d", d);
      beamEls[id].setAttribute("fill", `url(#${gradId})`);
    });
  }

  // ---------------------------------------------------
  // State
  // ---------------------------------------------------
  let activeSection = null;
  let currentTimeline = null;

  function measureContentHeight(el) {
    const prevHeight = el.style.height;
    el.style.height = "auto";
    const h = el.scrollHeight;
    el.style.height = prevHeight;
    return h;
  }

  // ---------------------------------------------------
  // Core transition — builds ONE coordinated GSAP timeline
  // so rapid re-clicks interrupt gracefully (kill + rebuild
  // from whatever the current rendered values are).
  //
  // toId may be null, meaning "clear the artwork back to neutral" — no
  // ribbon on screen at all.
  //
  // Visibility of the cards themselves is CSS's job, driven by the
  // .is-active class, so GSAP never writes an inline opacity that would
  // then outrank the stylesheet for the rest of the session. GSAP owns
  // the size (flex-grow / margin), the beams and the map reaction.
  // ---------------------------------------------------
  function switchSection(toId) {
    if (toId === activeSection) return;

    const fromId = activeSection;
    activeSection = toId;

    if (currentTimeline) currentTimeline.kill();

    const durScale = reduceMotion ? 0.25 : 1;
    const flowEase = "sine.inOut";

    const tl = gsap.timeline({
      defaults: { ease: flowEase },
      onComplete: () => {
        currentTimeline = null;
        if (toId === "trade") playFinalAnimation();
      },
    });
    currentTimeline = tl;

    // ---- 0s : hand card visibility over to CSS -------------------------
    SECTIONS.forEach((id) => {
      const isActive = id === toId;
      panelEls[id].classList.toggle("is-active", isActive);
      toggleEls[id].setAttribute("aria-expanded", String(isActive));
    });

    // ---- 0.15–1.0s : the visible card takes its space ------------------
    SECTIONS.forEach((id) => {
      const isActive = id === toId;
      tl.to(
        panelEls[id],
        {
          flexGrow: toId ? (isActive ? GROW_ACTIVE : GROW_RESTING) : 1,
          marginLeft: isActive ? ACTIVE_BLEED : "0%",
          duration: 0.85 * durScale,
          ease: flowEase,
        },
        0.15 * durScale
      );
    });

    // ---- 0.1–1.0s : beams. Only the current one is on screen. ----------
    SECTIONS.forEach((id) => {
      const isActive = id === toId;
      beamEls[id].classList.toggle("is-active", isActive);
      tl.to(
        beamEls[id],
        {
          opacity: isActive ? 1 : 0,
          duration: (isActive ? 0.9 : 0.5) * durScale,
        },
        0.1 * durScale
      );
    });
    // gentle energy swell as the beam arrives
    if (toId) {
      tl.fromTo(
        beamEls[toId],
        { scaleX: 0.97 },
        { scaleX: 1, duration: 0.9 * durScale, ease: "sine.out", transformOrigin: "0% 50%" },
        0.1 * durScale
      );
    }

    // ---- 0.3–1.15s : map reaction ----------------------------------------
    SECTIONS.forEach((id) => {
      tl.to(
        overlayEls[id],
        { opacity: id === toId ? 0.42 : 0, duration: 0.85 * durScale },
        0.3 * durScale
      );
    });
    if (toId) {
      tl.to(
        mapGlow,
        { scale: 1.1, opacity: 1, duration: 0.4 * durScale, ease: "sine.inOut", yoyo: true, repeat: 1 },
        0.3 * durScale
      );
      tl.to(
        mapCore,
        { scale: 1.25, duration: 0.35 * durScale, yoyo: true, repeat: 1, ease: "sine.out" },
        0.3 * durScale
      );
    }

    // ---- 0.55–1.25s : body copy inside the card --------------------------
    if (fromId) {
      tl.to(
        contentEls[fromId],
        { height: 0, opacity: 0, duration: 0.45 * durScale, ease: "sine.inOut" },
        0.1 * durScale
      );
    }
    if (toId) {
      const toContent = contentEls[toId];
      const naturalHeight = measureContentHeight(toContent);
      tl.fromTo(
        toContent,
        { height: 0, opacity: 0 },
        { height: naturalHeight, opacity: 1, duration: 0.65 * durScale, ease: "sine.out" },
        0.45 * durScale
      );
    }
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
  // The stepper — the only way ribbons come and go
  // ---------------------------------------------------
  function initStepper() {
    const btn = document.getElementById("stepBtn");
    const label = document.getElementById("stepLabel");
    const now = document.getElementById("stepNow");
    if (!btn) return;

    // -1 means "nothing on screen"; 0..6 index into SECTIONS.
    let step = -1;

    function render() {
      const shown = step + 1;
      now.textContent = String(shown);
      label.textContent =
        step < 0
          ? "Reveal first strength"
          : step === SECTIONS.length - 1
          ? "Start over"
          : "Next strength";
    }

    function advance() {
      // ... 6 -> -1 -> 0 ... so the seventh click clears the artwork and
      // the cycle can run again from the top.
      step = step >= SECTIONS.length - 1 ? -1 : step + 1;
      switchSection(step < 0 ? null : SECTIONS[step]);
      render();
    }

    btn.addEventListener("click", advance);

    // Clicking the ribbon that is currently on screen advances too — the
    // whole card is already a button, and moving on is the only thing left
    // to do with it.
    SECTIONS.forEach((id) => {
      toggleEls[id].addEventListener("click", advance);
    });

    render();
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

    const stage = document.getElementById("stage");
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
  initStepper();
  initExpand();
  initParallax();
})();
