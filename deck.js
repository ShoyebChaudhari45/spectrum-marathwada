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
    "02-strategic-context.html",
    "03-spectrum.html",
    "04-seven-spectrums.html",
    "05-industrial-might.html",
    "06-cmia-apex.html",
    "07-rise-framework.html",
    "08-national-demands.html",
    "09-commitments.html",
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

  // ---- golden-jubilee mark + Marathi tagline, bottom-left ----
  const jubilee = el(`
    <div class="jubilee">
      <div class="jubilee-slot"></div>
      <div class="jubilee-tagline">&#2344;&#2368;&#2340;&#2367; &#2360;&#2375; &#2344;&#2367;&#2352;&#2381;&#2350;&#2367;&#2340;&#2368; !</div>
    </div>
  `);
  slide.appendChild(jubilee);

  // Drop-in point for the real artwork: if assets/cmia-50-years.png
  // exists it is used as-is, otherwise we fall back to the vector
  // lockup below so the deck never renders a broken image.
  const jubileeSlot = jubilee.querySelector(".jubilee-slot");
  const jubileeImg = new Image();
  jubileeImg.className = "jubilee-mark";
  jubileeImg.alt = "50 years of CMIA";
  jubileeImg.onload = () => jubileeSlot.appendChild(jubileeImg);
  jubileeImg.onerror = () => {
    jubileeSlot.appendChild(
      el(`
      <svg class="jubilee-mark" viewBox="0 0 118 62" aria-label="50 years of CMIA" role="img">
        <path d="M12 22 C 30 4, 88 4, 108 20" fill="none" stroke="#6cb33f" stroke-width="4" stroke-linecap="round" />
        <path d="M108 20 L 99 10 M108 20 L 96 22" fill="none" stroke="#6cb33f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        <text x="59" y="52" text-anchor="middle" font-family="Sora, sans-serif" font-size="38" font-weight="700" fill="#1f3864">50</text>
        <text x="59" y="61" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="9" font-weight="600" letter-spacing="3" fill="#6cb33f">YEARS</text>
      </svg>
    `)
    );
  };
  jubileeImg.src = "assets/cmia-50-years.png";

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
