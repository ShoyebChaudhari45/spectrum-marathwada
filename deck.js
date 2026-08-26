/* =====================================================
   CMIA PRESENTATION DECK — shell, chrome & navigation
   -----------------------------------------------------
   Each slide is its own .html file (the client asked for
   separate pages, not one scrolling document). This file
   is shared by all of them and does three things:

     1. scales the fixed 1600x900 .slide box to the window
     2. injects the CMIA template chrome, so the logo /
        jubilee mark / swoosh live in exactly one place
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

  // ---- green spine down the left edge ----
  slide.prepend(el(`<div class="spine" aria-hidden="true"></div>`));

  // ---- bottom-right swoosh (sits behind the content) ----
  slide.prepend(
    el(`
    <svg class="swoosh" viewBox="0 0 470 250" preserveAspectRatio="none" aria-hidden="true">
      <path d="M470 44 C 358 62, 248 132, 150 250 L 470 250 Z" fill="#1f3864" />
      <path d="M470 2 C 350 22, 236 98, 128 250" fill="none" stroke="#6cb33f" stroke-width="17" />
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
