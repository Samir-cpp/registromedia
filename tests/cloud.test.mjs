import { test } from "node:test";
import assert from "node:assert/strict";
test("client cloud: sessioni in memoria, revisioni, conflitto senza sovrascrittura e recupero con codice", async () => {
  const original = globalThis.fetch;
  const calls = [];
  let revision = 1;
  const uid = "11111111-1111-4111-8111-111111111111",
    state = {
      subjects: [{ id: "m", name: "Matematica", target: 7 }],
      grades: [],
      tasks: [],
    };
  globalThis.fetch = async (url, options = {}) => {
    url = String(url);
    calls.push({
      url,
      method: options.method,
      body: options.body ? JSON.parse(options.body) : null,
    });
    const body = options.body ? JSON.parse(options.body) : {};
    let value,
      status = 200;
    if (url.endsWith("cloud-config.json"))
      value = {
        url: "https://school-demo.supabase.co",
        publishableKey: "sb_publishable_example_test_not_a_real_key",
      };
    else if (url.includes("/token?"))
      value = {
        access_token: "test-access-only",
        refresh_token: "test-refresh-only",
        expires_in: 3600,
        user: {
          id: uid,
          email: "demo@example.test",
          email_confirmed_at: "2026-10-30",
          user_metadata: { display_name: "Demo" },
        },
      };
    else if (url.includes("/student_states?"))
      value = [{ revision, display_name: "Demo", data: state }];
    else if (url.endsWith("/rpc/save_student_state")) {
      if (body.expected_revision !== revision) {
        value = { message: "CONFLICT" };
        status = 409;
      } else
        value = [
          { revision: ++revision, display_name: "Demo", data: body.state_json },
        ];
    } else if (url.endsWith("/recover")) value = {};
    else if (url.endsWith("/verify"))
      value = {
        access_token: "reset-access",
        refresh_token: "reset-refresh",
        user: { id: uid, email: "demo@example.test" },
      };
    else value = {};
    return new Response(JSON.stringify(value), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };
  try {
    const cloud = await import("../cloud.mjs?test=contract");
    const s = await cloud.login(
      "demo@example.test",
      "Password-test-lunga-2026",
    );
    assert.equal(s.cloud, true);
    assert.equal(s.revision, 1);
    assert.equal(cloud.connected(), true);
    await cloud.save(s, state);
    assert.equal(s.revision, 2);
    revision = 3;
    await assert.rejects(cloud.save(s, state), /altro dispositivo/);
    assert.equal(s.revision, 2);
    await cloud.sync(s);
    assert.equal(s.revision, 3);
    await cloud.resetEmail("demo@example.test");
    await cloud.resetPassword(
      "demo@example.test",
      "123456",
      "Nuova-password-2026",
    );
    assert.equal(cloud.connected(), false);
    assert.ok(
      calls.some(
        (c) => c.url.endsWith("/verify") && c.body.type === "recovery",
      ),
    );
    assert.ok(
      calls.some(
        (c) =>
          c.url.endsWith("/user") && c.body.password === "Nuova-password-2026",
      ),
    );
    assert.ok(
      calls.every(
        (c) => !c.url.includes("test-access") && !c.url.includes("Password"),
      ),
    );
    cloud.forget();
  } finally {
    globalThis.fetch = original;
  }
});
test("configurazione: una chiave amministrativa non può essere distribuita nel frontend", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        url: "https://school-demo.supabase.co",
        publishableKey: "sb_secret_questo_non_deve_essere_usato",
      }),
    );
  try {
    const c = await import("../cloud.mjs?test=secret");
    await assert.rejects(c.configuration(), /chiave pubblica/);
  } finally {
    globalThis.fetch = original;
  }
});
