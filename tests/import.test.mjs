import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseImportText,
  readDate,
  rowError,
  mergeImport,
  reconcileReadings,
} from "../import-model.mjs";
const subjects = [{ id: "math", name: "Matematica", target: 7 }],
  data = { subjects, grades: [], tasks: [] };
test("screenshot di una materia: date e voti sulla stessa riga, righe invertite e spezzate", () => {
  for (const text of [
    "14/10/2026 7,5 Scritto",
    "7,5 14/10/2026 Scritto",
    "14/10/2026\n7,5",
    "7,5\n14/10/2026",
  ]) {
    const rows = parseImportText(text, { subject: "Matematica", year: 2026 });
    assert.equal(rows.length, 1, text);
    assert.equal(rows[0].value, 7.5, text);
    assert.equal(rows[0].date, "2026-10-14", text);
    assert.equal(rowError(rows[0]), "");
  }
});
test("date italiane e anno inferito, nessuna data di oggi inventata", () => {
  assert.equal(readDate("14 ottobre 2026", 2026).date, "2026-10-14");
  assert.equal(readDate("03/02", 2026).date, "2027-02-03");
  assert.equal(readDate("03/02", 2026).inferred, true);
  assert.equal(readDate("31/02/2026").date, "");
  const row = parseImportText("7,5", { subject: "Matematica" })[0];
  assert.equal(row.date, "");
  assert.ok(rowError(row));
});
test("medie escluse, quarti bassi, segni ambigui e numeri multipli richiedono revisione", () => {
  assert.equal(
    parseImportText("Media 7,5", { subject: "Matematica" }).length,
    0,
  );
  assert.equal(
    parseImportText("14/10/2026 0,25", { subject: "Matematica" })[0].value,
    0.25,
  );
  assert.equal(
    parseImportText("14/10/2026 6+", { subject: "Matematica" })[0].value,
    "",
  );
  assert.equal(
    parseImportText("14/10/2026 6 7", { subject: "Matematica" })[0].value,
    "",
  );
  assert.equal(
    parseImportText("14/10/2026 6½", { subject: "Matematica" })[0].value,
    6.5,
  );
});
test("importazione atomica, riferimenti, duplicati e conservazione esplicita delle prove identiche", () => {
  const rows = parseImportText("Matematica 14/10/2026 7,5", {
      subjects,
      year: 2026,
    }),
    merged = mergeImport(data, rows);
  assert.equal(merged.added, 1);
  assert.equal(data.grades.length, 0);
  assert.equal(mergeImport(merged.data, rows).duplicates, 1);
  assert.equal(
    mergeImport(merged.data, rows, { keepDuplicates: true }).added,
    1,
  );
  assert.throws(() => mergeImport(data, [...rows, { ...rows[0], date: "" }]));
  assert.equal(data.grades.length, 0);
  assert.throws(() => parseImportText("x".repeat(50001)));
});

test("due letture OCR discordanti obbligano a correggere il numero invece di scegliere a caso", () => {
  const row = { subject: "Matematica", date: "2026-10-14", value: 7.5 };
  const result = reconcileReadings([row], [[{ ...row, value: 1.5 }]]);
  assert.equal(result[0].value, "");
  assert.match(result[0].reviewReason, /discordanti/);
  assert.equal(reconcileReadings([row], [[row]])[0].value, 7.5);
});
