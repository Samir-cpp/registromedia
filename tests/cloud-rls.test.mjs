import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("schema reale PostgreSQL: email verificata, RLS tra utenti, CAS, limiti e cancellazione a cascata", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`,
    );
    const sql = await readFile(
      new URL(
        "../supabase/migrations/202610300001_student_states.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await db.exec(sql);
    const alice = "11111111-1111-4111-8111-111111111111",
      bob = "22222222-2222-4222-8222-222222222222",
      unverified = "33333333-3333-4333-8333-333333333333";
    await db.query(
      "insert into auth.users values ($1,now()),($2,now()),($3,null)",
      [alice, bob, unverified],
    );
    const data = {
      subjects: [{ id: "math", name: "Matematica", target: 7 }],
      grades: [],
      tasks: [],
    };
    async function as(id, fn) {
      await db.exec("set role authenticated");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
      try {
        return await fn();
      } finally {
        await db.exec("reset role");
      }
    }
    const save = (revision, payload = data) =>
      db.query("select * from public.save_student_state($1,$2,$3)", [
        revision,
        JSON.stringify(payload),
        "Studente",
      ]);
    await as(unverified, () => assert.rejects(save(0), /AUTH_REQUIRED/));
    await as(alice, async () => {
      const r = await save(0);
      assert.equal(Number(r.rows[0].revision), 1);
      assert.equal(
        (await db.query("select * from student_states")).rows.length,
        1,
      );
      await assert.rejects(
        db.exec("update student_states set revision=999"),
        /permission denied/,
      );
    });
    await as(bob, async () => {
      assert.equal(
        (await db.query("select * from student_states")).rows.length,
        0,
      );
      await save(0);
      assert.equal(
        (await db.query("select * from student_states")).rows[0].user_id,
        bob,
      );
    });
    await as(alice, async () => {
      await save(1);
      await assert.rejects(save(1), /CONFLICT/);
      assert.equal(
        Number(
          (await db.query("select revision from student_states")).rows[0]
            .revision,
        ),
        2,
      );
      await assert.rejects(
        save(2, { ...data, grades: Array(10001).fill({}) }),
        /INVALID_STATE|bounded_student_state/,
      );
      const grade = {
        id: "g",
        subjectId: "math",
        value: 7.5,
        weight: 1,
        date: "2026-10-14",
        type: "Scritto",
        note: "",
      };
      for (const invalid of [
        { ...grade, subjectId: "other-user-subject" },
        { ...grade, date: "2026-02-30" },
        { ...grade, value: 12 },
        { ...grade, weight: 0 },
      ])
        await assert.rejects(
          save(2, { ...data, grades: [invalid] }),
          /INVALID_STATE/,
        );
      assert.equal(
        Number(
          (await db.query("select revision from student_states")).rows[0]
            .revision,
        ),
        2,
      );
      await assert.rejects(
        save(2, { subjects: null, grades: [], tasks: [] }),
        /INVALID_STATE/,
      );
      const accepted = await save(2, {
        ...data,
        grades: [grade],
        settings: { start: "09-01", split: "01-31", end: "06-30" },
      });
      assert.equal(Number(accepted.rows[0].revision), 3);
      assert.equal(accepted.rows[0].data.grades[0].value, 7.5);
    });
    await db.exec("set role anon");
    await assert.rejects(
      db.exec("select * from student_states"),
      /permission denied/,
    );
    await assert.rejects(save(0), /permission denied/);
    await db.exec("reset role");
    await db.query("delete from auth.users where id=$1", [alice]);
    assert.equal(
      (await db.query("select * from student_states where user_id=$1", [alice]))
        .rows.length,
      0,
    );
    await db.exec(sql);
    console.log(
      "RLS/CAS tested with embedded PostgreSQL; hosted Supabase is still unconfigured.",
    );
  } finally {
    await db.close();
  }
});
