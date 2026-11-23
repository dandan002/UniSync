import { expect, test } from "@playwright/test";

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
