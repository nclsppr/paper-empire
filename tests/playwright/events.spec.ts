import path from "node:path";
import { test, expect } from "@playwright/test";

const htmlPath = path.resolve(__dirname, "../../index.html");
const fileUrl = "file://" + htmlPath.replace(/\\/g, "/");

test.describe("events modal", () => {
  test("forces an event and resolves a choice", async ({ page }) => {
    await page.goto(fileUrl);
    await page.evaluate(() => {
      if (window.Tutorial && typeof window.Tutorial.skip === "function") {
        window.Tutorial.skip(true);
      }
    });
    await page.evaluate(() => window.__PE_DEBUG && window.__PE_DEBUG.spawnEvent("machineBreakdown"));
    const modal = page.locator("#eventModal");
    await expect(modal).toBeVisible();
    await page.locator(".event-choice-btn").first().click();
    await expect(page.locator(".event-result")).not.toHaveText("");
    await expect(modal).toBeHidden();
  });
});
