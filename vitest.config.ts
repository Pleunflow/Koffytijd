import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    // DB-tests delen één database; draai bestanden na elkaar.
    fileParallelism: false,
    setupFiles: ["./test/setup.ts"],
    globalSetup: ["./test/global-setup.ts"],
  },
});
