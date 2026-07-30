# assets

## Your portrait

Save a photo of yourself here as **`portrait.jpg`** and it appears at the top of
the About section automatically — no code changes needed.

- **Filename:** exactly `portrait.jpg` (lowercase)
- **Crop:** 4:5 portrait, or square. The CSS crops to 4:5 and centres it.
- **Size:** at least 600px on the short edge. Under ~300 KB keeps the page fast —
  export at 80% JPEG quality.
- The photo renders in grayscale and goes full colour on hover. To always show
  colour, delete the `filter: grayscale(1)` line from the `.portrait img` rule
  in `styles.css`.

Until the file exists, a dashed placeholder box shows in its place, so the layout
never breaks.

To use a PNG or a different filename instead, edit the `<img src="...">` inside
the `PORTRAIT SLOT` comment in `index.html`.
