import vinext from "vinext";
import { defineConfig } from "vite";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig({
    build: {
      // pg-native is an optional production-only libpq binding. Keeping it external
      // lets SQLite development builds run on machines without PostgreSQL headers.
      rolldownOptions: { external: ["pg-native"] },
    },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [vinext()],
});
