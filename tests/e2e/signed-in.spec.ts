import { expect, test, type Page } from "@playwright/test";

// Signed-in flows through the one-click demo personas (DEMO_LOGINS=on).
// These read the seeded demo data; Nina's run saves her resume the first time.

async function signInAs(page: Page, name: RegExp, landing: RegExp) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name }).click();
  await page.waitForURL(landing, { timeout: 45_000 });
}

test.describe.configure({ mode: "serial" });

test("student: home, jobs and resume", async ({ page }) => {
  await signInAs(page, /Bea Santos/, /\/home$/);
  await expect(page.getByRole("heading", { name: "Hi, Bea." })).toBeVisible();
  await expect(page.getByText(/Interview with Kalye Logistics/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Applications" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Data intern Kalye Logistics/ })).toBeVisible();

  await page.getByRole("link", { name: "Jobs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Internships for you" })).toBeVisible();
  await page.getByRole("button", { name: "Remote" }).click();
  await expect(page.getByRole("button", { name: /QA intern at Tanglaw Software/ })).toBeVisible();
  await page.getByRole("button", { name: /QA intern at Tanglaw Software/ }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByRole("heading", { name: "QA intern" })).toBeVisible();
  await expect(drawer.getByText("What you'll do")).toBeVisible();
  await drawer.getByRole("button", { name: "Close" }).click();

  await page.getByRole("link", { name: "Resume", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your resume" })).toBeVisible();
  await expect(page.getByLabel("Resume preview").getByText("Canteen inventory system, capstone")).toBeVisible();
  await page.getByRole("tab", { name: "Compact" }).click();
  await expect(page.getByRole("tab", { name: "Compact" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Classic" }).click();

  // Sync can pick up a saved resume. Opening the chat changes nothing.
  await page.getByRole("button", { name: "Improve with Sync" }).click();
  const chat = page.getByRole("region", { name: "Chat with Sync" });
  await expect(chat.getByRole("listitem").first()).toContainText("?", { timeout: 45_000 });
  await chat.getByRole("button", { name: "Done" }).click();
  await expect(page.getByLabel("Resume preview").getByText("Canteen inventory system, capstone")).toBeVisible();
});

test("coordinator: students, forms and activity", async ({ page }) => {
  await signInAs(page, /Maria Reyes/, /\/school$/);
  await expect(page.getByRole("heading", { name: "Needs attention" })).toBeVisible();
  await expect(page.getByText("Signed up", { exact: true })).toBeVisible();
  const roster = page.getByRole("table");
  await expect(roster.getByText("Bea Santos")).toBeVisible();
  await page.getByRole("tab", { name: "Interning" }).click();
  await expect(roster.getByText("Paolo Dizon")).toBeVisible();
  await expect(roster.getByText("Bea Santos")).toHaveCount(0);

  await page.getByRole("link", { name: "Forms" }).click();
  await expect(page.getByRole("heading", { name: "CHED forms" })).toBeVisible();

  await page.getByRole("link", { name: "People" }).click();
  await page.getByRole("tab", { name: "Activity" }).click();
  await expect(page.getByText(/exported the CHED report/).first()).toBeVisible();
});

test("admin: company verification queue", async ({ page }) => {
  await signInAs(page, /Ramon Cruz/, /\/school$/);
  await page.getByRole("link", { name: "People" }).click();
  await page.getByRole("tab", { name: "Company verification" }).click();
  await expect(page.getByText("Halo-Halo Labs")).toBeVisible();
  await expect(page.getByText("Personal email")).toBeVisible();
});

test("employer: applicant board and candidate profile", async ({ page }) => {
  await signInAs(page, /Liza Ocampo/, /\/employer$/);
  await expect(page.getByRole("heading", { name: "Data intern" })).toBeVisible();
  for (const col of ["New", "Reviewing", "Interview", "Offer"]) {
    await expect(page.getByRole("region", { name: col })).toBeVisible();
  }
  await page.getByRole("button", { name: "Open Ana Castillo" }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByRole("heading", { name: "Why Sync recommends them" })).toBeVisible();
  await expect(drawer.getByText(/exclude age, gender and photos/)).toBeVisible();
  await drawer.getByRole("button", { name: "Close" }).click();

  await page.getByRole("link", { name: "Current interns" }).click();
  await expect(page.getByRole("heading", { name: "Current interns" })).toBeVisible();
  await expect(page.getByRole("table").getByText("Paolo Dizon")).toBeVisible();
});

test("employer in review sees the review notice", async ({ page }) => {
  await signInAs(page, /Tess Navarro/, /\/employer$/);
  await expect(page.getByText(/Your company is in review/)).toBeVisible();
});

test("new student: finish onboarding signed in and save", async ({ page }) => {
  await signInAs(page, /Nina Garcia/, /\/(start|home)$/);
  if (page.url().endsWith("/home")) {
    await expect(page.getByRole("heading", { name: /Hi, Nina/ })).toBeVisible();
    return;
  }
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const next = page.getByRole("button", { name: "Next", exact: true });
  await page.getByRole("button", { name: "Information Technology", exact: true }).click();
  await next.click();
  await page.getByLabel("What's your full name?").fill("Nina Garcia");
  await next.click();
  await next.click();
  await page.getByLabel(/capstone/).fill("Gumawa kami ng attendance app gamit ang QR codes para sa 300 students. Ako ang nag-design ng UI sa Figma.");
  await next.click();
  await page.getByRole("button", { name: "Volunteer" }).click();
  await next.click();
  await page.getByRole("button", { name: "Taguig" }).click();
  await next.click();
  const chat = page.getByRole("region", { name: "Chat with Sync" });
  await expect(chat.getByRole("listitem").first()).toContainText("?", { timeout: 45_000 });
  await chat.getByLabel("Message Sync").fill("Nag-volunteer ako sa Brigada Eskwela, nag-paint ng classrooms kasama ang 30 students.");
  await chat.getByRole("button", { name: "Send" }).click();
  await expect(chat.getByRole("listitem").nth(2)).toBeVisible({ timeout: 45_000 });
  await chat.getByRole("button", { name: /^(Finish|Looks good)/ }).click();
  await expect(page.getByRole("heading", { name: "Save your resume." })).toBeVisible();
  await page.getByRole("button", { name: "Save my resume" }).click();
  await expect(page.getByRole("heading", { name: "You're ready, Nina." })).toBeVisible({ timeout: 30_000 });
});
