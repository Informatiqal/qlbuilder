import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["test/_playground.spec.js", "test/create_app_command.spec.js"],
    testTimeout: 30000,
    maxWorkers: 1,
    maxConcurrency: 1,
  },
});
