## Plan: Show full slideshow images without cropping

The right-panel slideshow on `/login` currently uses `object-cover`, which crops the images to fill the panel. The uploaded images have varying aspect ratios (a tall triangle, wide collages, a square-ish photo), so cropping cuts off important content.

### Change

In `src/routes/login.tsx`, in the `<aside>` slideshow:

1. **Switch `<img>` sizing from `object-cover` to `object-contain`** so every image fits fully inside the panel regardless of aspect ratio.
2. **Add a neutral backdrop** (`bg-slate-100`) behind the images so the letterbox bars on contained images look intentional, not broken. Remove the dark `bg-slate-900` from the aside.
3. **Remove the dark gradient overlay** (`from-black/10 ... to-black/40`) — it was tuned for full-bleed photos and muddies contained images.
4. **Add padding** around the image area (`p-6`) and reserve space at the bottom for the existing branding band (`pb-[140px]`) so images never sit under the white "Logistic Execution Module" band.
5. **Keep dot indicators** but reposition them just above the branding band and darken them (`bg-slate-800` active, `bg-slate-400` inactive) so they remain visible on the light backdrop.
6. **Keep the 4s auto-advance and click-to-jump** behavior unchanged.

No changes to the left form panel, no new dependencies, images stay the existing CDN assets.
