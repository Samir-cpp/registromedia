/* Reconstruct historical interfaces and record a real, synthetic-data demo. */
const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
// Reuse the system FFmpeg in a writable, task-local Playwright tools cache.
if (process.platform === "linux" && fs.existsSync("/usr/bin/ffmpeg")) {
  process.env.PLAYWRIGHT_BROWSERS_PATH =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    path.join(os.tmpdir(), "votiva-media-tools");
  const meta = JSON.parse(
    fs.readFileSync(
      path.join(
        path.dirname(require.resolve("playwright-core/package.json")),
        "browsers.json",
      ),
      "utf8",
    ),
  );
  const dir = path.join(
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    "ffmpeg-" + meta.browsers.find((b) => b.name === "ffmpeg").revision,
  );
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, "ffmpeg-linux");
  if (!fs.existsSync(target)) fs.symlinkSync("/usr/bin/ffmpeg", target);
}
const { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, ".."),
  OUT = path.join(ROOT, "docs/evolution"),
  TMP = fs.mkdtempSync(path.join(os.tmpdir(), "votiva-history-"));
const names = [
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
const values = [
  [7, 7.5],
  [6.5, 7],
  [8, 8.5],
  [5, 5.5],
  [7.5, 8],
  [8, 8.5],
  [7, 8],
  [5.5, 6],
  [7, 7.5],
  [6, 6.5],
];
const subjects = names.map((name, i) => ({ id: `demo-${i}`, name, target: 7 }));
const grades = subjects.flatMap((s, i) =>
  values[i].map((value, j) => ({
    id: `g-${i}-${j}`,
    subjectId: s.id,
    value,
    weight: 1,
    date: `2026-10-${j ? "21" : "08"}`,
    type: j ? "Orale" : "Scritto",
    note: j ? "Interrogazione — esempio" : "Verifica — esempio",
  })),
);
grades.push({
  id: "next-period",
  subjectId: "demo-9",
  value: 7.5,
  weight: 1,
  date: "2027-02-12",
  type: "Scritto",
  note: "Esempio nel pentamestre",
});
const demo = {
  subjects,
  grades,
  tasks: [
    {
      id: "old-task",
      title: "Ripassare le reti — esempio",
      subjectId: "demo-3",
      date: "2026-11-05",
      done: false,
    },
  ],
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let browser;
const servers = [],
  videos = [];
async function serve(ref, port) {
  let dir = ROOT;
  if (ref) {
    dir = path.join(TMP, ref);
    fs.mkdirSync(dir);
    const archive = execFileSync("git", ["archive", "--format=tar", ref], {
      cwd: ROOT,
      maxBuffer: 30 * 1024 * 1024,
    });
    execFileSync("tar", ["-x", "-C", dir], { input: archive });
  }
  const s = spawn(
    "python",
    ["-m", "http.server", String(port), "--bind", "127.0.0.1"],
    { cwd: dir, stdio: "ignore" },
  );
  servers.push(s);
  for (let i = 0; i < 30; i++) {
    try {
      await fetch(`http://127.0.0.1:${port}`);
      return `http://127.0.0.1:${port}`;
    } catch {
      await sleep(100);
    }
  }
  throw Error("Server not ready");
}
async function context(record = false) {
  return browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    ...(record
      ? {
          recordVideo: {
            dir: path.join(TMP, "raw"),
            size: { width: 1280, height: 800 },
          },
        }
      : {}),
  });
}
async function snap(p, name, options = {}) {
  await p.screenshot({
    path: path.join(OUT, "screenshots", name + ".png"),
    ...options,
  });
}
async function seed(p, url, legacy = false) {
  await p.goto(url);
  await p.locator("#auth-view").waitFor({ state: "visible" });
  await p.evaluate(
    async ({ demo, legacy }) => {
      const v = await import("./vault.mjs");
      const session = await v.register({
        username: "studente.demo",
        name: "Studente demo",
        password: "Solo-demo-non-usare-2026",
      });
      await v.save(
        session,
        legacy
          ? demo
          : {
              ...demo,
              tasks: [],
              settings: { start: "09-01", split: "12-31", end: "06-30" },
            },
      );
    },
    { demo, legacy },
  );
}
async function login(p) {
  await p.locator("#auth-form [name=username]").fill("studente.demo");
  await p
    .locator("#auth-form [name=password]")
    .fill("Solo-demo-non-usare-2026");
  await p.locator("#auth-submit").click();
  await p.locator("#app-view").waitFor({ state: "visible" });
  await p.locator("[data-period=first]").click();
}
async function caption(p, title, subtitle) {
  await p.evaluate(
    ({ title, subtitle }) => {
      let d = document.getElementById("demo-caption");
      if (!d) {
        d = document.createElement("div");
        d.id = "demo-caption";
        d.setAttribute("popover", "manual");
        document.body.append(d);
      }
      d.style.cssText =
        "position:fixed;inset:auto 20px 18px 20px;margin:0;width:calc(100% - 40px);max-width:none;border:1px solid #ffffff35;border-radius:14px;background:#102b25f2;color:white;padding:15px 22px;font:600 20px system-ui;z-index:2147483647;box-shadow:0 8px 35px #0004;pointer-events:none";
      d.replaceChildren();
      const a = document.createElement("div");
      a.textContent = title;
      const b = document.createElement("div");
      b.textContent = subtitle;
      b.style.cssText =
        "font-size:14px;font-weight:400;color:#d4e8d4;margin-top:5px";
      d.append(a, b);
      if (d.matches(":popover-open")) d.hidePopover();
      d.showPopover();
    },
    { title, subtitle },
  );
}
async function clearCaption(p) {
  await p.evaluate(() => document.getElementById("demo-caption")?.remove());
}
async function end(c, p, name) {
  const v = p.video();
  await c.close();
  const file = path.join(OUT, "media", name + ".webm");
  await v.saveAs(file);
  videos.push(file);
  console.log("Recorded", name);
}
async function card(title, kicker, body, name, seconds = 6) {
  const c = await context(true),
    p = await c.newPage();
  await p.setContent(
    `<style>body{margin:0;background:#123e33;color:#eff6e9;font-family:system-ui;display:grid;place-items:center;height:100vh}.card{max-width:1050px;padding:70px}.k{color:#c5ed85;font-size:18px;text-transform:uppercase;letter-spacing:5px}h1{font-size:66px;line-height:1.1;letter-spacing:-3px;margin:22px 0}p{font-size:25px;line-height:1.5;color:#d0e2d1;max-width:950px}.line{width:90px;height:6px;background:#c5ed85;border-radius:5px;animation:grow 1.2s ease both}@keyframes grow{from{width:0}to{width:90px}}</style><div class="card"><div class="k">${kicker}</div><h1>${title}</h1><div class="line"></div><p>${body}</p></div>`,
  );
  await sleep(seconds * 1000);
  await end(c, p, name);
}
(async () => {
  fs.mkdirSync(path.join(TMP, "raw"), { recursive: true });
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const old = await serve("bedd5f8", 3031),
    middle = await serve("f17d702", 3032),
    current = await serve(null, 3033);
  // Screenshots preserve the real interface: no captions, no fabricated application screens.
  for (const [url, prefix, legacy] of [
    [old, "01-registromedia-03", true],
    [middle, "02-registromedia-04", true],
    [current, "03-votiva-101", false],
  ]) {
    const c = await context(),
      p = await c.newPage();
    await seed(p, url, legacy);
    await snap(p, prefix + "-accesso");
    await login(p);
    await snap(p, prefix + "-desktop");
    if (prefix.startsWith("01")) {
      await p.locator("#account-button").click();
      await snap(p, prefix + "-account");
    }
    if (prefix.startsWith("02")) {
      await p.locator("#open-import").click();
      await snap(p, prefix + "-importazione");
      await p.locator("#close-import").click();
      await p.locator("#account-button").click();
      await p.locator("#tools-button").click();
      await snap(p, prefix + "-strumenti");
    }
    if (!legacy) {
      await p.getByRole("button", { name: "Matematica", exact: true }).click();
      await snap(p, "04-votiva-voti-matematica");
      await p.locator("#add-grade").click();
      await p.locator("#grade-form [name=value]").selectOption("7.75");
      await snap(p, "05-votiva-inserimento-voto");
      await p.locator("[data-close=grade-dialog]").click();
      await p.locator("#account-button").click();
      await p.locator("#period-settings").click();
      await snap(p, "06-votiva-periodi");
      await p.locator("[data-close=period-dialog]").click();
      await p.locator("#account-button").click();
      await snap(p, "11-votiva-account");
      await p
        .locator("#password-form")
        .locator("..")
        .locator("summary")
        .click();
      await p.locator("#password-form").scrollIntoViewIfNeeded();
      await snap(p, "12-votiva-password");
      await p.locator("[data-close=account-dialog]").click();
      await p.locator("#subjects-tab").click();
      await p.locator("#theme-select").selectOption("dark");
      await snap(p, "07-votiva-scuro");
      await p.locator("#theme-select").selectOption("light");
      await p.setViewportSize({ width: 390, height: 844 });
      await snap(p, "08-votiva-mobile");
      await snap(p, "09-votiva-mobile-completo", { fullPage: true });
      await p.setViewportSize({ width: 768, height: 1024 });
      await snap(p, "10-votiva-tablet");
    }
    await c.close();
  }
  await card(
    "Da RegistroMedia<br>a Votiva",
    "Il percorso del progetto",
    "Dall’idea di collegarsi ad Argo a un registro personale di voti e medie.<br>Interfacce reali ricostruite dal codice. Tutti i voti sono di esempio.",
    "00-intro",
    7,
  );
  await card(
    "L’idea iniziale",
    "01 / Obiettivo",
    "Leggere i dati del registro Argo, calcolare le medie e usarle su più dispositivi.<br>Le API e la sincronizzazione Argo non sono mai state attivate.",
    "01-idea",
    7,
  );
  {
    const c = await context(true),
      p = await c.newPage();
    await seed(p, old, true);
    await login(p);
    await caption(
      p,
      "RegistroMedia 0.3 · Il registro più ampio",
      "Medie, agenda e simulatore: più strumenti, ma anche più elementi da gestire.",
    );
    await sleep(5500);
    await p.locator("#simulator").scrollIntoViewIfNeeded();
    await sleep(4500);
    await end(c, p, "02-prima-app");
  }
  {
    const c = await context(true),
      p = await c.newPage();
    await seed(p, middle, true);
    await login(p);
    await caption(
      p,
      "RegistroMedia 0.4 · Prima semplificazione",
      "Due schede, temi e accesso mantenuto. Arriva l’importazione locale da screenshot.",
    );
    await sleep(4500);
    await p.locator("#open-import").click();
    await caption(
      p,
      "L’esperimento OCR",
      "Anteprima da correggere e confermare. Funzione poi rimossa per rendere l’app più essenziale.",
    );
    await sleep(5500);
    await end(c, p, "03-ocr");
  }
  await card(
    "Meno funzioni,<br>uno scopo più chiaro",
    "02 / La scelta finale",
    "Rimossi Argo, OCR, agenda e simulatore.<br>Si rinuncia all’automazione per ridurre peso e complessità.",
    "04-scelta",
    7,
  );
  {
    const c = await context(true),
      p = await c.newPage();
    await seed(p, current, false);
    await login(p);
    await caption(
      p,
      "Votiva 1.0.1 · Voti e medie",
      "Nuovo nome e logo. Dieci materie nei nuovi account, con un’interfaccia più essenziale.",
    );
    await sleep(5500);
    await p.getByRole("button", { name: "Matematica", exact: true }).click();
    await caption(
      p,
      "Tutti i voti della materia",
      "Tocca una materia per vedere i risultati del periodo e modificarli.",
    );
    await sleep(5000);
    await p.locator("#add-grade").click();
    await p.locator("#grade-form [name=subjectId]").selectOption("demo-9");
    await p.locator("#grade-form [name=value]").selectOption("7.75");
    await caption(
      p,
      "Voti ogni 0,25",
      "Il selettore va da 0,25 a 10. La data è automatica, ma si può modificare.",
    );
    await sleep(5000);
    await p.locator("[data-close=grade-dialog]").click();
    await p.locator("#subjects-tab").click();
    await p.locator(".insights").scrollIntoViewIfNeeded();
    await caption(
      p,
      "Grafico e percentuale dei voti sufficienti",
      "La media generale è la media delle materie con voti. Nessuna materia vuota vale zero.",
    );
    await sleep(5500);
    await p.locator("#account-button").click();
    await p.locator("#period-settings").click();
    await caption(
      p,
      "Trimestre e pentamestre configurabili",
      "I confini si ripetono ogni anno. I voti esclusi restano nell’anno intero.",
    );
    await sleep(5000);
    await p.locator("[data-close=period-dialog]").click();
    await p.locator("#theme-select").selectOption("dark");
    await p.evaluate(() => scrollTo({ top: 0, behavior: "smooth" }));
    await caption(
      p,
      "Chiaro, scuro o automatico",
      "Rosso sotto il 6, verde dal 6. I colori sono accompagnati da indicazioni testuali.",
    );
    await sleep(5500);
    await p.locator("#theme-select").selectOption("light");
    await p.locator("#account-button").click();
    await caption(
      p,
      "Dati locali e backup cifrati",
      "La password non viene conservata. Non ci sono sincronizzazione o recupero remoto.",
    );
    await sleep(5500);
    await p.locator("[data-close=account-dialog]").click();
    await clearCaption(p);
    await end(c, p, "05-votiva-demo");
  }
  await card(
    "Più leggera.<br>Con compromessi espliciti.",
    "03 / Risultati",
    "APK Android: da 15,6 a 3,04 MB circa (−80,5%).<br>Inserimento manuale, backup da trasferire e sito iPhone ancora da attivare.",
    "06-bilancio",
    8,
  );
  await card(
    "Windows · Android · iPhone",
    "04 / Come usarla",
    "Windows: installer o ZIP. Android: APK di sviluppo.<br>iPhone: sito HTTPS in Safari → Condividi → Aggiungi alla schermata Home.",
    "07-piattaforme",
    8,
  );
  await card(
    "Un prodotto più focalizzato",
    "Stato al 30 ottobre 2026",
    "Test automatici e build superati; collaudo fisico ancora necessario.<br>Il progresso è documentato. L’assenza totale di bug non è dimostrata.",
    "08-finale",
    7,
  );
  fs.writeFileSync(
    path.join(OUT, "capture-manifest.json"),
    JSON.stringify(
      {
        date: "2026-10-30",
        syntheticData: true,
        historicalCommits: ["bedd5f8", "f17d702"],
        currentCommit: "6a459f5",
        screenshots: fs
          .readdirSync(path.join(OUT, "screenshots"))
          .filter((f) => f.endsWith(".png")),
        videos: videos.map((f) => path.basename(f)),
        captureEnvironment:
          "Chromium locale su Linux; viste mobile/tablet simulate",
      },
      null,
      2,
    ),
  );
  console.log("CAPTURE COMPLETE", TMP);
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
    for (const s of servers) s.kill();
  });
