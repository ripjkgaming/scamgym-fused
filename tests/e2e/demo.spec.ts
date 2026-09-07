import { expect, test } from "@playwright/test";

test("completes the deterministic demo path", async ({ page }) => {
  await page.goto("/?demo=1");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /i understand/i }).click();
  await page.getByRole("button", { name: /answer call/i }).click();
  await expect(page.getByText(/bank security team/i)).toBeVisible();
  await expect(page.getByText(/practice only.*not a real call/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /hear the last message again/i })).toBeVisible();
  await page.screenshot({ path: "output/playwright/call-mobile.png", fullPage: true });
  await page.getByRole("button", { name: /type instead/i }).click();
  await page.getByLabel(/your reply/i).fill("No. I will call the bank using the official number on my card.");
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.getByRole("heading", { name: /scam resistance review/i })).toBeVisible();
  await expect(page.getByText(/resistance score/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /how the pressure changed/i })).toBeVisible();
  await expect(page.getByText(/three-step exit plan/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /print safety plan/i })).toBeVisible();
  await page.screenshot({ path: "output/playwright/debrief-mobile.png", fullPage: true });
});

test("recovers with typed input when microphone access fails", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: () => Promise.reject(new DOMException("Permission denied", "NotAllowedError")),
    });
  });
  await page.goto("/?demo=1");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /i understand/i }).click();
  await page.getByRole("button", { name: /answer call/i }).click();
  const talkButton = page.getByRole("button", { name: /tap to speak/i });
  await expect(talkButton).toBeEnabled({ timeout: 15_000 });
  await talkButton.click();
  await expect(page.getByText(/microphone access failed/i)).toBeVisible();
  await expect(page.getByLabel(/your reply/i)).toBeVisible();
});
