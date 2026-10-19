import { expect, test } from "@playwright/test";

test.describe("Cart & checkout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("naturo.cart.v1"));
  });

  test("empty cart and checkout states", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByText("Your cart is empty")).toBeVisible();
    await page.goto("/checkout");
    await expect(page.getByText("Your cart is empty")).toBeVisible();
  });

  test("add to cart, adjust quantity, validate, and place a collection order", async ({ page }) => {
    await page.goto("/shop/ginger-shot");
    await page.getByRole("button", { name: /^Add to cart$/ }).first().click();

    const drawer = page.getByRole("dialog", { name: /Your cart/ });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Ginger Shot")).toBeVisible();
    await drawer.getByRole("button", { name: "Increase quantity" }).click();
    await expect(drawer.getByText("$4.00").first()).toBeVisible();
    await drawer.getByRole("button", { name: "Close cart" }).click();
    await expect(drawer).toBeHidden();

    await page.goto("/cart");
    await expect(page.getByRole("link", { name: "Ginger Shot" }).first()).toBeVisible();
    await expect(page.getByText("Prices confirmed by our server.")).toBeVisible();
    await page.getByRole("link", { name: "Continue to checkout" }).click();
    await expect(page).toHaveURL(/\/checkout$/);

    // Validation
    await page.getByRole("button", { name: /Place order/ }).click();
    await expect(page.getByRole("alert").first()).toContainText("Please check the highlighted fields");
    await expect(page.getByText("Please enter your full name.")).toBeVisible();
    await expect(page.locator("#fullName")).toBeFocused();
    await page.fill("#fullName", "Rudo Chikore");
    await expect(page.getByText("Please enter your full name.")).toBeHidden();

    await page.fill("#phone", "12");
    await page.getByRole("button", { name: /Place order/ }).click();
    await expect(page.getByText(/Enter a valid phone number/)).toBeVisible();
    await page.fill("#phone", "+263 77 123 4567");

    await page.getByRole("radio", { name: /Collection/ }).check();
    await page.getByRole("radio", { name: /Pay on delivery/ }).check();

    // Invalid then valid promo code (dev sample code).
    await page.fill("#promo", "NOPE");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("This code isn't valid.")).toBeVisible();
    await page.fill("#promo", "DEVTEST10");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("Code DEVTEST10 applied.")).toBeVisible();

    await page.check("#acceptTerms");
    await expect(page.getByRole("button", { name: /Place order · \$3\.60/ })).toBeVisible();
    await page.getByRole("button", { name: /Place order/ }).click();

    await expect(page).toHaveURL(/\/order\/[0-9a-f-]{36}\?t=/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1, name: /Thank you, Rudo/ })).toBeVisible();
    await expect(page.getByText("Pay on delivery / collection")).toBeVisible();
    await expect(page.getByText("$3.60").last()).toBeVisible();

    // Cart is cleared after ordering.
    const stored = await page.evaluate(() => localStorage.getItem("naturo.cart.v1"));
    expect(JSON.parse(stored ?? "[]")).toEqual([]);

    // A tampered token must not reveal the order.
    const url = new URL(page.url());
    const res = await page.request.get(`/api/orders${url.pathname.replace("/order", "")}?t=tampered`);
    expect(res.status()).toBe(404);
  });

  test("admin can see the order and update its status (dev admin)", async ({ page, isMobile }) => {
    test.skip(isMobile, "admin flow covered on desktop");
    await page.goto("/admin/orders");
    await expect(page.getByRole("heading", { level: 1, name: "Orders" })).toBeVisible();
    await expect(page.getByText(/Development mode/)).toBeVisible();
    const first = page.getByRole("link", { name: /^NW-\d{6}-/ }).first();
    await first.click();
    await page.getByRole("combobox", { name: "Order status" }).selectOption("confirmed");
    await page.getByRole("button", { name: "Save status" }).click();
    await expect(page.getByText("Status changed to confirmed").last()).toBeVisible();
  });
});
