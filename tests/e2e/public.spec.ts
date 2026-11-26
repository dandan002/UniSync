import { expect, test, type Page } from "@playwright/test";

test("landing: pick a course and start the chat @phone", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Build your first resume/ })).toBeVisible();
  const cta = page.getByRole("button", { name: /Build my resume/ });
  await expect(cta).toBeDisabled();
  await page.getByRole("button", { name: "Information Technology" }).click();
  await expect(page.getByText("SQL").first()).toBeVisible();
  await page.getByRole("button", { name: /Build my resume/ }).click();
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByRole("heading", { name: "What's your full name?" })).toBeVisible();
});

test("onboarding: eight questions build the resume live", async ({ page }) => {
  await page.goto("/start");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.getByRole("heading", { name: "What's your course?" })).toBeVisible();
  await page.getByRole("button", { name: "Information Technology", exact: true }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("What's your full name?").fill("Ana Reyes");
  await page.getByRole("button", { name: "Next" }).click();
  const paper = page.getByLabel("Your resume, live");
  await expect(paper.getByText("Ana Reyes")).toBeVisible();

  await page.getByRole("radio", { name: "Taglish" }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("What did you build for your capstone?").fill("Inventory system para sa school canteen. Ako yung gumawa ng database, 4 kami sa team.");
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByRole("button", { name: "Club officer" }).click();
  await page.getByRole("button", { name: "Family business" }).click();
  await expect(paper.getByText(/inventory system/i).first()).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "What did you do as a club officer?" })).toBeVisible();
  await page.getByLabel("What did you do as a club officer?").fill("Treasurer ng IT Society. Nag-collect ng fees from 120 members, monthly report sa Google Sheets.");
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByRole("button", { name: "Pasig" }).click();
  await page.getByRole("button", { name: "Remote" }).click();
  await page.getByRole("radio", { name: "₱3,000+" }).click();
  await expect(paper.getByText(/Pasig, Remote/)).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Save your resume." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Text me a code" })).toBeVisible();
  await expect(paper.getByText("Family store")).toBeVisible();

  // The draft survives a reload on this device.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Welcome back, Ana." })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Save your resume." })).toBeVisible();
});

test("sign-in: code form and demo accounts", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Log in to Unisync." })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await page.getByRole("button", { name: "Use my mobile number" }).click();
  await expect(page.getByLabel("Mobile number")).toBeVisible();
  await expect(page.getByRole("button", { name: /Maria Reyes/ })).toBeVisible();
});

test("signed-in pages redirect to sign-in", async ({ page }) => {
  await page.goto("/school");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("privacy policy and terms are linked and readable @phone", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();
  await expect(page.getByRole("heading", { name: "Privacy Policy", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "5. Sync and AI" })).toBeVisible();
  await expect(page.getByText(/Data Privacy Act of 2012/)).toBeVisible();
  await expect(page.getByRole("link", { name: "mail@unisync.dev" }).first()).toHaveAttribute("href", "mailto:mail@unisync.dev");
  await page.getByRole("contentinfo").getByRole("link", { name: "Terms" }).click();
  await expect(page.getByRole("heading", { name: "Terms of Service", level: 1 })).toBeVisible();
  await expect(page.getByText(/Never ask students for money/)).toBeVisible();

  await page.goto("/sign-in");
  await expect(page.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
});

// Saving from onboarding with an email code. Clerk development instances
// accept +clerk_test addresses with the code 424242; production instances
// don't, so these only run against a local setup. Each test deletes the
// account it made.
test.describe("onboarding: save with an email code", () => {
  test.skip(!!process.env.E2E_BASE_URL, "Needs a Clerk development instance (+clerk_test emails).");

  async function answerAndSignUp(page: Page, name: string) {
    await page.goto("/start");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const next = () => page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Information Technology", exact: true }).click();
    await next();
    await page.getByLabel("What's your full name?").fill(name);
    await next();
    await next();
    await page.getByRole("button", { name: "Skip" }).click();
    await page.getByRole("button", { name: "None yet" }).click();
    await next();
    await page.getByRole("button", { name: "Remote" }).click();
    await next();
    await expect(page.getByRole("heading", { name: "Save your resume." })).toBeVisible();
    await page.getByRole("button", { name: "Use my school email" }).click();
    await page.getByLabel("Email").fill(`e2e-save-${Date.now()}+clerk_test@example.com`);
    await page.getByRole("button", { name: "Email me a code" }).click();
    await page.getByLabel(/Enter the six-digit code/).fill("424242");
    await page.getByRole("button", { name: "Continue" }).click();
  }

  async function deleteAccount(page: Page) {
    await page.goto("/home");
    await page.getByRole("button", { name: /Account for/ }).click();
    await page.getByRole("menuitem", { name: "Delete account" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Delete your account?" });
    await dialog.getByLabel("Type DELETE to confirm").fill("DELETE");
    await dialog.getByRole("button", { name: "Delete my account" }).click();
    await page.waitForURL((u) => u.pathname === "/", { timeout: 30_000 });
  }

  test("the code signs you up, saves the resume and opens Sync", async ({ page }) => {
    await answerAndSignUp(page, "Code Check");
    await expect(page.getByRole("region", { name: "Chat with Sync" }).getByText(/^Hi Code!/)).toBeVisible({ timeout: 30_000 });
    await deleteAccount(page);
  });

  test("a lost save answer is retried after a reload", async ({ page }) => {
    // Drop the first save request, as a flaky network or a remount would.
    let dropped = false;
    await page.route("**/start", async (route) => {
      const req = route.request();
      if (!dropped && req.method() === "POST" && (req.postData() ?? "").includes("Retry Check")) {
        dropped = true;
        await route.abort();
        return;
      }
      await route.fallback();
    });
    await answerAndSignUp(page, "Retry Check");
    await expect(page.getByText(/We couldn't reach Unisync/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Save my resume" })).toBeEnabled();
    expect(dropped).toBe(true);

    // No tap needed: the pending save runs once the page is back.
    await page.reload();
    await expect(page.getByRole("region", { name: "Chat with Sync" }).getByText(/^Hi Retry!/)).toBeVisible({ timeout: 30_000 });
    await deleteAccount(page);
  });
});
