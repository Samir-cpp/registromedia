import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import * as vault from "../vault.mjs";
const password = "Una-password-lunga-2026";
const schoolData = {
  subjects: [{ id: "mat", name: "MateriaRiservata", target: 7 }],
  grades: [
    {
      id: "vote1",
      subjectId: "mat",
      value: 8.5,
      weight: 1,
      date: "2026-12-31",
      type: "Orale",
      note: "Nota personale riservata",
    },
  ],
  tasks: [],
};
test("archivio cifrato, password errata, persistenza, isolamento e cancellazione", async () => {
  const session = await vault.register({
    username: "alice",
    name: "NomeRiservato",
    password,
  });
  await vault.save(session, schoolData);
  await assert.rejects(vault.login("alice", "password-sbagliata-lunga"));
  const restored = await vault.login("alice", password);
  assert.deepEqual(restored.data, schoolData);
  const backup = await vault.exportBackup(session),
    serialized = JSON.stringify(backup);
  assert.ok(!serialized.includes("MateriaRiservata"));
  assert.ok(!serialized.includes("NomeRiservato"));
  assert.ok(!serialized.includes(password));
  const bob = await vault.register({ username: "bob", name: "Bob", password });
  assert.equal(bob.data.grades.length, 0);
  const a = await vault.login("alice", password),
    b = await vault.login("alice", password);
  await vault.save(a, {
    ...schoolData,
    tasks: [
      {
        id: "task",
        title: "Compito",
        subjectId: "mat",
        date: "2027-01-03",
        done: false,
      },
    ],
  });
  await assert.rejects(vault.save(b, schoolData), /altra finestra/);
  await assert.rejects(vault.deleteAccount(a, "password-sbagliata-lunga"));
  await vault.deleteAccount(a, password);
  await assert.rejects(vault.login("alice", password), /non trovato/);
  const imported = await vault.restoreBackup(backup, password);
  assert.deepEqual(imported.data, schoolData);
  await assert.rejects(vault.restoreBackup(backup, password), /già presente/);
  const tampered = structuredClone(backup);
  tampered.account.ciphertext = "AAAA" + tampered.account.ciphertext.slice(4);
  await assert.rejects(vault.restoreBackup(tampered, password, true));
  const badRevision = structuredClone(backup);
  badRevision.account.revision++;
  await assert.rejects(vault.restoreBackup(badRevision, password, true));
  assert.equal((await vault.login("bob", password)).data.grades.length, 0);
});

test("accesso mantenuto con chiave non esportabile, Esci e cancellazione revocano l’accesso", async () => {
  const session = await vault.register({
    username: "persistente",
    name: "Studente",
    password,
  });
  await vault.rememberSession(session);
  const resumed = await vault.loadRememberedSession();
  assert.equal(resumed.username, "persistente");
  assert.equal(resumed.key.extractable, false);
  await vault.save(resumed, schoolData);
  assert.deepEqual((await vault.loadRememberedSession()).data, schoolData);
  await vault.logout();
  assert.equal(await vault.loadRememberedSession(), null);
  await vault.rememberSession(resumed);
  await vault.deleteAccount(resumed, password);
  assert.equal(await vault.loadRememberedSession(), null);
});

test("cambio password ricifra account, revoca chiave ricordata e mantiene leggibili i vecchi backup", async () => {
  const session = await vault.register({
    username: "change",
    name: "Change",
    password,
  });
  await vault.save(session, schoolData);
  await vault.rememberSession(session);
  const backup = await vault.exportBackup(session);
  await assert.rejects(
    vault.changePassword(
      session,
      "Password-sbagliata-2026",
      "Nuova-password-2026",
    ),
  );
  assert.ok(await vault.loadRememberedSession());
  await vault.changePassword(session, password, "Nuova-password-2026");
  assert.equal(await vault.loadRememberedSession(), null);
  await assert.rejects(vault.login("change", password));
  assert.deepEqual(
    (await vault.login("change", "Nuova-password-2026")).data,
    schoolData,
  );
  assert.deepEqual(
    (await vault.restoreBackup(backup, password, true)).data,
    schoolData,
  );
});
