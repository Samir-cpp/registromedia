# Collegamento ad Argo: stato e condizioni per la sincronizzazione

## Cosa funziona nella versione 0.4.0

Il pulsante “Apri il login ufficiale Argo” apre `https://www.portaleargo.it/famiglia/` in una nuova scheda o, su Windows, nel browser di sistema. Il collegamento è pubblicato nelle pagine ufficiali consultate il 27 ottobre 2026:

- https://argofamiglia.it/
- https://argofamiglia.it/accesso/
- https://argofamiglia.it/faq/

Il profilo scuola IIS Cesaris / SG18208 è locale. Non viene inviato nel collegamento. L'utente inserisce il codice sul sito ufficiale quando richiesto.

Il login avviene su Argo e non torna a RegistroMedia. Non significa che l'app sia collegata: non esistono callback di autenticazione, cookie condivisi, token di sessione importati, richieste a API Argo o raccolta di credenziali. Il pulsante di sincronizzazione è disabilitato con una spiegazione esplicita.

La pagina ufficiale Argo di destinazione è stata individuata dai collegamenti sul sito didUP, ma la sua apertura dal cloud è bloccata dal proxy (403). Non è stato eseguito un login reale. Le pagine pubbliche consultate non hanno fornito una specifica API per app terze: ciò non dimostra che nessuna integrazione sia disponibile.

## Protezioni implementate e relativi limiti

- Link web con `noopener`, `noreferrer` e `referrerpolicy=no-referrer`; nessun voto, identificativo personale o segreto nel suo URL.
- Windows: solo l'URL HTTPS esatto è ammesso a `shell.openExternal`. Altri host, percorsi, schemi, query e frammenti sono rifiutati. Nessuna API shell esposta al renderer.
- Nessuna pagina di login incorporata, iframe o webview, e nessuna lettura o iniezione di cookie Argo.
- Electron mantiene sandbox, isolamento del contesto e Node.js disattivato nel renderer. Le richieste HTTP(S) dal suo browser interno sono bloccate; il login esterno è separato.
- Il server web distribuisce solo file esplicitamente consentiti. Header contro framing, invio del referrer e uso di fotocamera/microfono/geolocalizzazione; CSP che limita script e connessioni all'origine e blocca invii di form.
- Nessun analytics, tracker o caricamento remoto del contenuto del registro. I dati del registro personale vengono conservati in IndexedDB, cifrati con la password del profilo locale.

Nella versione 0.3 i dati personali e i backup sono cifrati con AES-GCM e PBKDF2; il nome utente resta visibile. La password non viene salvata. Per mantenere l’accesso viene conservata sul dispositivo una CryptoKey non esportabile fino a Esci. La cifratura non protegge da un dispositivo compromesso o da una sessione già sbloccata. Non c'è recupero password. La cancellazione del profilo non cancella backup o copie su altri dispositivi. Le app Windows/Android sono offline e la versione web richiede HTTPS; il sito non è pubblicato. La build Windows non è firmata; l'APK di prova usa una firma di sviluppo. Nessuna prova su dispositivi fisici è stata ancora eseguita. Vedi README.md per i dettagli.

I test dimostrano proprietà specifiche, non l'assenza assoluta di vulnerabilità. Il progetto non è affiliato ad Argo o alla scuola e non offre una garanzia legale o una certificazione di conformità.

## Prerequisiti mancanti per le API

Prima di attivare la sincronizzazione servono:

1. Documentazione ufficiale delle API accessibili alle app terze, relativi termini e autorizzazione/registrazione dell'app quando richiesta. Il solo possesso di un account didUP e del codice scuola non stabilisce l'autorizzazione a integrare endpoint privati.
2. Un flusso di autorizzazione supportato da Argo. Se viene offerto OAuth/OIDC, usare il browser esterno, Authorization Code con PKCE, `state` e, per OIDC, `nonce`, callback registrate e controllate. Non inventare URL di autorizzazione o parametri sulla base della pagina di login.
3. Ambiti minimi di sola lettura per i dati necessari e verifiche che la sessione possa accedere solo allo studente autorizzato. Non scaricare dati di compagni o informazioni non necessarie.
4. Una gestione verificata dei token e della loro revoca: niente token negli URL, log o localStorage; per il web, sessione backend con cookie Secure/HttpOnly/SameSite e protezione CSRF; per Windows, custodia sicura del sistema operativo se prevista dall'integrazione approvata.
5. HTTPS, limitazione delle richieste, timeout, gestione di scadenza/revoca, logout e cancellazione dei dati; mappatura verificata dei periodi e dei pesi dei voti.
6. Verifica degli obblighi privacy applicabili prima di una pubblicazione destinata ad altri utenti, in particolare se vengono trattati dati di minori o introdotta una conservazione lato server.

Finché questi punti non sono verificati, non inserire password nell'app, non esportare cookie o token da Argo, non usare scraping del login e non aggirare limitazioni, CORS o controlli del servizio. L'alternativa disponibile resta l'inserimento manuale o l'importazione del formato RegistroMedia.

## Validazione eseguita

Sei test Node, compresi i rifiuti di destinazioni esterne alterate. Smoke test Chromium desktop/mobile: il click apre l'URL previsto senza `window.opener` e senza header Referer (destinazione simulata nel test, nessun login reale), nessun campo per password Argo, sincronizzazione assente, header di sicurezza e blocco dei file non pubblici. Gli altri flussi dei voti restano funzionanti. La gestione `shell.openExternal` su un PC Windows reale resta da collaudare.
