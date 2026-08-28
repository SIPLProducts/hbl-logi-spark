import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const basePath = process.env.APP_BASE_PATH || "/";

export default defineConfig({
  vite: {
    base: basePath,

    environments: {
      nitro: {
        build: {
          rollupOptions: {
            input: "src/nitro-empty-entry.ts",
          },
        },
      },
    },
  },

  tanstackStart: {
    server: {
      entry: "server",
    },
  },

  nitro: {
    preset: "static",
    output: {
      dir: "{{ rootDir }}/dist",
      publicDir: "{{ output.dir }}/skote",
    },
  },
});