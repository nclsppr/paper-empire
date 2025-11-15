import path from "node:path";
import { test, expect } from "@playwright/test";

const htmlPath = path.resolve(__dirname, "../../index.html");
const fileUrl = "file://" + htmlPath.replace(/\\/g, "/");

test.describe("contracts tab", () => {
  test("switches tabs and renders contracts", async ({ page }) => {
    await page.goto(fileUrl);
    await expect(page.locator("#contractsPanel")).toBeVisible();
    await page.locator("#journalTab").click();
    await expect(page.locator("#journalPanel")).toBeVisible();
    await page.locator("#contractsTab").click();
    await expect(page.locator("#contractsPanel")).toBeVisible();
  });
});
