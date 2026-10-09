import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Public pages are prerendered; authenticated pages read cookies and stay dynamic.
const config = defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});

// Webpack avoids duplicated server chunks in the Workers upload.
config.buildCommand = "npx next build --webpack";

export default config;
