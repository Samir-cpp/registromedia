import { test } from "node:test";
import assert from "node:assert/strict";
import {
  periodForDate,
  schoolYear,
  validateData,
  weightedAverage,
  generalAverage,
  academicPeriod,
  validateSettings,
  DEFAULT_SUBJECTS,
} from "../model.mjs";
const subjects = [
  { id: "a", name: "Matematica", target: 7 },
  { id: "b", name: "Italiano", target: 8 },
];
const grade = (
  id,
  value,
  subjectId = "a",
  date = "2026-12-31",
  weight = 1,
) => ({ id, value, subjectId, date, weight, type: "Orale", note: "" });
test("confini automatici tra periodi e anni scolastici", () => {
  assert.equal(periodForDate("2026-12-31"), "first");
  assert.equal(periodForDate("2027-01-01"), "second");
  assert.equal(schoolYear("2026-12-31"), 2026);
  assert.equal(schoolYear("2027-06-30"), 2026);
  assert.equal(periodForDate("2027-07-01"), "summer");
  assert.equal(schoolYear("2027-09-01"), 2027);
  assert.throws(() => periodForDate("2026-02-30"));
});
test("media generale attribuisce lo stesso peso alle materie", () => {
  const grades = [grade("1", 6), grade("2", 6), grade("3", 9, "b")];
  assert.equal(generalAverage(grades, subjects), 7.5);
  assert.equal(weightedAverage(grades), 7);
  assert.equal(generalAverage([], subjects), null);
  assert.equal(
    weightedAverage([grade("1", 6), grade("2", 9, "a", "2026-12-31", 2)]),
    8,
  );
});
test("validazione archivio e riferimenti a materie", () => {
  const base = { subjects, grades: [grade("1", 7)], tasks: [] };
  assert.deepEqual(validateData(base), base);
  for (const bad of [
    grade("1", 11),
    grade("1", NaN),
    grade("1", 7, "missing"),
    grade("1", 7, "a", "2027-08-12"),
    grade("1", 7, "a", "2026-12-31", 0),
  ])
    assert.throws(() => validateData({ ...base, grades: [bad] }));
  assert.throws(() =>
    validateData({
      ...base,
      subjects: [...subjects, { id: "c", name: "matematica", target: 7 }],
    }),
  );
});

test("voti minimi e decimali compatibili con i backup precedenti", () => {
  for (const value of [0.25, 0.5, 0.75, 1, 6.37, 10])
    assert.equal(
      validateData({ subjects, grades: [grade("1", value)], tasks: [] })
        .grades[0].value,
      value,
    );
  for (const value of [0, 0.24, 10.25])
    assert.throws(() =>
      validateData({ subjects, grades: [grade("1", value)], tasks: [] }),
    );
});
test("periodi personalizzati inclusivi e archivio annuale", () => {
  const s = { start: "09-15", split: "12-20", end: "06-15" };
  assert.equal(academicPeriod("2026-09-14", s), "outside");
  assert.equal(academicPeriod("2026-12-20", s), "first");
  assert.equal(academicPeriod("2026-12-21", s), "second");
  assert.equal(academicPeriod("2027-01-01", s), "second");
  assert.equal(academicPeriod("2027-06-15", s), "second");
  assert.equal(academicPeriod("2027-06-16", s), "outside");
  assert.throws(() => validateSettings({ ...s, split: "09-01" }));
  assert.throws(() => validateSettings({ ...s, end: "02-30" }));
  assert.equal(DEFAULT_SUBJECTS.length, 10);
  assert.deepEqual(
    validateData({ subjects, grades: [], tasks: [], settings: s }).settings,
    s,
  );
});

test("trimestre fino a gennaio e pentamestre da febbraio", () => {
  const s = { start: "09-10", split: "01-31", end: "06-10" };
  assert.equal(academicPeriod("2027-01-31", s), "first");
  assert.equal(academicPeriod("2027-02-01", s), "second");
  assert.equal(academicPeriod("2026-08-31", s), "outside");
  assert.equal(academicPeriod("2026-09-10", s), "first");
  assert.throws(() => validateSettings({ ...s, split: "06-11" }));
});

test("errori floating point non trasformano una media esatta di 6 in insufficienza", () => {
  const list = [
    grade("1", 2, "a", "2026-12-31", 0.1),
    grade("2", 10, "a", "2026-12-31", 0.1),
  ];
  assert.equal(weightedAverage(list), 6);
  assert.equal(generalAverage(list, subjects), 6);
});
