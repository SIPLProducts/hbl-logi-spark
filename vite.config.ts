// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// True only for `npm run build` (runs `vite build`), false for `npm run dev`
// (runs `vite dev`) — so the "/le/" subpath below only applies to the
// deployed build, not local development.
const isBuild = process.argv.includes("build");

export default defineConfig({
  // Deployed under http://10.10.4.178/le/ (a subpath, not domain root) — the
  // default base of "/" bakes root-absolute asset URLs into index.html that
  // 404 once served from a subpath, so it must match that subpath. Local dev
  // keeps the default "/" so `npm run dev` stays at plain http://localhost:PORT/.
  vite: {
    base: isBuild ? "/le/" : "/",
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // Used by `vite dev` and by generate-static-shell.mjs's build-time render.
    server: { entry: "server" },
  },
  nitro: {
    preset: "static",
    // The `static` preset ships no runtime entry of its own, but this nitro
    // version still bundles a final "nitro" environment unconditionally and
    // crashes without one — see src/nitro-empty-entry.ts. The real
    // index.html is rendered separately by scripts/generate-static-shell.mjs
    // (nitro's own built-in prerenderer is broken for this TanStack Start
    // version, so we bypass it).
    entry: "./src/nitro-empty-entry.ts",
    output: {
      dir: "{{ rootDir }}/dist",
      publicDir: "{{ output.dir }}/skote",
    },
  },
});
