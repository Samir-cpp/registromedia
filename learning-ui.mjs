import { analyze, simulate } from "./analytics.mjs";
import { parseImportText, rowError, mergeImport } from "./import-model.mjs";
import { recognizeScreenshot, loadBitmap } from "./ocr.mjs";
const $ = (id) => document.getElementById(id),
  fmt = (v) =>
    v === null ? "—" : v.toLocaleString("it-IT", { maximumFractionDigits: 2 });
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
function option(select, text, value) {
  const o = el("option", text);
  o.value = value;
  select.append(o);
}
function metric(parent, label, value, detail) {
  const card = el("div", undefined, "metric-card");
  card.append(el("span", label), el("strong", String(value)));
  if (detail) card.append(el("small", detail));
  parent.append(card);
}
export function installLearning({
  getData,
  getGrades,
  getScope,
  onImport,
  notify,
}) {
  let importRows = [],
    bitmap = null,
    file = null,
    controller = null,
    importBusy = false,
    previewRevision = 0,
    importGeneration = 0;
  function fill(select, blank = false) {
    const old = select.value;
    select.replaceChildren();
    if (blank) option(select, "Tutte le materie", "");
    for (const s of getData().subjects) option(select, s.name, s.id);
    if ([...select.options].some((o) => o.value === old)) select.value = old;
  }
  const scope = () => {
    $("mentor-scope").textContent = getScope();
    $("sim-scope").textContent = getScope();
  };
  function openSimulator(subjectId) {
    fill($("sim-subject"));
    if (subjectId) $("sim-subject").value = subjectId;
    scope();
    $("sim-error").textContent = "";
    renderSimulator();
    $("simulator-dialog").showModal();
  }
  function renderSimulator() {
    try {
      const list = getGrades().filter(
          (g) => g.subjectId === $("sim-subject").value,
        ),
        config = {
          target: Number($("sim-target").value),
          count: Number($("sim-count").value),
          weight: Number($("sim-weight").value),
          value: Number($("sim-value").value),
        },
        s = simulate(list, config);
      $("sim-current").textContent = fmt(s.current);
      $("sim-projected").textContent = fmt(s.projected);
      $("sim-required").textContent =
        s.quarter === null ? "Non basta" : fmt(s.quarter);
      $("sim-explanation").textContent =
        s.quarter === null
          ? `In ${config.count} ${config.count === 1 ? "prova" : "prove"} con questo peso servirebbe una media di ${fmt(s.required)}, oltre il 10. Prova con più verifiche.`
          : `Per arrivare a ${fmt(config.target)} servono ${config.count} ${config.count === 1 ? "voto" : "voti"} da almeno ${fmt(s.quarter)}, ciascuno con peso ${fmt(config.weight)}. Il valore è arrotondato al quarto superiore.`;
      $("sim-note").textContent = list.length
        ? `${list.length} voti attuali. ${s.already ? "L’obiettivo è già raggiunto: il calcolo mostra anche il margine disponibile." : ""}`
        : "Nessun voto nella materia in questo periodo: lo scenario partirà da zero voti, non da una media pari a zero.";
      $("sim-scenarios").replaceChildren();
      for (const count of [1, 2, 3, 5]) {
        const plan = simulate(list, { ...config, count });
        const b = el(
          "button",
          `${count} ${count === 1 ? "prova" : "prove"} · ${plan.quarter === null ? "oltre 10" : fmt(plan.quarter)}`,
          "scenario-button",
        );
        b.type = "button";
        b.onclick = () => {
          $("sim-count").value = count;
          renderSimulator();
        };
        $("sim-scenarios").append(b);
      }
      $("sim-error").textContent = "";
    } catch (e) {
      $("sim-error").textContent = e.message;
    }
  }
  for (const id of [
    "sim-subject",
    "sim-target",
    "sim-count",
    "sim-weight",
    "sim-value",
  ])
    $(id).oninput = renderSimulator;
  for (let q = 1; q <= 40; q++) option($("sim-value"), fmt(q / 4), q / 4);
  $("sim-value").value = 7;
  $("open-simulator").onclick = () => openSimulator();
  function renderMentor() {
    scope();
    const a = analyze(getGrades(), getData().subjects);
    $("mentor-metrics").replaceChildren();
    for (const [label, value, detail] of [
      ["Voti registrati", a.count, "Nel periodo selezionato"],
      ["Voti insufficienti", a.insufficient, `${a.severe} sotto il 5`],
      [
        "Materie da recuperare",
        a.priorities.length,
        `${a.rated} materie con voti`,
      ],
      [
        "Sufficienze",
        a.passRate === null ? "—" : `${fmt(a.passRate)}%`,
        `${a.passed} voti almeno pari a 6`,
      ],
      ["Voto più alto", fmt(a.highest), "Non è la media migliore"],
      ["Voto più basso", fmt(a.lowest), "Non è un giudizio personale"],
    ])
      metric($("mentor-metrics"), label, value, detail);
    $("mentor-priorities").replaceChildren();
    if (!a.priorities.length)
      $("mentor-priorities").append(
        el(
          "p",
          a.count
            ? "Nessuna media sotto il 6 nel periodo. Continua a controllare i risultati."
            : "Aggiungi voti per vedere priorità e piani di recupero.",
          "tiny",
        ),
      );
    for (const s of a.priorities) {
      const card = el("article", undefined, "recovery-card");
      card.append(
        el("h3", s.name),
        el(
          "p",
          `Media ${fmt(s.average)} · ${s.insufficient} voti insufficienti su ${s.count}${s.count === 1 ? " · Dato parziale: un solo voto" : ""}`,
        ),
      );
      const need = s.recovery.quarter;
      card.append(
        el(
          "p",
          need === null
            ? "Una sola prova non basta per arrivare a 6. Confronta più verifiche nel simulatore."
            : `Un prossimo ${fmt(need)} con peso 1 porta la media almeno a 6.`,
          "recovery-plan",
        ),
      );
      card.append(
        el(
          "p",
          s.notes.length
            ? "Da rivedere: " + s.notes.join(" · ")
            : "Rivedi gli errori delle prove sotto il 6; chiedi al docente quali argomenti e criteri contano nella prossima verifica.",
          "tiny",
        ),
      );
      const types = ["Scritto", "Orale", "Pratico"]
        .map((type) => {
          const list = getGrades().filter(
            (g) => g.subjectId === s.id && g.type === type,
          );
          return {
            type,
            count: list.length,
            average: list.length
              ? list.reduce((sum, g) => sum + g.value * g.weight, 0) /
                list.reduce((sum, g) => sum + g.weight, 0)
              : null,
          };
        })
        .filter((t) => t.count)
        .sort((a, b) => a.average - b.average);
      const weak = types[0],
        steps = el("ol", undefined, "recovery-steps");
      if (weak) {
        const advice =
          weak.type === "Scritto"
            ? "Rifai alcuni esercizi simili agli errori, poi riprovali senza guardare la soluzione."
            : weak.type === "Orale"
              ? "Prepara uno schema breve e prova a spiegare gli argomenti ad alta voce senza leggerlo."
              : "Ripeti la procedura completa e annota i passaggi su cui hai bisogno di un chiarimento.";
        steps.append(
          el(
            "li",
            `${weak.type}: media ${fmt(weak.average)} su ${weak.count} prove. ${advice}`,
          ),
        );
      }
      steps.append(
        el(
          "li",
          "Chiedi al docente quali argomenti e quale peso avrà la prossima prova. Aggiorna poi lo scenario con quel peso.",
        ),
      );
      card.append(steps);
      const b = el("button", "Costruisci un piano", "outline");
      b.onclick = () => {
        $("mentor-dialog").close();
        $("sim-target").value = 6;
        openSimulator(s.id);
      };
      card.append(b);
      $("mentor-priorities").append(card);
    }
    $("mentor-extremes").textContent = a.rated
      ? `Media più bassa: ${a.weakest.join(", ")}. Media più alta: ${a.strongest.join(", ")}. ${a.unrated} materie senza voti, escluse dal confronto.`
      : "Non ci sono ancora materie confrontabili.";
    $("mentor-distribution").replaceChildren();
    for (const b of a.buckets) {
      const row = el("div", undefined, "distribution-row"),
        bar = el("progress");
      bar.max = Math.max(1, a.count);
      bar.value = b.count;
      bar.setAttribute("aria-label", `${b.label}: ${b.count} voti`);
      row.append(el("span", b.label), bar, el("b", String(b.count)));
      $("mentor-distribution").append(row);
    }
    $("mentor-subjects").replaceChildren();
    for (const s of a.subjectStats) {
      const row = el("tr");
      for (const v of [
        s.name,
        fmt(s.average),
        s.count,
        s.insufficient,
        s.trend === null
          ? "Dati insufficienti"
          : `${s.trend >= 0 ? "+" : ""}${fmt(s.trend)}`,
      ])
        row.append(el("td", String(v)));
      $("mentor-subjects").append(row);
    }
    $("mentor-types").replaceChildren();
    for (const t of a.types)
      metric(
        $("mentor-types"),
        t.type,
        fmt(t.average),
        `${t.count} voti · media ponderata`,
      );
    $("mentor-months").replaceChildren();
    for (const m of a.monthly) {
      const row = el("div", undefined, "distribution-row"),
        bar = el("progress");
      bar.max = 10;
      bar.value = m.average ?? 0;
      bar.setAttribute("aria-label", `${m.month}: media ${fmt(m.average)}`);
      row.append(el("span", m.month), bar, el("b", fmt(m.average)));
      $("mentor-months").append(row);
    }
    if (!a.monthly.length)
      $("mentor-months").append(
        el("p", "Il confronto mensile comparirà con i primi voti.", "tiny"),
      );
  }
  $("open-mentor").onclick = () => {
    renderMentor();
    $("mentor-dialog").showModal();
  };
  function crop() {
    return Object.fromEntries(
      ["top", "bottom", "left", "right"].map((k) => [
        k,
        Number($("crop-" + k).value),
      ]),
    );
  }
  function preview() {
    if (!bitmap) return;
    const c = $("crop-preview"),
      scale = Math.min(1, 700 / bitmap.width, 380 / bitmap.height);
    c.width = Math.round(bitmap.width * scale);
    c.height = Math.round(bitmap.height * scale);
    const ctx = c.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, c.width, c.height);
    const r = crop(),
      x = (c.width * r.left) / 100,
      y = (c.height * r.top) / 100,
      w = c.width * (1 - (r.left + r.right) / 100),
      h = c.height * (1 - (r.top + r.bottom) / 100);
    ctx.fillStyle = "#0008";
    ctx.fillRect(0, 0, c.width, y);
    ctx.fillRect(0, y + h, c.width, c.height - y - h);
    ctx.fillRect(0, y, x, h);
    ctx.fillRect(x + w, y, c.width - x - w, h);
    ctx.strokeStyle = "#75bbff";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
  }
  for (const k of ["top", "bottom", "left", "right"])
    $("crop-" + k).oninput = () => {
      const opposite = {
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left",
      }[k];
      $("crop-" + k).value = Math.min(
        Number($("crop-" + k).value),
        89 - Number($("crop-" + opposite).value),
      );
      preview();
    };
  function updateBusy() {
    for (const n of document.querySelectorAll(
      "#import-dialog input,#import-dialog select,#import-dialog textarea,#import-dialog button:not([data-close])",
    ))
      n.disabled = importBusy;
    $("import-subject").disabled = importBusy || $("import-multiple").checked;
    validate();
  }
  function resetImport() {
    importGeneration++;
    controller?.abort();
    controller = null;
    bitmap?.close();
    bitmap = null;
    file = null;
    importRows = [];
    previewRevision++;
    importBusy = false;
    $("import-multiple").checked = false;
    updateBusy();
    $("ocr-file").value = "";
    $("ocr-text").value = "";
    $("import-rows").replaceChildren();
    $("import-review").hidden = true;
    $("crop-area").hidden = true;
    $("ocr-status").textContent = "";
    $("ocr-error").textContent = "";
    $("import-reviewed").checked = false;
    $("import-keep-duplicates").checked = false;
    $("ocr-read").disabled = false;
    const c = $("crop-preview");
    c.width = c.height = 0;
  }
  $("import-dialog").addEventListener("close", resetImport);
  $("open-import").onclick = () => {
    resetImport();
    fill($("import-subject"));
    $("import-year").replaceChildren();
    const y =
      Number(getScope().match(/\d{4}/)?.[0]) || new Date().getFullYear();
    for (let n = y + 1; n >= y - 5; n--)
      option($("import-year"), `${n}/${n + 1}`, n);
    $("import-year").value = y;
    $("import-dialog").showModal();
  };
  $("import-multiple").onchange = () => {
    $("import-subject").disabled = $("import-multiple").checked;
  };
  $("ocr-file").onchange = async () => {
    try {
      const revision = ++previewRevision;
      bitmap?.close();
      bitmap = null;
      file = $("ocr-file").files[0];
      if (!file) return;
      const decoded = await loadBitmap(file);
      if (revision !== previewRevision || !$("import-dialog").open) {
        decoded.close();
        return;
      }
      bitmap = decoded;
      for (const k of ["top", "bottom", "left", "right"])
        $("crop-" + k).value = 0;
      $("crop-area").hidden = false;
      preview();
      $("ocr-error").textContent = "";
    } catch (e) {
      file = null;
      bitmap = null;
      $("crop-area").hidden = true;
      $("ocr-error").textContent = e.message;
    }
  };
  function options() {
    const s = getData().subjects.find(
      (s) => s.id === $("import-subject").value,
    );
    return {
      year: Number($("import-year").value),
      subject: $("import-multiple").checked ? "" : s?.name || "",
      subjects: getData().subjects,
      type: $("import-type").value,
    };
  }
  function showRows(rows) {
    importRows = rows.length
      ? rows
      : [
          {
            id: crypto.randomUUID(),
            subject: options().subject,
            value: "",
            date: "",
            weight: 1,
            type: options().type,
            raw: "",
            selected: true,
          },
        ];
    $("import-reviewed").checked = false;
    $("import-review").hidden = false;
    $("import-rows").replaceChildren();
    for (const r of importRows) {
      const card = el("div", undefined, "import-row");
      const head = el("label", undefined, "check-label"),
        check = el("input");
      check.type = "checkbox";
      check.checked = r.selected !== false;
      head.append(check, el("b", "Importa questa riga"));
      check.onchange = () => {
        r.selected = check.checked;
        validate();
      };
      card.append(head);
      const grid = el("div", undefined, "import-fields");
      for (const [key, title, type] of [
        ["subject", "Materia", "text"],
        ["value", "Voto", "number"],
        ["date", "Data", "date"],
        ["weight", "Peso", "number"],
      ]) {
        const label = el("label", title),
          input = el("input");
        input.type = type;
        input.value = r[key];
        input.className = "field-" + key;
        if (key === "value") {
          input.min = 0.25;
          input.max = 10;
          input.step = 0.01;
        }
        if (key === "weight") {
          input.min = 0.01;
          input.max = 10;
          input.step = 0.01;
        }
        if (key === "subject") {
          input.maxLength = 80;
          input.setAttribute("list", "import-subject-names");
        }
        input.oninput = () => {
          r[key] = input.value;
          $("import-reviewed").checked = false;
          validate();
        };
        label.append(input);
        grid.append(label);
      }
      const typeLabel = el("label", "Tipo"),
        typeSelect = el("select");
      for (const t of ["Scritto", "Orale", "Pratico"]) option(typeSelect, t, t);
      typeSelect.value = r.type;
      typeSelect.onchange = () => {
        r.type = typeSelect.value;
        $("import-reviewed").checked = false;
        validate();
      };
      typeLabel.append(typeSelect);
      grid.append(typeLabel);
      card.append(grid);
      if (r.raw) {
        const d = el("details"),
          summary = el("summary", "Testo letto");
        d.append(summary, el("p", r.raw, "tiny"));
        card.append(d);
      }
      if (r.reviewReason) card.append(el("p", r.reviewReason, "error"));
      if (r.inferredYear)
        card.append(
          el(
            "p",
            "Anno ricavato dalla scelta sopra: controlla la data.",
            "tiny",
          ),
        );
      const error = el("p", "", "error");
      error.dataset.rowError = r.id;
      card.append(error);
      $("import-rows").append(card);
    }
    $("import-subject-names").replaceChildren();
    for (const s of getData().subjects)
      option($("import-subject-names"), s.name, s.name);
    validate();
  }
  function validate() {
    const selected = importRows.filter((r) => r.selected);
    for (const r of importRows) {
      const n = [...document.querySelectorAll("[data-row-error]")].find(
        (n) => n.dataset.rowError === r.id,
      );
      if (n) n.textContent = r.selected ? rowError(r) : "Riga esclusa";
    }
    let duplicates = 0;
    if (selected.length && selected.every((r) => !rowError(r)))
      try {
        duplicates = mergeImport(getData(), selected).duplicates;
      } catch {}
    $("import-summary").textContent =
      `${selected.length} righe selezionate${duplicates ? ` · ${duplicates} già presenti o identiche` : ""}`;
    $("import-confirm").disabled =
      !selected.length ||
      selected.some((r) => rowError(r)) ||
      !$("import-reviewed").checked ||
      importBusy;
  }
  $("import-reviewed").onchange = validate;
  $("import-keep-duplicates").onchange = validate;
  $("import-add-row").onclick = () =>
    showRows([
      ...importRows,
      {
        id: crypto.randomUUID(),
        subject: options().subject,
        value: "",
        date: "",
        weight: 1,
        type: options().type,
        raw: "",
        selected: true,
      },
    ]);
  $("ocr-read").onclick = async () => {
    if (importBusy) return;
    const generation = ++importGeneration;
    try {
      if (!file) throw Error("Scegli uno screenshot con data e voto visibili");
      if (!$("import-multiple").checked && !options().subject)
        throw Error("Scegli la materia prima di leggere");
      importBusy = true;
      updateBusy();
      controller = new AbortController();
      const active = controller;
      const result = await recognizeScreenshot(file, {
        crop: crop(),
        parseOptions: options(),
        signal: active.signal,
        onProgress: (t) => {
          if (generation === importGeneration) $("ocr-status").textContent = t;
        },
      });
      if (active.signal.aborted) return;
      showRows(result.rows);
      $("ocr-status").textContent = result.rows.length
        ? `${result.rows.length} righe candidate. Controlla tutti i campi: il riconoscimento può sbagliare.`
        : "Non ho trovato righe affidabili. Prova a ritagliare meglio o compila la riga qui sotto.";
      $("ocr-text").value = result.text;
      $("ocr-error").textContent = "";
    } catch (e) {
      if (generation === importGeneration && e.name !== "AbortError")
        $("ocr-error").textContent = e.message;
    } finally {
      if (generation === importGeneration) {
        importBusy = false;
        updateBusy();
      }
    }
  };
  $("ocr-parse").onclick = () => {
    try {
      showRows(parseImportText($("ocr-text").value, options()));
      $("ocr-error").textContent = "";
    } catch (e) {
      $("ocr-error").textContent = e.message;
    }
  };
  $("import-confirm").onclick = async () => {
    if (importBusy) return;
    try {
      const rows = importRows.filter((r) => r.selected);
      if (!$("import-reviewed").checked || rows.some(rowError))
        throw Error("Controlla le righe selezionate e conferma la revisione");
      importBusy = true;
      validate();
      const merged = mergeImport(getData(), rows, {
        keepDuplicates: $("import-keep-duplicates").checked,
      });
      if (!merged.added)
        throw Error(
          "Nessun voto nuovo: le righe sono già presenti. Se sono prove diverse abilita il mantenimento degli identici.",
        );
      updateBusy();
      await onImport(merged.data, rows);
      $("import-dialog").close();
      notify(
        `${merged.added} voti importati${merged.duplicates ? `; ${merged.duplicates} duplicati esclusi` : ""}`,
      );
    } catch (e) {
      $("ocr-error").textContent = e.message;
    } finally {
      importBusy = false;
      updateBusy();
    }
  };
  return {
    refresh() {
      if ($("mentor-dialog").open) renderMentor();
      if ($("simulator-dialog").open) {
        fill($("sim-subject"));
        renderSimulator();
      }
    },
    clear() {
      resetImport();
      for (const id of [
        "mentor-metrics",
        "mentor-subjects",
        "mentor-priorities",
        "mentor-extremes",
        "mentor-months",
        "mentor-types",
        "mentor-distribution",
        "sim-subject",
        "sim-current",
        "sim-projected",
        "sim-required",
        "sim-note",
        "sim-explanation",
        "sim-scenarios",
      ])
        $(id).replaceChildren();
    },
  };
}
