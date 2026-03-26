import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/tools/**", "src/api/**", "src/utils/**"],
      reporter: ["text", "lcov"],
      thresholds: {
        // Coverage thresholds are enforced per tested file.
        // Files without tests are not blocked; thresholds ramp up
        // as subsequent tasks add test suites.
        perFile: true,
        "src/tools/plaid.ts": {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
        "src/utils/errors.ts": {
          lines: 60,
          functions: 60,
          branches: 50,
          statements: 60,
        },
      },
    },
  },
});
