import { defineConfig } from "@playwright/test";
import { devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/playwright",
  reporter: [["list"]],
  use: {
    baseURL: "",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "iphone-15-pro-max",
      use: {
        ...devices["iPhone 13 Pro Max"],
        viewport: { width: 430, height: 932 }
      }
    }
  ]
});
