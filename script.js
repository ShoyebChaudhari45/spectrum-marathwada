/* =====================================================
   THE SPECTRUM OF MARATHWADA — interaction layer
   State machine + GSAP timelines for the 7 sections.
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
  // inline on each .section-panel in index.html).
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
  // authored in, and it will always line up with .stage (locked to 3:2).
  const VB_W = 1536;
  const VB_H = 1024;

  const ORIGIN = { x: VB_W * 0.342, y: VB_H * 0.49 };
  const PANELS_TOP = VB_H * 0.122;
  const PANELS_BOTTOM = VB_H * 0.732;
  const PANELS_LEFT_X = VB_W * 0.726;
  const BAND_H = (PANELS_BOTTOM - PANELS_TOP) / SECTIONS.length;
  const WEDGE_HALF_H = BAND_H * 0.46;

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------
  // DOM references
  // ---------------------------------------------------
  const svg = document.getElementById("beamsSvg");
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
  // ---------------------------------------------------
  function switchSection(toId) {
    if (toId === activeSection) return;

    const fromId = activeSection;
    activeSection = toId;

    if (currentTimeline) currentTimeline.kill();

    const durScale = reduceMotion ? 0.25 : 1;
    const ease = "power3.inOut";

    const tl = gsap.timeline({
      defaults: { ease },
      onComplete: () => {
        currentTimeline = null;
        if (toId === "trade") playFinalAnimation();
      },
    });
    currentTimeline = tl;

    // ---- 0.0–0.25s : active highlight -------------------------------
    SECTIONS.forEach((id) => {
      const isActive = id === toId;
      panelEls[id].classList.toggle("is-active", isActive);
      toggleEls[id].setAttribute("aria-expanded", String(isActive));
    });

    tl.to(
      Object.values(panelEls),
      { filter: "brightness(1)", duration: 0.25 * durScale },
      0
    );

    // ---- 0.15–0.7s : panel expansion / collapse (flex-grow) --------
    SECTIONS.forEach((id) => {
      tl.to(
        panelEls[id],
        {
          flexGrow: id === toId ? 3.1 : 0.85,
          duration: 0.55 * durScale,
          ease: "power4.out",
        },
        0.15 * durScale
      );
    });

    // icon emphasis
    tl.to(
      `.section-panel[data-section="${toId}"] .icon`,
      { scale: 1.12, duration: 0.4 * durScale, ease: "back.out(1.7)" },
      0.2 * durScale
    );
    if (fromId) {
      tl.to(
        `.section-panel[data-section="${fromId}"] .icon`,
        { scale: 1, duration: 0.4 * durScale },
        0.15 * durScale
      );
    }

    // ---- 0.2–0.8s : beam animation -----------------------------------
    SECTIONS.forEach((id) => {
      beamEls[id].classList.toggle("is-active", id === toId);
      tl.to(
        beamEls[id],
        {
          opacity: id === toId ? 1 : 0.28,
          duration: 0.6 * durScale,
        },
        0.2 * durScale
      );
    });
    // subtle energy pulse on the active beam
    tl.fromTo(
      beamEls[toId],
      { scaleX: 0.97 },
      { scaleX: 1, duration: 0.6 * durScale, ease: "expo.out", transformOrigin: "0% 50%" },
      0.2 * durScale
    );

    // ---- 0.3–0.9s : map reaction --------------------------------------
    SECTIONS.forEach((id) => {
      tl.to(
        overlayEls[id],
        { opacity: id === toId ? 0.42 : 0, duration: 0.6 * durScale },
        0.3 * durScale
      );
    });
    tl.to(
      mapGlow,
      { scale: 1.1, opacity: 1, duration: 0.3 * durScale, yoyo: true, repeat: 1 },
      0.3 * durScale
    );
    tl.to(
      mapCore,
      { scale: 1.25, duration: 0.25 * durScale, yoyo: true, repeat: 1, ease: "power2.out" },
      0.3 * durScale
    );

    // ---- 0.5–1.0s : content fade/slide --------------------------------
    if (fromId) {
      tl.to(
        contentEls[fromId],
        { height: 0, opacity: 0, duration: 0.35 * durScale, ease: "power3.inOut" },
        0.15 * durScale
      );
    }
    const toContent = contentEls[toId];
    const naturalHeight = measureContentHeight(toContent);
    tl.fromTo(
      toContent,
      { height: 0, opacity: 0 },
      { height: naturalHeight, opacity: 1, duration: 0.45 * durScale, ease: "power3.out" },
      0.5 * durScale
    );
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
  // Wire up clicks / keyboard (native <button> gives us
  // Enter/Space + focus-visible for free)
  // ---------------------------------------------------
  SECTIONS.forEach((id) => {
    toggleEls[id].addEventListener("click", () => switchSection(id));
  });

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

      mapX(nx * 10);
      mapY(ny * 8);
      bgX(nx * -4);
      bgY(ny * -3);
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
  initParallax();
})();
