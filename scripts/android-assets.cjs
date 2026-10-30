const fs = require("node:fs");
const path = require("node:path");
const dest = path.join(__dirname, "../android/app/src/main/assets");
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const name of [
  "index.html",
  "style.css",
  "app.mjs",
  "analytics.mjs",
  "learning-ui.mjs",
  "ocr.mjs",
  "import-model.mjs",
  "cloud.mjs",
  "cloud-config.json",

  "model.mjs",
  "vault.mjs",
  "manifest.json",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "theme.js",
])
  fs.copyFileSync(path.join(__dirname, "..", name), path.join(dest, name));
console.log("Risorse offline Android aggiornate");

fs.cpSync(
  path.join(__dirname, "../vendor/ocr"),
  path.join(dest, "vendor/ocr"),
  { recursive: true },
);
