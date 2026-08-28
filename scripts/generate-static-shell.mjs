// Renders dist/skote/index.html from the app's server-rendered output,
// then discards the server bundle — the deployed artifact is a fully
// static SPA (assets + one HTML shell).

import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

const ssrBundlePath = resolve(
  rootDir,
  "node_modules/.nitro/vite/services/ssr/index.js",
);

const publicDir = resolve(rootDir, "dist/skote");
const indexHtmlPath = resolve(publicDir, "index.html");

// Quality = /le/
// Production = /
const basePath = process.env.APP_BASE_PATH || "/";

const normalizedBasePath =
  basePath === "/" ? "/" : `/${basePath.replace(/^\/|\/$/g, "")}/`;

console.log(`Generating static shell for base path: ${normalizedBasePath}`);

if (!existsSync(ssrBundlePath)) {
  throw new Error(
    `Expected nitro's SSR staging bundle at ${ssrBundlePath} but it doesn't exist. ` +
      `Run vite build first and check node_modules/.nitro.`,
  );
}

if (!existsSync(publicDir)) {
  throw new Error(
    `Expected client build output at ${publicDir} — run vite build first.`,
  );
}

const { default: handler } = await import(
  pathToFileURL(ssrBundlePath).toString()
);

const response = await handler.fetch(
  new Request(`http://localhost${normalizedBasePath}`),
  {},
  {},
);

if (response.status !== 200) {
  throw new Error(
    `SSR render of "${normalizedBasePath}" returned status ${response.status}, expected 200.`,
  );
}

const html = await response.text();

await mkdir(dirname(indexHtmlPath), { recursive: true });

await writeFile(indexHtmlPath, html, "utf8");

console.log(`Wrote ${indexHtmlPath}`);

// Build-time-only artifacts — not part of the static deployment.
await rm(resolve(rootDir, "dist/server"), {
  recursive: true,
  force: true,
});

await rm(resolve(rootDir, "dist/nitro.json"), {
  force: true,
});