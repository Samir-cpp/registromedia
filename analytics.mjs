import { weightedAverage, generalAverage } from "./model.mjs";
const roundQuarterUp = (v) => Math.ceil((v - 1e-9) * 4) / 4;
export function simulate(
  grades,
  { target = 6, count = 1, weight = 1, value = 7 } = {},
) {
  if (
    !Number.isFinite(target) ||
    target < 0.25 ||
    target > 10 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 10 ||
    !Number.isFinite(weight) ||
    weight <= 0 ||
    weight > 10 ||
    !Number.isFinite(value) ||
    value < 0.25 ||
    value > 10
  )
    throw Error("Controlla obiettivo, numero di prove, voto e peso");
  const sum = grades.reduce((s, g) => s + g.value * g.weight, 0),
    totalWeight = grades.reduce((s, g) => s + g.weight, 0);
  const required =
      (target * (totalWeight + count * weight) - sum) / (count * weight),
    quarter = Math.max(0.25, roundQuarterUp(required));
  const projected =
    (sum + count * value * weight) / (totalWeight + count * weight);
  const minimumAtTen =
    weightedAverage(grades) !== null && weightedAverage(grades) >= target
      ? 0
      : target === 10
        ? grades.some((g) => g.value < 10)
          ? null
          : 1
        : Math.max(
            1,
            Math.ceil(
              (target * totalWeight - sum) / (weight * (10 - target)) - 1e-9,
            ),
          );
  return {
    current: weightedAverage(grades),
    required,
    quarter: quarter <= 10 ? quarter : null,
    projected,
    already: grades.length > 0 && sum / totalWeight >= target,
    minimumAtTen,
  };
}
export function analyze(grades, subjects) {
  const bySubject = new Map(subjects.map((s) => [s.id, []]));
  for (const g of grades) bySubject.get(g.subjectId)?.push(g);
  const subjectStats = subjects.map((s) => {
    const list = bySubject.get(s.id),
      ordered = [...list].sort(
        (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
      ),
      avg = weightedAverage(list);
    let trend = null;
    if (ordered.length >= 4) {
      const mid = Math.floor(ordered.length / 2);
      if (ordered[mid - 1].date !== ordered[mid].date)
        trend =
          weightedAverage(ordered.slice(mid)) -
          weightedAverage(ordered.slice(0, mid));
    }
    const lows = list.filter((g) => g.value < 6);
    return {
      ...s,
      count: list.length,
      average: avg,
      insufficient: lows.length,
      severe: list.filter((g) => g.value < 5).length,
      highest: list.length ? Math.max(...list.map((g) => g.value)) : null,
      lowest: list.length ? Math.min(...list.map((g) => g.value)) : null,
      trend,
      notes: [...new Set(lows.map((g) => g.note).filter(Boolean))].slice(0, 3),
      recovery: simulate(list, { target: 6 }),
    };
  });
  const rated = subjectStats
    .filter((s) => s.count)
    .sort(
      (a, b) => a.average - b.average || a.name.localeCompare(b.name, "it"),
    );
  const buckets = [
    { label: "Sotto 5", min: 0, max: 5 },
    { label: "Da 5 a meno di 6", min: 5, max: 6 },
    { label: "Da 6 a meno di 8", min: 6, max: 8 },
    { label: "Da 8 a 10", min: 8, max: 11 },
  ].map((b) => ({
    ...b,
    count: grades.filter((g) => g.value >= b.min && g.value < b.max).length,
  }));
  const monthly = new Map();
  for (const g of grades) {
    const k = g.date.slice(0, 7);
    if (!monthly.has(k)) monthly.set(k, []);
    monthly.get(k).push(g);
  }
  const extremes = (bound) =>
    rated.length
      ? rated
          .filter((s) => Math.abs(s.average - bound) < 1e-9)
          .map((s) => s.name)
      : [];
  return {
    count: grades.length,
    average: generalAverage(grades, subjects),
    insufficient: grades.filter((g) => g.value < 6).length,
    severe: grades.filter((g) => g.value < 5).length,
    passed: grades.filter((g) => g.value >= 6).length,
    passRate: grades.length
      ? (grades.filter((g) => g.value >= 6).length / grades.length) * 100
      : null,
    highest: grades.length ? Math.max(...grades.map((g) => g.value)) : null,
    lowest: grades.length ? Math.min(...grades.map((g) => g.value)) : null,
    rated: rated.length,
    unrated: subjects.length - rated.length,
    subjectStats,
    priorities: rated.filter((s) => s.average < 6),
    weakest: extremes(rated[0]?.average),
    strongest: extremes(rated.at(-1)?.average),
    buckets,
    types: ["Scritto", "Orale", "Pratico"].map((type) => ({
      type,
      count: grades.filter((g) => g.type === type).length,
      average: weightedAverage(grades.filter((g) => g.type === type)),
    })),
    monthly: [...monthly]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, list]) => ({
        month,
        count: list.length,
        average: generalAverage(list, subjects),
      })),
  };
}
