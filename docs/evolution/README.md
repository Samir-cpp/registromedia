# Da RegistroMedia a Votiva — il percorso completo

Il racconto dell’idea iniziale, delle versioni intermedie e del prodotto finale, con miglioramenti, rinunce, difficoltà e limiti ancora aperti. Stato del prodotto: **Votiva 1.0.1**, al 30 ottobre 2026. Questi materiali documentano il progetto e non cambiano il funzionamento dell’app.

## Apri i materiali

- [Relazione illustrata PDF](Votiva-Storia-del-Progetto.pdf): 17 pagine e 14 immagini.
- [Word modificabile](Votiva-Storia-del-Progetto.docx).
- [Video MP4](media/Votiva-Evoluzione-e-Demo.mp4): circa 1 minuto e 52 secondi, 1280 × 800, con cartelli e didascalie italiane, **senza audio**.
- [Anteprima animata GIF](media/Votiva-Anteprima.gif).
- [Presentazione animata HTML](presentazione.html): 12 diapositive; apri il file nel browser dopo aver estratto l’intera cartella. Frecce per navigare, pulsante per avviare o fermare la riproduzione automatica.
- [18 screenshot PNG](screenshots/) di desktop, modali, telefono e tablet.
- [Testo sorgente della relazione](STORIA-DEL-PROGETTO.md).
- [SRT dei capitoli](media/Votiva-Capitoli.srt) e [metadati del video](media/video-info.json).

PDF e Word contengono immagini statiche: per vedere movimento usa MP4, GIF o HTML. Il video mostra interazioni vere nel frontend del browser, non l’installazione su dispositivi fisici.

## Provenienza e dati dimostrativi

Le interfacce storiche sono rieseguite dai commit `bedd5f8` (0.3) e `f17d702` (0.4). L’interfaccia finale corrisponde a `6a459f5` (1.0.1). Le schermate sono quindi ricostruzioni da codice storico acquisite oggi, non immagini contemporanee ai primi giorni di sviluppo. Le schermate mobile/tablet sono simulazioni di viewport Chromium, non foto di hardware reale.

L’account `studente.demo`, le materie, i voti e gli impegni sono sintetici. Le credenziali nello script servono soltanto a creare un profilo temporaneo di dimostrazione e non sono segreti di un account reale. Nessun database o profilo reale è incluso. L’OCR della versione storica viene illustrato, senza reinstallare o usare i vecchi modelli rimossi.

L’idea Argo non viene rappresentata come un’integrazione API funzionante: le API non sono mai state attivate. Le perdite di funzioni effettive, come OCR e agenda, sono distinte dagli obiettivi mai realizzati e dai limiti rimasti.

## Riproducibilità

Richiede checkout Git con la cronologia indicata, Node.js 24+, dipendenze `npm ci`, Python 3 con i pacchetti in `requirements-media.txt`, Chromium e FFmpeg con encoder VP8/H.264. I renderer PDF usano DejaVu Sans in `/usr/share/fonts/truetype/dejavu`.

```sh
node scripts/capture-evolution.cjs
python scripts/build-evolution-media.py
python scripts/build-evolution-docs.py
```

Su Linux lo script può usare `/usr/bin/chromium` e riutilizza `/usr/bin/ffmpeg` mediante un collegamento in una cache temporanea Playwright scrivibile. `CHROMIUM_PATH` permette di scegliere un altro eseguibile Chromium. Su altri sistemi installa anche il FFmpeg previsto da Playwright con `npx playwright install ffmpeg`.

La cattura usa soltanto server su localhost e account sintetici in contesti browser nuovi. Le registrazioni intermedie `.webm` sono escluse da Git; il montaggio finale MP4, la GIF e i documenti sono conservati. I riferimenti delle catture sono in `capture-manifest.json`. La cartella può essere copiata o compressa mantenendo i percorsi relativi: la presentazione funziona anche senza hosting.
