# Make All Slideshow Images Uniform Size

Currently the slides use `object-contain`, which keeps each image at its native aspect ratio — so images with different shapes appear at different sizes with empty space around them.

## Change

In `src/routes/login.tsx`, update the slide images on the right panel:

1. **Switch from `object-contain` to `object-cover object-center`** — every image will fill the entire slideshow panel edge-to-edge at the exact same size, with no padding, gaps, or background showing.
2. **No other adjustments** — no padding, no background color, no changes to the form panel, auto-advance, or dot indicators.

## Result

All 6 slides display at an identical, full-panel size with clean alignment and smooth crossfade. Note: because the images have different aspect ratios, uniform sizing means the edges of some images may be trimmed slightly to fill the frame — this is the standard way sliders achieve a consistent look.