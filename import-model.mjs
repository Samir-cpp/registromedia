import { validDate, schoolYear, validateData } from "./model.mjs";
export const normalized = (s) =>
  String(s || "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("it")
    .replace(/\s+/g, " ");
const numericDate =
  /\b(?:(\d{4})-(\d{2})-(\d{2})|(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?)\b/;
const months = [
  "gen",
  "feb",
  "mar",
  "apr",
  "mag",
  "giu",
  "lug",
  "ago",
  "set",
  "ott",
  "nov",
  "dic",
];
export function readDate(text, year = schoolYear()) {
  let match = text.match(numericDate),
    y,
    m,
    d,
    inferred = false;
  if (match) {
    if (match[1]) [, y, m, d] = match;
    else {
      d = match[4];
      m = match[5];
      y = match[6];
    }
  } else {
    match = text.match(
      /\b(\d{1,2})\s+(gen\w*|feb\w*|mar\w*|apr\w*|mag\w*|giu\w*|lug\w*|ago\w*|set\w*|ott\w*|nov\w*|dic\w*)(?:\s+(20\d{2}))?\b/i,
    );
    if (!match) return null;
    d = match[1];
    m = months.indexOf(match[2].slice(0, 3).toLowerCase()) + 1;
    y = match[3];
  }
  if (!y) {
    y = Number(m) >= 9 ? year : year + 1;
    inferred = true;
  } else if (String(y).length === 2) y = "20" + y;
  const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { raw: match[0], date: validDate(date) ? date : "", inferred };
}
function votes(text) {
  const result = [];
  for (const m of text.matchAll(
    /(?:^|[\s|:;])(10|[0-9])(?:([.,]\d{1,2})|\s*(½)|([+−–-]))?(?=$|[\s|:;])/g,
  )) {
    const value =
      Number(m[1] + (m[2] || "").replace(",", ".")) + (m[3] ? 0.5 : 0);
    if (value >= 0.25 && value <= 10)
      result.push({ value: m[4] ? "" : value, raw: m[0].trim() });
  }
  return result;
}
export function parseImportText(
  text,
  { year = schoolYear(), subject = "", subjects = [], type = "Scritto" } = {},
) {
  if (typeof text !== "string" || text.length > 50000)
    throw Error("Usa al massimo 50.000 caratteri");
  const known = [...subjects].sort((a, b) => b.name.length - a.name.length);
  const rows = [];
  let current = subject,
    pendingDate = null,
    pendingVote = null;
  const add = (vote, date, raw) => {
    rows.push({
      id: crypto.randomUUID(),
      subject: current,
      value: vote?.value ?? "",
      date: date?.date || "",
      weight: 1,
      type: /orale/i.test(raw)
        ? "Orale"
        : /pratico/i.test(raw)
          ? "Pratico"
          : /scritto/i.test(raw)
            ? "Scritto"
            : type,
      raw: raw.slice(0, 300),
      inferredYear: date?.inferred || false,
      selected: true,
    });
  };
  for (const line of text
    .replace(/(\d)?[½¼¾]/g, (m) => {
      const fraction = m.at(-1),
        whole = m.length > 1 ? m.slice(0, -1) : "0";
      return whole + { "½": ",5", "¼": ",25", "¾": ",75" }[fraction];
    })
    .normalize("NFKC")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)) {
    if (/\b(?:media|assenze|ore totali|percentuale)\b/i.test(line)) continue;
    const date = readDate(line, year);
    let rest = date ? line.replace(date.raw, " ") : line;
    if (!subject) {
      const matched = known.find((s) =>
        normalized(rest).includes(normalized(s.name)),
      );
      if (matched) {
        if (pendingVote) {
          add(pendingVote, pendingDate, pendingVote.raw);
          pendingVote = null;
        }
        current = matched.name;
        rest = rest.replace(
          new RegExp(matched.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
          " ",
        );
      } else if (
        !date &&
        !votes(rest).length &&
        /^[\p{L}][\p{L}\s&-]{1,79}$/u.test(rest) &&
        !/(voti|valutazioni|docente|dettaglio|registro|indietro)/i.test(rest)
      ) {
        current = rest;
      }
    }
    const found = votes(rest.replace(/\bpeso\s*\d+(?:[.,]\d+)?/gi, ""));
    if (date && found.length) {
      if (pendingVote) {
        add(pendingVote, pendingDate, pendingVote.raw);
        pendingVote = null;
      }
      add(found.length === 1 ? found[0] : null, date, line);
      pendingDate = null;
    } else if (date) {
      if (pendingVote) {
        add(pendingVote, date, pendingVote.raw + " " + line);
        pendingVote = null;
        pendingDate = null;
      } else pendingDate = date;
    } else if (found.length) {
      if (pendingDate) {
        add(found.length === 1 ? found[0] : null, pendingDate, line);
        pendingDate = null;
      } else {
        if (pendingVote) add(pendingVote, null, pendingVote.raw);
        pendingVote =
          found.length === 1
            ? { ...found[0], raw: line }
            : { value: "", raw: line };
      }
    }
  }
  if (pendingVote) add(pendingVote, pendingDate, pendingVote.raw);
  if (rows.length > 200)
    throw Error(
      "Troppi risultati: usa screenshot più piccoli (massimo 200 righe)",
    );
  return rows;
}
export function rowError(r) {
  if (!r.subject?.trim() || r.subject.trim().length > 80)
    return "Scegli la materia";
  if (
    r.value === "" ||
    !Number.isFinite(Number(r.value)) ||
    Number(r.value) < 0.25 ||
    Number(r.value) > 10
  )
    return "Controlla il voto";
  if (!validDate(r.date)) return "Completa la data";
  if (["07", "08"].includes(r.date.slice(5, 7)))
    return "Data fuori anno scolastico";
  if (
    !Number.isFinite(Number(r.weight)) ||
    Number(r.weight) <= 0 ||
    Number(r.weight) > 10
  )
    return "Controlla il peso";
  if (!["Scritto", "Orale", "Pratico"].includes(r.type))
    return "Controlla il tipo";
  return "";
}
const fingerprint = (r) =>
  JSON.stringify([
    normalized(r.subject),
    r.date,
    Number(r.value),
    Number(r.weight),
    r.type,
  ]);
export function mergeImport(
  data,
  rows,
  { keepDuplicates = false, id = () => crypto.randomUUID() } = {},
) {
  const next = structuredClone(data),
    byName = new Map(next.subjects.map((s) => [normalized(s.name), s]));
  const names = new Map(next.subjects.map((s) => [s.id, s.name])),
    seen = new Set(
      next.grades.map((g) =>
        fingerprint({ ...g, subject: names.get(g.subjectId) }),
      ),
    );
  let added = 0,
    duplicates = 0,
    subjectsAdded = 0;
  for (const r of rows) {
    if (rowError(r)) throw Error(rowError(r));
    let s = byName.get(normalized(r.subject));
    if (!s) {
      s = { id: id(), name: r.subject.trim(), target: 7 };
      next.subjects.push(s);
      byName.set(normalized(r.subject), s);
      subjectsAdded++;
    }
    const fp = fingerprint(r);
    if (seen.has(fp) && !keepDuplicates) {
      duplicates++;
      continue;
    }
    seen.add(fp);
    next.grades.push({
      id: id(),
      subjectId: s.id,
      value: Number(r.value),
      weight: Number(r.weight),
      date: r.date,
      type: r.type,
      note: "",
    });
    added++;
  }
  return { data: validateData(next), added, duplicates, subjectsAdded };
}

// Disagreement between OCR passes must never silently choose a different grade.
export function reconcileReadings(primary, alternatives) {
  const key = (r) => normalized(r.subject) + "|" + r.date;
  return primary.map((row, index) => {
    const values = new Set(row.value === "" ? [] : [Number(row.value)]);
    for (const other of alternatives) {
      const ours = primary.filter((r) => key(r) === key(row)),
        theirs = other.filter((r) => key(r) === key(row));
      if (ours.length === theirs.length) {
        const rank = primary
          .slice(0, index)
          .filter((r) => key(r) === key(row)).length;
        const r = theirs[rank];
        if (r?.value !== "") values.add(Number(r.value));
      }
    }
    if (values.size > 1)
      return {
        ...row,
        value: "",
        reviewReason: `Letture discordanti (${[...values].join(" / ")}). Controlla lo screenshot e inserisci il voto.`,
      };
    return row;
  });
}
