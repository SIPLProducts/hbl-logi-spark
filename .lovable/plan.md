# Plan: Professional Login Page

## Route
Create `src/routes/login.tsx` rendering at `/login`. Standalone page (no sidebar/topbar) — uses its own full-viewport layout.

## Layout (split-screen, matches reference)
Two-column grid on `md+`, stacked on mobile:

**Left column (~40%)** — white card, centered vertically:
- HBL logo (reuse `src/assets/hbl-logo.png.asset.json`), large
- Heading: "Sign in to your account" / subtle: "Logistics Execution Module"
- `User Name` label + input (`Enter User Name` placeholder)
- `Password` label + input with eye toggle for show/hide
- Primary "Log In" button (gradient primary, full-width, with LogIn lucide icon)
- "Forgot Password?" text link below
- Footer at bottom: "© 2026 HBL Power Systems. All Rights Reserved"

**Right column (~60%)** — visual panel:
- Three-image collage (port containers, highway truck, container ship) using royalty-free Unsplash URLs split into 3 angled/diagonal panels with subtle clip-path
- Bottom overlay band: large display-font title "LOGISTIC EXECUTION MODULE" + small "HBL Engineering Limited" with logo on the right
- Subtle dark gradient overlay on imagery for legibility
- Hidden on `<md` screens

## Behavior
- Form is UI-only with local `useState` for the two fields and `showPassword` toggle
- Submit: zod validation (username min 1 max 100, password min 1 max 100), toast success "Signed in", then `navigate({ to: "/" })`
- "Forgot Password?" toast: "Contact your administrator"

## SEO / head
- `title: "Login · HBL LE"`, description, canonical

## Files
- `src/routes/login.tsx` (new)

## Out of scope
- No auth backend, no session, no route guards
- No new images uploaded; use Unsplash URLs for the right-side collage
- Existing `/login` link from TopBar Logout button now resolves to this page