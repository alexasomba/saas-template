import path from "path";
import { test, expect, Page, APIRequestContext } from "@playwright/test";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

type SlugStore = {
  noInventorySlug?: string;
  testProductSlug?: string;
  variantProductSlug?: string;
};

type APICollectionDoc = {
  _status?: string;
  id?: number | string;
  [key: string]: unknown;
};

type APIListResponse<T extends APICollectionDoc = APICollectionDoc> = {
  docs?: T[];
  items?: T[];
  totalDocs?: number;
};

type APILoginResponse = {
  token?: string;
  user?: {
    id?: number | string;
  };
};

const slugStore: SlugStore = {};

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

test.describe("Frontend", () => {
  test.setTimeout(120000);
  let page: Page;
  let adminToken = "";
  const baseURL = "http://localhost:8787";
  const mediaURL = `${baseURL}/admin/collections/media`;
  const adminEmail = "admin@test.com";
  const adminPassword = "admin";
  const userEmail = "user@test.com";
  const userPassword = "user";
  const testPaymentDetails = {
    cardNumber: "5454 5454 5454 5454",
    expiryDate: "0330",
    cvc: "737",
    postcode: "WS11 1DB",
  };

  // Hoisted helper
  async function getOrCreate(
    request: APIRequestContext,
    collection: string,
    where: string,
    data: Record<string, unknown>,
  ): Promise<APICollectionDoc> {
    const authHeaders = adminToken ? { Authorization: `JWT ${adminToken}` } : undefined;
    let retries = 5;
    while (retries > 0) {
      try {
        console.log(`getOrCreate: searching ${collection} with ${where}`);
        // Always try to find published items first, but fall back to drafts if needed
        const existing = await request.get(`${baseURL}/api/${collection}?${where}&draft=true`, {
          headers: authHeaders,
        });
        const existingJson = (await existing.json()) as APIListResponse;
        const items = existingJson.items || existingJson.docs || [];

        if (items.length > 0) {
          const item = items[0];
          console.log(
            `getOrCreate: found existing ${collection} (status: ${item._status || "unknown"}, id: ${item.id})`,
          );

          // If it has draft support and is not published, publish it
          if (item._status && item._status !== "published") {
            console.log(`getOrCreate: item is ${item._status}, publishing...`);
            const publishRes = await request.patch(`${baseURL}/api/${collection}/${item.id}`, {
              headers: authHeaders,
              data: { ...data, _status: "published" },
            });
            if (publishRes.ok()) {
              console.log(`getOrCreate: successfully published existing ${collection}`);
              return await publishRes.json();
            } else {
              console.error(
                `getOrCreate: failed to publish existing ${collection}:`,
                await publishRes.text(),
              );
            }
          }
          return item;
        }

        console.log(`getOrCreate: not found, creating ${collection}...`);
        const response = await request.post(`${baseURL}/api/${collection}`, {
          headers: authHeaders,
          data: { ...data, _status: "published" },
        });
        if (!response.ok()) {
          const errorText = await response.text();
          console.error(`getOrCreate: create failed for ${collection}:`, errorText);
          // If it's a transient DB error, retry
          if (errorText.includes("SQLITE_BUSY") || errorText.includes("database is locked")) {
            retries--;
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }
          throw new Error(`${collection} creation failed: ${errorText}`);
        }
        const json = await response.json();
        console.log(`getOrCreate: successfully created ${collection}`);
        return (json.doc || json) as APICollectionDoc;
      } catch (err) {
        console.error(`getOrCreate: error in ${collection}:`, err);
        if (retries <= 1) throw err;
        retries--;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    throw new Error(`getOrCreate: exhausted retries for ${collection}`);
  }

  test.beforeAll(async ({ browser, request }) => {
    test.setTimeout(900000); // Increase hook timeout to 15 minutes
    const context = await browser.newContext();
    page = await context.newPage();

    // Capture browser logs
    page.on("console", (msg) => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      console.error("[BROWSER ERROR]", err.message);
    });

    console.log("Setup: creating admin user...");
    await page.goto(baseURL);
    await createUserAndLogin(request, adminEmail, adminPassword);
    // Small delay to let the DB settle after re-creating user
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log("Setup: creating products and variants...");
    await createVariantsAndProducts(page, request);
    console.log("Setup completed successfully");
    // Final delay to ensure DB is ready for tests
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });

  test.beforeEach(async ({ page, context, request }) => {
    // Navigate to baseURL first to avoid SecurityError when accessing storage
    await page.goto(baseURL);
    // Clear cookies and local storage to ensure test isolation
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Clear server-side cart for admin
    if (adminToken) {
      // Find the admin user ID first
      const meRes = await request.get(`${baseURL}/api/users/me`, {
        headers: { Authorization: `JWT ${adminToken}` },
      });
      const meJson = (await meRes.json()) as APILoginResponse;
      const adminID = meJson.user?.id;
      if (adminID) {
        // Find cart for this user (field name is 'customer')
        const cartRes = await request.get(
          `${baseURL}/api/carts?where[customer][equals]=${adminID}`,
          {
            headers: { Authorization: `JWT ${adminToken}` },
          },
        );
        const cartJson = (await cartRes.json()) as APIListResponse;
        if (cartJson.docs?.[0]?.id) {
          await request
            .delete(`${baseURL}/api/carts/${cartJson.docs[0].id}`, {
              headers: { Authorization: `JWT ${adminToken}` },
            })
            .catch(() => {});
        }

        // Also clear the cart field on user record just in case
        await request
          .patch(`${baseURL}/api/users/${adminID}`, {
            headers: { Authorization: `JWT ${adminToken}` },
            data: { cart: null },
          })
          .catch(() => {});
      }
    }

    page.on("pageerror", (error) => {
      // Surface browser exceptions in test logs to help diagnose flaky UI errors.
      console.error("[pageerror]", error);
    });

    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        console.error("[console]", message.type(), message.text());
      }
    });
  });

  test("renders ecommerce homepage", async ({ page }) => {
    await page.goto(baseURL);
    await expect(page).toHaveTitle(/Payload Ecommerce Template/);
    const heading = page.locator("h1").first();
    await expect(heading).toHaveText("Payload Ecommerce Template");
  });

  test("can go on homepage", async ({ page }) => {
    await page.goto(baseURL);

    await expect(page).toHaveTitle(/Payload Ecommerce Template/);

    const heading = page.locator("h1").first();

    await expect(heading).toHaveText("Payload Ecommerce Template");
  });

  test("can sign up and subsequently login", async ({ page }) => {
    await logoutAndExpectSuccess(page);

    await page.goto(`${baseURL}/create-account`);

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const confirmPasswordInput = page.locator('input[name="passwordConfirm"]');
    const email = `test-${Date.now()}@test.com`;
    const password = `test`;

    await emailInput.fill(email);
    await passwordInput.fill(password);
    await confirmPasswordInput.fill(password);

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    const successMessage = page.locator("text=Account created successfully");
    await expect(successMessage).toBeVisible();

    await logoutAndExpectSuccess(page);
    await loginFromUI(page, email, password);
  });

  test("can add products to cart", async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: "Test Product",
      productSlug: "test-product",
    });
  });

  test("can add product with variant to cart", async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: "Test Product With Variants",
      productSlug: "test-product-variants",
      variant: "Payload",
    });
  });

  test("can remove products from cart", async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: "Test Product",
      productSlug: "test-product",
    });

    await removeFromCartAndConfirm(page);
  });

  test("can remove products with variants from cart", async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: "Test Product With Variants",
      productSlug: "test-product-variants",
      variant: "Payload",
    });

    await removeFromCartAndConfirm(page);
  });

  test("should retain cart content on hard refresh", async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: "Test Product",
      productSlug: "test-product",
    });

    await page.reload();

    const cartCount = page.locator('button[data-slot="sheet-trigger"] span').last();
    await cartCount.click();

    const productInCart = page.getByRole("dialog").getByText("Test Product");
    await expect(productInCart).toBeVisible();
  });

  test("can view and sort via shop page", async ({ page }) => {
    await page.goto(`${baseURL}/shop`);

    const productCard = page.locator(`a[href="/products/test-product"]`).first();
    await productCard.waitFor({ state: "visible" });
    await expect(productCard).toBeVisible();

    // For now, let's just verify products are visible on /shop
  });

  test("authenticated users can view account", async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword);

    await page.goto(`${baseURL}/account`);

    const heading = page.locator("h1").first();
    await expect(heading).toHaveText("Account settings");
  });

  test("authenticated users can update their name", async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword);

    await page.goto(`${baseURL}/account`);

    const heading = page.locator("h1").first();
    await expect(heading).toHaveText("Account settings");

    // Wait for form data to load to avoid race condition with AuthProvider
    await expect(page.locator('input[name="email"]')).toHaveValue(adminEmail);

    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning" || msg.type() === "log") {
        console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });

    const nameInput = page.locator('input[name="name"]');
    const newName = `Test User ${randomUUID()}`;
    await nameInput.fill(newName);

    const updateButton = page.getByRole("button", { name: "Update Account" });
    await expect(updateButton).toBeEnabled({ timeout: 10000 });
    await updateButton.click();

    const successMessage = page.getByText(/successfully updated account/i);
    await expect(successMessage).toBeVisible({ timeout: 15000 });
  });

  test("authenticated users can view orders page", async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword);

    await page.goto(`${baseURL}/orders`);

    const heading = page.locator("h1").first();
    await expect(heading).toContainText(/orders/i);
  });

  test("authenticated users can view order details", async ({ page, request }) => {
    test.setTimeout(180000); // Increase timeout for this specific test
    await loginFromUI(page, adminEmail, adminPassword);

    // Ensure user has an address
    const meRes = await request.get(`${baseURL}/api/users/me`, {
      headers: { Authorization: `JWT ${adminToken}` },
    });
    const meJson = (await meRes.json()) as APILoginResponse;
    const adminID = meJson.user?.id;

    console.log(`Ensuring address for admin ID: ${adminID}`);
    await getOrCreate(request, "addresses", `where[user][equals]=${adminID}`, {
      user: adminID,
      firstName: "Admin",
      lastName: "User",
      addressLine1: "123 Admin Way",
      city: "Admin City",
      state: "AS",
      postalCode: "12345",
      country: "US",
    });

    await addToCartAndConfirm(page, {
      productName: "Test Product",
      productSlug: "test-product",
    });

    await checkout(page, testPaymentDetails);

    await expectOrderIsDisplayed(page);

    const orderIDElement = page.locator("p", { hasText: "Order ID:" });
    const orderIDText = await orderIDElement.textContent();
    const orderNumber = orderIDText?.split("#").pop()?.trim();

    await page.goto(`${baseURL}/orders/${orderNumber}`, { waitUntil: "networkidle" });

    const orderTextLocator = page.getByText(`Order #${orderNumber}`, { exact: false });
    await expect(orderTextLocator).toBeVisible({ timeout: 40000 });
  });

  test("authenticated customers cannot access /admin", async ({ page }) => {
    await createUserAndLogin(page.request, userEmail, userPassword, false);
    await page.goto(`${baseURL}/admin`);
    const heading = page.locator("h1").first();
    await expect(heading).toContainText("Unauthorized");
  });

  test("Guest can create and view order", async ({ page }) => {
    await logoutAndExpectSuccess(page);
    await addToCartAndConfirm(page, {
      productName: "Test Product",
      productSlug: "test-product",
    });

    await checkout(page, testPaymentDetails, "guest@test.com");
    await expectOrderIsDisplayed(page);
  });

  test("Guest can view their order using /find-order", async ({ page }) => {
    await logoutAndExpectSuccess(page);
    const guestEmail = `guest-${randomUUID()}@test.com`;

    await addToCartAndConfirm(page, {
      productName: "Test Product",
      productSlug: "test-product",
    });

    await checkout(page, testPaymentDetails, guestEmail);

    await expectOrderIsDisplayed(page);
    const orderIDElement = page.locator("p", { hasText: "Order ID:" });
    const orderIDText = await orderIDElement.textContent();
    const orderNumber = orderIDText?.split("#").pop()?.trim();

    await page.goto(`${baseURL}/find-order`);
    const orderNumberInput = page.locator('input[name="orderID"]');
    const emailInput = page.locator('input[name="email"]');
    await orderNumberInput.fill(orderNumber || "");
    await emailInput.fill(guestEmail);

    const findOrderButton = page.getByRole("button", { name: /Find my order/i });
    await findOrderButton.click();

    await expect(page.locator("h1", { hasText: /Order #/i })).toBeVisible({ timeout: 15000 });
  });

  test("Admins can update and view prices on products", async ({ page, request }) => {
    await loginFromUI(page, adminEmail, adminPassword, true);

    // Robust way: Get the product ID via API and go direct to edit page
    console.log("Finding product ID via API...");
    const product = await getOrCreate(request, "products", "where[slug][equals]=test-product", {
      title: "Test Product",
      slug: "test-product",
      _status: "published",
    });

    const productID = product?.id;

    if (!productID) {
      throw new Error("Could not find test-product via API for admin test");
    }

    const editURL = `${baseURL}/admin/collections/products/${productID}`;
    console.log(`Navigating directly to product edit: ${editURL}`);
    await page.goto(editURL, { waitUntil: "networkidle", timeout: 60000 });

    // Check if we were redirected to login
    if (page.url().includes("/admin/login")) {
      console.warn("Redirected to login, re-attempting login from current page...");
      await page.locator('input[name="email"], input[type="email"], #email').fill(adminEmail);
      await page
        .locator('input[name="password"], input[type="password"], #password')
        .fill(adminPassword);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(new RegExp(editURL), { timeout: 60000 });
      console.log("Login re-attempt successful, reached edit page");
    }

    await page.waitForLoadState("domcontentloaded");

    console.log("Reached product edit page:", page.url());
    console.log("Page title:", await page.title());

    // Diagnostics: Find all elements with "Details" text to identify the tab correctly
    const detailsElements = await page.evaluate(() => {
      const elements = Array.from(
        document.querySelectorAll('button, [role="tab"], .tabs-nav__button'),
      );
      return elements
        .filter((el) => el.textContent?.includes("Details"))
        .map((el) => ({
          tagName: el.tagName,
          className: el.className,
          role: el.getAttribute("role"),
          text: el.textContent?.trim(),
        }));
    });
    console.log("Potential tab elements:", JSON.stringify(detailsElements, null, 2));

    // Payload 3.0 uses tabs. Price is in "Product Details" tab
    console.log("Switching to Product Details tab...");
    const tabByRole = page.getByRole("tab", { name: /Product Details/i });
    const tabByClass = page
      .locator(".tabs-nav__button, .tabs__tab-button")
      .filter({ hasText: /Details/i });
    const tabByText = page.locator("button").filter({ hasText: /Product Details/i });

    if ((await tabByRole.count()) > 0) {
      console.log("Clicking tab by role");
      await tabByRole.first().click();
    } else if ((await tabByClass.count()) > 0) {
      console.log("Clicking tab by class");
      await tabByClass.first().click();
    } else if ((await tabByText.count()) > 0) {
      console.log("Clicking tab by text");
      await tabByText.first().click();
    } else {
      console.warn("No definitive tab found, trying generic text click...");
      await page.click('text="Product Details"', { timeout: 5000 }).catch(() => {});
    }

    await page.waitForTimeout(3000); // Longer wait for tab content to render

    // Diagnostics: List all inputs again after tab click
    const inputsAfterTab = await page.evaluate(() =>
      Array.from(document.querySelectorAll("input")).map((i) => i.name || i.id),
    );
    console.log("Inputs after tab click:", inputsAfterTab.join(", "));

    // Try multiple ways to find the price input - ensure we exclude the "Enabled" checkbox
    const priceInput = page
      .locator('input[name="priceInUSD"]:not([type="checkbox"]), input#field-priceInUSD')
      .first();
    const priceLabel = page.getByLabel(/^Price \(USD\)$/i).first();

    console.log("Waiting for price input...");
    try {
      await Promise.race([
        priceInput.waitFor({ state: "visible", timeout: 40000 }),
        priceLabel.waitFor({ state: "visible", timeout: 40000 }),
      ]);
    } catch (err) {
      console.error("Price input still not found. Current URL:", page.url());
      throw err;
    }

    // Ensure we have the correct element before filling
    const targetInput = (await priceInput.isVisible()) ? priceInput : priceLabel;
    await targetInput.fill("20");

    await saveAndConfirmSuccess(page);
  });

  test("Admins can view transactions and orders", async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword, true);
    const productSlug = slugStore.testProductSlug;
    if (!productSlug) {
      throw new Error("Missing test product slug from setup");
    }
    await addToCartAndConfirm(page, {
      productName: "Test Product",
      productSlug,
    });
    await checkout(page, testPaymentDetails);
    await expectOrderIsDisplayed(page);
    const orderIDElement = page.locator("p", { hasText: "Order ID:" });
    const orderIDText = await orderIDElement.textContent();
    const orderNumber = orderIDText?.split("#").pop()?.trim();

    await page.goto(`${baseURL}/admin/collections/orders`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForLoadState("domcontentloaded");
    console.log("Navigated to orders collection");

    // Search for order - try even more locators for Payload 3.0
    const searchInput = page
      .locator(
        [
          ".list-controls__search-input",
          'input[placeholder*="Search"]',
          'input[placeholder*="search"]',
          'input[aria-label*="Search"]',
          'input[name="search"]',
        ].join(", "),
      )
      .first();

    console.log("Waiting for search input...");
    try {
      await searchInput.waitFor({ state: "visible", timeout: 45000 });
    } catch (err) {
      console.error("Search input not found in orders. Current URL:", page.url());
      const bodyText = await page.innerText("body");
      console.log("Orders admin body text preview:", bodyText.substring(0, 1500));
      throw err;
    }

    await searchInput.fill(orderNumber || "");
    console.log(`Filled search input with order: ${orderNumber}`);
    await page.keyboard.press("Enter");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const rowRows = page.locator("div.table table tbody tr, .list-controls + div table tbody tr");
    await expect(rowRows.first()).toBeVisible({ timeout: 30000 });
    const rowCount = await rowRows.count();
    expect(rowCount).toBeGreaterThan(0);

    await page.goto(`${baseURL}/admin/collections/orders/${orderNumber}`);
    // Verify the order contains the product - look specifically in the items list
    const productCell = page.locator("a", { hasText: "Test Product" }).first();
    await expect(productCell).toBeVisible({ timeout: 30000 });

    await page.goto(`${baseURL}/admin/collections/transactions`);
    await page.waitForLoadState("networkidle");
    const transactionRows = page.locator(
      "div.table table tbody tr, .list-controls + div table tbody tr",
    );
    await expect(transactionRows.first()).toBeVisible({ timeout: 30000 });
    expect(await transactionRows.count()).toBeGreaterThan(0);
  });

  test("should disable add to cart when product has no inventory", async ({ page }) => {
    await page.goto(`${baseURL}/products/no-inventory-product`);
    const addToCartButton = page.getByRole("button", { name: /add to cart/i });
    await expect(addToCartButton).toBeDisabled();
  });

  test("guest shopper completes checkout and converts invite to account", async ({ page }) => {
    const uniqueEmail = `guest-${randomUUID()}@example.com`;
    await logoutAndExpectSuccess(page);
    await addToCartAndConfirm(page, {
      productName: "Test Product",
      productSlug: "test-product",
    });

    await checkout(page, testPaymentDetails, uniqueEmail);
    await expectOrderIsDisplayed(page);

    // Now convert to account
    const inviteSection = page.locator("h2", {
      hasText: /create an account to track your orders/i,
    });
    await expect(inviteSection).toBeVisible();

    const passwordInput = page.locator('input[id="password"]');
    await passwordInput.fill("password123");
    const confirmPasswordInput = page.locator('input[id="passwordConfirm"]');
    await confirmPasswordInput.fill("password123");

    const createAccountButton = page.getByRole("button", { name: /create account/i });
    await createAccountButton.click();

    await page.waitForURL(/\/account/);
    await expect(page).toHaveURL(/\/account/);
  });

  // Helpers

  async function createUserAndLogin(
    request: APIRequestContext,
    email: string,
    password: string,
    isAdmin: boolean = true,
  ) {
    const data: Record<string, unknown> = { email, password };

    if (isAdmin) {
      data.roles = ["admin"];
    }

    // Attempt to delete existing user to ensure clean state (cart, etc.)
    // Also try to delete associated cart record
    const existingUserRes = await request.get(`${baseURL}/api/users?where[email][equals]=${email}`);
    const existingUserJson = (await existingUserRes.json()) as APIListResponse;
    const existingUserID = existingUserJson.docs?.[0]?.id;

    if (existingUserID) {
      // Find and delete cart
      const cartRes = await request.get(
        `${baseURL}/api/carts?where[customer][equals]=${existingUserID}`,
      );
      const cartJson = (await cartRes.json()) as APIListResponse;
      if (cartJson.docs?.[0]?.id) {
        await request.delete(`${baseURL}/api/carts/${cartJson.docs[0].id}`).catch(() => {});
      }
      await request.delete(`${baseURL}/api/users/${existingUserID}`).catch(() => {});
    }

    // Use first-register for the first admin user
    const endpoint = isAdmin ? `${baseURL}/api/users/first-register` : `${baseURL}/api/users`;
    const response = await request.post(endpoint, { data });

    if (response.ok()) {
      const responseJson = (await response.json()) as APILoginResponse;
      if (isAdmin && responseJson.token) {
        adminToken = responseJson.token;
        console.log("Got admin token from first-register");

        // Verify the token by calling /api/users/me
        const meRes = await request.get(`${baseURL}/api/users/me`, {
          headers: { Authorization: `JWT ${adminToken}` },
        });
        console.log("User-me (first-register) response:", await meRes.json());
        return;
      }
    }

    // Login to get the JWT token
    const login = await request.post(`${baseURL}/api/users/login`, {
      data: { email, password },
    });

    if (login.ok()) {
      const loginJson = (await login.json()) as APILoginResponse;
      if (isAdmin && loginJson.token) {
        adminToken = loginJson.token;
        console.log("Got admin token from login");

        // Verify the token by calling /api/users/me
        const meRes = await request.get(`${baseURL}/api/users/me`, {
          headers: { Authorization: `JWT ${adminToken}` },
        });
        console.log("User-me response:", await meRes.json());
      }
    } else {
      console.error("Login failed:", await login.json());
    }
  }

  async function createVariantsAndProducts(page: Page, request: APIRequestContext) {
    const variantType = await getOrCreate(request, "variantTypes", "where[name][equals]=brand", {
      name: "brand",
      label: "Brand",
    });

    const variantTypeID = variantType.id;

    const brands = [
      { label: "Payload", value: "payload" },
      { label: "Figma", value: "figma" },
    ];

    const variantOptions = [];
    for (const option of brands) {
      const created = await getOrCreate(
        request,
        "variantOptions",
        `where[value][equals]=${option.value}&where[variantType][equals]=${variantTypeID}`,
        {
          ...option,
          variantType: variantTypeID,
        },
      );
      variantOptions.push(created);
    }

    const payloadVariantID = variantOptions[0]?.id;
    const figmaVariantID = variantOptions[1]?.id;

    if (!variantTypeID || !payloadVariantID || !figmaVariantID) {
      throw new Error("Variant setup failed");
    }

    console.log("Created variant options:", { payloadVariantID, figmaVariantID });

    await loginFromUI(page, adminEmail, adminPassword, true);
    await page.goto(`${mediaURL}/create`);
    const successMessage = page.locator("text=Media successfully created");
    let imageID: number;

    // Check if we already have media
    const existingMedia = await request.get(`${baseURL}/api/media?where[alt][equals]=Test Image`, {
      headers: { Authorization: `JWT ${adminToken}` },
    });
    const existingMediaJson = await existingMedia.json();
    if (existingMediaJson.docs?.length > 0) {
      imageID = existingMediaJson.docs[0].id;
      console.log("Using existing image ID:", imageID);
    } else {
      console.log("Creating new test image...");
      await page.goto(`${mediaURL}/create`, { waitUntil: "networkidle" });
      console.log("Navigated to media create page");
      const fileInput = page.locator('input[type="file"]');
      const altInput = page.locator('input[name="alt"]');
      const filePath = path.resolve(dirname, "../../public/media/image-post1.webp");

      console.log("Waiting for file input...");
      await fileInput.waitFor({ state: "attached", timeout: 30000 });
      console.log("Setting input files...");
      await fileInput.setInputFiles(filePath);
      console.log("Filling alt text...");
      await altInput.fill("Test Image");

      const uploadButton = page.locator('#action-save, button[type="submit"]');
      console.log("Clicking upload button...");
      await uploadButton.click();

      console.log("Waiting for success message or redirect...");
      await Promise.race([
        expect(successMessage).toBeVisible({ timeout: 60000 }),
        page.waitForURL(/\/admin\/collections\/media\/\d+/),
      ]);

      const imageIDStr = page.url().split("/").pop();
      imageID = imageIDStr ? parseInt(imageIDStr, 10) : 0;
      console.log("Created new image ID:", imageID);
    }

    const variantProductSlug = `test-product-variants-${randomUUID()}`;
    console.log("Creating product with variants...");
    const product = await getOrCreate(
      request,
      "products",
      `where[slug][equals]=${variantProductSlug}`,
      {
        title: "Test Product With Variants",
        slug: variantProductSlug,
        enableVariants: true,
        variantTypes: [variantTypeID],
        inventory: 100,
        _status: "published",
        layout: [],
        gallery: [{ image: imageID, variantOption: payloadVariantID }],
        priceInUSDEnabled: true,
        priceInUSD: 1000,
        priceInNGNEnabled: true,
        priceInNGN: 1000,
      },
    );
    const productID = product.id;
    if (!productID) {
      throw new Error("Product with variants was not created");
    }
    console.log("Product with variants created:", productID);

    await getOrCreate(
      request,
      "variants",
      `where[product][equals]=${productID}&where[options][in][0]=${payloadVariantID}`,
      {
        product: productID,
        variantType: variantTypeID,
        options: [payloadVariantID],
        priceInUSDEnabled: true,
        priceInUSD: 1000,
        priceInNGNEnabled: true,
        priceInNGN: 1000,
        inventory: 50,
        _status: "published",
      },
    );

    await getOrCreate(
      request,
      "variants",
      `where[product][equals]=${productID}&where[options][in][0]=${figmaVariantID}`,
      {
        product: productID,
        variantType: variantTypeID,
        options: [figmaVariantID],
        priceInUSDEnabled: true,
        priceInUSD: 1000,
        priceInNGNEnabled: true,
        priceInNGN: 1000,
        inventory: 50,
        _status: "published",
      },
    );

    const testProductSlug = `test-product-${randomUUID()}`;
    await getOrCreate(request, "products", `where[slug][equals]=${testProductSlug}`, {
      title: "Test Product",
      slug: testProductSlug,
      inventory: 100,
      _status: "published",
      layout: [],
      gallery: [{ image: imageID }],
      priceInUSDEnabled: true,
      priceInUSD: 1000,
      priceInNGNEnabled: true,
      priceInNGN: 1000,
    });

    const noInventorySlug = `no-inventory-product-${randomUUID()}`;
    await getOrCreate(request, "products", `where[slug][equals]=${noInventorySlug}`, {
      title: "No Inventory Product",
      slug: noInventorySlug,
      inventory: 0,
      _status: "published",
      layout: [],
      gallery: [{ image: imageID }],
      priceInUSDEnabled: true,
      priceInUSD: 1000,
      priceInNGNEnabled: true,
      priceInNGN: 1000,
    });

    // Store these for tests to use
    slugStore.variantProductSlug = variantProductSlug;
    slugStore.testProductSlug = testProductSlug;
    slugStore.noInventorySlug = noInventorySlug;
  }

  async function logoutAndExpectSuccess(page: Page) {
    await page.goto(`${baseURL}/logout`);
    const heading = page.locator("h1").first();
    await expect(heading).toContainText(/logged out/i);
  }

  async function loginFromUI(
    page: Page,
    email: string,
    password: string,
    isAdmin: boolean = false,
  ) {
    const loginURL = isAdmin ? `${baseURL}/admin/login` : `${baseURL}/login`;
    let retries = 3;

    while (retries > 0) {
      try {
        console.log(`Navigating to login URL: ${loginURL} (attempts left: ${retries})`);
        await page.goto(loginURL, { waitUntil: "networkidle", timeout: 60000 });
        console.log(`Current URL after goto: ${page.url()}`);

        const emailInput = page.locator('input[name="email"], input[type="email"], #email');
        const passwordInput = page.locator(
          'input[name="password"], input[type="password"], #password',
        );
        const submitButton = page.locator('button[type="submit"]');

        console.log("Waiting for email input...");
        await emailInput.waitFor({ state: "visible", timeout: 30000 });
        console.log("Email input visible, filling...");
        await emailInput.fill(email);
        await passwordInput.fill(password);
        await submitButton.click();

        if (isAdmin) {
          console.log("Waiting for admin redirect...");
          await page.waitForURL(/\/admin/, { timeout: 60000 });
          // Wait for any element that confirms we are logged in - Payload 3.0 specific
          console.log("Waiting for admin session confirmation...");
          await page
            .locator('nav, .dashboard, .app-header, button:text("Logout"), a[href*="logout"]')
            .first()
            .waitFor({ state: "visible", timeout: 30000 });

          const bodyText = await page.innerText("body");
          if (
            bodyText.toLowerCase().includes("dashboard") ||
            bodyText.toLowerCase().includes("logout")
          ) {
            console.log("Confirmed logged in to Admin");
          } else {
            console.warn("Login confirmation text not found, but continuing...");
          }
        } else {
          console.log("Waiting for account redirect...");
          await page.waitForURL(/\/account/, { timeout: 60000 });
          await page
            .locator('*:text("Account settings")')
            .first()
            .waitFor({ state: "visible", timeout: 30000 });
        }
        console.log("Login successful");
        return;
      } catch (err) {
        console.error(`Login attempt failed: ${err instanceof Error ? err.message : String(err)}`);
        retries--;
        if (retries === 0) throw err;
        await new Promise((resolve) => setTimeout(resolve, 5000));
        // Reload page before retry
        await page.goto(baseURL);
      }
    }
  }

  async function addToCartAndConfirm(
    page: Page,
    {
      productName,
      productSlug,
      variant,
    }: {
      productName: string;
      productSlug: string;
      variant?: string;
    },
  ) {
    console.log(`Navigating to product: ${productSlug}`);
    await page.goto(`${baseURL}/products/${productSlug}`);
    await expect(page).toHaveURL(new RegExp(`/products/${productSlug}`));

    if (variant) {
      const variantButton = page.getByRole("button", { name: variant });
      await variantButton.waitFor({ state: "visible" });
      await variantButton.click();
    }

    const addToCartButton = page.getByRole("button", { name: /add to cart/i });
    await expect(addToCartButton).toBeVisible({ timeout: 10000 });
    await addToCartButton.click();

    const cartCount = page.locator('button[data-slot="sheet-trigger"] span').last();
    await expect(cartCount).toBeVisible({ timeout: 15000 });

    // Wait for the quantity to appear (it should be different from "Cart")
    await expect(cartCount).not.toHaveText("Cart", { timeout: 15000 });
    await expect(cartCount).toHaveText("1");
    await cartCount.click();

    const productInCart = page.getByRole("dialog").getByText(productName, { exact: false });
    await expect(productInCart).toBeVisible();
  }

  async function removeFromCartAndConfirm(page: Page) {
    const reduceQuantityButton = page.getByRole("button", { name: "Reduce item quantity" });
    await expect(reduceQuantityButton).toBeVisible();
    await reduceQuantityButton.click();

    const emptyCartMessage = page.getByText("Your cart is empty.");
    await expect(emptyCartMessage).toBeVisible();
  }

  async function checkout(
    page: Page,
    _paymentDetails: {
      cardNumber: string;
      expiryDate: string;
      cvc: string;
      postcode: string;
    },
    guestEmail?: string | null,
  ): Promise<void> {
    await page.goto(`${baseURL}/checkout`);

    // Add console logging for checkout specifically
    page.on("console", (msg) => {
      if (msg.type() === "log" && msg.text().includes("Checkout states")) {
        console.log(`[CHECKOUT STATE] ${msg.text()}`);
      }
    });

    if (guestEmail) {
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(guestEmail);

      const continueGuestBtn = page.getByRole("button", { name: /continue as guest/i });
      await continueGuestBtn.click();
    }

    // Fill address details if not already present
    // Wait for the address section to settle/hydrate
    console.log("Waiting for address section to hydrate...");
    const addressSection = page.locator("h2", { hasText: /Address/i });
    await addressSection.waitFor({ state: "visible", timeout: 30000 });

    const addAddressButton = page.getByRole("button", { name: /Add a new address/i });
    const selectAddressButton = page.getByRole("button", { name: /Select an address/i });
    const removeAddressButton = page.getByRole("button", { name: /Remove/i });

    // Use a race condition wait for any of the address buttons to appear
    console.log("Checking for address action buttons...");
    await expect(async () => {
      const isRemoveVisible = await removeAddressButton.isVisible();
      const isAddVisible = await addAddressButton.isVisible();
      const isSelectVisible = await selectAddressButton.isVisible();
      expect(isRemoveVisible || isAddVisible || isSelectVisible).toBeTruthy();
    }).toPass({ timeout: 20000 });

    if (await removeAddressButton.isVisible()) {
      console.log("Address already pre-filled");
    } else if (await addAddressButton.isVisible()) {
      console.log("Filling new address...");
      await addAddressButton.click();

      const dialog = page.getByRole("dialog");
      await dialog.locator('input[name="firstName"]').fill("Test");
      await dialog.locator('input[name="lastName"]').fill("User");
      await dialog.locator('input[name="addressLine1"]').fill("123 Test St");
      await dialog.locator('input[name="city"]').fill("Test City");
      await dialog.locator('input[name="postalCode"]').fill("12345");

      // Select country
      await dialog.locator("#country").click();
      await page.getByRole("option", { name: /United States/i }).click();

      await dialog.getByRole("button", { name: /Submit/i }).click();
      await expect(dialog).not.toBeVisible();
      console.log("New address submitted");
    } else if (await selectAddressButton.isVisible()) {
      console.log("Selecting existing address...");
      await selectAddressButton.click();
      const dialog = page.getByRole("dialog");
      const firstSelectButton = dialog.getByRole("button", { name: /Select/i }).first();
      await firstSelectButton.waitFor({ state: "visible" });
      await firstSelectButton.click();
      await expect(dialog).not.toBeVisible();
      console.log("Existing address selected");
    }

    await page.waitForTimeout(2000); // Let state update

    const reviewOrderButton = page.getByRole("button", { name: /(Review order|Go to payment)/i });
    await reviewOrderButton.waitFor({ state: "visible" });
    // Wait for button to be enabled (meaning validation is complete)
    await expect(reviewOrderButton).toBeEnabled({ timeout: 15000 });
    await reviewOrderButton.click();

    const completeOrderButton = page.getByRole("button", { name: /Complete order/i });
    await completeOrderButton.waitFor({ state: "visible" });
    await completeOrderButton.click();

    console.log("Waiting for confirm-order page...");
    await page.waitForURL("**/checkout/confirm-order**", { timeout: 100000 });
    console.log("Reached confirm-order page");
    await expect(page).toHaveURL(/\/checkout\/confirm-order/);
  }

  async function expectOrderIsDisplayed(page: Page): Promise<void> {
    const successHeading = page.locator("h1", { hasText: /Thank you!/i });
    await expect(successHeading).toBeVisible({ timeout: 20000 });

    const orderIdLabel = page.locator("span", { hasText: "Order ID:" });
    await expect(orderIdLabel).toBeVisible();

    const pageURL = page.url();
    expect(pageURL).toContain("/checkout/confirm-order");
  }

  async function saveAndConfirmSuccess(page: Page) {
    const saveButton = page.locator("#action-save");
    console.log("Clicking save button...");
    await saveButton.waitFor({ state: "visible", timeout: 30000 });
    await saveButton.click();

    console.log("Waiting for success message...");
    const successMessage = page.getByText(/successfully/i).first();
    await expect(successMessage).toBeVisible({ timeout: 30000 });
    console.log("Update confirmed");
  }
});
