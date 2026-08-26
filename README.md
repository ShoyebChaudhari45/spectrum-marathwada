# CMIA — Chhatrapati Sambhajinagar: Legacy to Global Powerhouse

An eight-page HTML presentation for the Chamber of Marathwada Industries &
Agriculture, built from the *Project-CSNTech: India's Next IT and GCC
Powerhouse* deck. Every page is wrapped in the official CMIA slide template
(green spine, logo, 58-years jubilee mark, navy/green corner swoosh), and page
2 carries the interactive "Spectrum of Marathwada" artwork inset inside that
frame.

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

## Two crowded slides

Slides 7 and 8 are the densest in the deck, and at full size their bottom-right
cards ran under the navy/green corner swoosh. Both are tightened by a modifier
class — `.content.demands` and `.content.commitments` in `slides.css` — rather
than by shrinking the swoosh, so the template chrome stays identical on every
page. If you add copy to either slide, re-check that the last row still
finishes above roughly y=670 in slide coordinates.

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
| 1 | `index.html` | Chhatrapati Sambhajinagar — Legacy to Global Powerhouse (title) |
| 2 | `02-spectrum.html` | **The Spectrum of Marathwada** (interactive) |
| 3 | `03-seven-spectrums.html` | The 7 Spectrums of Chhatrapati Sambhajinagar |
| 4 | `04-industrial-might.html` | Industrial Might: Scale & Ground Reality |
| 5 | `05-cmia-apex.html` | CMIA — The Apex Industrial Voice |
| 6 | `06-rise-framework.html` | The CSN RISE Framework |
| 7 | `07-national-demands.html` | Strategic National Demands: What We Seek |
| 8 | `08-commitments.html` | CMIA's Bilateral Commitments |

Each slide is a standalone page. Navigate with the small prev/next arrows at
the bottom left, or with <kbd>←</kbd> / <kbd>→</kbd> (also <kbd>PageUp</kbd> /
<kbd>PageDown</kbd>, <kbd>Home</kbd>, <kbd>End</kbd>). The arrow at either end
of the deck stays visible but greys out.

**Reordering or renaming slides** is a one-line change: edit the `PAGES` array
at the top of `deck.js`. The arrows, the page numbers and the keyboard
shortcuts all read from it.

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
swoosh, page number, nav arrows — so the branding lives in exactly one place.
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
- `assets/csn-rise-logo.png` — the CSN RISE lockup, used on slide 6 only.

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

### Interaction

- Click (or Tab + Enter/Space) any band to open it. Exactly one is ever open.
- Clicking the open band closes it and returns the spectrum to neutral.
- Rapid clicks are safe — `switchSection()` kills the in-flight GSAP timeline
  and rebuilds from wherever the DOM currently is.
- The chosen band grows on **both** axes: taller via `flex-grow`, and ~30%
  wider via a negative left margin that reaches back out over the beam feeding
  it. Its left edge fades to transparent so the beam reads as flowing into the
  card. Tune with `GROW_ACTIVE`, `GROW_RESTING` and `ACTIVE_BLEED` at the top
  of `script.js`.
- While a band is open the other six drop well back (opacity and saturation),
  and their beams dim with them. Tune in the `.sections.has-active` and
  `.beam.is-dimmed` rules in `spectrum.css`.
- The **expand button** at the artwork's top-right corner breaks the spectrum
  out of the template to fill the whole slide for presenting; <kbd>Esc</kbd> or
  a second click restores it.

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
