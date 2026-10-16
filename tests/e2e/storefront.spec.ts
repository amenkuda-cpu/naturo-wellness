import { expect, test, type Page } from "@playwright/test";

/** Collects uncaught errors so every test can assert a clean console. */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Download the React DevTools|favicon/.test(m.text())) errors.push(m.text());
  });
  return errors;
}

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "horizontal overflow (px)").toBeLessThanOrEqual(0);
}

test.describe("Storefront", () => {
  test("home renders hero, showcase and footer without errors or overflow", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Feel good. Naturally." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Shop Naturo" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Meet your daily goodness/i })).toBeAttached();
    await noHorizontalOverflow(page);
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
    await expect(page.getByRole("contentinfo")).toContainText("Naturo Wellness");
    await noHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });

  test("primary navigation reaches every main page", async ({ page, isMobile }) => {
    await page.goto("/shop");
    for (const [label, heading] of [
      ["Our Story", /A taste that feels/i],
      ["Our Ingredients", /Flavours that feel/i],
      ["Contact", /Let's/i],
      ["Shop", /Natural goodness/i],
    ] as const) {
      if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
      const nav = page.getByRole("navigation", { name: isMobile ? "Mobile" : "Main" });
      await nav.getByRole("link", { name: label, exact: true }).click();
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await noHorizontalOverflow(page);
    }
  });

  test("shop filters by category and search", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByText("9 products")).toBeVisible();
    await page.getByRole("tab", { name: "Traditional Favourites" }).click();
    await expect(page).toHaveURL(/category=traditional-favourites/);
    await expect(page.getByText("2 products")).toBeVisible();
    await page.getByRole("tab", { name: "All" }).click();
    await page.getByRole("searchbox", { name: "Search products" }).fill("hibiscus");
    await expect(page.getByText("1 product", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hibiscus Shot" })).toBeVisible();
  });

  test("unpriced product shows 'Price coming soon' and cannot be bought", async ({ page }) => {
    await page.goto("/shop/muvhee");
    await expect(page.getByRole("heading", { level: 1, name: "Muvhee" })).toBeVisible();
    await expect(page.getByText("Price coming soon").first()).toBeVisible();
    await expect(page.getByText("Coming soon to our online shop")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Add to cart$/ })).toHaveCount(0);
  });

  test("server rejects ordering an unpriced product even if the client is bypassed", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      data: {
        items: [{ productId: "muvhee", variantId: "muvhee-standard", quantity: 1, price: 1 }],
        customer: { fullName: "Test Person", phone: "0771234567", email: "" },
        fulfilment: { method: "collection" },
        paymentMethod: "cash_on_delivery",
        acceptTerms: true,
      },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.quote.issues[0].code).toBe("not_for_sale");
  });

  test("order pages require the private access token", async ({ request }) => {
    const res = await request.get("/api/orders/00000000-0000-0000-0000-000000000000?t=nope");
    expect(res.status()).toBe(404);
  });

  test("reduced motion shows all hero content immediately", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Shop Naturo" }).first()).toBeVisible();
    const hiddenPre = await page.evaluate(
      () => [...document.querySelectorAll(".hero-pre, .hero-pre-lg")].filter((el) => getComputedStyle(el).visibility === "hidden").length,
    );
    expect(hiddenPre).toBe(0);
    // Showcase scenes are stacked (not pinned) and all readable.
    await expect(page.locator("article[data-scene]")).toHaveCount(7);
    await expect(page.locator("article[data-scene]").last()).toBeVisible();
    await ctx.close();
  });
});
