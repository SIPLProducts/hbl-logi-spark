## Plan: Login page right-side slideshow

Replace the static 3-image collage on the right panel of `src/routes/login.tsx` with an auto-advancing slideshow cycling through the 6 uploaded images in the order provided.

### Steps

1. **Upload images as Lovable assets** (so they're CDN-served, not bundled):
   - `1.png` → `src/assets/hbl-vision.png.asset.json`
   - `2.jpeg` → `src/assets/hbl-values.jpeg.asset.json`
   - `loginggimage_3.png` → `src/assets/le-collage-1.png.asset.json`
   - `loginbgimage_4.jpg` → `src/assets/le-collage-2.jpg.asset.json`
   - `loginbgimage_5.jpg` → `src/assets/le-truck.jpg.asset.json`
   - `Le1_image_6.png` → `src/assets/le-fleet.png.asset.json`

   Using `lovable-assets create --file /mnt/user-uploads/<name> ...`.

2. **Update `src/routes/login.tsx`**:
   - Import the 6 asset JSON pointers.
   - Replace the 3-column collage `<div>` inside `<aside>` with a single slideshow container:
     - Stack of `<img>` elements, absolutely positioned, full-size, `object-cover`.
     - Active slide `opacity-100`, others `opacity-0`, with `transition-opacity duration-700`.
     - `useState` + `useEffect` interval advancing index every ~4s, cycling 0→5→0.
     - Cleanup interval on unmount.
   - Keep the existing bottom branding band (Logistic Execution Module + HBL logo) unchanged on top of the slideshow.
   - Add small dot indicators (clickable) above the bottom band for manual navigation.
   - Add `alt` text per image; first image `loading="eager"`, rest `loading="lazy"`.

### Notes

- Form panel on the left is untouched.
- No new dependencies needed (pure React + Tailwind transitions).
- Slideshow only renders on `md:` and up (matches existing `hidden md:block` aside).
