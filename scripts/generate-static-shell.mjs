// Renders dist/skote/index.html from the app's server-rendered output, then
// discards the server bundle — the deployed artifact is a fully static SPA
// (assets + one HTML shell), matching the old Angular `ng build` layout.
//
// We render by importing nitro's own build-time SSR bundle directly instead
// of using nitro's built-in prerenderer (`nitro build`'s crawler) or
// TanStack Start's built-in `spa` prerender feature: both are broken in the
// currently installed nitro/@tanstack/react-start versions (the former fails
// to resolve the "#tanstack-router-entry" subpath import; the latter looks
// for the server bundle at a hardcoded path nitro never writes to). The
// bundle at node_modules/.nitro/vite/services/ssr/index.js is nitro's
// internal (undocumented) staging build for the "ssr" Vite environment — it
// builds correctly and is what nitro's prerenderer would otherwise use.
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const ssrBundlePath = resolve(rootDir, "node_modules/.nitro/vite/services/ssr/index.js");
const publicDir = resolve(rootDir, "dist/skote");
const indexHtmlPath = resolve(publicDir, "index.html");

if (!existsSync(ssrBundlePath)) {
  throw new Error(
    `Expected nitro's SSR staging bundle at ${ssrBundlePath} but it doesn't exist. ` +
      `This is an internal nitro build path (node_modules/.nitro/vite/services/ssr/index.js) ` +
      `that may have moved in a newer nitro version — run \`vite build\` and check ` +
      `node_modules/.nitro for where the "ssr" environment output actually landed.`,
  );
}

if (!existsSync(publicDir)) {
  throw new Error(`Expected client build output at ${publicDir} — run \`vite build\` first.`);
}

const { default: handler } = await import(pathToFileURL(ssrBundlePath).toString());
const response = await handler.fetch(new Request("http://localhost/le/"), {}, {});

if (response.status !== 200) {
  throw new Error(`SSR render of "/le/" returned status ${response.status}, expected 200.`);
}

const html = await response.text();
await mkdir(dirname(indexHtmlPath), { recursive: true });
await writeFile(indexHtmlPath, html, "utf8");
console.log(`Wrote ${indexHtmlPath}`);

// The "nitro" environment build (dist/server/, from src/nitro-empty-entry.ts)
// and nitro's own metadata file are build-time-only artifacts — not part of
// the static deployment.
await rm(resolve(rootDir, "dist/server"), { recursive: true, force: true });
await rm(resolve(rootDir, "dist/nitro.json"), { force: true });
