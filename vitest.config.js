import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import { SYNTHETIC_UNIT_ENV } from "./src/test/synthetic-env.js";

// Override inherited values before Vite resolves env. Test env remains stubbable.
Object.assign(process.env, SYNTHETIC_UNIT_ENV);

export default defineConfig({
  envDir: false,
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    env: SYNTHETIC_UNIT_ENV,
    setupFiles: ["./src/test/unit-network-guard.js", "./src/test/setup.js"],
    sequence: { setupFiles: "list" },
    include: ["src/**/*.test.{js,jsx}"],
  },
});
