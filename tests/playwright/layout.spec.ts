import path from "node:path";
import { test, expect } from "@playwright/test";

const htmlPath = path.resolve(__dirname, "../../victorzoo.html");

const fileUrl = "file://" + htmlPath.replace(/\\/g, "/");

test.describe("mobile layout", () => {
  test("app remains centered on iPhone 15 Pro Max dimensions", async ({ page }) => {
    await page.goto(fileUrl);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const app = page.locator(".app");
    await expect(app).toBeVisible();
    const box = await app.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      const expectedLeft = (viewportWidth - box.width) / 2;
      expect(Math.abs(box.x - expectedLeft)).toBeLessThanOrEqual(2);
      expect(box.width).toBeLessThanOrEqual(viewportWidth);
    }
    const header = page.locator(".app-header");
    await expect(header).toBeVisible();
    const headerBox = await header.boundingBox();
    if (headerBox) {
      expect(headerBox.width).toBeGreaterThanOrEqual(viewportWidth - 2);
    }
  });
});
