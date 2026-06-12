# Fix Slideshow Image Visibility

`object-cover` is cropping slides 1–4 (the vision/values/collage images) because they have important content near the edges. Switching back to `object-contain` brings back letterboxing. The fix is to give the slideshow panel a neutral backdrop and let each image display fully at a consistent framed size.

## Change (only `src/routes/login.tsx`, right `<aside>`)

1. **Add a soft neutral background** to the `<aside>` (`bg-slate-100`) so letterboxed areas look intentional, not broken.
2. **Switch images back to `object-contain object-center`** so every image is fully visible with nothing cropped.
3. **Add a subtle inner frame**: wrap the images in a centered container with `inset-6` padding so all slides render inside the same bounded box — uniform framing across all 6 images, no edge bleed.
4. **Keep dot indicators** at `bottom-6`, auto-advance, and crossfade unchanged.
5. **Left form panel untouched.**

## Result

All 6 images (including 1–4) display in full with neat, identical framing inside a clean neutral panel — no cropping, no distortion, consistent size.