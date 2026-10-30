# Votiva 2.0

Lo stesso registro personale, con **Mentor**, **simulatore**, **importazione screenshot guidata** e integrazione **Supabase per account online**. Account locali, identificatori delle app e backup precedenti restano compatibili.

## Novità

- **Mentor:** contatori, insufficienze per periodo e materia, materie da recuperare, voti massimi/minimi, distribuzioni, medie per tipo e mese, punti forti e priorità. I piani collegano i voti reali al simulatore, senza giudizi personali o dati inventati.
- **Simulatore:** quanto serve in una o più prove, con pesi, obiettivi e voto ipotizzato; scorciatoie per confrontare piani e segnalazione degli obiettivi impossibili. Non modifica i voti reali.
- **OCR guidato:** istruzioni su quale screenshot caricare, materia scelta prima, ritaglio, due letture locali, anteprima correggibile, revisione obbligatoria e controllo dei duplicati. Se non funziona puoi incollare testo o completare le righe a mano.
- **Online:** integrazione per email verificata, recupero a codice, sincronizzazione e protezione dai conflitti. Richiede un progetto Supabase di tua proprietà: **non è attivo finché non viene configurato**.

Restano dieci materie iniziali modificabili, voti ogni 0,25 fino a 10, media ponderata per materia e media generale delle materie con voti, date dei periodi configurabili, temi chiaro/scuro e backup cifrati. Nessuna API o connessione Argo.

## Installare e usare

Scarica la versione desiderata dalla [pagina release](https://github.com/Samir-cpp/registromedia/releases). Le build 2.0 sono di collaudo, non una certificazione per l’uso commerciale nelle scuole.

**Windows:** installer `*-Setup.exe` o ZIP `*-Portable.zip`, da estrarre completamente prima di avviare `Votiva.exe`. Windows non ha firma commerciale.

**Android:** `*-Android-debug.apk`, Android 9+ con WebView aggiornato. La firma di sviluppo può essere diversa da quella precedente: **esporta un backup cifrato e conserva la password prima di disinstallare o reinstallare**. Le risorse OCR aumentano le dimensioni rispetto alla 1.0.

**iPhone/iPad:** pubblica il sito HTTPS e aprilo in Safari → Condividi → Aggiungi alla schermata Home. Nel repository: Settings → Pages → Source GitHub Actions, poi avvia il workflow **Publish iPhone and web app**. Il workflow prepara anche le risorse OCR. Non c’è un’app App Store.

### Account locale oppure online

Il profilo locale funziona offline e conserva l’accesso fino a Esci. Password non recuperabile; dati AES-GCM e backup cifrati formato 3. Le versioni 0.3/0.4/1.0 rimangono compatibili.

L’account online richiede connessione e progetto configurato. Email verificata, token solo in memoria, nuovo accesso alla riapertura. Dati condivisi tra i tuoi dispositivi, con controllo delle revisioni: un conflitto blocca il salvataggio e richiede aggiornamento dal cloud. Nessuna coda offline o unione automatica. Il server conserva i dati protetti da autenticazione e RLS, **non end-to-end**. Da un profilo locale puoi copiarli online con scelta esplicita; i dati locali restano intatti.

**[Guida completa per attivare Supabase](docs/SUPABASE-SETUP.md)**: SQL, conferma email, template a codice, SMTP, funzione di cancellazione, chiave pubblica e collaudo. Non inserire chiavi amministrative nel client. I pacchetti standard contengono `cloud-config.json` vuoto: per il tuo backend va configurato e ricostruito sito/installer/APK.

## Quale screenshot serve

Apri l’elenco dei singoli voti di una materia. Devono comparire **data e voto**, non soltanto la media. Scegli la materia nell’app e ritaglia menu, dati personali e intestazioni, lasciando date e numeri leggibili. Usa PNG/JPG/WebP, un file fino a 10 MB per volta. Correggi l’anteprima e conferma la revisione: il riconoscimento può sbagliare. Nessuna data viene sostituita automaticamente con oggi.

Le immagini restano sul dispositivo e vengono liberate alla chiusura; il cloud riceve soltanto i voti confermati. Nessuna immagine viene inviata a un servizio AI. Sono verificati tre casi sintetici di lettura reale, non ogni possibile schermata di registro.

## Sviluppo e controlli

Node.js 24+:

```sh
npm ci
npm test
npm start
```

Apri `http://localhost:3000`. Per i test browser:

```sh
npx playwright install --with-deps chromium
npm run test:ui
npm run test:major
npm run test:cloud
```

Se Chromium è già presente: `CHROMIUM_PATH=/usr/bin/chromium`. I test SQL usano PostgreSQL embedded PGlite, senza collegarsi a progetti reali; il test cloud browser usa API simulate e lo dichiara. I test OCR riconoscono immagini reali generate per il test, senza simulare il motore.

```sh
npm run desktop
npm run test:desktop
npm run dist:win
npm run android:assets
npm run dist:web
```

Android: JDK 21, Gradle 8.11.1, SDK 35, build tools 35.0.0; `gradle --project-dir android assembleDebug lintDebug`. Il frontend non richiede framework; OCR e lingua italiana sono preparati da postinstall. Non sono necessarie chiavi di un servizio AI.

## Documentazione

- [Funzioni, formule e limiti della 2.0](docs/MAJOR-2.0.md)
- [Attivazione e collaudo Supabase](docs/SUPABASE-SETUP.md)
- [Retrospettiva illustrata 0.3–1.0, con video](docs/evolution/README.md)
- [Relazione storica 1.0](docs/PROJECT-DOCUMENTATION.md) e [WBS 1.0](docs/WBS.md)

Per la vendita scolastica servono ancora collaudo del backend reale e dei dispositivi, revisione di sicurezza e accessibilità, firme stabili e gestione del servizio/privacy con la scuola. Non sono promessi zero bug, conformità legale o licenza commerciale già definita. Il repository resta `UNLICENSED` finché il titolare non sceglie la licenza.
