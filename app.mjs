import {
  today,
  schoolYear,
  periodForDate,
  weightedAverage,
  generalAverage,
  academicPeriod,
  defaultSettings,
} from "./model.mjs";
import * as vault from "./vault.mjs";
const $ = (id) => document.getElementById(id),
  number = (v) =>
    v === null
      ? "—"
      : v.toLocaleString("it-IT", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 2,
        });
const dateLabel = (d) =>
  new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" }).format(
    new Date(d + "T12:00:00"),
  );
const node = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
let session = null,
  data = { subjects: [], grades: [], tasks: [] },
  period = periodForDate(today()) === "summer" ? "all" : periodForDate(today()),
  year = schoolYear(),
  registerMode = false,
  editingSubject = null,
  editingGrade = null,
  pendingBackup = null,
  busy = false,
  pendingSignOut = false,
  timer;
function notify(text) {
  clearTimeout(timer);
  $("message").textContent = text;
  $("message").hidden = false;
  timer = setTimeout(() => ($("message").hidden = true), 7000);
}
function showAuth() {
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  session = null;
  data = { subjects: [], grades: [], tasks: [] };
  pendingBackup = null;
  $("app-view").hidden = true;
  $("auth-view").hidden = false;
  $("loading-view").hidden = true;
  for (const id of [
    "auth-form",
    "subject-form",
    "grade-form",
    "delete-account-form",
    "restore-form",
  ])
    $(id).reset();
  for (const id of ["grade-list", "subject-list", "history-subject"])
    $(id).replaceChildren();
  for (const id of ["account-details", "account-name", "greeting"])
    $(id).textContent = "";
  $("average").textContent = "—";
  document.querySelectorAll("[data-password]").forEach((b) => {
    const input = document.querySelector(b.dataset.password);
    input.type = "password";
    b.textContent =
      b.dataset.password === "#login-password" ? "Mostra password" : "Mostra";
    b.setAttribute("aria-pressed", "false");
  });
  authMode(false);
}

async function openSession(value, remember = true) {
  if (remember) await vault.rememberSession(value);
  session = value;
  data = value.data;
  const current = academicPeriod(today(), data.settings);
  period = current === "outside" ? "all" : current;
  year = schoolYear();
  $("auth-form").reset();
  $("auth-view").hidden = true;
  $("app-view").hidden = false;
  $("loading-view").hidden = true;
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  render();
}
function authMode(register) {
  registerMode = register;
  $("name-label").hidden = !register;
  $("confirm-label").hidden = !register;
  $("auth-form").elements.name.required = false;
  $("auth-form").elements.confirm.required = register;
  $("auth-form").elements.password.autocomplete = register
    ? "new-password"
    : "current-password";
  $("login-tab").classList.toggle("selected", !register);
  $("register-tab").classList.toggle("selected", register);
  $("auth-heading").textContent = register
    ? "Crea il tuo registro."
    : "Il tuo registro, solo tuo.";
  $("auth-description").textContent = register
    ? "Bastano un nome utente e una password."
    : "Accedi alle tue materie e ai tuoi voti.";
  $("auth-submit").textContent = register ? "Crea account" : "Accedi";
  $("recovery-note").hidden = false;
  $("auth-error").textContent = "";
}
$("login-tab").onclick = () => authMode(false);
$("register-tab").onclick = () => authMode(true);
$("auth-form").onsubmit = async (event) => {
  event.preventDefault();
  const b = Object.fromEntries(new FormData(event.target));
  $("auth-error").textContent = "";
  if (registerMode && b.password !== b.confirm) {
    $("auth-error").textContent = "Le password non coincidono";
    return;
  }
  $("auth-submit").disabled = true;
  try {
    await openSession(
      registerMode
        ? await vault.register({
            ...b,
            name: b.name.trim() || b.username.trim(),
          })
        : await vault.login(b.username, b.password),
    );
  } catch (error) {
    $("auth-error").textContent = error.message;
  } finally {
    $("auth-submit").disabled = false;
  }
};
function chosenGrades() {
  return data.grades.filter(
    (g) =>
      schoolYear(g.date) === year &&
      (period === "all" || academicPeriod(g.date, data.settings) === period),
  );
}
function subjectName(id) {
  return data.subjects.find((s) => s.id === id)?.name || "Generale";
}
function populateSelect(select, empty = false) {
  const old = select.value;
  select.replaceChildren();
  if (empty) {
    const o = node("option", empty === true ? "Tutte le materie" : empty);
    o.value = "";
    select.append(o);
  }
  for (const s of data.subjects) {
    const o = node("option", s.name);
    o.value = s.id;
    select.append(o);
  }
  if ([...select.options].some((o) => o.value === old)) select.value = old;
}
function emptyState(parent, title, description, buttonText, action) {
  const box = node("div", undefined, "empty-state");
  box.append(
    node("div", "✦", "empty-icon"),
    node("h3", title),
    node("p", description),
  );
  if (buttonText) {
    const b = node("button", buttonText, "primary");
    b.onclick = action;
    box.append(b);
  }
  parent.append(box);
}
async function mutate(change) {
  if (busy) throw Error("Attendi il salvataggio in corso");
  if (!session) throw Error("Accedi al tuo account");
  busy = true;
  $("sync-status").textContent = "Salvataggio…";
  try {
    const next = structuredClone(data);
    change(next);
    data = await vault.save(session, next);
    render();
  } catch (error) {
    $("sync-status").textContent = "Modifica non salvata";
    throw error;
  } finally {
    busy = false;
    if (pendingSignOut) {
      pendingSignOut = false;
      showAuth();
    }
  }
}
function render() {
  if (!session) return;
  const list = chosenGrades(),
    stats = data.subjects
      .map((s) => ({ ...s, grades: list.filter((g) => g.subjectId === s.id) }))
      .map((s) => ({ ...s, average: weightedAverage(s.grades) }));
  $("greeting").textContent = `Ciao ${session.name}.`;
  $("account-name").textContent = session.name;
  $("avatar").textContent = session.name.slice(0, 1).toUpperCase();
  $("account-details").textContent =
    `${session.name} · @${session.username} · Accesso mantenuto su questo dispositivo`;
  $("sync-status").textContent = "Salvato sul dispositivo";
  const years = [
    ...new Set([schoolYear(), ...data.grades.map((g) => schoolYear(g.date))]),
  ].sort((a, b) => b - a);
  if (!years.includes(year)) year = schoolYear();
  $("year-select").replaceChildren(
    ...years.map((y) => {
      const o = node("option", `${y}/${String(y + 1).slice(2)}`);
      o.value = y;
      return o;
    }),
  );
  $("year-select").value = year;
  document.querySelectorAll("[data-period]").forEach((b) => {
    b.classList.toggle("selected", b.dataset.period === period);
    b.setAttribute("aria-pressed", String(b.dataset.period === period));
  });
  const overall = generalAverage(list, data.subjects);
  $("average").textContent = number(overall);
  $("average").className =
    overall === null ? "" : overall < 6 ? "negative" : "positive";
  $("average-status").textContent =
    overall === null
      ? "Nessun voto"
      : overall < 6
        ? "Insufficiente"
        : "Sufficiente";
  $("average-status").className =
    "status-tag " +
    (overall === null ? "" : overall < 6 ? "negative" : "positive");
  $("count").textContent = list.length;
  $("subject-count").textContent = data.subjects.length;
  $("recover").textContent = stats.filter(
    (s) => s.average !== null && s.average < 6,
  ).length;
  $("subject-list").replaceChildren();
  if (!stats.length) {
    emptyState(
      $("subject-list"),
      "Inizia dalle tue materie",
      "Aggiungi una materia per iniziare.",
      "Aggiungi materia",
      () => openSubject(),
    );
  }
  for (const s of stats) {
    const row = node("div", undefined, "subject"),
      body = node("div"),
      score = node("div", undefined, "subject-score");
    body.append(
      node("div", s.name, "subject-name"),
      node(
        "div",
        `${s.grades.length} ${s.grades.length === 1 ? "voto" : "voti"}`,
        "subject-meta",
      ),
    );
    score.append(
      node(
        "b",
        number(s.average),
        s.average === null ? "" : s.average < 6 ? "negative" : "positive",
      ),
      node(
        "small",
        s.average === null
          ? "Nessun voto"
          : s.average < 6
            ? "Insufficiente"
            : "Sufficiente",
      ),
    );
    const edit = node("button", "Modifica", "subject-edit");
    edit.setAttribute("aria-label", `Modifica ${s.name}`);
    edit.onclick = () => openSubject(s);
    const view = node("button", s.name, "subject-link");
    view.onclick = () => {
      $("history-subject").value = s.id;
      switchView("grades");
      renderHistory();
    };
    body.firstChild.replaceWith(view);
    row.append(body, score, edit);
    $("subject-list").append(row);
  }
  populateSelect($("history-subject"), true);
  renderHistory();
  renderChart(stats, list);
}

function renderHistory() {
  const list = chosenGrades()
    .filter(
      (g) =>
        !$("history-subject").value ||
        g.subjectId === $("history-subject").value,
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  $("grade-list").replaceChildren();
  if (!list.length) {
    $("grade-list").append(
      node("p", "Qui compariranno i voti del periodo selezionato.", "tiny"),
    );
    return;
  }
  for (const g of list) {
    const row = node("div", undefined, "grade-row"),
      body = node("div");
    body.append(
      node("div", subjectName(g.subjectId), "grade-title"),
      node("div", g.note || `${g.type} · peso ${g.weight}`, "grade-note"),
    );
    const date = node("div", dateLabel(g.date), "grade-date");
    date.append(
      node(
        "small",
        academicPeriod(g.date, data.settings) === "first"
          ? "Trimestre"
          : academicPeriod(g.date, data.settings) === "second"
            ? "Pentamestre"
            : "Fuori periodo",
      ),
    );
    const edit = node("button", "Modifica", "subject-edit");
    edit.setAttribute(
      "aria-label",
      `Modifica voto ${g.value} di ${subjectName(g.subjectId)}`,
    );
    edit.onclick = () => openGrade(g);
    row.append(
      node("div", number(g.value), `grade-mark${g.value < 6 ? " low" : ""}`),
      body,
      date,
      node("div", g.type, "grade-type"),
      edit,
    );
    $("grade-list").append(row);
  }
}
function openSubject(subject) {
  editingSubject = subject?.id || null;
  const form = $("subject-form");
  form.reset();
  form.querySelector(".form-error").textContent = "";
  form.elements.name.value = subject?.name || "";
  $("subject-dialog-title").textContent = subject
    ? "La tua materia"
    : "Una nuova materia";
  $("delete-subject").hidden = !subject;
  $("subject-dialog").showModal();
}
function gradeDate() {
  const d = $("grade-form").elements.date.value;
  try {
    $("grade-auto-date").textContent =
      academicPeriod(d, data.settings) === "first"
        ? "Trimestre"
        : academicPeriod(d, data.settings) === "second"
          ? "Pentamestre"
          : "Fuori dai periodi impostati";
  } catch {
    $("grade-auto-date").textContent = "Scegli una data";
  }
}
function openGrade(grade) {
  if (!data.subjects.length) {
    openSubject();
    notify("Aggiungi prima una materia, poi potrai inserire un voto.");
    return;
  }
  editingGrade = grade?.id || null;
  const form = $("grade-form");
  const picker = form.elements.value;
  picker.replaceChildren(node("option", "Scegli voto"));
  picker.firstChild.value = "";
  for (let i = 1; i <= 40; i++) {
    const o = node("option", number(i / 4));
    o.value = i / 4;
    picker.append(o);
  }
  if (
    grade &&
    !Array.from(picker.options).some((o) => Number(o.value) === grade.value)
  ) {
    const o = node("option", number(grade.value));
    o.value = grade.value;
    picker.append(o);
  }
  form.reset();
  form.querySelector("details").open = false;
  form.querySelector(".form-error").textContent = "";
  populateSelect(form.elements.subjectId);
  for (const [k, v] of Object.entries(
    grade || { date: today(), weight: 1, note: "" },
  ))
    if (form.elements[k]) form.elements[k].value = v;
  $("grade-dialog-title").textContent = grade
    ? "Il tuo risultato"
    : "Un nuovo risultato";
  $("delete-grade").hidden = !grade;
  gradeDate();
  $("grade-dialog").showModal();
}
async function submit(form, action, dialog) {
  const button = form.querySelector("[type=submit]");
  button.disabled = true;
  form.querySelector(".form-error").textContent = "";
  try {
    await action();
    $(dialog).close();
  } catch (error) {
    form.querySelector(".form-error").textContent = error.message;
  } finally {
    button.disabled = false;
  }
}
$("subject-form").onsubmit = (e) => {
  e.preventDefault();
  const b = Object.fromEntries(new FormData(e.target));
  submit(
    e.target,
    () =>
      mutate((d) => {
        const s = {
          id: editingSubject || crypto.randomUUID(),
          name: b.name,
          target: 7,
        };
        if (editingSubject)
          d.subjects[d.subjects.findIndex((x) => x.id === editingSubject)] = s;
        else d.subjects.push(s);
      }),
    "subject-dialog",
  );
};
$("grade-form").onsubmit = (e) => {
  e.preventDefault();
  const b = Object.fromEntries(new FormData(e.target));
  submit(
    e.target,
    async () => {
      if (academicPeriod(b.date, data.settings) === "outside")
        throw Error("La data è fuori dai periodi impostati");
      await mutate((d) => {
        const g = {
          ...b,
          id: editingGrade || crypto.randomUUID(),
          value: Number(b.value),
          weight: Number(b.weight),
        };
        if (editingGrade)
          d.grades[d.grades.findIndex((x) => x.id === editingGrade)] = g;
        else d.grades.push(g);
      });
      year = schoolYear(b.date);
      period = academicPeriod(b.date, data.settings);
      render();
    },
    "grade-dialog",
  );
};
$("delete-subject").onclick = () => {
  if (!confirm("Eliminare la materia e tutti i suoi voti?")) return;
  submit(
    $("subject-form"),
    () =>
      mutate((d) => {
        d.subjects = d.subjects.filter((s) => s.id !== editingSubject);
        d.grades = d.grades.filter((g) => g.subjectId !== editingSubject);
        d.tasks = d.tasks.filter((t) => t.subjectId !== editingSubject);
      }),
    "subject-dialog",
  );
};
$("delete-grade").onclick = () => {
  if (confirm("Eliminare questo voto?"))
    submit(
      $("grade-form"),
      () =>
        mutate((d) => {
          d.grades = d.grades.filter((g) => g.id !== editingGrade);
        }),
      "grade-dialog",
    );
};
$("add-subject").onclick = () => openSubject();
$("add-grade").onclick = () => openGrade();
$("grade-form").elements.date.onchange = gradeDate;
$("history-subject").onchange = renderHistory;
$("year-select").onchange = () => {
  year = Number($("year-select").value);
  render();
};
document.querySelectorAll("[data-period]").forEach(
  (b) =>
    (b.onclick = () => {
      period = b.dataset.period;
      render();
    }),
);
document
  .querySelectorAll("[data-close]")
  .forEach((b) => (b.onclick = () => $(b.dataset.close).close()));
$("account-button").onclick = () => $("account-dialog").showModal();
$("logout").onclick = signOut;
$("export").onclick = async () => {
  try {
    const backup = await vault.exportBackup(session),
      content = JSON.stringify(backup);
    if (window.NativeBackup?.postMessage) {
      window.NativeBackup.postMessage(content);
      return;
    }
    if (navigator.userAgent.includes("RegistroMediaAndroid"))
      throw Error(
        "Aggiorna Android System WebView per esportare i backup dall’app",
      );
    const url = URL.createObjectURL(
      new Blob([content], { type: "application/json" }),
    );
    const a = node("a");
    a.href = url;
    a.download = `registromedia-${today()}-cifrato.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    notify("Backup cifrato pronto. Per aprirlo serve la tua password.");
  } catch (e) {
    notify(e.message);
  }
};
$("restore-auth").onclick = $("restore-account").onclick = () =>
  $("restore-file").click();
$("restore-file").onchange = async (e) => {
  try {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5000000) throw Error("Backup troppo grande (massimo 5 MB)");
    const backup = JSON.parse(await file.text());
    if (backup.format !== "registromedia-encrypted" || backup.version !== 3)
      throw Error("Seleziona un backup cifrato RegistroMedia versione 3");
    pendingBackup = backup;
    $("restore-form").reset();
    $("restore-form").querySelector(".form-error").textContent = "";
    $("restore-info").textContent =
      "Inserisci la password usata per creare questo backup. Non sarà inviata a nessuno.";
    $("restore-dialog").showModal();
  } catch (e) {
    notify(e.message);
  } finally {
    e.target.value = "";
  }
};
$("restore-form").onsubmit = (e) => {
  e.preventDefault();
  submit(
    e.target,
    async () => {
      const b = Object.fromEntries(new FormData(e.target));
      const restored = await vault.restoreBackup(
        pendingBackup,
        b.password,
        b.replace === "on",
      );
      pendingBackup = null;
      await openSession(restored);
      $("restore-form").reset();
      notify("Account ripristinato su questo dispositivo.");
    },
    "restore-dialog",
  );
};
$("delete-account-form").onsubmit = (e) => {
  e.preventDefault();
  if (!confirm("Eliminare definitivamente l’account da questo dispositivo?"))
    return;
  submit(
    e.target,
    async () => {
      await vault.deleteAccount(session, e.target.elements.password.value);
      channel?.postMessage("logout");
      showAuth();
      notify("Account eliminato da questo dispositivo.");
    },
    "account-dialog",
  );
};
const channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("registromedia-session")
    : null;
async function signOut() {
  if (busy) {
    notify("Attendi il salvataggio prima di uscire.");
    return;
  }
  try {
    await vault.logout();
    channel?.postMessage("logout");
    showAuth();
  } catch (e) {
    notify(e.message);
  }
}
if (channel)
  channel.onmessage = (e) => {
    if (e.data === "logout") {
      if (busy) pendingSignOut = true;
      else showAuth();
    }
  };
function switchView(view) {
  const subjects = view === "subjects";
  $("subjects-view").hidden = !subjects;
  $("grades-view").hidden = subjects;
  $("subjects-tab").classList.toggle("active", subjects);
  $("grades-tab").classList.toggle("active", !subjects);
  $("subjects-tab").setAttribute("aria-selected", String(subjects));
  $("grades-tab").setAttribute("aria-selected", String(!subjects));
  $("add-subject").hidden = !subjects;
}
$("subjects-tab").onclick = () => switchView("subjects");
$("grades-tab").onclick = () => switchView("grades");
const themeSelect = $("theme-select");
try {
  themeSelect.value = localStorage.getItem("rm-theme") || "system";
} catch {}
function applyTheme() {
  const mode = themeSelect.value;
  document.documentElement.dataset.theme =
    mode === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : mode;
  window.NativeAppearance?.postMessage(document.documentElement.dataset.theme);
  try {
    localStorage.setItem("rm-theme", mode);
  } catch {}
}
themeSelect.onchange = applyTheme;
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (themeSelect.value === "system") applyTheme();
});
(async () => {
  try {
    const remembered = await vault.loadRememberedSession();
    if (remembered) await openSession(remembered, false);
    else showAuth();
  } catch (e) {
    showAuth();
    notify(e.message);
  }
})();
if (
  "serviceWorker" in navigator &&
  ["http:", "https:"].includes(location.protocol) &&
  location.hostname !== "appassets.androidplatform.net"
)
  navigator.serviceWorker.register("./sw.js").catch(() => {});

function renderChart(stats, list) {
  const passes = list.filter((g) => g.value >= 6).length;
  $("pass-rate").textContent = list.length
    ? Math.round((passes / list.length) * 100) + "%"
    : "—";
  $("pass-detail").textContent = `${passes} su ${list.length} voti sufficienti`;
  $("chart").replaceChildren();
  for (const s of stats) {
    const row = node("div", undefined, "chart-row"),
      label = node("span", s.name),
      track = node("div", undefined, "chart-track"),
      bar = node("progress");
    bar.max = 10;
    bar.value = s.average ?? 0;
    bar.className = s.average !== null && s.average < 6 ? "low" : "high";
    bar.setAttribute("aria-label", `${s.name}: ${number(s.average)} su 10`);
    track.append(bar);
    row.append(label, track, node("b", number(s.average)));
    $("chart").append(row);
  }
}
$("period-settings").onclick = () => {
  const s = data.settings || defaultSettings(),
    form = $("period-form");
  for (const key of ["start", "split", "end"])
    form.elements[key].value =
      `${s[key] < "09-01" ? year + 1 : year}-${s[key]}`;
  form.querySelector(".form-error").textContent = "";
  $("account-dialog").close();
  $("period-dialog").showModal();
};
$("period-form").onsubmit = (e) => {
  e.preventDefault();
  const b = Object.fromEntries(new FormData(e.target));
  submit(
    e.target,
    () =>
      mutate((d) => {
        if (
          b.start.slice(0, 4) !== String(year) ||
          b.split.slice(0, 4) !==
            String(b.split.slice(5) < "09-01" ? year + 1 : year) ||
          b.end.slice(0, 4) !== String(year + 1)
        )
          throw Error("Usa le date dell’anno scolastico selezionato");
        d.settings = {
          start: b.start.slice(5),
          split: b.split.slice(5),
          end: b.end.slice(5),
        };
      }),
    "period-dialog",
  );
};
$("password-form").onsubmit = (e) => {
  e.preventDefault();
  submit(
    e.target,
    async () => {
      if (busy) throw Error("Attendi il salvataggio");
      busy = true;
      try {
        const b = Object.fromEntries(new FormData(e.target));
        if (b.newPassword !== b.confirm)
          throw Error("Le password non coincidono");
        await vault.changePassword(session, b.currentPassword, b.newPassword);
        await vault.rememberSession(session);
        channel?.postMessage("logout");
        e.target.reset();
        notify(
          "Password aggiornata. I backup precedenti usano ancora la vecchia password.",
        );
      } finally {
        busy = false;
      }
    },
    "account-dialog",
  );
};
document.querySelectorAll("[data-password]").forEach(
  (button) =>
    (button.onclick = () => {
      const input = document.querySelector(button.dataset.password);
      input.type = input.type === "password" ? "text" : "password";
      button.textContent = input.type === "password" ? "Mostra" : "Nascondi";
      button.setAttribute("aria-pressed", String(input.type === "text"));
    }),
);
