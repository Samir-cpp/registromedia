const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
(async () => {
  const server = spawn(process.execPath, ["server.cjs"], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, PORT: "3017" },
  });
  let browser;
  const states = new Map(),
    errors = [];
  const uid = (email) =>
    email.startsWith("alice")
      ? "11111111-1111-4111-8111-111111111111"
      : "22222222-2222-4222-8222-222222222222";
  async function mock(route) {
    if (route.request().method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        },
      });
    const r = route.request(),
      url = new URL(r.url()),
      body = r.postDataJSON() || {},
      id = r.headers().authorization?.replace("Bearer ", "");
    let json = {},
      status = 200;
    if (url.pathname === "/auth/v1/token") {
      const id = uid(body.email || "alice");
      json = {
        access_token: id,
        refresh_token: "refresh-" + id,
        expires_in: 3600,
        user: {
          id,
          email: body.email,
          email_confirmed_at: "2026-10-30",
          user_metadata: {
            display_name: body.email.startsWith("alice")
              ? "Alice demo"
              : "Bob demo",
          },
        },
      };
    } else if (url.pathname === "/rest/v1/student_states")
      json = states.has(id) ? [states.get(id)] : [];
    else if (url.pathname === "/rest/v1/rpc/save_student_state") {
      const current = states.get(id);
      if ((current?.revision || 0) !== body.expected_revision) {
        json = { message: "CONFLICT" };
        status = 409;
      } else {
        json = {
          revision: (current?.revision || 0) + 1,
          display_name: body.profile_name,
          data: body.state_json,
        };
        states.set(id, json);
        json = [json];
      }
    }
    return route.fulfill({
      status,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
      body: JSON.stringify(json),
    });
  }
  try {
    await new Promise((r, j) => {
      server.stdout.once("data", r);
      server.on("error", j);
    });
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ["--no-sandbox"],
    });
    async function page(email) {
      const c = await browser.newContext({
        acceptDownloads: true,
        serviceWorkers: "block",
      });
      await c.route("**/cloud-config.json", (r) =>
        r.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            url: "https://school-demo.supabase.co",
            publishableKey: "sb_publishable_demo_not_a_real_project_key",
          }),
        }),
      );
      await c.route("https://school-demo.supabase.co/**", mock);
      const p = await c.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto("http://127.0.0.1:3017");
      await p.locator("#auth-view").waitFor({ state: "visible" });
      await p.locator("#cloud-auth").click();
      await p.waitForFunction(
        () => !document.getElementById("cloud-submit").disabled,
      );
      await p.locator("#cloud-form [name=email]").fill(email);
      await p
        .locator("#cloud-form [name=password]")
        .fill("Password-cloud-test-2026");
      await p.locator("#cloud-submit").click();
      await p.locator("#app-view").waitFor({ state: "visible" });
      return p;
    }
    const a = await page("alice@example.test"),
      b = await page("alice@example.test");
    async function add(p, value, expectConflict = false) {
      await p.locator("#add-grade").click();
      await p.locator("#grade-form [name=subjectId]").selectOption("subject-9");
      await p.locator("#grade-form [name=value]").selectOption(String(value));
      await p.locator("#grade-form details summary").click();
      await p.locator("#grade-form [name=date]").fill("2026-10-14");
      await p.locator("#grade-form [type=submit]").click();
      if (expectConflict) {
        await p.waitForFunction(() =>
          document
            .querySelector("#grade-form .form-error")
            .textContent.includes("altro dispositivo"),
        );
      } else await p.locator("#grade-dialog").waitFor({ state: "hidden" });
    }
    await add(a, 7.5);
    await add(b, 8, true);
    assert.equal(states.get(uid("alice")).data.grades.length, 1);
    await b.locator("[data-close=grade-dialog]").click();
    await b.locator("#account-button").click();
    await b.locator("#cloud-sync").click();
    await b.waitForFunction(
      () => document.getElementById("count").textContent === "1",
    );
    await b.locator("[data-close=account-dialog]").click();
    await add(b, 8);
    assert.equal(states.get(uid("alice")).data.grades.length, 2);
    const bob = await page("bob@example.test");
    assert.equal(await bob.locator("#count").textContent(), "0");
    assert.equal(states.get(uid("bob")).data.grades.length, 0);
    await b.locator("#account-button").click();
    await b.locator("#export").click();
    await b
      .locator("#cloud-backup-form [name=password]")
      .fill("Password-backup-demo-2026");
    await b
      .locator("#cloud-backup-form [name=confirm]")
      .fill("Password-backup-demo-2026");
    const pending = b.waitForEvent("download");
    await b.locator("#cloud-backup-form [type=submit]").click();
    const d = await pending,
      f = path.join(os.tmpdir(), "votiva-cloud-backup-test.json");
    await d.saveAs(f);
    const text = fs.readFileSync(f, "utf8");
    assert.equal(JSON.parse(text).version, 3);
    assert.equal(text.includes("Matematica"), false);
    assert.equal(text.includes("Password"), false);
    fs.unlinkSync(f);
    await a.reload();
    await a.locator("#auth-view").waitFor({ state: "visible" });
    assert.equal(
      await a.evaluate(() =>
        JSON.stringify({ ...localStorage }).includes("11111111"),
      ),
      false,
    );
    assert.equal(await a.evaluate(() => sessionStorage.length), 0);
    assert.deepEqual(errors, []);
    console.log(
      "PASS cloud browser contract: 2 devices, conflict protection, manual sync, user separation, encrypted backup, no persisted tokens. Remote APIs mocked; RLS tested separately in PostgreSQL.",
    );
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
