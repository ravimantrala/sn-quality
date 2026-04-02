import { defineConfig } from "@playwright/test";
import "dotenv/config";

export default defineConfig({
  testDir: "./tests/generated",
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  use: {
    baseURL: process.env.SN_INSTANCE,
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from(`${process.env.SN_USER || ""}:${process.env.SN_PASSWORD || ""}`).toString("base64")}`,
      Accept: "application/json",
    },
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
