# RegistroMedia · Il tuo registro personale

App personale **offline**, in italiano, per Windows e Android, con interfaccia web responsive per iPhone. Non richiede dominio, hosting, account Argo o abbonamenti per usare le app installate.

## Download da GitHub

Apri **[Releases](https://github.com/Samir-cpp/registromedia/releases)** e scegli la versione più recente con file allegati. Per Windows scarica l'installer `.exe` o la ZIP portabile; per Android il file `.apk`. Non serve scaricare il codice sorgente o installare Node.js per usare le app.

Il workflow **[Publish installable apps](https://github.com/Samir-cpp/registromedia/actions/workflows/release.yml)** esegue i test, compila e pubblica i download quando viene caricato un tag `v*` corrispondente alla versione in `package.json`. La release compare solo se tutti i job passano; un tag da solo non dimostra che i download siano pronti.

Le release sono versioni di prova: Windows non è firmato e Android usa una chiave di sviluppo generata dal runner. La firma può cambiare tra build o rispetto all'APK della chat. **Esporta sempre un backup cifrato prima di passare a un altro APK**, perché una firma diversa può richiedere la disinstallazione. Per aggiornamenti stabili servirà configurare una firma release privata in un archivio sicuro; le chiavi locali non sono incluse nel repository.

## Uso personale

1. Windows: estrai **tutto** `dist/RegistroMedia-0.3.0-x64-Portable.zip` e apri `RegistroMedia.exe`. Non serve Node.js.
2. Android: installa `dist/RegistroMedia-0.3.0-Android-debug.apk` sul tuo dispositivo, quando disponibile. È una build di prova firmata con chiave di sviluppo, non una distribuzione Play Store. Richiede Android 9 o successivo e Android System WebView aggiornato.
3. Premi **Crea account**, scegli nome utente e una password di almeno 12 caratteri, aggiungi le materie e poi i voti. Non ci sono dati dimostrativi dentro il tuo account.
4. La data del voto è quella di oggi nel fuso Europe/Rome. Puoi cambiarla per inserire voti precedenti; il periodo viene calcolato da solo.
5. Da **Account e dati → Esporta backup cifrato**, conserva una copia. Per passare i dati all'altro dispositivo, trasferisci quel file e scegli **Hai un backup? Ripristina il tuo account**. Usa la password con cui è stato creato il backup.

**L'account è locale a ciascun dispositivo**, non è un account online condiviso. Il ripristino sostituisce l'account locale con lo stesso nome: non unisce modifiche. Prima di sostituirlo esporta una copia recente. Non c'è sincronizzazione automatica; senza hosting e senza un servizio di trasferimento non si può promettere una copia aggiornata automaticamente su tutti i dispositivi.

## Funzioni

- Materie personalizzabili, con obiettivo di media; modifica o eliminazione con conferma.
- Voti 1–10, anche decimali, peso, tipo orale/scritto/pratico e nota facoltativa.
- Inserimento, modifica ed eliminazione dei voti; data precompilata automaticamente.
- **1° periodo: 1 settembre – 31 dicembre. 2° periodo: 1 gennaio – 30 giugno.** Il periodo dipende dalla data, non dal momento in cui si inserisce il voto. Luglio/agosto non sono periodi valutativi supportati.
- Anni scolastici separati, riepilogo per materia e confronto tra periodi.
- Media ponderata all'interno di ogni materia. La **media generale è la media delle medie delle materie con voti**, attribuendo lo stesso peso a ogni materia. La media di tutti i singoli voti è mostrata separatamente nel riepilogo dei voti. Tutti i calcoli restano indicativi e non sostituiscono lo scrutinio.
- Simulatore del voto necessario per raggiungere un obiettivo, tenendo conto del peso del prossimo voto.
- Agenda di compiti e verifiche, impegni completabili ed evidenza delle scadenze passate.
- Backup cifrati, blocco manuale e dopo 15 minuti di inattività, eliminazione del profilo locale.

## Privacy e conservazione

Il browser/app conserva un archivio IndexedDB con **AES-256-GCM**, IV casuale di 96 bit per ogni salvataggio e chiave derivata dalla password con **PBKDF2-HMAC-SHA-256, 600.000 iterazioni e salt casuale di 128 bit**. La chiave resta in memoria e non è esportabile; nome, voti, materie e agenda sono cifrati. Il nome utente, la versione e i parametri crittografici restano visibili. La password non viene memorizzata né inviata a server. Il backup contiene lo stesso archivio cifrato e richiede la password originale.

**Non esiste recupero password.** Senza password e backup non possiamo recuperare i dati. La cancellazione dei dati del browser o la disinstallazione dell'app può rimuovere definitivamente l'archivio. La cifratura non protegge da un dispositivo compromesso, una password debole o l'accesso mentre il profilo è sbloccato. Non è stata eseguita una revisione di sicurezza indipendente. I backup esportati e le copie su altri dispositivi non sono cancellati eliminando il profilo locale.

Le modifiche concorrenti da due finestre dello stesso archivio sono controllate tramite revisioni e transazioni: una modifica obsoleta è rifiutata, senza sovrascrittura silenziosa. Il vecchio archivio locale della versione 0.1/0.2 viene lasciato intatto, ma non è automaticamente migrato. I vecchi JSON in chiaro non sono backup della versione 0.3.

## Sito per iPhone

Il frontend è responsive e installabile come web app quando servito in HTTPS. Per visitarlo da Safari su iPhone occorre comunque un indirizzo raggiungibile in HTTPS (anche un hosting statico gratuito, senza dominio personale). **Non è stato pubblicato un sito**, né creata un'app iOS nativa. Le app Android e Windows includono invece tutti i file e funzionano senza un sito online.

## Sviluppo e verifiche

Richiede Node.js 24. Il sito non richiede dipendenze runtime.

```sh
npm ci
npm start
npm test
npx playwright install chromium
npm run test:ui
```

Il server statico ascolta su `127.0.0.1:3000`. Non riceve account o voti. Per usare Chromium già installato: `CHROMIUM_PATH=/usr/bin/chromium npm run test:ui`. I test UI creano solo profili di prova e scrivono screenshot e un backup di prova in una nuova cartella temporanea. Per la versione web servono un contesto sicuro (localhost o HTTPS), IndexedDB e Web Crypto. Disabilitare lo storage del browser impedisce l'uso dell'archivio.

## Build Windows

```sh
npm run desktop
npm run dist:win
npm run dist:win:portable
```

La ZIP contiene il programma completo; il nome di build `*-Setup.zip` viene rinominato `*-Portable.zip` negli artifact consegnati. `dist:win` crea l'installer NSIS su Windows; da Linux richiede Wine. Il workflow `.github/workflows/windows.yml` verifica il bootstrap desktop e genera l'installer su un runner Windows. I pacchetti Windows non sono firmati; l'avvio su un PC Windows reale resta da verificare.

## Build Android

Richiede **JDK 17 o 21 completo**, Gradle **8.11.1**, Android SDK Platform **35**, Build Tools **35.0.0**.

```sh
npm run android:assets
gradle --project-dir android assembleDebug
```

L'APK è generato in `android/app/build/outputs/apk/debug/app-debug.apk`. I file web sono copiati come asset: non sono caricati da Internet. Il WebView usa l'origine locale sicura `https://appassets.androidplatform.net`; WebViewAssetLoader intercetta i file dal pacchetto, le altre richieste sono bloccate. L'unica funzione nativa esposta al sito è un canale per esportare **backup già cifrati**, limitato all'origine locale e al frame principale, tramite il selettore file Android. Il selettore di importazione apre solo il file scelto dall'utente. Nessuna autorizzazione per contatti, posizione, fotocamera o archivio generale. Il login Argo viene aperto nel browser esterno.

Per una distribuzione stabile serve una chiave di firma release conservata dal proprietario: la chiave di sviluppo non va usata per il Play Store. La perdita o il cambio di firma può impedire aggiornamenti sullo stesso pacchetto: esporta sempre un backup prima di disinstallare. Nessuna prova su telefono fisico è stata ancora eseguita.

## Argo

Rimane un collegamento al sito ufficiale, con profilo **IIS Cesaris / SG18208**. Il login non importa voti e non collega l'account locale ad Argo. Non vengono raccolte password o sessioni Argo. Per la situazione dell'integrazione vedi [docs/argo-integration.md](docs/argo-integration.md).

## Esito delle verifiche di questa versione

- Sei test automatici passati su calcoli, confini dei periodi, validazione, cifratura, password errata, profili separati, conflitti tra finestre, ripristino e manomissione dei backup.
- Smoke Chromium desktop e mobile 390 px passato per registrazione, inserimento/modifica dei dati di base, data automatica, agenda, esportazione, login e trasferimento del backup tra due contesti browser indipendenti. Nessun errore JavaScript; non è una prova su Safari o su un telefono reale.
- Build Android `assembleDebug` e `lintDebug` completate. Zero errori lint; resta il warning informativo sull'abilitazione JavaScript, necessaria al frontend locale. Le risorse sono limitate al pacchetto, con CSP e nessun HTML utente inserito nel DOM. Firma APK v2 verificata.
- ZIP Windows verificata, risorse confrontate con i sorgenti testati. Avvio su Windows reale ancora da collaudare.
- Nessun account personale, password o voto reale dell'utente è stato creato o importato durante i test. Nessun sito pubblicato e nessuna app inviata agli store.

La chiave di firma **di sviluppo** dell'APK è conservata fuori dal checkout in `/workspace/.registromedia-private/android-debug.keystore`. Per mantenere la stessa firma nei rebuild di questo ambiente impostare `REGISTROMEDIA_DEBUG_KEYSTORE` a quel percorso. Non versionare o distribuire la chiave; la sua perdita può richiedere una reinstallazione, quindi esportare i dati prima degli aggiornamenti.
