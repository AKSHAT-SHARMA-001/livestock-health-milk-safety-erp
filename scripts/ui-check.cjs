// Browser checks against the running local ERP. Uses synthetic test records.
const { chromium } = require("../frontend/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.UI_URL || "http://localhost:5173";
const shots = path.resolve(__dirname, "../docs/screenshots");
fs.mkdirSync(shots, { recursive: true });
const failures = [],
  results = [];
function pass(message) {
  results.push(message);
  console.log("PASS: " + message);
}
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.CHROMIUM_EXECUTABLE }
      : {}),
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => failures.push(e.message));
    await page.goto(base + "/login");
    await page.getByRole("heading", { name: "Sign in", exact: true }).waitFor();
    await page.locator(".auth-photo").evaluate((image) => image.decode());
    assert(
      await page
        .locator(".auth-photo")
        .evaluate((image) => image.naturalWidth > 0),
    );
    await page.getByRole("button", { name: "Show password" }).click();
    assert.equal(
      await page.locator('input[name="password"]').getAttribute("type"),
      "text",
    );
    await page.getByRole("button", { name: "Hide password" }).click();
    await page.screenshot({
      path: path.join(shots, "login.png"),
      fullPage: true,
    });
    await page.locator('input[name="password"]').fill("incorrect");
    await page.locator(".auth-submit").click();
    await page.getByRole("alert").waitFor();
    assert.match(
      await page.getByRole("alert").innerText(),
      /Invalid email or password/,
    );
    pass("Login image, password toggle and incorrect-password error");

    const rolePaths = {
      Farmer: ["/", "/animals", "/vets", "/book", "/history", "/milk"],
      Vet: ["/", "/services", "/bookings", "/treatment", "/history"],
      Admin: ["/", "/users", "/stock", "/reports"],
    };
    for (const [role, paths] of Object.entries(rolePaths)) {
      await page.goto(base + "/login");
      await page.getByRole("button", { name: role, exact: true }).click();
      await page.locator(".auth-submit").click();
      await page.locator(".sidebar").waitFor();
      for (const route of paths) {
        await page.goto(base + route);
        await page.locator("main h1").waitFor();
        await page.waitForLoadState("networkidle");
        assert.equal(
          await page.getByRole("alert").count(),
          0,
          role + " " + route + " error",
        );
        assert.equal(
          await page.locator("main .error").count(),
          0,
          role + " " + route + " API error",
        );
      }
      if (role === "Farmer") {
        await page.goto(base);
        await page.waitForLoadState("networkidle");
        await page.screenshot({
          path: path.join(shots, "farmer-overview.png"),
          fullPage: true,
        });
        // Search actually navigates instead of acting as a decorative input.
        await page.getByRole("textbox", { name: "Find a page" }).fill("milk");
        await page.getByRole("textbox", { name: "Find a page" }).press("Enter");
        await page.waitForURL("**/milk");
        // Farmer routes cannot access admin pages.
        await page.goto(base + "/users");
        await page.waitForURL(base + "/");
      }
      if (role === "Admin") {
        await page.goto(base + "/stock");
        const name = "Browser inventory " + Date.now();
        const add = page
          .locator("form")
          .filter({
            has: page.getByRole("heading", {
              name: "Add inventory item",
              exact: true,
            }),
          });
        await add.getByLabel("Name", { exact: true }).fill(name);
        await add.getByLabel("Stock", { exact: true }).fill("2");
        await add.getByLabel("Low-stock threshold", { exact: true }).fill("5");
        await add.getByRole("button", { name: "Save", exact: true }).click();
        const row = page
          .getByRole("row")
          .filter({ has: page.getByRole("cell", { name, exact: true }) });
        await row.getByText("LOW STOCK", { exact: true }).waitFor();
        await row.getByRole("button", { name: "Edit stock" }).click();
        const edit = page
          .locator("form")
          .filter({ has: page.getByRole("heading", { name: /Update item/ }) });
        await edit.getByLabel("Stock", { exact: true }).fill("10");
        await edit.getByRole("button", { name: "Save", exact: true }).click();
        await row.getByText("OK", { exact: true }).waitFor();
        pass("Inventory create/edit and low-stock status");
        await page.goto(base + "/reports");
        const select = page.locator("main select");
        for (const name of [
          "withdrawal",
          "top-vets",
          "low-stock",
          "attention",
          "unvaccinated",
          "treated-vaccinated",
        ]) {
          await select.selectOption(name);
          await page.waitForLoadState("networkidle");
          assert.equal(
            await page.locator("main .error").count(),
            0,
            "Report " + name,
          );
        }
        pass("All six report pages load");
      }
      await page.getByRole("button", { name: /sign out/i }).click();
      await page.waitForURL("**/login");
      pass(role + " login, all role pages and logout");
    }

    await page.getByRole("button", { name: "Create a farmer account" }).click();
    const tag = Date.now();
    for (const [name, value] of Object.entries({
      name: "Browser Test Farmer",
      email: "browser-" + tag + "@test.local",
      password: "Browser123!",
      phone: "1234567890",
      village: "Test Village",
      address: "Test dairy",
    }))
      await page.locator('input[name="' + name + '"]').fill(value);
    await page.locator(".auth-submit").click();
    await page.locator(".sidebar").waitFor();
    await page.goto(base + "/animals");
    const form = page
      .locator("form")
      .filter({
        has: page.getByRole("heading", {
          name: "Register animal",
          exact: true,
        }),
      });
    await form.getByLabel("Tag number").fill("BROWSER-" + tag);
    await form.getByLabel("Breed").fill("Jersey");
    await form.getByLabel("Age in years").fill("3");
    await form.getByRole("button", { name: "Save", exact: true }).click();
    await page
      .getByRole("cell", { name: "BROWSER-" + tag, exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    const edit = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: /Edit animal/ }) });
    await edit.getByLabel("Breed").fill("Holstein");
    await edit.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByRole("cell", { name: "Holstein", exact: true }).waitFor();
    page.once("dialog", (d) => d.dismiss());
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    assert.equal(
      await page
        .getByRole("cell", { name: "BROWSER-" + tag, exact: true })
        .count(),
      1,
    );
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page
      .getByRole("cell", { name: "BROWSER-" + tag, exact: true })
      .waitFor({ state: "detached" });
    pass(
      "Farmer signup and animal create/edit/delete, including cancel confirmation",
    );
    await page.reload();
    await page.locator(".sidebar").waitFor();
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.goto(base + "/animals");
    await page.waitForURL("**/login");
    pass("Session refresh and logged-out route protection");
    await page.route("**/backend/user/api/auth/login", (route) =>
      route.abort(),
    );
    await page.locator(".auth-submit").click();
    await page.getByRole("alert").waitFor();
    assert.match(
      await page.getByRole("alert").innerText(),
      /Could not reach the server/,
    );
    await page.unroute("**/backend/user/api/auth/login");
    pass("Readable error when the backend cannot be reached");
    await page.goto(base + "/login");
    await page.locator(".auth-submit").click();
    await page.locator(".sidebar").waitFor();
    await page.evaluate(() =>
      window.dispatchEvent(new Event("erp-session-expired")),
    );
    await page.waitForURL("**/login");
    assert.equal(
      await page.evaluate(() => sessionStorage.getItem("erpUser")),
      null,
    );
    pass("Expired sessions return to login and clear browser credentials");

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
    });
    const small = await mobile.newPage();
    small.on("pageerror", (e) => failures.push(e.message));
    await small.goto(base + "/login");
    await small.locator(".auth-submit").click();
    await small.getByRole("button", { name: "Open navigation" }).waitFor();
    await small.getByRole("button", { name: "Open navigation" }).click();
    await small.getByRole("link", { name: "My animals", exact: true }).click();
    await small
      .getByRole("heading", { name: "My Animals", exact: true })
      .waitFor();
    assert(
      await small.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "Mobile page overflows",
    );
    await small.screenshot({
      path: path.join(shots, "mobile-animals.png"),
      fullPage: true,
    });
    pass("Mobile login, navigation and no horizontal page overflow");
    assert.deepEqual(failures, [], "Browser runtime errors");
    pass("No uncaught browser runtime errors");
    fs.writeFileSync(
      path.resolve(__dirname, "../logs/ui-results.json"),
      JSON.stringify({ base, results, errors: failures }, null, 2),
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
