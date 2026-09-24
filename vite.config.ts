import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },

  nitro: {
    preset: "vercel",

    externals: {
      inline: [
        "tslib",
        "@supabase/functions-js",
      ],
    },
  },

  vite: {
    ssr: {
      noExternal: [
        "tslib",
        "@supabase/functions-js",
      ],
    },
  },
});