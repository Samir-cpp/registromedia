import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, simulate } from "../analytics.mjs";
const subjects = [
  { id: "a", name: "Matematica" },
  { id: "b", name: "Italiano" },
  { id: "c", name: "Storia" },
];
const g = (id, value, subjectId = "a", weight = 1, date = "2026-10-01") => ({
  id,
  value,
  subjectId,
  weight,
  date,
  type: "Scritto",
  note: "",
});
test("simulazione ponderata e soglia a quarti non promettono medie irraggiungibili", () => {
  assert.equal(simulate([g("1", 5)]).quarter, 7);
  assert.equal(simulate([g("1", 5, "a", 2)]).quarter, 8);
  assert.equal(simulate([g("1", 1, "a", 10)], { target: 6 }).quarter, null);
  assert.equal(simulate([g("1", 1, "a", 10)], { target: 6 }).minimumAtTen, 13);
  assert.equal(simulate([g("1", 6.1)], { target: 7 }).quarter, 8);
  assert.equal(simulate([g("1", 9)], { target: 10 }).minimumAtTen, null);
  assert.equal(simulate([]).current, null);
  assert.equal(simulate([]).quarter, 6);
  assert.equal(simulate([g("1", 8)], { target: 6 }).quarter, 4);
  assert.equal(
    simulate([g("1", 4)], { target: 6, count: 2, value: 7 }).projected,
    6,
  );
  for (const count of [0, 11, 1.5])
    assert.throws(() => simulate([], { count }));
});
test("Mentor separa insufficienze dei voti e medie insufficienti, esclude materie vuote", () => {
  const a = analyze([g("1", 4), g("2", 8), g("3", 5, "b")], subjects);
  assert.equal(a.insufficient, 2);
  assert.equal(a.priorities.length, 1);
  assert.equal(a.priorities[0].name, "Italiano");
  assert.equal(a.unrated, 1);
  assert.equal(a.average, 5.5);
  assert.deepEqual(a.weakest, ["Italiano"]);
  assert.deepEqual(a.strongest, ["Matematica"]);
  assert.equal(a.highest, 8);
  assert.equal(a.lowest, 4);
  assert.equal(
    a.buckets.reduce((s, b) => s + b.count, 0),
    3,
  );
  assert.equal(analyze([], subjects).passRate, null);
  assert.deepEqual(analyze([], subjects).weakest, []);
});
test("parità e campioni troppo piccoli non inventano classifiche o tendenze", () => {
  const a = analyze([g("1", 6), g("2", 6, "b")], subjects);
  assert.equal(a.weakest.length, 2);
  assert.equal(a.strongest.length, 2);
  assert.equal(a.subjectStats[0].trend, null);
  const same = analyze([g("1", 4), g("2", 5), g("3", 7), g("4", 8)], subjects);
  assert.equal(same.subjectStats[0].trend, null);
  const dated = analyze(
    [
      g("1", 4, "a", 1, "2026-09-01"),
      g("2", 5, "a", 1, "2026-09-02"),
      g("3", 7, "a", 1, "2026-10-01"),
      g("4", 8, "a", 1, "2026-10-02"),
    ],
    subjects,
  );
  assert.equal(dated.subjectStats[0].trend, 3);
  assert.equal(dated.monthly.length, 2);
});
