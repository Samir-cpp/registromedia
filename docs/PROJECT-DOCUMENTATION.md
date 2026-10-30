# Votiva — Documentazione del progetto

Documento 2.0 · 30 ottobre 2026 · software 1.0.0. Sostituisce la relazione della versione 0.4.0. Il documento descrive lo stato implementato e distingue i controlli automatici dalle verifiche ancora necessarie.

## 1. Obiettivo e confini

Votiva è un registro personale di voti e medie, utilizzabile offline su Windows, Android e browser moderni. Su iPhone e iPad il sito HTTPS può essere aggiunto alla schermata Home da Safari. Non è pubblicato su App Store. Il cambio nome sostituisce l’identità visibile RegistroMedia; identificatori tecnici e formato dei backup restano stabili.

Argo e ogni collegamento al registro scolastico, screenshot/OCR, agenda e simulatore sono rimossi dall’interfaccia, dalle allowlist native, dai file distribuiti e dalle dipendenze. Non esistono API scolastiche, server per gli account, sincronizzazione automatica o recupero password. Non vengono promessi assenza totale di bug, compatibilità con tutti i dispositivi o valutazioni scolastiche ufficiali.

## 2. Funzionalità e percorsi principali

| Funzione | Comportamento | Percorso |
|---|---|---|
| Account | Registrazione locale con username, nome facoltativo e password da 12 a 128 caratteri | Accedi / Crea account |
| Materie iniziali | Italiano, Storia, Informatica, Sistemi e reti, Inglese, Motoria, Educazione civica, Telecomunicazioni, TPSIT, Matematica | Nuovo account |
| Gestione materie | Aggiunta, rinomina ed eliminazione con conferma; eliminare una materia elimina anche i relativi voti | Scheda Materie |
| Voti | Selettore 0,25–10 ogni 0,25, tipo Orale/Scritto/Pratico, data, peso e nota | Aggiungi voto |
| Dettaglio materia | Voti del periodo selezionato, modifica ed eliminazione | Tocca il nome della materia |
| Periodi | Trimestre, pentamestre e anno; anno scolastico selezionabile | Barra sopra la media |
| Date personalizzate | Inizio trimestre, fine trimestre e fine pentamestre; date ricorrenti ogni anno | Account → Date dei periodi |
| Statistiche | Media generale, materie sotto il 6, grafico delle medie, percentuale di voti sufficienti | Schermata principale |
| Password | Mostra ciò che viene digitato; cambia la password verificando quella attuale | Accesso / Account → Password |
| Backup | Esportazione cifrata e ripristino verificato dalla password del backup | Account o schermata di accesso |
| Aspetto | Chiaro, scuro o tema del sistema | Selettore in alto |

L’accesso resta attivo dopo la chiusura dell’app fino a Esci. I dati di account differenti sono isolati. Le materie predefinite inizializzano solo i nuovi account: i profili esistenti e i backup conservano il proprio elenco.

## 3. Calcoli, soglie e date

La media della materia è Σ(voto × peso) / Σ(pesi). Per esempio, 6 con peso 1 e 9 con peso 2 danno 8. Il peso è maggiore di zero e al massimo 10; il valore predefinito è 1.

La media generale è la media aritmetica delle medie delle materie che hanno almeno un voto nel filtro corrente. Una materia senza voti non vale zero. Per esempio, Matematica con due 6 e Italiano con un 9 danno media generale 7,5, mentre la media di tutti i singoli voti sarebbe 7. L’anno intero usa tutti i voti dell’anno per ogni materia e non la media semplice delle due medie di periodo.

La percentuale è numero di voti ≥ 6 / numero totale di voti × 100, arrotondata all’intero. Non è la percentuale di materie sufficienti né la media convertita in percentuale. Senza voti compare un trattino. Il grafico usa una scala fissa 0–10 e riporta anche il valore numerico per l’accessibilità.

Rosso significa valore effettivo inferiore a 6; verde significa almeno 6. Le medie sono mostrate con una o due cifre decimali, ma i calcoli usano i valori completi. L’arrotondamento visivo può differire dalla soglia effettiva per vecchi voti o pesi non standard.

Le date sono ISO YYYY-MM-DD; la data di oggi è determinata nel fuso Europe/Rome. L’anno scolastico inizia a settembre. Per impostazione iniziale il trimestre va dal 1° settembre al 31 dicembre, il pentamestre dal 1° gennaio al 30 giugno. I confini sono inclusivi; il pentamestre inizia il giorno dopo la fine del trimestre. È possibile terminare il trimestre a gennaio. Le date devono seguire l’ordine scolastico e terminare entro giugno; il 29 febbraio non è ammesso come confine ricorrente. Luglio e agosto non accettano nuovi voti.

Cambiare i confini non elimina voti. I voti precedenti esclusi dai nuovi periodi restano in Anno intero. Le impostazioni dei confini valgono per tutti gli anni del profilo; non esiste un calendario diverso per ciascun anno.

## 4. Interfaccia e adattamento

L’interfaccia usa caratteri di sistema, colori verde bosco e avorio, logo vettoriale V e temi coordinati. Il registro precede il grafico nel flusso mobile; su desktop ampio i due pannelli sono affiancati. Le finestre modali hanno altezza massima e scorrimento interno. Le etichette, lo stato delle schede e i grafici hanno nomi accessibili; i colori hanno anche indicazioni testuali.

Le larghezze controllate automaticamente sono 320, 375, 390, 430, 768, 1024, 1440 e 1920 pixel, con controllo dell’overflow e dei dialoghi. Questi controlli non sostituiscono un audit completo con VoiceOver/TalkBack, zoom, orientamento e dispositivi reali.

## 5. Architettura e componenti

| Componente | Responsabilità | Tecnologie |
|---|---|---|
| index.html / style.css | Struttura, dialoghi e layout responsive | HTML e CSS, senza framework UI |
| app.mjs | Eventi, filtri, rendering sicuro e salvataggi | JavaScript ES modules |
| model.mjs | Validazione, periodi, medie e materie iniziali | Funzioni pure condivise |
| vault.mjs | Account cifrati, sessioni, backup e cambio password | Web Crypto e IndexedDB |
| sw.js / manifest.json | Cache offline e installazione web | Service Worker e PWA |
| desktop/main.cjs | Finestra Windows isolata e protocollo locale | Electron |
| MainActivity.java | WebView locale, selezione e salvataggio backup | AndroidX WebKit |
| server.cjs | Server statico locale per sviluppo | Node.js, nessun endpoint account |
| Workflow GitHub | Verifica, build, checksum, release e Pages | GitHub Actions |

Non servono dipendenze JavaScript a runtime nel frontend. Le dipendenze di sviluppo includono Electron, Electron Builder, Playwright e fake-indexeddb. Le dipendenze e i modelli Tesseract sono eliminati. Windows include ancora il runtime Electron, che resta la parte principale delle dimensioni dell’app.

## 6. Archivio e compatibilità

Le materie hanno id, nome e il campo legacy target. I voti hanno id, subjectId, value, weight, date, type, note. Le impostazioni hanno start, split, end in formato MM-DD. Gli id sono limitati a 64 caratteri alfanumerici/trattini; i nomi materia a 80 caratteri e sono unici ignorando maiuscole e spazi esterni. Le note sono limitate a 160 caratteri. Limiti: 100 materie e 10.000 voti.

Per compatibilità i dati tasks e target dei vecchi backup vengono ancora validati e conservati cifrati, senza alcuna funzione agenda o simulatore. Questa parte del validatore è intenzionale, non un collegamento a codice OCR rimosso. La compatibilità conserva i vecchi voti decimali non multipli di 0,25; il selettore consente di modificarli senza arrotondarli automaticamente.

IndexedDB usa il nome registromedia-private-v3, schema 2, store accounts e deviceSession. Il formato cifrato e dei backup resta versione 3: il numero di schema del database è distinto dalla versione del prodotto. I backup 0.3/0.4 restano leggibili. I dati 0.1/0.2 non cifrati non sono importati automaticamente.

L’applicationId Android, l’appId e protocollo desktop e il percorso dati Windows RegistroMedia sono conservati. Il nome visibile e gli asset diventano Votiva. Gli aggiornamenti Android richiedono comunque una firma compatibile; non disinstallare la vecchia app senza backup.

## 7. Sicurezza e password

Nome, voti, materie e impostazioni sono cifrati con AES-256-GCM, IV casuale di 96 bit e chiave derivata da password tramite PBKDF2-HMAC-SHA256, 600.000 iterazioni, salt di 128 bit. Versione, username e revisione sono associati all’autenticazione del ciphertext. La chiave è non esportabile. Username e metadati tecnici restano visibili.

La password originale non viene conservata. Mostra rende leggibile solo il campo che l’utente sta digitando; non recupera un segreto precedente. Il cambio password verifica la password attuale, genera salt e chiave nuovi, ricifra l’account e aggiorna la revisione. I vecchi backup restano cifrati con la password precedente. Le altre finestre ricevono l’uscita dalla sessione tramite BroadcastChannel quando disponibile.

La sessione persistente conserva sul dispositivo una CryptoKey non esportabile. Chi accede al profilo del dispositivo può aprire l’app fino a Esci. Il blocco del sistema operativo è necessario su dispositivi condivisi. La cifratura non protegge un dispositivo compromesso e non permette il recupero di password dimenticate.

I salvataggi usano revisioni e transazioni IndexedDB: una finestra rimasta indietro non sovrascrive silenziosamente la revisione più recente. Il ripristino di un backup non unisce i dati e richiede conferma prima della sostituzione di un account omonimo.

Electron usa sandbox, contextIsolation e nessun nodeIntegration nel renderer; blocca richieste HTTP/HTTPS, finestre esterne, navigazioni e permessi. Android usa un’origine locale HTTPS con allowlist di file, blocca risorse esterne e non richiede il permesso INTERNET. Le interfacce NativeBackup e NativeAppearance controllano origine e frame principale. Non esistono collegamenti esterni al registro scolastico.

La CSP non consente script inline o eval; non serve più l’eccezione WebAssembly dell’OCR. Il codice inserisce nomi e note come textContent, non HTML interpretato. Non ci sono tracker, pubblicità o invio remoto dei dati dell’account.

## 8. Backup, trasferimento e iPhone

Esporta backup crea JSON cifrato con formato registromedia-encrypted e versione 3. Il file non contiene la password e richiede quella usata alla creazione. La selezione di un file è esplicita; dimensione massima 5 MB. Su Android il salvataggio usa la finestra documenti di sistema e scrive solo il contenuto cifrato.

Per trasferire i dati: esporta, trasferisci il file, scegli Ripristina sul secondo dispositivo, digita la password corretta e conferma l’eventuale sostituzione. I dispositivi non si sincronizzano. Mantieni più backup e non affidarti alla sola memoria del browser: Safari e il sistema operativo possono rimuovere dati locali.

Su iPhone apri il sito in Safari e scegli Condividi → Aggiungi alla schermata Home. Il primo caricamento richiede rete; dopo la cache delle risorse il sito funziona offline. Non si possono installare APK o EXE su iPhone. Non aprire direttamente un file HTML da File perché non offre lo stesso contesto sicuro per cifratura e Service Worker.

Il repository contiene il workflow Publish iPhone and web app. Il proprietario abilita Settings → Pages → Source GitHub Actions, poi avvia il workflow su main. L’URL è quello del deployment riuscito. Non considerare il sito pubblicato solo perché i sorgenti sono presenti nel repository.

## 9. Avvio, build e distribuzione

Node.js 24+: npm ci, npm test, npm start; aprire localhost:3000. npm run dist:web copia solo gli asset pubblici in dist/web, senza account o configurazioni segrete. Per test browser installare Chromium Playwright oppure usare CHROMIUM_PATH. npm run desktop avvia Electron; npm run test:desktop verifica inizializzazione, Web Crypto e IndexedDB.

Windows: Electron Builder genera installer NSIS e archivio ZIP. Android: JDK 21, Gradle 8.11.1, SDK 35, build tools 35.0.0; npm run android:assets ricrea le risorse da zero per non trascinare file OCR vecchi; assembleDebug e lintDebug verificano il progetto.

Il workflow release parte da un tag v che coincide con package.json. Esegue test unitari e browser, poi costruisce Windows e Android. Pubblica release con checksum solo dopo entrambe le build riuscite. Le versioni pubblicate non vengono sovrascritte. Le build restano senza firma Windows commerciale e con firma Android di sviluppo; la gestione di chiavi di produzione stabili è un’attività futura.

## 10. Verifiche e criteri di accettazione

| Ambito | Evidenza automatica | Limite |
|---|---|---|
| Medie e periodi | Test soglie, pesi, date impossibili, confini personalizzati anche a gennaio | Non equivalgono alle valutazioni ufficiali della scuola |
| Archivio | Cifratura, password errata, manomissione, isolamento, conflitti, migrazione e cambio password | Nessun audit indipendente eseguito |
| Interfaccia | Creazione account, voti, filtri, percentuali, temi, sessioni, backup, offline | Chromium automatizzato; iPhone reale da verificare |
| Layout | Otto larghezze, nessun overflow orizzontale, dialoghi nei limiti | Zoom e screen reader manuali da verificare |
| Native | Workflow desktop startup, build Windows e Android con lint | Installazione su dispositivi fisici da verificare |
| Sito | Bundle statico pronto, workflow Pages presente | Serve Pages abilitato e deployment riuscito |

Una build pronta per il download richiede tutti i job release verdi. La presenza di una configurazione di build non equivale al suo completamento: verificare la pagina Actions per la versione specifica.

## 11. Rischi e manutenzione

| Rischio | Gestione prevista | Residuo |
|---|---|---|
| Perdita archivio locale | Backup cifrati periodici e avviso prima della disinstallazione | Nessun recupero remoto |
| Password dimenticata | Conservazione sicura personale | Nessun reset automatico |
| Sessione aperta sul dispositivo | Esci e blocco del sistema | Accesso possibile finché la sessione resta attiva |
| Firma APK diversa | Backup prima di reinstallare | Aggiornamento diretto non sempre possibile |
| Incompatibilità iOS | PWA con asset locali e guida Safari | Test fisico ancora necessario |
| Regressioni future | Test e release nuova senza sovrascrivere asset | Zero bug non dimostrabile |
| Licenza | package.json rimane UNLICENSED | Repository pubblico non significa licenza open source |

Ruoli nella WBS sono responsabilità proposte, non un team o un calendario già assegnato. Costi e tempi non sono inventati. Le verifiche su dispositivi reali, accessibilità assistiva, revisione sicurezza e firme di produzione restano attività distinte dalle funzioni già implementate.
