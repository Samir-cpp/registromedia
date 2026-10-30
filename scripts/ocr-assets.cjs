const fs = require("node:fs");
const path = require("node:path");
const dest = path.join(__dirname, "../vendor/ocr");
fs.mkdirSync(dest, { recursive: true });
for (const file of [
  "tesseract.esm.min.js",
  "worker.min.js",
  "tesseract.min.js.LICENSE.txt",
  "worker.min.js.LICENSE.txt",
])
  fs.copyFileSync(
    path.join(__dirname, "../node_modules/tesseract.js/dist", file),
    path.join(dest, file),
  );
for (const file of [
  "tesseract-core-lstm.wasm.js",
  "tesseract-core-lstm.wasm",
  "tesseract-core-simd-lstm.wasm.js",
  "tesseract-core-simd-lstm.wasm",
  "LICENSE",
])
  fs.copyFileSync(
    path.join(__dirname, "../node_modules/tesseract.js-core", file),
    path.join(dest, file === "LICENSE" ? "CORE-LICENSE.txt" : file),
  );
fs.copyFileSync(
  path.join(
    __dirname,
    "../node_modules/@tesseract.js-data/ita/4.0.0/ita.traineddata.gz",
  ),
  path.join(dest, "ita.traineddata.gz"),
);
fs.writeFileSync(
  path.join(dest, "NOTICE.txt"),
  "OCR locale: Tesseract.js 6.0.1 (Apache-2.0), tesseract.js-core (Apache-2.0), dati ita dal progetto tessdata (Apache-2.0). Nessun invio di immagini a server. https://github.com/naptha/tesseract.js https://github.com/tesseract-ocr/tessdata\n",
);
console.log(
  "OCR locale preparato: motore e lingua italiana inclusi nel pacchetto",
);
