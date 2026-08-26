# CMIA — Spectrum: The Industrial Story of Marathwada

A seven-page HTML presentation for the Chamber of Marathwada Industries &
Agriculture, built from the *Project-CSNTech: India's Next IT and GCC
Powerhouse* deck. Every page is wrapped in the official CMIA slide template
(green spine, logo, 58-years jubilee mark, bottom spectrum wave) on a dark
theme, and page 2 carries the interactive "Spectrum of Marathwada" artwork
inset inside that frame.

## Running it — works with no internet

Nothing is fetched from the network. GSAP, both fonts and every image are
vendored into `assets/`, and there is no build step and no backend, so the
deck runs from a folder on a USB stick in a hall with no wifi. Open
`index.html` in a browser, or serve the folder:

```bash
npx serve .
# or
python -m http.server 8080
```

## Dark theme

Tokens live in `:root` in `deck.css`. Two brand colours are lifted from their
print values so they hold up on near-black: the heading green (`--green-deep`,
`#35c99a`) and the CMIA wordmark orange (`--orange`, `#ff7a4d`).

The navy/green corner swoosh is gone. In its place is a full-width **spectrum
wave** along the bottom of every slide (`.spectrum-wave`, drawn in `deck.js`),
carrying the seven spectrum colours left to right — the deck's whole idea, and
what the brief asked for.

Marks needing no plate: the **CMIA logo** (transparent, gold/orange/blue) and
the **58-years jubilee mark**, for which the supplied dark artwork is
white-and-green on transparent. Both sit straight onto the page.

Still on a white plate: the **CSN RISE lockup** (`.rise-logo` in `slides.css`),
which is navy-on-white with no alpha and would otherwise disappear. Its PNG is
trimmed to its content so the plate hugs the artwork.

On the title slide the 58-years mark moves up beside the CMIA logo as the
`CMIA | 58` lockup from the brief — `data-chrome="lockup"` on the slide.

## Two crowded slides

Slide 6 is the densest in the deck — six cards plus a title. At full size its
bottom row overran the content box (and, back when the corner swoosh was still
there, ran under it). It is tightened by a modifier class,
`.content.demands` in `slides.css`, rather than by shrinking the template
chrome, so the frame stays identical on every page. If you add copy to that
slide, re-check that the last row still finishes inside the 600px content box.

## Deploying

The deck is plain static files with no build step, so Vercel needs no
configuration beyond `vercel.json`, which pins `cleanUrls: false`. That matters:
`deck.js` navigates to explicit `.html` filenames, and with clean URLs enabled
Vercel would 308-redirect every one of them to its extensionless form — an
extra round trip on every arrow click, and a URL that no longer matches the
filenames in this repo.

Vercel's production deploy follows `master`. Pushing to `master` redeploys;
pushing any other branch gets its own preview URL.

## The deck

| # | File | Slide |
|---|------|-------|
| 1 | `index.html` | Spectrum — The Industrial Story of Marathwada (title) |
| 2 | `02-spectrum.html` | **The Spectrum of Marathwada** (interactive) |
| 3 | `03-industrial-might.html` | Industrial Might: Scale & Ground Reality |
| 4 | `04-cmia-apex.html` | CMIA — The Apex Industrial Voice |
| 5 | `05-rise-framework.html` | The CSN RISE Framework |
| 6 | `06-national-demands.html` | Strategic National Demands: What We Seek |
| 7 | `07-commitments.html` | CMIA Commitments |

Each slide is a standalone page. Navigate with the small prev/next arrows at
the bottom left, or with <kbd>←</kbd> / <kbd>→</kbd> (also <kbd>PageUp</kbd> /
<kbd>PageDown</kbd>, <kbd>Home</kbd>, <kbd>End</kbd>). The arrow at either end
of the deck stays visible but greys out.

**Reordering or renaming slides** is a one-line change: edit the `PAGES` array
at the top of `deck.js`. The arrows, the page numbers and the keyboard
shortcuts all read from it.

### Presenting full-screen

**Use F11.** The slide and the letterbox around it are the same near-black, so
at any window shape the deck already reads edge-to-edge with no visible frame —
and the browser's own fullscreen survives navigating between slides.

There is also a fullscreen button top-right, and <kbd>F</kbd> does the same
thing. Both use the Fullscreen API, which is per-document: it drops the moment
the arrows load the next slide's file. Fine for one slide, not for presenting
the deck — hence F11.

## How a slide is built

Every slide is authored inside a fixed **1600 × 900** box. `deck.js` measures
the window and applies a single `transform: scale()` to that box, so layout can
be written in plain, predictable pixels and still fills any screen — the same
way a PowerPoint slide behaves. Nothing reflows between screen sizes; the whole
slide just gets bigger or smaller.

A slide's markup is only its content:

```html
<div class="deck">
  <section class="slide" data-page="5">
    <div class="content"> ... </div>
  </section>
</div>
```

`deck.js` injects the template chrome — green spine, CMIA logo, jubilee mark,
bottom spectrum wave, page number, nav arrows — so the branding lives in
exactly one place.
`data-page` is the only thing a slide has to declare.

- `deck.css` — the template chrome and shared typography/cards
- `slides.css` — per-slide layout blocks (title slide, table, timelines, grids)
- `spectrum.css` + `script.js` — page 2 only

## Brand assets

- `assets/cmia-logo.png` — the CMIA mark, matted out of the dark plate in
  `assets/background.jpg` and up-sampled, so it composites cleanly on white.
- `assets/cmia-58-years.png` — the 58-years jubilee lockup. The supplied
  artwork already carries the *niti se nirmiti* line, so the template draws no
  separate text for it.
- `assets/csn-rise-logo.png` — the CSN RISE lockup, used on slide 5 only.

Both supplied marks were down-sampled to roughly 3x their display size; the
originals were far larger than needed and made the deck slower to load from a
stick.

## Page 2 — the interactive spectrum

The source artwork (`assets/background.jpg`, 1536×1024, exactly 3:2) is a
flattened photo composite. The prism collage, the left-hand typography block
and the bottom landscape stay as the image; everything interactive is
independent DOM/SVG layered on top, positioned in percentages that stay
pixel-aligned because `.spectrum-panel` is locked to the same 3:2 ratio.

- **7 section panels** — real buttons with real text and SVG icons
- **7 beams** — built at runtime in `buildBeams()` as SVG `<path>` wedges with
  per-section gradients, not baked into the photo
- **Central map reaction layer** (`#mapWrap`) — a glow, a bright core point and
  7 colour-tint overlays that fade in and out as sections change
- **A scrim** (`.panel-scrim`) hides the flattened rainbow baked into the right
  third of the original photo

### Interaction — a click-through sequence

The slide has no visible controls. **Clicking anywhere on it advances one
step**, and the artwork is what the presenter talks over:

| Step | What happens |
|------|--------------|
| 0 | the prism fades in — on load, no click needed |
| 1 | the ray travels in from the left, through the prism |
| 2 | red — Funding & Trade |
| 3 | orange — Education & Skills |
| 4 | yellow — Creativity |
| 5 | green — Hospitality |
| 6 | blue — Value Addition |
| 7 | violet — Engineering |
| 8 | magenta — Legacy |
| 9 | back to step 0, so the sequence can run again |

Colours **accumulate**: each click adds the next band and leaves the earlier
ones in place, so the spectrum builds to the full seven and ends on the
complete artwork. The newest band is the one expanded with its body copy; the
earlier ones sit back as ribbons, and their beams drop to 55% so the newest
still reads as the one being discussed.

- Nothing is on the right-hand side at step 0: `.section-panel` and `.beam`
  both start at `opacity: 0` in `spectrum.css`.
- The ray is a single SVG path drawn on with `stroke-dashoffset`, so it reads
  as travelling in from the left edge rather than just fading up.
- Rapid clicks are safe: `renderStep()` kills the in-flight GSAP timeline and
  rebuilds from wherever the DOM currently is.
- The newest card grows on **both** axes: taller via `flex-grow`, and ~30%
  wider via a negative left margin that reaches back out over the beam feeding
  it. Its left edge fades to transparent so the beam reads as flowing into the
  card. Tune with `GROW_ACTIVE`, `GROW_RESTING` and `ACTIVE_BLEED` at the top
  of `script.js`.
- Clicks on the deck's own controls (`.page-nav`, `.fs-btn`,
  `.spectrum-expand`) keep their own jobs and do not advance the sequence.
- The **expand button** at the artwork's top-right corner breaks the spectrum
  out of the template to fill the whole slide; <kbd>Esc</kbd> or a second click
  restores it.

Card visibility is CSS's job, driven by the `.is-revealed` and `.is-active`
classes, so GSAP never writes an inline `opacity` that would then outrank the
stylesheet for the rest of the session. GSAP owns the sizing, the ray, the
beams and the map reaction.

### What the artwork carries, and what is masked

This slide sets `data-chrome="minimal"`, which hides the template's outside
CMIA and 58-years marks: the photo has the CMIA logo baked into its top-left,
and `.stage-58` places the jubilee mark beside it inside the frame.

Two things flattened into the photo are covered rather than cropped:

- `.panel-scrim` — the baked rainbow, which would otherwise read as all seven
  ribbons being visible at once. Falloff starts at 60% of the panel, just past
  the widest point of the map outline (measured at 60.7%), and reaches full
  black by 66%. A soft ramp, not a hard edge: the light has to die out rather
  than get sliced off by a seam.
- `.stage-foot-mask` — the "ONE REGION. SEVEN STRENGTHS. LIMITLESS POTENTIAL."
  line along the bottom. Opaque from ~94.6% of the panel: past the bottom of
  the landscape strip but above the text, so the text goes and the artwork
  stays.

#### The scrim, and why its falloff is where it is

The source photo has a rainbow flattened into it, which would otherwise read as
all seven ribbons being visible at once. `.panel-scrim` covers it. The falloff
starts at 60% of the panel — just past the widest point of the map outline,
which measures at 60.7% — and reaches full black by 66%. It is a soft ramp
rather than a hard edge on purpose: the baked rainbow has to die out as though
the light were fading, not get sliced off by a visible seam.

### Upgrading the map reaction with real cropped assets

`.map-overlay` currently fakes "the map reacts to this section" with coloured
radial gradients over the prism region. If per-section cut-outs are ever
produced (`assets/map-industry.png`, … , same crop as the prism in
`background.jpg`):

1. Add `<img class="map-layer" data-section="industry" src="…">` per section
   inside `#mapWrap`, stacked where `.map-overlay` sits.
2. In `switchSection()`, cross-fade `opacity` on `.map-layer` exactly as
   `.map-overlay` is animated today.
3. Keep or drop the colour tints as an extra glow on top.

### The final-animation hook

After the `trade` band's timeline completes, `script.js` calls:

```js
function playFinalAnimation() {
  // TODO: final animation will be provided later
}
```

Intentionally empty — nothing has been assumed about what should happen after
Legacy. Implement it there once the spec arrives.

## Animation timing

All choreography is one GSAP timeline per click, in `switchSection()`:

| Phase                     | Offset       |
|---------------------------|--------------|
| Highlight / dim           | 0.0s         |
| Panel expansion/collapse  | 0.15–1.0s    |
| Beam animation            | 0.2–1.1s     |
| Map reaction              | 0.3–1.15s    |
| Content fade/slide        | 0.55–1.25s   |

Durations are `Number * durScale`, where `durScale` shrinks under
`prefers-reduced-motion: reduce`. A ripple stagger radiates outward from
whichever band was clicked so the rows don't move in lockstep.

## Accessibility

- Real `<button>` elements with `aria-expanded` kept in sync and
  `aria-controls`/`aria-labelledby` wiring each content region.
- Visible `:focus-visible` outlines throughout.
- `prefers-reduced-motion: reduce` shortens the choreography and disables the
  mouse parallax entirely.
- The branding and heading baked into `background.jpg` is mirrored as real text
  in a visually-hidden `.sr-only` block.

## Known gaps / next steps

- **Copy is not verified.** Slide text was transcribed from the supplied PDF.
  Any figure, partnership or claim should be checked against current data
  before this is presented.
- **Desktop/tablet target.** The fixed-size slide scales to fit any window, so
  the deck stays legible down to laptop and tablet sizes, but it does not
  reflow into a phone-friendly layout — a 16:9 slide on a narrow phone is
  simply small. This is a presentation format, not a responsive web page.
- `background.jpg` is a flattened composite. Independently swappable
  branding/landscape layers would have to come from the original design file.
- `spectrum-marathwada-preview.html` is the earlier single-file preview of the
  standalone spectrum page, kept for reference. It predates the deck and is no
  longer wired to anything.
