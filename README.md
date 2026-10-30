# RegistroMedia

Registro personale offline per Windows, Android e web. Materie, voti e medie in una schermata semplice, senza hosting o account Argo.

**[Scarica le app dalle Releases](https://github.com/Samir-cpp/registromedia/releases)**. Windows: installer `.exe` oppure ZIP portabile da estrarre tutta. Android: APK di prova per Android 9+, con WebView aggiornato. Non serve Node.js per usare le app.

## Uso

1. Crea un account locale o accedi. Resterai collegato finché scegli **Account → Esci**; non devi rifare il login a ogni apertura. Usa un dispositivo personale.
2. Aggiungi le materie, poi i voti. La data è quella di oggi in Europe/Rome; puoi modificarla per voti precedenti. Tipo, peso e note sono facoltativi.
3. Il primo periodo comprende **settembre–dicembre**, il secondo **gennaio–giugno**. Il periodo dipende dalla data del voto. Luglio/agosto non sono supportati come periodi valutativi.
4. La media per materia è ponderata per il peso dei voti. La media generale è la media delle materie con voti: ogni materia conta allo stesso modo. Rosso significa media sotto il 6, verde dal 6 in su; i calcoli non sostituiscono lo scrutinio.
5. Seleziona tema **Chiaro**, **Scuro** o **Automatico**. Agenda, obiettivi e simulatore sono sotto Account → Agenda e simulatore, fuori dalla schermata principale. I dati dell'agenda precedente sono preservati.

## Importa voti e materie

Apri **Importa voti e materie** e scegli fino a 5 screenshot PNG/JPG/WebP (10 MB ciascuno) oppure incolla il testo. Per un elenco senza voti scegli “Solo nomi delle materie”.

Il lettore OCR Tesseract funziona sul dispositivo, con motore e lingua italiana inclusi nelle app. Non servono chiavi API né servizi AI esterni. Le immagini e il testo OCR non sono salvati nell'account. Nel sito web i file OCR vengono scaricati solo dal sito stesso al primo utilizzo e sono memorizzati per l'uso successivo offline; le app installate includono già tutto.

**Controlla l'anteprima prima di confermare.** Puoi cambiare materia, voto, data, tipo e peso, deselezionare o rimuovere righe. Nessuna modifica viene salvata prima della conferma; tutte le righe selezionate devono essere valide. Se manca la data, non viene inventata né sostituita con oggi. Per date senza anno, scegli l'anno scolastico prima della lettura. I segni 6+/6− non vengono convertiti arbitrariamente. I voti con stessa materia, data, valore, tipo e peso già presenti vengono saltati: eventuali valutazioni legittimamente identiche vanno aggiunte a mano.

Qualità e disposizione dello screenshot incidono sul riconoscimento: nessuna garanzia di lettura corretta per tutti i layout Argo. Scegli immagini nitide contenenti materia, voto e data. Il lettore riconosce testo italiano e numeri; non PDF o accesso diretto al registro. L'anteprima va sempre corretta se il testo è ambiguo. Il pulsante Argo nelle impostazioni apre solo il sito ufficiale, senza acquisire password o cookie.

## Account, dati e backup

L'account è locale al dispositivo. Esporta da **Account → Esporta backup cifrato** e importa quel file sull'altro dispositivo con **Ripristina un backup**. Il ripristino sostituisce l'account omonimo, non unisce i dati. I backup versione 3 delle release 0.3 sono compatibili. Non c'è sincronizzazione automatica né recupero password.

I dati sono cifrati in IndexedDB con AES-256-GCM, IV casuale da 96 bit e PBKDF2-HMAC-SHA-256 (600.000 iterazioni, salt casuale da 128 bit). Il nome utente e i parametri crittografici restano visibili; password e dati non vengono trasmessi. Per l'accesso persistente viene conservata in IndexedDB una **CryptoKey non esportabile**: chi usa il tuo profilo del dispositivo può aprire il registro finché non premi Esci. Esci rimuove quella chiave salvata e chiude le altre finestre dell'app; il backup richiede sempre la password. La cifratura non protegge da un dispositivo compromesso o da chi ha già accesso al profilo sbloccato. Nessuna revisione di sicurezza indipendente.

La migrazione IndexedDB aggiunge lo spazio per la sessione senza cancellare gli account esistenti. Le modifiche concorrenti tra finestre sono controllate da revisioni; una scrittura obsoleta viene rifiutata. I vecchi dati in localStorage delle versioni 0.1/0.2 rimangono intatti ma non sono migrati automaticamente. Disinstallare l'app o cancellare i dati del browser può eliminare l'archivio: conserva password e backup prima degli aggiornamenti.

## Sviluppo

Node.js 24:

```sh
npm ci
npm start
npm test
npx playwright install chromium
npm run test:ui
```

Il server statico usa `127.0.0.1:3000`; non riceve credenziali, immagini o voti. Servono Web Crypto e IndexedDB. Per il browser Chromium già presente: `CHROMIUM_PATH=/usr/bin/chromium npm run test:ui`.

`npm ci` prepara `vendor/ocr` da pacchetti bloccati nel lockfile (Tesseract.js 6.0.1, core e lingua italiana). Non vengono scaricati modelli da CDN all'avvio del lettore. CSP consente worker locali e compilazione WASM, senza `unsafe-eval` JavaScript. Le licenze OCR sono incluse nel pacchetto. Le risorse generate non vanno versionate: rigenerare con `npm run ocr:assets`.

## Build

- Windows: `npm run desktop`, `npm run dist:win` (NSIS) o `npm run dist:win:portable` (ZIP). NSIS su Linux richiede Wine. Non è presente una firma digitale Windows.
- Android: JDK 17/21 completo, Gradle 8.11.1, SDK 35 e Build Tools 35.0.0; `npm run android:assets`, poi `gradle --project-dir android assembleDebug lintDebug`. Le risorse OCR sono copiate nell'APK; WebViewAssetLoader serve solo i file inclusi nell'app, bloccando richieste remote. Import immagini/JSON tramite selettore file e due canali nativi limitati all'origine locale: esportazione di backup già cifrati e applicazione del tema. Nessun accesso generale a foto, contatti o posizione. Backup di sistema Android disabilitati.
- Il workflow **Publish installable apps** su tag `v*` verifica il codice e il vero OCR su uno screenshot sintetico, compila le app e pubblica una prerelease solo se tutti i job passano. Il tag deve corrispondere a `package.json`. Le chiavi private non vanno versionate.

Gli APK di sviluppo del runner possono avere una firma diversa a ogni build, impedendo un aggiornamento diretto. **Esporta prima un backup**; se serve disinstallare la copia precedente, ripristinalo dopo l'installazione. Per aggiornamenti stabili è necessaria una chiave di firma release privata e conservata in modo sicuro; non è stata configurata.

Il frontend è responsive per iPhone; per usarlo da Safari serve un indirizzo HTTPS raggiungibile. Non è stato pubblicato un sito né creata un'app iOS nativa.

## Verifica

Test Node per medie, date, parser, duplicati, cifratura, accesso persistente, Esci, migrazione degli account e ripristino di backup. Smoke Chromium desktop/mobile con OCR reale locale su screenshot sintetico, correzione delle date mancanti, conferma esplicita, riavvio del browser senza login, logout tra finestre, temi, colori e uso offline. Nessun dato reale dello studente usato nei test. Le prove nel browser e le build non sostituiscono il collaudo su telefoni e PC reali.

## Documentazione di progetto

- [Relazione completa e WBS — PDF](docs/documents/RegistroMedia-Documentazione-Completa.pdf)
- [Versione Word modificabile](docs/documents/RegistroMedia-Documentazione-Completa.docx)
- [WBS leggibile su GitHub](docs/WBS.md) e [dizionario WBS per Excel — CSV](docs/wbs.csv)
- [Sorgente della relazione](docs/PROJECT-DOCUMENTATION.md)

La relazione descrive la baseline 0.4.0, con funzioni, formule, architettura, dati, OCR, sicurezza, installazione, verifiche e limiti. La WBS contiene 44 pacchetti con stati distinti tra realizzato, da validare e pianificato; non inventa costi o scadenze. Per rigenerare PDF/Word: installare i requisiti di `docs/requirements-docs.txt` e usare `python3 scripts/build-project-docs.py`. L'esportatore usa i font DejaVu in `/usr/share/fonts/truetype/dejavu`, disponibili nell'ambiente di generazione; adattare il percorso su altri sistemi.
