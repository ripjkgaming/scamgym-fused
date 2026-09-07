import { expect, test, type Locator, type Page } from "@playwright/test";
import { scamChannels } from "../../lib/scam-channels";

test.use({ reducedMotion: "reduce" });

const stages = [
  { button: "1 Example", heading: "Look at an example", hash: "example" },
  { button: "2 Stay safe", heading: "What to do", hash: "safe-steps" },
  { button: "3 Practise", heading: "Try a practice question", hash: "practice" },
];

async function expectStage(page: Page, current: number, focused = true) {
  const navigation = page.getByRole("navigation", { name: "Guide steps", exact: true });
  await expect(navigation.getByRole("button")).toHaveCount(3);
  await expect(navigation.locator('[aria-current="step"]')).toHaveCount(1);
  await expect(page.locator(".guide-panel")).toHaveCount(3);
  await expect(page.locator(".guide-panel:visible")).toHaveCount(1);
  for (const [index, stage] of stages.entries()) {
    const button = navigation.getByRole("button", { name: stage.button, exact: true });
    const panel = page.locator(".guide-panel").nth(index);
    await expect(button).toHaveAttribute("aria-controls", await panel.getAttribute("id") as string);
    if (index === current) {
      await expect(button).toHaveAttribute("aria-current", "step");
      await expect(panel).toBeVisible();
      const heading = panel.getByRole("heading", { level: 2, name: stage.heading, exact: true });
      await expect(heading).toBeVisible();
      if (focused) await expect(heading).toBeFocused();
    } else {
      await expect(button).not.toHaveAttribute("aria-current", "step");
      await expect(panel).toBeHidden();
      await expect(panel).toHaveAttribute("hidden", "");
      await expect(page.getByRole("heading", { level: 2, name: stage.heading, exact: true })).toHaveCount(0);
    }
  }
  if (focused) expect(new URL(page.url()).hash).toBe(`#${stages[current].hash}`);
}

async function tabTo(page: Page, target: Locator) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  await expect(target, "Control must be reachable using Tab without programmatic focus").toBeFocused();
}

async function expectReadableLayout(page: Page) {
  await expect(page.locator(".guide-panel:visible")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Document must not scroll horizontally").toBe(true);
  // Inspect descendants too: an overflow-hidden preview can conceal a broken inner layout.
  const overflow = await page.locator(".guide-panel:visible, .guide-panel:visible *:visible").evaluateAll((elements) => {
    return elements.flatMap((element) => {
      if (!(element instanceof HTMLElement) || !element.getClientRects().length) return [];
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      const boundary = element.parentElement?.closest(".example-preview, .guide-panel");
      const outer = boundary?.getBoundingClientRect();
      const problems: string[] = [];
      if (style.display !== "inline" && element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1) problems.push("inner horizontal overflow");
      if (outer && (box.left < outer.left - 1 || box.right > outer.right + 1)) problems.push("outside preview or panel");
      if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1) problems.push("nested vertical scrolling");
      return problems.map((problem) => `${element.tagName}.${element.className}: ${problem}`);
    });
  });
  expect(overflow, "Visible guide panels and inner examples must fit without clipped content or nested scrolling").toEqual([]);

  const textGroups = [
    { minimum: 20, selector: ".guide-heading > p, .example-message p, .example-transcript blockquote p, .example-mail-meta dd, .example-mail-body > p, .example-payment p, .example-flag-copy p, .guide-more > p:not(.guide-secondary-text):not(.help-note), .guide-safe-steps p, .guide-takeaway p, .practice-reference-message, .practice-question, .practice-choice-label, .practice-answer, .practice-feedback p, .practice-summary p, .help-section > p" },
    { minimum: 18, selector: ".guide-reading-controls > p, .guide-step-count, .guide-step-nav button, .example-intro, .example-identity > span, .example-badge, .example-timestamp, .example-url, .example-call-label, .example-transcript-label, .example-attachment span, .example-store-tag, .example-sale, .example-price > span:not(.example-flag), .example-product-copy > p:last-child, .practice-disclaimer, .practice-progress-label, .practice-footer p, .guide-secondary-text, .help-note, .footer-note" },
  ];
  for (const { minimum, selector } of textGroups) {
    const text = page.locator(selector).filter({ visible: true });
    expect(await text.count(), `Visible ${minimum}px text samples`).toBeGreaterThan(0);
    const undersized = await text.evaluateAll((elements, minimum) => elements.flatMap((element) => {
      const size = parseFloat(getComputedStyle(element).fontSize);
      return size < minimum ? [`${element.className}: ${size}px (${element.textContent?.trim()})`] : [];
    }), minimum);
    expect(undersized, `Text must be at least ${minimum}px`).toEqual([]);
  }
  const smallTargets = await page.locator(".learning-shell button:visible, .learning-shell summary:visible, .nav-help:visible, .help-link:visible").evaluateAll((elements) => elements.flatMap((element) => {
    const box = element.getBoundingClientRect();
    return box.width < 56 || box.height < 56 ? [`${element.textContent?.trim()}: ${box.width} x ${box.height}`] : [];
  }));
  expect(smallTargets, "Buttons and summaries must have at least 56px hit targets").toEqual([]);
}

for (const channel of scamChannels) {
  test(`${channel.id} guide runs locally on the existing site`, async ({ page }) => {
    const apiRequests: string[] = [];
    await page.route("**/api/**", async (route) => {
      apiRequests.push(route.request().url());
      await route.abort();
    });
    await page.goto(`/scams/${channel.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(channel.title);
    await expect(page.locator(".learning-shell")).toHaveAttribute("lang", "en");
    await expectStage(page, 0, false);
    const historyLength = await page.evaluate(() => history.length);
    await expect(page.getByRole("figure", { name: channel.exampleTitle })).toBeVisible();
    await expect(page.getByText("This example is made up. No links, calls or payments work.", { exact: true })).toBeVisible();
    await expect(page.locator(".example-preview").locator("a, button, input, audio, video")).toHaveCount(0);
    const warningSigns = page.getByRole("region", { name: "Warning signs in this example", includeHidden: true });
    await expect(warningSigns).toBeHidden();
    await expect(page.getByRole("button", { name: "Show warning signs", exact: true })).toHaveAttribute("aria-expanded", "false");
    await page.getByRole("button", { name: "Show warning signs", exact: true }).click();
    await expect(page.getByRole("button", { name: "Hide warning signs", exact: true })).toHaveAttribute("aria-expanded", "true");
    await expect(warningSigns.getByRole("listitem")).toHaveCount(3);
    for (const [index, sign] of channel.warningSigns.entries()) {
      await expect(warningSigns.getByRole("heading", { name: sign.title, exact: true })).toBeVisible();
      await expect(page.getByRole("img", { name: `Warning sign ${index + 1}: ${sign.title}`, exact: true })).toBeVisible();
    }
    await page.getByRole("button", { name: "Hide warning signs", exact: true }).click();
    await expect(warningSigns).toBeHidden();
    await expect(page.locator(".example-flag")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Show warning signs", exact: true })).toHaveAttribute("aria-expanded", "false");

    await page.getByRole("button", { name: "Next: what to do", exact: true }).click();
    await expectStage(page, 1);
    await expect(page.locator(".guide-safe-steps > li")).toHaveCount(3);
    for (const step of channel.safeSteps) {
      await expect(page.getByRole("heading", { level: 3, name: step.title, exact: true })).toBeVisible();
      await expect(page.locator(".guide-safe-steps").getByText(step.body, { exact: true })).toBeVisible();
    }
    await page.getByRole("button", { name: "Next: practise", exact: true }).click();
    await expectStage(page, 2);
    const practice = page.getByRole("region", { name: channel.practice.title, exact: true });
    await expect(practice.getByText("This is only practice. Nothing is sent and no money is used.", { exact: true })).toBeVisible();
    await expect(practice.getByRole("progressbar")).toHaveJSProperty("max", 3);
    const unsafe = channel.practice.steps[0].choices.find((choice) => !choice.safe)!;
    await practice.getByRole("button", { name: unsafe.label, exact: true }).click();
    await expect(practice.getByRole("status")).toContainText(unsafe.feedback);
    await expect(practice.getByRole("status")).toBeFocused();
    await expect(practice.getByRole("progressbar")).toHaveJSProperty("value", 0);
    await expect(practice.getByRole("group")).toHaveCount(0);
    await expect(practice.getByRole("button", { name: "Next question", exact: true })).toHaveCount(0);
    await practice.getByRole("button", { name: "Choose a different answer", exact: true }).click();
    await expect(practice.getByRole("heading", { name: channel.practice.steps[0].message, exact: true })).toBeFocused();
    await expect(practice.getByText(unsafe.feedback, { exact: true })).toHaveCount(0);
    expect(channel.practice.steps).toHaveLength(3);
    for (const [index, step] of channel.practice.steps.entries()) {
      await expect(practice.locator(".practice-question")).toHaveCount(1);
      await expect(practice.getByRole("heading", { name: step.message, exact: true })).toBeVisible();
      await expect(practice.getByText(`Question ${index + 1} of 3`, { exact: true })).toBeVisible();
      const choices = practice.getByRole("group", { name: step.message, exact: true });
      await expect(choices.getByRole("button")).toHaveCount(3);
      for (const choice of step.choices) await expect(choices.getByRole("button", { name: choice.label, exact: true })).toBeVisible();
      for (const previous of channel.practice.steps.slice(0, index)) {
        await expect(practice.getByRole("heading", { name: previous.message, exact: true })).toHaveCount(0);
        await expect(practice.getByText(previous.choices.find((choice) => choice.safe)!.feedback, { exact: true })).toHaveCount(0);
      }
      const safe = step.choices.find((choice) => choice.safe)!;
      await practice.getByRole("button", { name: safe.label, exact: true }).click();
      await expect(practice.getByRole("status")).toContainText(safe.feedback);
      await expect(practice.getByRole("status")).toBeFocused();
      await expect(practice.getByRole("status")).toHaveCount(1);
      await expect(practice.getByRole("progressbar")).toHaveJSProperty("value", index + 1);
      await expect(page.getByRole("log", { includeHidden: true })).toHaveCount(0);
      await expectReadableLayout(page);
      if (index === 1) {
        await page.getByRole("navigation", { name: "Guide steps" }).getByRole("button", { name: "1 Example", exact: true }).click();
        await expectStage(page, 0);
        await expect(practice).toBeHidden();
        await page.getByRole("navigation", { name: "Guide steps" }).getByRole("button", { name: "3 Practise", exact: true }).click();
        await expectStage(page, 2);
        await expect(practice.getByRole("heading", { name: step.message, exact: true })).toBeVisible();
        await expect(practice.getByRole("status")).toContainText(safe.feedback);
        await expect(practice.getByRole("progressbar")).toHaveJSProperty("value", 2);
        await expect(practice.getByRole("group")).toHaveCount(0);
      }
      await practice.getByRole("button", { name: index === 2 ? "Finish practice" : "Next question", exact: true }).click();
      if (index < 2) await expect(practice.getByRole("heading", { name: channel.practice.steps[index + 1].message, exact: true })).toBeFocused();
    }
    await expect(practice.getByRole("heading", { name: "Practice complete", exact: true })).toBeVisible();
    await expect(practice.locator(".practice-summary")).toBeFocused();
    await expect(practice.getByRole("progressbar")).toHaveJSProperty("value", 3);
    await expect(practice.getByRole("status")).toHaveCount(0);
    await expect(practice.locator(".practice-question")).toHaveCount(0);
    await expectReadableLayout(page);
    await practice.getByRole("button", { name: "Practise again", exact: true }).click();
    await expect(practice.getByRole("progressbar")).toHaveJSProperty("value", 0);
    await expect(practice.getByRole("heading", { name: channel.practice.steps[0].message, exact: true })).toBeFocused();
    await expect(practice.getByRole("group").getByRole("button")).toHaveCount(3);
    expect(await page.evaluate(() => history.length), "Guide stages and practice must not build browser history").toBe(historyLength);
    expect(apiRequests).toEqual([]);
  });

  test(`${channel.id} practice deep link reveals and focuses the panel on initial load`, async ({ page }) => {
    await page.goto(`/scams/${channel.id}#practice`);
    await expectStage(page, 2);
    await expect(page.getByRole("region", { name: channel.practice.title, exact: true })).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveJSProperty("value", 0);
    await page.reload();
    await expectStage(page, 2);
  });
}

test("homepage links to the guides without inheriting their styles on return", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".hero-title")).toContainText("The lesson stays.");
  const originalStyles = await page.locator(".masthead .brand").evaluate((element) => {
    const style = getComputedStyle(element);
    return { font: style.font, color: style.color, gap: style.gap };
  });
  const guides = page.getByRole("region", { name: "Explore the scam guides." });
  await expect(guides.getByRole("link")).toHaveCount(5);
  expect(await guides.getByRole("link").evaluateAll((links) => {
    const boxes = links.map((link) => link.getBoundingClientRect());
    return boxes.every((box, index) => boxes.slice(index + 1).every((other) => box.right <= other.left || other.right <= box.left || box.bottom <= other.top || other.bottom <= box.top));
  }), "Guide cards must not overlap").toBe(true);
  for (const channel of scamChannels) {
    await expect(guides.getByRole("link", { name: new RegExp(channel.title) })).toHaveAttribute("href", `/scams/${channel.id}`);
  }
  await guides.getByRole("link", { name: /Text or SMS scams/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Text or SMS scams");
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link").click();
  await expect(guides).toBeVisible();
  await expect(page.locator(".hero-title")).toContainText("The lesson stays.");
  expect(await page.locator(".masthead .brand").evaluate((element) => {
    const style = getComputedStyle(element);
    return { font: style.font, color: style.color, gap: style.gap };
  })).toEqual(originalStyles);
  await expect(page.locator("#check")).toBeVisible();
  await expect(page.locator("#routine")).toBeVisible();
  await expect(page.locator(".pin-phone .phone")).toBeVisible();
  await page.goto("/scams/phone#practice");
  await expectStage(page, 2);
  await expect(page.getByRole("link", { name: "Start voice practice", exact: true })).toBeHidden();
  await page.locator("summary").filter({ hasText: "Prefer to practise speaking?" }).click();
  await page.getByRole("link", { name: "Start voice practice", exact: true }).click();
  await expect(page).toHaveURL(/\/practice$/);
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
  await expect(page.locator(".learning-shell")).toHaveCount(0);
});

test("larger text toggles from 20px to 24px and persists across reloads and guide navigation", async ({ page }) => {
  await page.goto("/scams/text-sms");
  const toggle = page.getByRole("button", { name: "Larger text", exact: true });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".guide-reader")).toHaveCSS("font-size", "20px");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".guide-reader")).toHaveCSS("font-size", "24px");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".guide-reader")).toHaveCSS("font-size", "24px");

  const otherGuides = page.locator(".learning-footer details");
  await expect(otherGuides).not.toHaveAttribute("open", "");
  const navigation = page.getByRole("navigation", { name: "Scam guides", exact: true });
  await expect(navigation).toBeHidden();
  await otherGuides.locator("summary").filter({ hasText: "See other scam guides" }).click();
  await expect(navigation.getByRole("link")).toHaveCount(5);
  for (const channel of scamChannels) {
    await expect(navigation.getByRole("link", { name: channel.title, exact: true })).toHaveAttribute("href", `/scams/${channel.id}`);
  }
  await expect(navigation.getByRole("link", { name: "Text or SMS scams", exact: true })).toHaveAttribute("aria-current", "page");
  await navigation.getByRole("link", { name: "Email scams", exact: true }).click();
  await expect(page).toHaveURL(/\/scams\/email$/);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".guide-reader")).toHaveCSS("font-size", "24px");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".guide-reader")).toHaveCSS("font-size", "20px");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".guide-reader")).toHaveCSS("font-size", "20px");
});

for (const restriction of ["getter", "methods"] as const) {
  test(`restricted localStorage ${restriction} does not break reading or practice controls`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript((restriction) => {
      const blocked = () => { throw new DOMException("Storage is blocked", "SecurityError"); };
      if (restriction === "getter") Object.defineProperty(window, "localStorage", { configurable: true, get: blocked });
      else {
        Object.defineProperty(Storage.prototype, "getItem", { configurable: true, value: blocked });
        Object.defineProperty(Storage.prototype, "setItem", { configurable: true, value: blocked });
      }
    }, restriction);
    await page.goto("/scams/text-sms");
    const toggle = page.getByRole("button", { name: "Larger text", exact: true });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".guide-reader")).toHaveCSS("font-size", "24px");
    await page.getByRole("button", { name: "Show warning signs", exact: true }).click();
    await expect(page.getByRole("region", { name: "Warning signs in this example" })).toBeVisible();
    await page.getByRole("button", { name: "Next: what to do", exact: true }).click();
    await expectStage(page, 1);
    await page.getByRole("button", { name: "Next: practise", exact: true }).click();
    await expectStage(page, 2);
    const safe = scamChannels[0].practice.steps[0].choices.find((choice) => choice.safe)!;
    await page.getByRole("button", { name: safe.label, exact: true }).click();
    await expect(page.getByRole("status")).toContainText(safe.feedback);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".guide-reader")).toHaveCSS("font-size", "20px");
    await page.reload();
    await expectStage(page, 2);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(errors).toEqual([]);
  });
}

test("keyboard-only readers can change stages, retry, finish and reset with meaningful focus", async ({ page }) => {
  const channel = scamChannels[0];
  await page.goto(`/scams/${channel.id}`);
  await expectStage(page, 0, false);
  const safeStage = page.getByRole("navigation", { name: "Guide steps" }).getByRole("button", { name: "2 Stay safe", exact: true });
  await tabTo(page, safeStage);
  await page.keyboard.press("Enter");
  await expectStage(page, 1);
  await tabTo(page, page.getByRole("button", { name: "Back: example", exact: true }));
  await page.keyboard.press("Space");
  await expectStage(page, 0);
  await tabTo(page, page.getByRole("button", { name: "Show warning signs", exact: true }));
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Hide warning signs", exact: true })).toBeFocused();
  await tabTo(page, page.getByRole("button", { name: "Next: what to do", exact: true }));
  await page.keyboard.press("Enter");
  await expectStage(page, 1);
  await tabTo(page, page.getByRole("button", { name: "Next: practise", exact: true }));
  await page.keyboard.press("Enter");
  await expectStage(page, 2);
  const practice = page.getByRole("region", { name: channel.practice.title, exact: true });
  const unsafe = channel.practice.steps[0].choices.find((choice) => !choice.safe)!;
  await tabTo(page, practice.getByRole("button", { name: unsafe.label, exact: true }));
  await page.keyboard.press("Space");
  await expect(practice.getByRole("status")).toBeFocused();
  await expect(practice.getByRole("status")).toContainText(unsafe.feedback);
  await tabTo(page, practice.getByRole("button", { name: "Choose a different answer", exact: true }));
  await page.keyboard.press("Enter");
  for (const [index, step] of channel.practice.steps.entries()) {
    await expect(practice.getByRole("heading", { name: step.message, exact: true })).toBeFocused();
    const safe = step.choices.find((choice) => choice.safe)!;
    await tabTo(page, practice.getByRole("button", { name: safe.label, exact: true }));
    await page.keyboard.press("Enter");
    await expect(practice.getByRole("status")).toBeFocused();
    await expect(practice.getByRole("status")).toContainText(safe.feedback);
    await tabTo(page, practice.getByRole("button", { name: index === 2 ? "Finish practice" : "Next question", exact: true }));
    await page.keyboard.press("Enter");
  }
  await expect(practice.getByRole("heading", { name: "Practice complete", exact: true })).toBeVisible();
  await expect(practice.locator(".practice-summary")).toBeFocused();
  await tabTo(page, practice.getByRole("button", { name: "Practise again", exact: true }));
  await page.keyboard.press("Space");
  await expect(practice.getByRole("heading", { name: channel.practice.steps[0].message, exact: true })).toBeFocused();
  await expect(practice.getByRole("progressbar")).toHaveJSProperty("value", 0);
});

test("Get help is available before any guide steps, with bank advice outside the support disclosure", async ({ page }) => {
  await page.goto("/scams/phone");
  await expectStage(page, 0, false);
  const helpLink = page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Get help", exact: true });
  await expect(helpLink).toBeInViewport();
  await expect(helpLink).toHaveAttribute("href", "#get-help");
  await tabTo(page, helpLink);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#get-help$/);
  await expectStage(page, 0, false);
  const help = page.getByRole("region", { name: "Need help with a real scam?", exact: true });
  await expect(help.getByRole("heading")).toBeInViewport();
  await expect(help.getByText("contact your bank now.", { exact: true })).toBeVisible();
  await expect(help).toContainText("Use the number on your bank card.");
  await expect(help.locator("details")).not.toHaveAttribute("open", "");
  await expect(help.getByRole("link", { name: "Report to Scamwatch", exact: true })).toBeHidden();
  await expect(help.getByRole("link", { name: "Get identity support from IDCARE", exact: true })).toBeHidden();
  await tabTo(page, help.locator("summary").filter({ hasText: "Support and reporting in Australia" }));
  await page.keyboard.press("Enter");
  await expect(help.getByRole("link", { name: "Report to Scamwatch", exact: true })).toBeVisible();
  await expect(help.getByRole("link", { name: "Report to Scamwatch", exact: true })).toHaveAttribute("href", "https://www.scamwatch.gov.au/report-a-scam");
  await expect(help.getByRole("link", { name: "Get identity support from IDCARE", exact: true })).toBeVisible();
  await expect(help.getByRole("link", { name: "Get identity support from IDCARE", exact: true })).toHaveAttribute("href", "https://www.idcare.org/");
});

for (const width of [320, 390, 1040, 1440]) {
  for (const colorScheme of ["light", "dark"] as const) {
    for (const largeText of [false, true]) {
      test(`guides fit ${width}px, ${colorScheme}, ${largeText ? "larger" : "default"} text including inner content`, async ({ page }) => {
        test.setTimeout(120_000);
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme });
        for (const channel of scamChannels) {
          await test.step(channel.id, async () => {
            await page.goto(`/scams/${channel.id}`);
            const toggle = page.getByRole("button", { name: "Larger text", exact: true });
            if (largeText && channel === scamChannels[0]) await toggle.click();
            await expect(toggle).toHaveAttribute("aria-pressed", String(largeText));
            await expect(page.locator(".guide-reader")).toHaveCSS("font-size", largeText ? "24px" : "20px");
            await expectStage(page, 0, false);
            await expectReadableLayout(page);
            await page.getByRole("button", { name: "Show warning signs", exact: true }).click();
            await page.locator(".example-explanation summary").click();
            await expectReadableLayout(page);
            if (!largeText && colorScheme === "light" && (width === 390 || width === 1440)) {
              await page.screenshot({ path: `/tmp/opencode/scamgym-senior-${channel.id}-${width}-example.png`, fullPage: true });
            }
            await page.getByRole("button", { name: "Next: what to do", exact: true }).click();
            await expectStage(page, 1);
            await expectReadableLayout(page);
            await page.getByRole("button", { name: "Next: practise", exact: true }).click();
            await expectStage(page, 2);
            await expectReadableLayout(page);
            if (!largeText && colorScheme === "light" && (width === 390 || width === 1440)) {
              await page.screenshot({ path: `/tmp/opencode/scamgym-senior-${channel.id}-${width}-practice.png`, fullPage: true });
            }
            if (channel.id === "phone") {
              await page.locator(".voice-practice-option summary").click();
              await expectReadableLayout(page);
            }
            const unsafe = channel.practice.steps[0].choices.find((choice) => !choice.safe)!;
            await page.getByRole("button", { name: unsafe.label, exact: true }).click();
            await expect(page.getByRole("status")).toContainText(unsafe.feedback);
            await expectReadableLayout(page);
          });
        }
      });
    }
  }
}

test("200% CSS zoom approximation at a 640px viewport keeps guide content usable", async ({ page }) => {
  test.setTimeout(90_000);
  // CSS zoom exercises magnified layout, not the browser's native zoom UI or its media-query behaviour.
  await page.setViewportSize({ width: 640, height: 900 });
  await page.emulateMedia({ colorScheme: "dark" });
  for (const channel of scamChannels) {
    await page.goto(`/scams/${channel.id}`);
    await page.locator("html").evaluate((element) => { element.style.zoom = "2"; });
    await expect(page.locator("html")).toHaveCSS("zoom", "2");
    const toggle = page.getByRole("button", { name: "Larger text", exact: true });
    if (channel === scamChannels[0]) await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Show warning signs", exact: true }).click();
    await expectReadableLayout(page);
    await page.getByRole("button", { name: "Next: what to do", exact: true }).click();
    await expectStage(page, 1);
    await expectReadableLayout(page);
    await page.getByRole("button", { name: "Next: practise", exact: true }).click();
    await expectStage(page, 2);
    await expectReadableLayout(page);
  }
});
