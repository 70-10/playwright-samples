import test, { expect } from "@playwright/test";
import path from "node:path";
import { SinonFakeTimers, SinonStatic } from "sinon";

declare global {
  interface Window {
    __clock: SinonFakeTimers;
    sinon: SinonStatic;
  }
}

test.beforeEach(async ({ context }) => {
  await context.addInitScript({
    path: path.join(__dirname, "..", "./node_modules/sinon/pkg/sinon.js"),
  });

  await context.addInitScript(() => {
    window.__clock = window.sinon.useFakeTimers();
  });
});

test("fake timer test", async ({ page }) => {
  await page.setContent(`
    <h1>UTC Time: <x-time></x-time></h1>
    <script>
      const time = document.querySelector('x-time');
      (function renderLoop() {
        const date = new Date();
        time.textContent = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
          .map(number => String(number).padStart(2, '0'))
          .join(':');
        setTimeout(renderLoop, 1000);
      })();
    </script>
  `);

  await expect(page.locator("x-time")).toHaveText("00:00:00");
  await page.evaluate(() => window.__clock.tick(60 * 60 * 1000));
  await expect(page.locator("x-time")).toHaveText("01:00:00");
});
