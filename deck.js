/* =====================================================
   CMIA PRESENTATION DECK — shell, chrome & navigation
   -----------------------------------------------------
   Each slide is its own .html file (the client asked for
   separate pages, not one scrolling document). This file
   is shared by all of them and does three things:

     1. scales the fixed 1600x900 .slide box to the window
     2. injects the CMIA template chrome, so the logo /
        jubilee mark / wave live in exactly one place
     3. wires the small bottom-left prev/next arrows and
        the matching keyboard shortcuts

   A slide declares which page it is with data-page on
   the .slide element; everything else is derived here.
   ===================================================== */

(() => {
  "use strict";

  // Deck order. Renaming or reordering the deck is a one-line
  // change here — the arrows, page numbers and keyboard nav all
  // read from this array.
  const PAGES = [
    "index.html",
    "02-heritage-legacy.html",
    "03-industrial-vision.html",
    "04-title.html",
    "04-spectrum.html",
    "05-industrial-might.html",
    "06-anchoring-investments.html",
    "07-rise-framework.html",
    "08-national-demands.html",
    "09-commitments.html",
    "10-thank-you.html",
  ];

  const slide = document.querySelector(".slide");
  if (!slide) return;

  const pageNo = parseInt(slide.dataset.page, 10) || 1;
  const index = pageNo - 1;

  // ---------------------------------------------------
  // 1. Fit the 1600x900 slide to the viewport
  // ---------------------------------------------------
  const SLIDE_W = 1600;
  const SLIDE_H = 900;

  function fit() {
    // Math.max (cover) rather than Math.min (contain): the slide fills the
    // whole window edge-to-edge with no letterbox bars, cropping whichever
    // axis runs long. html/body has overflow:hidden (deck.css) so the
    // cropped overflow never shows a scrollbar.
    const scale = Math.max(
      window.innerWidth / SLIDE_W,
      window.innerHeight / SLIDE_H
    );
    // .deck centres the un-scaled 1600x900 box and the transform
    // scales it about its own centre, so the painted slide stays
    // centred at every scale without any further correction.
    slide.style.transform = `scale(${scale})`;
  }

  window.addEventListener("resize", fit);
  fit();

  // ---------------------------------------------------
  // 2. Template chrome
  // ---------------------------------------------------
  const svgNS = "http://www.w3.org/2000/svg";

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // ---- bottom spectrum wave (sits behind the content) ----
  // The gradient id is suffixed per page so several of these can never
  // collide if slides are ever composed into one document.
  const waveId = `specWave-${pageNo}`;
  const waveContainer = el(`
    <svg class="spectrum-wave" viewBox="0 0 1600 80" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="${waveId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stop-color="#ff3b30" />
          <stop offset="16%"  stop-color="#ff9500" />
          <stop offset="33%"  stop-color="#ffd60a" />
          <stop offset="50%"  stop-color="#34c759" />
          <stop offset="67%"  stop-color="#0a84ff" />
          <stop offset="84%"  stop-color="#5e5ce6" />
          <stop offset="100%" stop-color="#ff2d92" />
        </linearGradient>
      </defs>
      <g class="mesh-group"></g>
    </svg>
  `);
  slide.prepend(waveContainer);

  // Setup dynamic warped mesh grid inside .mesh-group
  (() => {
    const H = 5;      // 5 horizontal waves
    const V = 38;      // 38 vertical grid lines
    const width = 1600;
    const height = 80;

    // Define distinct configurations for each wave row to maximize crossover visual interest
    const rows = [];
    for (let i = 0; i < H; i++) {
      const ratio = i / (H - 1);
      rows.push({
        baseline: 15 + ratio * 50,
        amp1: 6 + Math.sin(i * 1.5) * 3,
        amp2: 4 + Math.cos(i * 1.5) * 2,
        freq1: 0.003 + (i * 0.0004),
        freq2: 0.0075 - (i * 0.0004),
        speed1: 0.8 + i * 0.1,
        speed2: 1.1 - i * 0.15,
        phase1: i * 0.7,
        phase2: i * 1.1 + 1.5
      });
    }

    const pathH = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathH.setAttribute("fill", "none");
    pathH.setAttribute("stroke", `url(#${waveId})`);
    pathH.setAttribute("stroke-width", "1.75");
    pathH.setAttribute("stroke-linecap", "round");
    pathH.setAttribute("stroke-linejoin", "round");

    const pathV = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathV.setAttribute("fill", "none");
    pathV.setAttribute("stroke", `url(#${waveId})`);
    pathV.setAttribute("stroke-width", "0.75");
    pathV.setAttribute("opacity", "0.4");
    pathV.setAttribute("stroke-linecap", "round");
    pathV.setAttribute("stroke-linejoin", "round");

    const group = waveContainer.querySelector(".mesh-group");
    group.appendChild(pathV);
    group.appendChild(pathH);

    function update() {
      const t = performance.now() * 0.001; // time in seconds
      const nodes = [];

      // Calculate all point locations
      for (let i = 0; i < H; i++) {
        const rowNodes = [];
        const r = rows[i];
        for (let j = 0; j < V; j++) {
          const x = (j / (V - 1)) * width;
          const y = r.baseline 
            + r.amp1 * Math.sin(x * r.freq1 + t * r.speed1 + r.phase1)
            + r.amp2 * Math.sin(x * r.freq2 - t * r.speed2 + r.phase2);
          rowNodes.push({ x, y });
        }
        nodes.push(rowNodes);
      }

      // Draw horizontal lines
      let dH = "";
      for (let i = 0; i < H; i++) {
        const rowNodes = nodes[i];
        dH += `M ${rowNodes[0].x.toFixed(1)} ${rowNodes[0].y.toFixed(1)}`;
        for (let j = 1; j < V; j++) {
          dH += ` L ${rowNodes[j].x.toFixed(1)} ${rowNodes[j].y.toFixed(1)}`;
        }
      }
      pathH.setAttribute("d", dH);

      // Draw vertical connecting lines
      let dV = "";
      for (let j = 0; j < V; j++) {
        dV += `M ${nodes[0][j].x.toFixed(1)} ${nodes[0][j].y.toFixed(1)}`;
        for (let i = 1; i < H; i++) {
          dV += ` L ${nodes[i][j].x.toFixed(1)} ${nodes[i][j].y.toFixed(1)}`;
        }
      }
      pathV.setAttribute("d", dV);

      requestAnimationFrame(update);
    }

    update();
  })();

  // ---- CMIA logo, top-left ----
  slide.appendChild(
    el(`
    <div class="brand">
      <img src="assets/cmia-logo.png" alt="Chamber of Marathwada Industries &amp; Agriculture" />
      <div class="wordmark">Chamber of Marathwada<br />Industries &amp; Agriculture</div>
    </div>
  `)
  );

  // ---- 58-years jubilee mark, bottom-left. The supplied artwork already
  // carries the "niti se nirmiti" line, so there is no separate text
  // element for it. ----
  slide.appendChild(
    el(`
    <div class="jubilee">
      <img class="jubilee-mark" src="assets/cmia-58-years.png"
           alt="58 years of CMIA &mdash; &#2344;&#2368;&#2340;&#2367; &#2360;&#2375; &#2344;&#2367;&#2352;&#2381;&#2350;&#2367;&#2340;&#2368;" />
    </div>
  `)
  );

  // ---- page number, sitting on the navy swoosh ----
  slide.appendChild(
    el(`<div class="page-number">${pageNo}</div>`)
  );

  // ---- fullscreen toggle, top-right --------------------------------------
  // Worth knowing: the Fullscreen API is per-document, so this drops as soon
  // as the arrows navigate to the next slide's file. For actually presenting
  // the deck, F11 (the browser's own fullscreen) survives navigation — see
  // the README. This button is here for a single slide, and because the page
  // is the same near-black as the letterbox either way.
  const fsBtn = el(`
    <button class="fs-btn" type="button" aria-label="Toggle fullscreen" title="Fullscreen (F)">
      <svg class="icon-enter" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" /></svg>
      <svg class="icon-exit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h6V3M21 9h-6V3M3 15h6v6M21 15h-6v6" /></svg>
    </button>
  `);
  slide.appendChild(fsBtn);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  fsBtn.addEventListener("click", toggleFullscreen);

  document.addEventListener("fullscreenchange", () => {
    document.body.classList.toggle(
      "is-fullscreen",
      Boolean(document.fullscreenElement)
    );
    fit(); // the viewport just changed size
  });

  // ---------------------------------------------------
  // 3. Prev / next arrows — small, bottom-left
  // ---------------------------------------------------
  const prevHref = index > 0 ? PAGES[index - 1] : null;
  const nextHref = index < PAGES.length - 1 ? PAGES[index + 1] : null;

  const nav = el(`
    <nav class="page-nav" aria-label="Slide navigation">
      <button class="page-nav-btn" type="button" data-dir="prev"
              aria-label="Previous slide"${prevHref ? "" : ' aria-disabled="true"'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <button class="page-nav-btn" type="button" data-dir="next"
              aria-label="Next slide"${nextHref ? "" : ' aria-disabled="true"'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7" /></svg>
      </button>
    </nav>
  `);
  slide.appendChild(nav);

  function go(href) {
    if (href) window.location.href = href;
  }

  nav.addEventListener("click", (e) => {
    const btn = e.target.closest(".page-nav-btn");
    if (!btn) return;
    go(btn.dataset.dir === "prev" ? prevHref : nextHref);
  });

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case "ArrowRight":
      case "PageDown":
        go(nextHref);
        break;
      case "ArrowLeft":
      case "PageUp":
        go(prevHref);
        break;
      case "Home":
        go(PAGES[0]);
        break;
      case "End":
        go(PAGES[PAGES.length - 1]);
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
    }
  });
})();
