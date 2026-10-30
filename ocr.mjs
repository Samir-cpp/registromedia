import {
  parseImportText,
  rowError,
  reconcileReadings,
} from "./import-model.mjs";
export function checkImage(file) {
  if (
    !file ||
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 10000000
  )
    throw Error("Scegli PNG, JPG o WebP fino a 10 MB");
}
export async function loadBitmap(file) {
  checkImage(file);
  const image = await createImageBitmap(file);
  if (
    image.width * image.height > 20000000 ||
    image.width < 100 ||
    image.height < 80
  ) {
    image.close();
    throw Error("Usa uno screenshot nitido tra 100 pixel e 20 megapixel");
  }
  return image;
}
export function prepareCanvas(
  image,
  crop = { top: 0, bottom: 0, left: 0, right: 0 },
) {
  const { top, bottom, left, right } = crop;
  if (
    ![top, bottom, left, right].every(
      (v) => Number.isFinite(v) && v >= 0 && v <= 90,
    ) ||
    top + bottom >= 90 ||
    left + right >= 90
  )
    throw Error("Il ritaglio deve lasciare visibili data e voto");
  const x = (image.width * left) / 100,
    y = (image.height * top) / 100,
    w = image.width * (1 - (left + right) / 100),
    h = image.height * (1 - (top + bottom) / 100);
  const scale = Math.min(
    1.5,
    3000 / Math.max(w, h),
    Math.sqrt(4500000 / (w * h)),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, x, y, w, h, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let total = 0,
    n = 0;
  for (let i = 0; i < pixels.data.length; i += 160) {
    total += (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3;
    n++;
  }
  const invert = total / n < 120;
  for (let i = 0; i < pixels.data.length; i += 4) {
    let g =
      0.299 * pixels.data[i] +
      0.587 * pixels.data[i + 1] +
      0.114 * pixels.data[i + 2];
    if (invert) g = 255 - g;
    g = Math.max(0, Math.min(255, (g - 128) * 1.25 + 128));
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = g;
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}
export async function recognizeScreenshot(
  file,
  { crop, parseOptions, signal, onProgress = () => {} } = {},
) {
  checkImage(file);
  let worker, image, canvas, timer, rejectCancel;
  const abort = () => {
    if (signal?.aborted)
      throw new DOMException("Lettura annullata", "AbortError");
  };
  let timedOut = false;
  const stop = () => {
    worker?.terminate().catch(() => {});
    rejectCancel?.();
  };
  signal?.addEventListener("abort", stop, { once: true });
  try {
    abort();
    onProgress("Preparo il lettore locale…");
    const { default: Tesseract } = await import(
      "./vendor/ocr/tesseract.esm.min.js"
    );
    abort();
    const cancellation = new Promise((_, reject) => {
      rejectCancel = () =>
        reject(new DOMException("Lettura annullata", "AbortError"));
    });
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        stop();
        reject(
          Error(
            "Lettura troppo lunga: ritaglia solo l’elenco dei voti e riprova",
          ),
        );
      }, 90000);
    });
    const job = (async () => {
      worker = await Tesseract.createWorker("ita", 1, {
        workerPath: new URL("./vendor/ocr/worker.min.js", import.meta.url).href,
        corePath: new URL("./vendor/ocr/", import.meta.url).href,
        langPath: new URL("./vendor/ocr/", import.meta.url).href,
        workerBlobURL: false,
        cacheMethod: "none",
        logger: (m) => {
          if (m.status === "recognizing text")
            onProgress(`Leggo data e voto… ${Math.round(m.progress * 100)}%`);
        },
      });
      if (timedOut || signal?.aborted) {
        await worker.terminate();
        throw new DOMException("Lettura annullata", "AbortError");
      }
      abort();
      image = await loadBitmap(file);
      canvas = prepareCanvas(image, crop);
      let best = null;
      const readings = [];
      for (const mode of [6, 11]) {
        abort();
        await worker.setParameters({
          tessedit_pageseg_mode: String(mode),
          preserve_interword_spaces: "1",
        });
        const result = await worker.recognize(canvas);
        abort();
        const text = result.data.text || "",
          rows = parseImportText(text, parseOptions),
          score =
            rows.filter((r) => !rowError(r)).length * 10 +
            rows.filter((r) => r.date && r.value !== "").length * 2 +
            rows.length;
        readings.push(rows);
        if (
          !best ||
          score > best.score ||
          (score === best.score && result.data.confidence > best.confidence)
        )
          best = { text, rows, score, confidence: result.data.confidence };
      }
      best.rows = reconcileReadings(best.rows, readings);
      return best;
    })();
    return await Promise.race([job, timeout, cancellation]);
  } catch (error) {
    if (signal?.aborted)
      throw new DOMException("Lettura annullata", "AbortError");
    if (timedOut)
      throw Error(
        "Lettura troppo lunga: ritaglia solo l’elenco dei voti e riprova",
      );
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", stop);
    image?.close();
    if (canvas) canvas.width = canvas.height = 0;
    await worker?.terminate().catch(() => {});
  }
}
