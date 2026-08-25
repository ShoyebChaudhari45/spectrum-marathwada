# The Spectrum of Marathwada & Chhatrapati Sambhajinagar — Interactive Build

An interactive, cinematic recreation of the CMIA "Spectrum of Marathwada" design.
The 7 right-side strengths (Industry, Agriculture, Heritage, Education,
Connectivity, Innovation, Trade) are independently clickable, with only one
expanded at a time, coordinated rainbow beams, and a reactive central map.

## Running it

No build step, no backend. Just open `index.html` in a browser, or serve the
folder locally:

```bash
npx serve .
# or
python -m http.server 8080
```

GSAP is loaded from a CDN (cdnjs). An internet connection is required on
first load unless you vendor `gsap.min.js` into the project yourself.

## What's real background art vs. what's interactive DOM

The source reference (`assets/background.jpg`, 1536×1024, exactly 3:2) is a
single flattened photo composite. Recreating the photoreal prism/collage and
painterly landscape in pure CSS/SVG would lose fidelity, so those pieces stay
as the background image:

- CYAIA logo + left-side typography block
- The glass prism with heritage/industrial imagery inside the Marathwada outline
- The bottom cinematic landscape (caves, fort, mausoleum, factories, wind
  turbines, cargo rail) and the footer tagline

Everything interactive is **independent DOM/SVG**, layered on top and
positioned with percentage coordinates that stay pixel-aligned to the
background art because `.stage` is locked to the same 3:2 aspect ratio as the
source image (see `--panels-*`, `--map-*`, `--origin-*` custom properties at
the top of `style.css`):

- **7 section panels** (`<li class="section-panel">` in `index.html`) — real
  buttons, real text, real SVG icons, independently styled/animated
- **7 beams** — generated at runtime in `script.js` (`buildBeams()`) as SVG
  `<path>` wedges with per-section gradients, not baked into the photo
- **Central map reaction layer** (`#mapWrap`) — a glow, a bright core point,
  and 7 stackable color-tint overlays (`.map-overlay[data-section=...]`) that
  fade in/out to simulate the map "responding" to the active section
- A **scrim** (`.panel-scrim`) masks the flattened rainbow/panel artwork
  baked into the original photo on the right third of the frame, so only the
  new interactive layers are visible there

### Upgrading the map reaction with real cropped assets later

Right now `animateMap()` (inside the timeline in `script.js`) fakes "the map
reacts to Industry / Agriculture / etc." using colored radial-gradient
overlays + glow/scale on the whole prism region — see `.map-overlay` rules in
`style.css`. If you later produce separate cut-out images (e.g.
`assets/map-industry.png`, `assets/map-heritage.png`, one per section, same
crop/framing as the prism in `background.jpg`), you can:

1. Add `<img class="map-layer" data-section="industry" src="assets/map-industry.png">`
   for each section inside `#mapWrap`, stacked in the same position as
   `.map-overlay`.
2. In `switchSection()`, cross-fade `opacity` on `.map-layer` the same way
   `.map-overlay` is animated today.
3. Optionally remove the color-tint overlays or keep them as an extra glow on
   top of the real crop.

## Project structure

```
spectrum-marathwada/
├── index.html      # markup: stage, map layer, beams SVG, 7 section panels
├── style.css       # layout coordinates, colors, responsive + reduced-motion
├── script.js       # state machine, beam geometry, GSAP timelines
├── assets/
│   └── background.jpg   # the reference composite (logo, prism, landscape)
└── README.md
```

## Interaction model

- Click (or Tab + Enter/Space) any panel header to make it the active
  section. Exactly one section is ever expanded.
- Clicking the same active section again is a no-op (there is always exactly
  one active section once the user has made a first choice — see §7/§8 of
  the spec this was built from).
- Rapid re-clicks are safe: `switchSection()` kills the in-flight GSAP
  timeline and rebuilds a new one from wherever the DOM currently is, so
  nothing double-animates or jumps.
- Every section panel is a single `<button>` covering the whole compact
  panel (icon + title + subtitle), so the entire visible panel is the click
  target, not just the text.

## Animation timing

All the choreography lives in one GSAP timeline per click, in
`switchSection()` in `script.js`, using the offsets from the spec:

| Phase                     | Offset       |
|---------------------------|--------------|
| Active highlight          | 0.0–0.25s    |
| Panel expansion/collapse  | 0.15–0.7s    |
| Beam animation            | 0.2–0.8s     |
| Map reaction              | 0.3–0.9s     |
| Content fade/slide        | 0.5–1.0s     |

Durations are all `Number * durScale` where `durScale` shrinks under
`prefers-reduced-motion: reduce` (simple, fast fades instead of the full
choreography). To retime anything, edit the `duration`/position values
directly in `switchSection()`, or the `--dur-*` custom properties in
`style.css` for CSS-only transitions (hover states, panel dimming).

## The Trade / final-animation hook

After the `trade` section's expand timeline completes, `script.js` calls:

```js
function playFinalAnimation() {
  // TODO: final animation will be provided later
}
```

This is intentionally empty. Nothing else has been assumed about what should
happen after Trade & Global Markets — implement it here once the spec is
provided.

## Section content

Each section's expanded content area (`<ul class="content-list">` per
section in `index.html`) now has real, region-grounded bullet copy — e.g.
Industry references the Waluj/Chikalthana/Shendra MIDC belt and AURIC;
Heritage references Ajanta & Ellora, Bibi Ka Maqbara, Daulatabad Fort;
Connectivity references the Chhatrapati Sambhajinagar airport, Samruddhi
Mahamarg, and the DMIC corridor, etc. Treat this as a first draft, not
verified official copy — CMIA should review/approve wording, and any claim
that implies a specific statistic, partnership, or figure should be checked
against current data before publishing. No markup/JS changes are needed to
swap wording — just edit the `<li>` text per section.

## Responsive behavior

- **Desktop** (the primary target, ≥901px): the fixed 3:2 stage, beams, and
  map-reaction layer, matching the reference composition.
- **Tablet/mobile** (≤900px, see the media query in `style.css`): the beams
  and map-reaction layer are hidden (they only make sense at the wide
  layout), the background image becomes a shorter header crop, and the 7
  panels become a full-width vertical accordion. The same one-active-at-a-time
  GSAP-driven expand/collapse logic in `script.js` is reused as-is.

## Accessibility

- Each section is a real `<button>` with `aria-expanded` kept in sync, and
  `aria-controls`/`aria-labelledby` wiring its content region.
- Visible `:focus-visible` outline on the toggle buttons.
- `prefers-reduced-motion: reduce` shortens/simplifies the GSAP choreography
  and disables mouse parallax entirely.
- Left-side branding/heading text (logo line, title, tagline) is duplicated
  as real semantic text in a visually-hidden `.sr-only` block, since that
  copy currently only exists as pixels inside `background.jpg`.

## Known gaps / next steps

- `background.jpg` is the only real image asset. If you want independently
  swappable branding/landscape assets exactly per the original spec's asset
  list (`background.png`, `map.png`, `industry.png`, ...), those need to be
  produced from the source design file (e.g. exported layers from whatever
  authored the original composite) — a flattened JPEG can't be losslessly
  split back into layers.
- The map "reaction" is a color-wash simulation (§10 of the spec explicitly
  allows this as an interim solution) until real per-section map crops are
  available — see the upgrade path above.
