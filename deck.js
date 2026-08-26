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
    "02-spectrum.html",
    "03-industrial-might.html",
    "04-cmia-apex.html",
    "05-rise-framework.html",
    "06-national-demands.html",
    "07-commitments.html",
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
  slide.prepend(
    el(`
    <svg class="spectrum-wave" viewBox="0 0 1600 58" preserveAspectRatio="none" aria-hidden="true">
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
      <path d="M0 26 C 280 4, 520 44, 800 24 S 1340 2, 1600 20" fill="none"
            stroke="url(#${waveId})" stroke-width="7" stroke-linecap="round" />
      <path d="M0 46 C 320 22, 560 60, 880 40 S 1360 16, 1600 40" fill="none"
            stroke="url(#${waveId})" stroke-width="4" stroke-linecap="round" opacity=".5" />
    </svg>
  `)
  );

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
