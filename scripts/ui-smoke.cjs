const { chromium, webkit } = require("playwright");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), "votiva-ui-"));
(async () => {
  const server = spawn(process.execPath, ["server.cjs"], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, PORT: "3013" },
  });
  let context, otherBrowser;
  const errors = [],
    external = [];
  const options = {
    executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: true,
    args: ["--no-sandbox"],
    viewport: { width: 1440, height: 1000 },
  };
  const profile = path.join(artifacts, "profile");
  let page;
  const attach = (p) => {
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("dialog", (d) => d.accept());
    p.on("request", (r) => {
      if (
        /^https?:/.test(r.url()) &&
        !r.url().startsWith("http://127.0.0.1:3013/")
      )
        external.push(r.url());
    });
  };
  try {
    await new Promise((resolve, reject) => {
      server.stdout.once("data", resolve);
      server.once("error", reject);
      server.once("exit", (code) =>
        reject(Error("Server non avviato: " + code)),
      );
    });
    context = await chromium.launchPersistentContext(profile, options);
    page = context.pages()[0];
    attach(page);
    await page.goto("http://127.0.0.1:3013");
    await page.locator("#auth-view").waitFor({ state: "visible" });
    await page.locator("#register-tab").click();
    await page.locator("#auth-form [name=name]").fill("Samir");
    await page.locator("#auth-form [name=username]").fill("samir");
    await page
      .locator("#auth-form [name=password]")
      .fill("Password-di-test-2026");
    await page
      .locator("#auth-form [name=confirm]")
      .fill("Password-di-test-2026");
    await page.locator("#auth-submit").click();
    await page.locator("#app-view").waitFor({ state: "visible" });
    assert.equal(await page.locator(".subject").count(), 10);
    assert.equal(await page.locator("#open-import").count(), 0);
    assert.equal(await page.locator("#connection").count(), 0);
    async function grade(value, date, subject = "subject-9", weight = 1) {
      await page.locator("#add-grade").click();
      assert.equal(
        await page.locator("#grade-form [name=value] option").count(),
        41,
      );
      await page.locator("#grade-form [name=subjectId]").selectOption(subject);
      await page
        .locator("#grade-form [name=value]")
        .selectOption(String(value));
      await page.locator("#grade-form details summary").click();
      await page.locator("#grade-form [name=date]").fill(date);
      await page.locator("#grade-form [name=weight]").fill(String(weight));
      await page.locator("#grade-form [type=submit]").click();
      await page.locator("#grade-dialog").waitFor({ state: "hidden" });
    }
    await grade(5.5, "2026-12-31");
    assert.equal(await page.locator("#average").textContent(), "5,5");
    assert.equal(
      await page.locator("#average-status").textContent(),
      "Insufficiente",
    );
    await grade(8, "2027-01-01");
    assert.equal(await page.locator("#average").textContent(), "8,0");
    assert.equal(await page.locator("#pass-rate").textContent(), "100%");
    await grade(0.25, "2027-01-02", "subject-0");
    assert.equal(await page.locator("#pass-rate").textContent(), "50%");
    await page.locator("[data-period=all]").click();
    assert.equal(await page.locator("#count").textContent(), "3");
    assert.equal(await page.locator("#average").textContent(), "3,5");
    await page.getByRole("button", { name: "Matematica", exact: true }).click();
    assert.equal(await page.locator(".grade-row").count(), 2);
    assert.equal(await page.locator("#grades-view").isVisible(), true);
    await page.locator(".grade-row .subject-edit").first().click();
    await page.locator("#grade-form [name=value]").selectOption("9");
    await page.locator("#grade-form [type=submit]").click();
    await page.locator("#grade-dialog").waitFor({ state: "hidden" });
    await page.locator("#account-button").click();
    await page.locator("#period-settings").click();
    await page.locator("#period-form [name=split]").fill("2026-12-20");
    await page.locator("#period-form [type=submit]").click();
    await page.locator("#period-dialog").waitFor({ state: "hidden" });
    await page.locator("[data-period=first]").click();
    assert.equal(await page.locator("#count").textContent(), "0");
    await page.locator("[data-period=second]").click();
    assert.equal(await page.locator("#count").textContent(), "3");
    await page.locator("#subjects-tab").click();
    await page.locator("#theme-select").selectOption("dark");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.screenshot({
      path: path.join(artifacts, "desktop-dark.png"),
      fullPage: true,
    });
    await context.close();
    context = await chromium.launchPersistentContext(profile, options);
    page = context.pages()[0];
    attach(page);
    await page.goto("http://127.0.0.1:3013");
    await page.locator("#app-view").waitFor({ state: "visible" });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    assert.equal(await page.locator("#auth-view").isVisible(), false);
    await page.locator("#theme-select").selectOption("light");
    await page.locator("[data-period=all]").click();
    await page.screenshot({
      path: path.join(artifacts, "desktop-light.png"),
      fullPage: true,
    });
    for (const width of [320, 375, 390, 430, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Overflow ${width}`,
      );
      if ([390, 768].includes(width))
        await page.screenshot({
          path: path.join(artifacts, `width-${width}.png`),
          fullPage: true,
        });
      await page.locator("#add-grade").click();
      assert.ok(
        await page.evaluate(() => {
          const r = document
            .querySelector("#grade-dialog")
            .getBoundingClientRect();
          return r.left >= 0 && r.right <= innerWidth;
        }),
      );
      await page.locator("[data-close=grade-dialog]").click();
    }
    await page.locator("#account-button").click();
    await page
      .locator("#password-form")
      .locator("..")
      .locator("summary")
      .click();
    await page
      .locator("#password-form [name=currentPassword]")
      .fill("Password-di-test-2026");
    await page.locator('[data-password="#current-password"]').click();
    assert.equal(
      await page.locator("#current-password").getAttribute("type"),
      "text",
    );
    await page
      .locator("#password-form [name=newPassword]")
      .fill("Nuova-password-2026");
    await page
      .locator("#password-form [name=confirm]")
      .fill("Nuova-password-2026");
    await page.locator("#password-form [type=submit]").click();
    await page.locator("#account-dialog").waitFor({ state: "hidden" });
    await page.locator("#account-button").click();
    const download = page.waitForEvent("download");
    await page.locator("#export").click();
    const file = await download;
    const backupPath = path.join(artifacts, "backup.json");
    await file.saveAs(backupPath);
    assert.equal(
      fs.readFileSync(backupPath, "utf8").includes("Matematica"),
      false,
    );
    await page.locator("[data-close=account-dialog]").click();
    const another = await context.newPage();
    attach(another);
    await another.goto("http://127.0.0.1:3013");
    await another.locator("#app-view").waitFor({ state: "visible" });
    await page.locator("#account-button").click();
    await page.locator("#logout").click();
    await page.locator("#auth-view").waitFor({ state: "visible" });
    await another.locator("#auth-view").waitFor({ state: "visible" });
    await another.close();
    await page.reload();
    await page.locator("#auth-view").waitFor({ state: "visible" });
    await page.locator("#auth-form [name=username]").fill("samir");
    await page
      .locator("#auth-form [name=password]")
      .fill("Password-di-test-2026");
    await page.locator("#auth-submit").click();
    await page.waitForFunction(
      () => document.querySelector("#auth-error").textContent.length > 0,
    );
    await page
      .locator("#auth-form [name=password]")
      .fill("Nuova-password-2026");
    await page.locator("#auth-submit").click();
    await page.locator("#app-view").waitFor({ state: "visible" });
    otherBrowser = await chromium.launch(options);
    const other = await otherBrowser.newPage();
    await other.goto("http://127.0.0.1:3013");
    await other.locator("#auth-view").waitFor({ state: "visible" });
    await other.locator("#restore-file").setInputFiles(backupPath);
    await other
      .locator("#restore-form [name=password]")
      .fill("Nuova-password-2026");
    await other.locator("#restore-form [type=submit]").click();
    await other.locator("#app-view").waitFor({ state: "visible" });
    assert.equal(await other.locator(".subject").count(), 10);
    await other.locator("[data-period=all]").click();
    assert.equal(await other.locator("#count").textContent(), "3");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.reload();
    await page.locator("#app-view").waitFor({ state: "visible" });
    assert.equal(await page.locator(".subject").count(), 10);
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      "PASS: materie predefinite, quarti di voto, medie, percentuali, filtro materia, modifica, periodi, password, sessione, backup, offline, temi e 8 larghezze.",
    );
    console.log("Screenshot di test:", artifacts);
  } catch (e) {
    if (page)
      try {
        await page.screenshot({
          path: path.join(artifacts, "failure.png"),
          fullPage: true,
        });
        console.error("Errori JS:", errors);
      } catch {}
    throw e;
  } finally {
    await context?.close();
    await otherBrowser?.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
