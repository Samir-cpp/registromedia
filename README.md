# Votiva

Voti e medie, senza distrazioni. App personale offline per Windows e Android, sito installabile dalla schermata Home di iPhone. Nuova identità di RegistroMedia, versione **1.0.0**.

## Cosa trovi

- Dieci materie iniziali: Italiano, Storia, Informatica, Sistemi e reti, Inglese, Motoria, Educazione civica, Telecomunicazioni, TPSIT e Matematica. Puoi aggiungerle, rinominarle o eliminarle.
- Voti selezionabili ogni 0,25: da 0,25 fino a 10. Data di oggi automatica, tipo, peso e nota facoltativa.
- Media ponderata per materia, media generale delle materie con voti, grafico e percentuale dei voti sufficienti.
- Trimestre, pentamestre e anno intero. Date configurabili da Account → Date dei periodi; si ripetono ogni anno. La fine del trimestre può essere anche a gennaio.
- Tutti i voti di una materia con un tocco sul suo nome; modifica ed eliminazione.
- Rosso sotto il 6, verde dal 6, con indicazioni testuali; tema chiaro, scuro o automatico.
- Account locale cifrato, accesso mantenuto fino a Esci, backup cifrati e cambio password.

Argo, riconoscimento screenshot, agenda e simulatore sono stati rimossi, insieme alle rispettive dipendenze e percorsi di accesso. Non ci sono API scolastiche, tracker o pubblicità.

## Installazione

Le nuove build sono pubblicate nella [pagina delle release](https://github.com/Samir-cpp/registromedia/releases). Controlla che la versione sia **v1.0.0**: i download 0.4 appartengono alla versione precedente.

**Windows:** esegui `Votiva-1.0.0-x64-Setup.exe` oppure estrai tutto `Votiva-1.0.0-x64-Portable.zip` e apri `Votiva.exe`. La build non ha certificato di firma commerciale.

**Android:** installa `Votiva-1.0.0-Android-debug.apk`, Android 9 o successivo con System WebView aggiornato. L’APK usa una firma di sviluppo: se non è compatibile con la vecchia firma, esporta un backup e conserva la password **prima di disinstallare**. Non cancellare i dati dell’app senza backup.

**iPhone / iPad:** apri il sito pubblicato in Safari → Condividi → Aggiungi alla schermata Home. Primo accesso online; poi l’app funziona offline, anche dopo aver chiuso Safari. APK ed EXE non si installano su iOS. Il sito deve usare HTTPS, non basta aprire `index.html` da File.

### Pubblicare il sito gratuitamente su GitHub Pages

Il proprietario del repository può fare questa configurazione una sola volta:

1. Repository → **Settings → Pages → Source: GitHub Actions**.
2. **Actions → Publish iPhone and web app → Run workflow**, ramo `main`.
3. Apri l’indirizzo mostrato dal job di deploy, normalmente `https://samir-cpp.github.io/registromedia/`.
4. Ripeti il workflow quando vuoi aggiornare il sito.

L’indirizzo è utilizzabile solo dopo il deploy riuscito. Pages serve esclusivamente i file dell’app: materie, password e voti restano nel browser. Pubblicare il sito non sincronizza gli account. Il bundle statico può anche essere ospitato da qualsiasi server HTTPS.

## Dati e password

L’account esiste sul dispositivo, non su un server. Username visibile; nome, voti, materie e impostazioni cifrati con AES-256-GCM e PBKDF2-SHA256 (600.000 iterazioni). Nessuna password salvata o inviata. **Mostra password** rende visibile solo quello che stai digitando; l’app non può recuperare la password originale. Account → Password permette di cambiarla verificando quella attuale.

La chiave non esportabile salvata in IndexedDB mantiene l’accesso. Chi può usare il tuo profilo del dispositivo può aprire Votiva fino a **Esci**. Non c’è recupero password. Usa un dispositivo personale protetto dal blocco schermo.

Per trasferire i voti: **Account → Esporta backup cifrato**; sull’altro dispositivo **Ripristina backup** e password del backup. Il ripristino sostituisce, non unisce. I backup precedenti al cambio password richiedono ancora la vecchia password. Safari può eliminare dati del sito: salva periodicamente un backup in File/iCloud Drive.

I backup cifrati formato 3 di RegistroMedia 0.3/0.4 restano compatibili; le materie esistenti non vengono sostituite da quelle predefinite. I vecchi dati agenda e obiettivi sono conservati solo per compatibilità dell’archivio, senza funzioni o schermate per usarli. I dati non cifrati 0.1/0.2 non sono migrati automaticamente. Identificatori Android, database, protocollo desktop e cartella Windows `RegistroMedia` restano stabili per conservare l’archivio dopo il cambio nome.

## Sviluppo e verifiche

Richiede Node.js 24+.

```sh
npm ci
npm test
npm start
```

Apri `http://localhost:3000`. Per i test browser:

```sh
npx playwright install --with-deps chromium
npm run test:ui
```

Se Chromium è già installato puoi impostare `CHROMIUM_PATH=/usr/bin/chromium`. Il test copre account, voti, medie, percentuali, date, cambio password, backup, sessioni, temi, offline e larghezze 320–1920 px. I test unitari coprono anche migrazione e conflitti di scrittura. I controlli automatici non garantiscono assenza di bug o compatibilità con ogni dispositivo fisico.

```sh
npm run desktop
npm run test:desktop
npm run dist:win
npm run android:assets
npm run dist:web
```

Windows: build su Windows con Electron Builder. Android: JDK 21, Gradle 8.11.1, SDK 35 e build tools 35.0.0; `gradle --project-dir android assembleDebug lintDebug`. Il sito statico è in `dist/web`, senza dipendenze o dati personali. I workflow separati costruiscono Windows e Android; il workflow release verifica il tag, esegue i test e pubblica tutti gli asset con checksum solo se entrambe le build passano.

Non servono Tesseract, modelli OCR, account Argo o chiavi API. Electron resta la componente principale dello spazio occupato su Windows: la rimozione dei modelli alleggerisce l’app, ma non elimina il runtime desktop.

## Documentazione

- [Relazione tecnica e funzionale](docs/PROJECT-DOCUMENTATION.md)
- [WBS](docs/WBS.md) e [CSV per Excel](docs/wbs.csv)
- [Documento PDF](docs/documents/RegistroMedia-Documentazione-Completa.pdf) e [Word modificabile](docs/documents/RegistroMedia-Documentazione-Completa.docx)

Per rigenerare PDF e Word: `python -m pip install -r docs/requirements-docs.txt`, poi `python scripts/build-project-docs.py`. Il renderer usa DejaVu Sans in `/usr/share/fonts/truetype/dejavu`; su altri sistemi adatta il percorso nel renderer.
