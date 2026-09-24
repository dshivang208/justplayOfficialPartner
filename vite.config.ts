import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },

  nitro: {
    preset: "vercel",

    // Nitro v3's default "rolldown" builder has a known bug where it splits
    // shared deps (like @supabase/functions-js) into _libs/ chunks and
    // leaves a raw, unresolved `require("tslib")` behind instead of
    // bundling it in — which is exactly the ERR_MODULE_NOT_FOUND you saw on
    // Vercel. The classic "rollup" builder doesn't have this bug and is the
    // one externals.inline below was designed for.
    builder: "rollup",

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