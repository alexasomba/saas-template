import { test, expect, Page } from "@playwright/test";
import { login } from "../helpers/login";

const testUser = {
  email: "dev@payloadcms.com",
  password: "test",
};

test.describe("Admin Panel", () => {
  let page: Page;

  test.beforeAll(async ({ browser, request }) => {
    const registrationResponse = await request.post(
      "http://localhost:8787/api/users/first-register",
      {
        data: {
          email: testUser.email,
          password: testUser.password,
          roles: ["admin"],
        },
      },
    );

    if (!registrationResponse.ok() && registrationResponse.status() !== 403) {
      throw new Error(`Failed to create admin user: ${await registrationResponse.text()}`);
    }

    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page, user: testUser });
  });

  test("can navigate to dashboard", async () => {
    await page.goto("http://localhost:8787/admin");
    await expect(page).toHaveURL("http://localhost:8787/admin");
    await expect(page.getByText("Welcome to your dashboard!")).toBeVisible();
    await expect(page.getByText("Total Revenue")).toBeVisible();
    await expect(page.getByText("Recent Orders")).toBeVisible();
    await expect(page.getByText("Products & Inventory")).toBeVisible();
    await expect(page.getByText("Revenue Chart")).toBeVisible();
    await expect(page.getByText("Recent Customers")).toBeVisible();
    await expect(page.getByText("Paystack Status")).toBeVisible();
    await expect(page.getByText("Quick Actions")).toBeVisible();
  });

  test("dashboard widget links navigate to the expected admin destinations", async () => {
    await page.goto("http://localhost:8787/admin");

    await Promise.all([
      page.waitForURL("http://localhost:8787/admin/collections/orders"),
      page.getByRole("link", { name: /View Orders/i }).click(),
    ]);

    await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();

    await page.goto("http://localhost:8787/admin");

    await Promise.all([
      page.waitForURL("http://localhost:8787/admin/collections/products"),
      page.getByRole("link", { name: /Manage Inventory/i }).click(),
    ]);

    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
  });

  test("can navigate to list view", async () => {
    await page.goto("http://localhost:8787/admin/collections/users");
    await expect(page).toHaveURL("http://localhost:8787/admin/collections/users");
    const listViewArtifact = page.locator("h1", { hasText: "Users" }).first();
    await expect(listViewArtifact).toBeVisible();
  });

  test("can navigate to edit view", async () => {
    await page.goto("http://localhost:8787/admin/collections/users/create");
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/);
    const editViewArtifact = page.locator('input[name="email"]');
    await expect(editViewArtifact).toBeVisible();
  });
});
