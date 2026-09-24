import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },

  nitro: {
    preset: "vercel",

    // Nitro's default code-splitting groups every node_modules package into
    // its own shared "_libs/<name>.mjs" chunk. With this project's Rolldown
    // build pipeline, that step has a bug: it leaves a raw, unresolved
    // `require("tslib")`/`import "tslib"` behind inside the chunk instead of
    // actually bundling tslib's code into it — which is exactly the
    // ERR_MODULE_NOT_FOUND for /var/task/_libs/supabase__functions-js.mjs
    // seen on Vercel. Setting inlineDynamicImports makes Nitro skip that
    // chunk-splitting step entirely and bundle tslib directly into whatever
    // file needs it, so there's no separate _libs chunk left to go missing.
    rollupConfig: {
      output: {
        inlineDynamicImports: true,
      },
    },

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