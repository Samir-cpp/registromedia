const fs = require("node:fs");
const path = require("node:path");
const files = [
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
  "theme.js",
  "sw.js",
  "manifest.json",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
];
const dest = path.join(__dirname, "../dist/web");
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const file of files)
  fs.copyFileSync(path.join(__dirname, "..", file), path.join(dest, file));
console.log("Sito statico pronto in dist/web");

fs.cpSync(
  path.join(__dirname, "../vendor/ocr"),
  path.join(dest, "vendor/ocr"),
  { recursive: true },
);
