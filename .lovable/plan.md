## Plan: Remove bottom branding band from slideshow

In `src/routes/login.tsx`, inside the right `<aside>`, remove the entire "Bottom branding band" block — the white panel containing "LOGISTIC EXECUTION MODULE" headline and the HBL logo / "HBL Engineering Limited" caption.

Also move the dot indicators from `bottom-[120px]` to `bottom-6` so they sit nicely above the bottom edge now that the branding band is gone.

Nothing else changes — left form panel, slides, auto-advance, and click-to-jump all stay as-is.
