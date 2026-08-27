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
  //
  // Page 1 is 01-opener.html, not index.html — index.html is the
  // persistent presentation shell (see the "inFrame" branch below),
  // which holds this whole array's worth of slides inside its iframe
  // and is never itself one of them.
  const PAGES = [
    "01-opener.html",
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
    // Contain, not cover: the whole 1600x900 slide always stays fully
    // visible. The page and the letterbox around the slide are the same
    // near-black (deck.css), so at any window shape the deck already reads
    // edge-to-edge with no visible frame — cover cropped the top and
    // bottom (logo, nav arrows) whenever the window was wider than 16:9.
    const scale = Math.min(
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

  // Single flowing gradient line, not a grid — the busier wireframe mesh
  // this replaced drew 5 warped rows crossed with 38 verticals, which read
  // as a dense technical grid. One thick line with a gentle drift reads
  // as calmer, plain "spectrum" band instead.
  (() => {
    const width = 1600;
    const baseline = 20; // sits near the top of the 80px-tall strip
    const amp = 5;
    const freq = 0.0032;
    const speed = 0.35;
    const segments = 48; // points sampled along the line, not a grid dimension

    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", `url(#${waveId})`);
    line.setAttribute("stroke-width", "5");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-linejoin", "round");

    const group = waveContainer.querySelector(".mesh-group");
    group.appendChild(line);

    function update() {
      const t = performance.now() * 0.001; // time in seconds
      let d = "";
      for (let j = 0; j <= segments; j++) {
        const x = (j / segments) * width;
        const y = baseline + amp * Math.sin(x * freq + t * speed);
        d += j === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      line.setAttribute("d", d);

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
    }
  });
})();
