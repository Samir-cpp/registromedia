const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), "votiva-major-"));
(async () => {
  const server = spawn(process.execPath, ["server.cjs"], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, PORT: "3016" },
  });
  let browser;
  const errors = [],
    external = [];
  try {
    await new Promise((r, j) => {
      server.stdout.once("data", r);
      server.on("error", j);
    });
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ["--no-sandbox"],
    });
    const c = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const p = await c.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("request", (r) => {
      if (
        /^https?:/.test(r.url()) &&
        !r.url().startsWith("http://127.0.0.1:3016/")
      )
        external.push(r.url());
    });
    await p.goto("http://127.0.0.1:3016");
    await p.locator("#auth-view").waitFor({ state: "visible" });
    await p.evaluate(async () => {
      const v = await import("./vault.mjs");
      const s = await v.register({
        username: "major.demo",
        name: "Demo Major",
        password: "Demo-major-password-2026",
      });
      await v.save(s, {
        ...s.data,
        grades: [
          {
            id: "g1",
            subjectId: "subject-9",
            value: 5,
            weight: 1,
            date: "2026-10-10",
            type: "Scritto",
            note: "Equazioni",
          },
          {
            id: "g2",
            subjectId: "subject-9",
            value: 5.5,
            weight: 1,
            date: "2026-10-15",
            type: "Orale",
            note: "",
          },
          {
            id: "g3",
            subjectId: "subject-0",
            value: 8,
            weight: 1,
            date: "2026-10-16",
            type: "Scritto",
            note: "",
          },
        ],
      });
      await v.rememberSession(s);
    });
    await p.reload();
    await p.locator("#app-view").waitFor({ state: "visible" });
    await p.locator("[data-period=all]").click();
    await p.locator("#open-mentor").click();
    assert.match(
      await p.locator("#mentor-metrics").textContent(),
      /Voti registrati3/,
    );
    assert.match(
      await p.locator("#mentor-metrics").textContent(),
      /Voti insufficienti2/,
    );
    assert.equal(await p.locator(".recovery-card").count(), 1);
    assert.match(await p.locator(".recovery-card").textContent(), /Matematica/);
    await p.screenshot({
      path: path.join(artifacts, "mentor-desktop.png"),
      fullPage: true,
    });
    await p.getByRole("button", { name: "Costruisci un piano" }).click();
    assert.equal(await p.locator("#sim-subject").inputValue(), "subject-9");
    assert.equal(await p.locator("#sim-required").textContent(), "7,5");
    await p.locator("#sim-count").selectOption("2");
    assert.equal(await p.locator("#sim-required").textContent(), "6,75");
    await p.locator("#sim-target").fill("10");
    assert.equal(await p.locator("#sim-required").textContent(), "Non basta");
    await p.screenshot({ path: path.join(artifacts, "simulator-desktop.png") });
    await p.locator("[data-close=simulator-dialog]").click();
    assert.equal(await p.locator("#count").textContent(), "3");
    const fixtures = [
      { name: "light", dark: false, size: 1 },
      { name: "dark", dark: true, size: 1 },
      { name: "small", dark: false, size: 0.65 },
    ];
    for (const fixture of fixtures) {
      const image = await p.evaluate(({ dark, size }) => {
        const c = document.createElement("canvas");
        c.width = 1200 * size;
        c.height = 450 * size;
        const x = c.getContext("2d");
        x.scale(size, size);
        x.fillStyle = dark ? "#18212b" : "white";
        x.fillRect(0, 0, 1200, 450);
        x.fillStyle = dark ? "#fafafa" : "#18212b";
        x.font = "bold 36px Arial";
        x.fillText("Valutazioni", 45, 60);
        x.font = "38px Arial";
        x.fillText("14/10/2026", 45, 180);
        x.fillText("Scritto", 470, 180);
        x.fillText("7,5", 880, 180);
        x.fillText("21/10/2026", 45, 290);
        x.fillText("Orale", 470, 290);
        x.fillText("5,25", 880, 290);
        return c.toDataURL("image/png").split(",")[1];
      }, fixture);
      const file = path.join(artifacts, fixture.name + ".png");
      fs.writeFileSync(file, Buffer.from(image, "base64"));
      await p.locator("#open-import").click();
      await p.locator("#import-subject").selectOption("subject-9");
      await p.locator("#ocr-file").setInputFiles(file);
      await p.locator("#crop-area").waitFor({ state: "visible" });
      await p.locator("#ocr-read").click();
      await p
        .locator("#import-review")
        .waitFor({ state: "visible", timeout: 120000 });
      const values = await p
        .locator(".field-value")
        .evaluateAll((nodes) => nodes.map((n) => n.value));
      const dates = await p
        .locator(".field-date")
        .evaluateAll((nodes) => nodes.map((n) => n.value));
      console.log("OCR actual", fixture.name, { values, dates });
      assert.deepEqual(values, ["7.5", "5.25"]);
      assert.deepEqual(dates, ["2026-10-14", "2026-10-21"]);
      assert.equal(await p.locator("#import-confirm").isDisabled(), true);
      assert.equal(await p.locator("#count").textContent(), "3");
      if (fixture.name === "small") {
        await p.locator("#import-reviewed").check();
        await p.locator("#import-confirm").click();
        await p.locator("#import-dialog").waitFor({ state: "hidden" });
        assert.equal(await p.locator("#count").textContent(), "5");
      } else await p.locator("[data-close=import-dialog]").click();
    }
    // No recognitions should silently invent a historical date; review is mandatory.
    await p.locator("#open-import").click();
    await p
      .locator("#ocr-text")
      .locator("..")
      .locator("..")
      .locator("summary")
      .click();
    await p.locator("#ocr-text").fill("7,5");
    await p.locator("#ocr-parse").click();
    assert.equal(await p.locator(".field-date").inputValue(), "");
    await p.locator("#import-reviewed").check();
    assert.equal(await p.locator("#import-confirm").isDisabled(), true);
    await p.locator("[data-close=import-dialog]").click();
    // Closing a running recognition cancels it without corrupting the next session.
    await p.locator("#open-import").click();
    await p
      .locator("#ocr-file")
      .setInputFiles(path.join(artifacts, "light.png"));
    await p.locator("#crop-area").waitFor({ state: "visible" });
    await p.locator("#ocr-read").click();
    await p.locator("[data-close=import-dialog]").click();
    await p.locator("#open-import").click();
    await p.waitForTimeout(400);
    assert.equal(await p.locator("#ocr-status").textContent(), "");
    assert.equal(await p.locator("#ocr-read").isEnabled(), true);
    await p.locator("[data-close=import-dialog]").click();
    for (const width of [320, 390, 768, 1440]) {
      await p.setViewportSize({ width, height: 900 });
      for (const id of ["mentor", "simulator", "import"]) {
        await p.locator("#open-" + id).click();
        assert.ok(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        if (width === 390)
          await p.screenshot({
            path: path.join(artifacts, `${id}-mobile.png`),
          });
        await p
          .locator(
            `[data-close=${id === "simulator" ? "simulator" : id}-dialog]`,
          )
          .click();
      }
    }
    await p.locator("#account-button").click();
    await p.locator("#cloud-account").click();
    await p.waitForFunction(() =>
      document
        .querySelector("#cloud-config-status")
        .textContent.includes("non attivo"),
    );
    assert.equal(await p.locator("#cloud-submit").isDisabled(), true);
    await p.locator("[data-close=cloud-dialog]").click();
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.waitForFunction(() => !!navigator.serviceWorker.controller);
    await c.setOffline(true);
    await p.reload();
    await p.locator("#app-view").waitFor({ state: "visible" });
    await p.locator("#open-import").click();
    await p.locator("#import-subject").selectOption("subject-9");
    await p
      .locator("#ocr-file")
      .setInputFiles(path.join(artifacts, "light.png"));
    await p.locator("#crop-area").waitFor({ state: "visible" });
    await p.locator("#ocr-read").click();
    await p
      .locator("#import-review")
      .waitFor({ state: "visible", timeout: 120000 });
    assert.deepEqual(
      await p
        .locator(".field-value")
        .evaluateAll((nodes) => nodes.map((n) => n.value)),
      ["7.5", "5.25"],
    );
    await p.locator("[data-close=import-dialog]").click();
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      "PASS major UI, real OCR 3 fixtures, review, analytics, scenarios, responsive views and unconfigured cloud. Artifacts:",
      artifacts,
    );
  } catch (e) {
    console.error("Artifacts:", artifacts, "JS errors:", errors);
    throw e;
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
