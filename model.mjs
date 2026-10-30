export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function validDate(date) {
  return (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date
  );
}
export function schoolYear(date = today()) {
  if (!validDate(date)) throw Error("Data non valida");
  const y = Number(date.slice(0, 4));
  return Number(date.slice(5, 7)) >= 9 ? y : y - 1;
}
export function periodForDate(date) {
  if (!validDate(date)) throw Error("Data non valida");
  const m = Number(date.slice(5, 7));
  return m >= 9 ? "first" : m <= 6 ? "second" : "summer";
}
export function weightedAverage(grades) {
  return grades.length
    ? grades.reduce((s, g) => s + g.value * g.weight, 0) /
        grades.reduce((s, g) => s + g.weight, 0)
    : null;
}
export function generalAverage(grades, subjects) {
  const values = subjects
    .map((s) => weightedAverage(grades.filter((g) => g.subjectId === s.id)))
    .filter((v) => v !== null);
  return values.length
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;
}
const text = (s, max = 80) =>
  typeof s === "string" && s.trim().length > 0 && s.length <= max;
const id = (s) => typeof s === "string" && /^[a-zA-Z0-9-]{1,64}$/.test(s);
export function validateData(data) {
  if (
    !data ||
    !Array.isArray(data.subjects) ||
    !Array.isArray(data.grades) ||
    !Array.isArray(data.tasks) ||
    data.subjects.length > 100 ||
    data.grades.length > 10000 ||
    data.tasks.length > 2000
  )
    throw Error("Archivio non valido o troppo grande");
  const ids = new Set(),
    names = new Set();
  const subjects = data.subjects.map((s) => {
    if (
      !s ||
      !id(s.id) ||
      ids.has(s.id) ||
      !text(s.name) ||
      !Number.isFinite(s.target) ||
      s.target < 1 ||
      s.target > 10 ||
      names.has(s.name.trim().toLocaleLowerCase("it"))
    )
      throw Error("Materia duplicata o non valida");
    ids.add(s.id);
    names.add(s.name.trim().toLocaleLowerCase("it"));
    return { id: s.id, name: s.name.trim(), target: s.target };
  });
  const gradeIds = new Set();
  const grades = data.grades.map((g) => {
    if (
      !g ||
      !id(g.id) ||
      gradeIds.has(g.id) ||
      !ids.has(g.subjectId) ||
      !Number.isFinite(g.value) ||
      g.value < 0.25 ||
      g.value > 10 ||
      !Number.isFinite(g.weight) ||
      g.weight <= 0 ||
      g.weight > 10 ||
      !validDate(g.date) ||
      periodForDate(g.date) === "summer" ||
      !["Orale", "Scritto", "Pratico"].includes(g.type) ||
      typeof g.note !== "string" ||
      g.note.length > 160
    )
      throw Error(
        "Voto non valido: usa date da settembre a giugno e voti da 0,25 a 10",
      );
    gradeIds.add(g.id);
    return {
      id: g.id,
      subjectId: g.subjectId,
      value: g.value,
      weight: g.weight,
      date: g.date,
      type: g.type,
      note: g.note.trim(),
    };
  });
  // Legacy backup compatibility only; no agenda feature consumes these records.
  const taskIds = new Set();
  const tasks = data.tasks.map((t) => {
    if (
      !t ||
      !id(t.id) ||
      taskIds.has(t.id) ||
      !text(t.title, 200) ||
      !validDate(t.date) ||
      typeof t.done !== "boolean" ||
      (t.subjectId !== "" && !ids.has(t.subjectId))
    )
      throw Error("Impegno non valido");
    taskIds.add(t.id);
    return {
      id: t.id,
      title: t.title.trim(),
      date: t.date,
      done: t.done,
      subjectId: t.subjectId,
    };
  });
  return {
    subjects,
    grades,
    tasks,
    ...(data.settings ? { settings: validateSettings(data.settings) } : {}),
  };
}

export const DEFAULT_SUBJECTS = [
  "Italiano",
  "Storia",
  "Informatica",
  "Sistemi e reti",
  "Inglese",
  "Motoria",
  "Educazione civica",
  "Telecomunicazioni",
  "TPSIT",
  "Matematica",
];
export const defaultSettings = () => ({
  start: "09-01",
  split: "12-31",
  end: "06-30",
});
export function validateSettings(s) {
  const order = (v) => (v >= "09-01" ? v : "~" + v);
  const mmdd = (v) =>
    typeof v === "string" && /^\d{2}-\d{2}$/.test(v) && validDate(`2027-${v}`);
  if (
    !s ||
    ![s.start, s.split, s.end].every(mmdd) ||
    s.start < "09-01" ||
    s.end < "01-01" ||
    s.end > "06-30" ||
    order(s.split) < order(s.start) ||
    order(s.split) >= order(s.end)
  )
    throw Error(
      "Imposta date in ordine: inizio da settembre, fine trimestre prima della fine pentamestre, entro giugno",
    );
  return { start: s.start, split: s.split, end: s.end };
}
export function academicPeriod(date, settings = defaultSettings()) {
  if (!validDate(date)) throw Error("Data non valida");
  const s = validateSettings(settings),
    md = date.slice(5),
    order = (v) => (v >= "09-01" ? v : "~" + v),
    x = order(md);
  if (x >= order(s.start) && x <= order(s.split)) return "first";
  if (x > order(s.split) && x <= order(s.end)) return "second";
  return "outside";
}
