# RegistroMedia
## Documentazione completa del progetto

Versione di riferimento: 0.4.0. Documento 1.0, 30 ottobre 2026. Lingua: italiano. Stato del prodotto: prerelease personale offline. La WBS in appendice e il CSV associato completano questa relazione.

Questo documento descrive il comportamento del codice della versione indicata. Le funzioni implementate, le verifiche automatiche e le attività future sono distinte: una build riuscita non equivale a un collaudo su tutti i dispositivi o a una certificazione di sicurezza. Non sono attribuiti costi, scadenze o risultati di prove non eseguite.

## Indice

1. Scopo e contesto
2. Ambito e requisiti
3. Esperienza utente
4. Regole scolastiche e formule
5. Importazione da screenshot
6. Architettura e componenti
7. Modello dei dati
8. Sicurezza, privacy e sessione
9. Backup, migrazione e continuità
10. Installazione e sviluppo
11. Build e distribuzione
12. Verifica e criteri di accettazione
13. Rischi, limiti e sviluppi futuri
14. Organizzazione del progetto
15. Glossario e fonti interne
Appendice: Work Breakdown Structure.

## 1. Scopo e contesto

RegistroMedia è un registro personale per uno studente che vuole conoscere le proprie medie senza calcolarle a mano. Permette di aggiungere materie e voti, controllare i risultati nei due periodi scolastici e recuperare valutazioni precedenti da screenshot o testo.

La scelta principale è il funzionamento offline: Windows e Android includono i file necessari e non richiedono un hosting, un dominio o un server che conservi i voti. L'utente mantiene i dati sul proprio dispositivo. Per portarli altrove usa un backup cifrato, non una sincronizzazione automatica.

Il progetto è indipendente da Argo e dalla scuola. Nell'interfaccia è presente un collegamento al login ufficiale didUP Famiglia, con riferimento all'IIS Cesaris e al codice SG18208 forniti dall'utente. Il collegamento non concede accesso alle API e non importa automaticamente i dati del registro scolastico.

Il risultato consegnato è una prerelease: sorgenti su GitHub, installer e archivio portabile Windows, APK Android di sviluppo. Esiste un frontend web responsive; non è stato pubblicato un sito per iPhone e non è stata realizzata un'app iOS nativa.

## 2. Ambito e requisiti

### 2.1 Funzioni comprese

| ID | Requisito | Realizzazione |
| --- | --- | --- |
| RF-01 | Creare e riaprire un account personale | Profilo locale protetto da password, archivio IndexedDB |
| RF-02 | Restare collegati fino a Esci | Chiave locale non esportabile per riaprire il profilo |
| RF-03 | Gestire materie | Creazione, modifica, obiettivo ed eliminazione |
| RF-04 | Gestire voti | Inserimento, modifica, eliminazione, tipo, peso e nota |
| RF-05 | Assegnare data e periodo | Oggi in Europe/Rome per i nuovi voti; periodo derivato dalla data |
| RF-06 | Calcolare le medie | Media ponderata per materia; media generale delle materie |
| RF-07 | Importare dati precedenti | OCR locale e testo incollato, con revisione obbligatoria |
| RF-08 | Rendere chiari i risultati | Rosso sotto 6, verde da 6; testo sufficiente/insufficiente |
| RF-09 | Cambiare tema | Chiaro, scuro o automatico, con preferenza salvata |
| RF-10 | Conservare e trasferire i dati | Backup cifrato, ripristino e controllo dei conflitti |
| RF-11 | Offrire strumenti secondari | Agenda, obiettivi, simulatore e confronto dei periodi |
| RF-12 | Usare più piattaforme | Applicazioni Windows/Android e frontend web condiviso |

### 2.2 Requisiti non funzionali

L'interfaccia principale deve restare ridotta a media generale, materie e voti. Le opzioni meno frequenti sono in dettagli espandibili o nel menu Account. L'OCR viene caricato quando serve; il lavoro di riconoscimento è eseguito in un worker per non svolgere tutto nel thread dell'interfaccia.

I dati personali non devono essere inviati a un backend. I voti devono essere validati prima del salvataggio; un'importazione non deve scrivere righe parziali o assegnare arbitrariamente la data di oggi a valutazioni vecchie. Le dipendenze e i modelli di riconoscimento devono essere riproducibili dal lockfile e inclusi nelle app distribuite.

### 2.3 Esclusioni esplicite

Non sono presenti sincronizzazione cloud, condivisione tra studenti, recupero password via email, accesso alle API Argo, modifica dei voti ufficiali, notifiche push, gestione di classi o segreterie, scansione PDF, riconoscimento garantito di tutti i layout o distribuzione sugli store. Le medie sono indicative e non sostituiscono lo scrutinio dei docenti.

## 3. Esperienza utente

### 3.1 Primo accesso

L'utente sceglie Crea account e inserisce nome utente, password e conferma. Il nome visualizzato è facoltativo; in sua assenza viene usato il nome utente. Il nome utente ammette lettere latine, numeri, punti, trattini e underscore, da 3 a 40 caratteri. La password deve contenere da 12 a 128 caratteri.

Il profilo appena creato non contiene voti dimostrativi. La schermata invita ad aggiungere una materia o importare i dati. L'accesso viene mantenuto sul dispositivo fino a Esci; non è più previsto il blocco automatico dopo 15 minuti.

### 3.2 Schermata principale

La barra superiore contiene nome dell'app, selettore del tema e accesso all'account. Le azioni principali sono Importa voti e materie e Aggiungi voto. Il filtro del periodo e l'anno scolastico precedono la media generale.

Le due schede Materie e Voti evitano di mostrare contemporaneamente tutti i dettagli. In Materie sono visibili nome, numero dei voti, media e azione Modifica. In Voti sono mostrati valutazione, materia, data, periodo e azione di modifica, con filtro per materia. Il testo accompagna il colore: la distinzione non dipende soltanto da rosso e verde.

### 3.3 Inserimento quotidiano

Dopo aver aggiunto la materia, l'utente inserisce il voto. La data è già compilata e il tipo ha un valore predefinito; peso e nota sono nelle opzioni aggiuntive. L'utente può correggere la data per una valutazione precedente. I valori vengono validati e salvati nell'archivio cifrato, quindi le medie sono ricalcolate.

Eliminare una materia richiede conferma e rimuove anche i voti e gli impegni associati. Eliminare un voto ricalcola la media ma non cancella la materia. Il controllo di conferma aiuta a distinguere un cambiamento reversibile di un campo dalla rimozione dei dati.

### 3.4 Strumenti secondari e temi

Account → Agenda e simulatore contiene compiti e verifiche, stato completato, scadenze passate, obiettivi per materia e simulatore del prossimo voto. Il confronto tra i periodi è secondario. Spostare questi elementi non elimina i dati precedenti dell'agenda.

Il tema può essere chiaro, scuro o automatico secondo la preferenza comunicata dal sistema/browser. La scelta è salvata localmente e applicata prima del disegno principale della pagina. Il wrapper Android include anche l'adeguamento dei colori delle barre di sistema sui WebView compatibili.

## 4. Regole scolastiche e formule

### 4.1 Date, periodi e anni

Le date sono archiviate come YYYY-MM-DD. La data proposta per un nuovo voto è calcolata nel fuso Europe/Rome. Il periodo dipende dal giorno del voto, non da quando viene inserito nell'app.

| Intervallo | Periodo | Anno scolastico di esempio |
| --- | --- | --- |
| 1 settembre–31 dicembre 2025 | Primo | 2025/26 |
| 1 gennaio–30 giugno 2026 | Secondo | 2025/26 |
| 1 luglio–31 agosto 2026 | Fuori dai periodi supportati | Nessun voto importabile in questo intervallo |
| 1 settembre 2026 | Nuovo primo periodo | 2026/27 |

Il codice rappresenta luglio/agosto come periodo summer e rifiuta tali date per i voti. Questa è una limitazione del modello attuale, non una dichiarazione sul calendario di ogni scuola.

### 4.2 Media per materia

Per una materia, con voti v_i e pesi p_i, la media è:

M = somma(v_i × p_i) / somma(p_i).

Esempio: un 6 di peso 1 e un 9 di peso 2 producono (6 + 18) / 3 = 8. Una materia senza voti non ha media numerica: viene mostrato un trattino, non uno zero.

### 4.3 Media generale

La media generale è la media aritmetica delle medie delle materie che hanno voti nel filtro selezionato. Ogni materia pesa allo stesso modo, anche se il numero dei voti è diverso.

Esempio: Matematica ha due 6, Italiano un 9. Le medie per materia sono 6 e 9; la media generale è 7,5. La media di tutti i voti insieme sarebbe invece 7: sono due indicatori diversi. L'app usa il primo per Media generale.

Nel filtro Anno intero tutti i voti delle due parti dell'anno contribuiscono alla media della propria materia con il loro peso. Non viene calcolata prima la media dei due periodi per poi attribuire loro automaticamente lo stesso peso.

### 4.4 Simulazione e soglie

Dato un obiettivo T e il peso p del prossimo voto, il valore necessario x è:

x = [T × (somma dei pesi attuali + p) − somma(voto × peso)] / p.

Con un 6 di peso 1, per arrivare a 7 con un altro voto di peso 1 serve 8. Se il risultato supera 10, l'obiettivo non è raggiungibile con quella sola valutazione. La simulazione non modifica i voti reali e non garantisce il voto dello scrutinio.

La soglia di sufficienza è 6, applicata al valore calcolato prima dell'arrotondamento di presentazione. L'interfaccia usa la formattazione italiana con una o due cifre decimali; visualizzazione e valore interno non sono la stessa cosa. I voti validi vanno da 1 a 10, i pesi devono essere maggiori di zero e non superiori a 10.

## 5. Importazione da screenshot

### 5.1 Percorso del dato

Scelta immagine o testo → lettura locale → estrazione delle righe → anteprima → correzione e selezione → verifica → salvataggio cifrato → ricalcolo delle medie.

Tesseract.js usa il motore WebAssembly e il modello italiano inclusi nel pacchetto. Non viene chiamato un servizio AI remoto. Il riconoscimento OCR produce testo; il parser del progetto trasforma soltanto le righe compatibili in candidati materia/voto/data. Non è una comprensione universale del documento.

### 5.2 Formati e limiti

| Vincolo | Valore attuale |
| --- | --- |
| Immagini per operazione | Da 1 a 5 |
| Formati | PNG, JPEG, WebP |
| Dimensione massima del singolo file | 10.000.000 byte |
| Dimensione immagine originale | Rifiutata oltre 20.000.000 pixel dopo apertura |
| Preparazione della lettura | Ridimensionamento entro 2.800 pixel sul lato maggiore e 4.000.000 pixel complessivi |
| Testo da analizzare | Massimo 50.000 caratteri |
| Righe riconosciute per operazione | Massimo 300; oltre il limite l'operazione viene rifiutata |

La preparazione usa sfondo bianco, scala di grigi e inversione quando l'immagine risulta prevalentemente scura. Le dimensioni sono limiti implementativi; non costituiscono un benchmark di velocità o di precisione.

### 5.3 Date e ambiguità

Sono riconosciute date complete ISO o nel formato giorno/mese/anno e varianti con punti. Per date senza anno, il periodo settembre–dicembre usa l'anno iniziale scelto, gennaio–giugno quello successivo. Un anno a due cifre viene interpretato nel secolo 2000: non è adatto a documenti storici del Novecento.

Se non è leggibile una data valida, il campo resta da completare: non viene sostituito con oggi. Una valutazione come 6+ o 6− non viene trasformata arbitrariamente in 6,25 o 5,75: richiede una correzione numerica. Le righe che sembrano medie o intestazioni comuni vengono escluse dal parser. Sono supportate anche alcune disposizioni con materia, data e voto su righe successive.

### 5.4 Conferma, duplicati e conservazione

L'utente può cambiare i campi, vedere la riga letta, escludere righe o aggiungerne una a mano. Se non è riconosciuto nulla, l'app propone una riga vuota e invita a correggere la fonte. Le righe selezionate devono essere valide prima della conferma.

Il confronto dei duplicati usa materia normalizzata, data, voto, peso e tipo. Le note non fanno parte della chiave. Una valutazione legittimamente identica a un'altra nello stesso giorno può quindi essere saltata: deve essere aggiunta a mano. Non viene cancellato il voto già presente.

La fusione avviene su una copia dei dati e poi passa alla validazione e al salvataggio revisionato. Se il salvataggio fallisce, non viene applicata un'importazione parziale. Le immagini originali e il testo OCR non vengono conservati nell'account; soltanto i dati confermati diventano voti e materie. I dati temporanei della lettura sono rimossi dall'interfaccia quando si chiude l'importazione.

## 6. Architettura e componenti

Il prodotto condivide un frontend HTML/CSS/JavaScript tra le piattaforme. Il calcolo è separato dalla vista, la cifratura dalla gestione dei moduli e il parser dal motore OCR.

| Livello | Componenti principali | Responsabilità |
| --- | --- | --- |
| Presentazione | index.html, style.css, theme.js | Schermate, moduli, temi e leggibilità |
| Coordinamento | app.mjs | Navigazione, eventi, filtri, salvataggio e sessione |
| Dominio | model.mjs | Date, medie, simulazione e validazione dell'archivio |
| Importazione | import-ui.mjs, import-model.mjs, ocr.mjs | Anteprima, parser e lettura locale |
| Persistenza | vault.mjs | Cifratura, account, sessione, revisioni e backup |
| Desktop | desktop/main.cjs | Finestra Electron, file locali e browser esterno |
| Android | MainActivity.java e risorse | WebView locale, selettore file, backup e tema |
| Web | server.cjs, sw.js, manifest.json | Server statico di sviluppo e risorse offline |
| Preparazione | scripts/ocr-assets.cjs, scripts/android-assets.cjs | Copia riproducibile delle risorse nei pacchetti |

Il server Node distribuisce soltanto file ammessi; non è un backend di autenticazione. Non esistono endpoint per caricare credenziali, immagini o voti. L'applicazione web richiede HTTPS o un contesto locale sicuro, Web Crypto e IndexedDB.

Windows usa un'origine locale dedicata con protocollo registromedia. Android usa WebViewAssetLoader con origine appassets.androidplatform.net: gli indirizzi sono risolti verso gli asset inclusi nell'app, non verso un server che riceve i dati. I wrapper bloccano le richieste remote interne non previste e aprono il solo collegamento Argo ammesso nel browser esterno.

Sul web il service worker conserva i file principali per il funzionamento offline e memorizza i componenti OCR dopo il primo utilizzo dal medesimo sito. Nelle app installate motore e modello sono già nel pacchetto. Browser o sistema possono eliminare cache e storage in determinate condizioni: l'uso offline non equivale a un backup.

## 7. Modello dei dati

### 7.1 Archivio logico

| Entità | Campi | Regole essenziali |
| --- | --- | --- |
| Materia | id, name, target | Nome non vuoto, massimo 80 caratteri; obiettivo da 1 a 10; nomi duplicati rifiutati |
| Voto | id, subjectId, value, weight, date, type, note | Materia esistente; voto 1–10; peso >0 e <=10; data valida; nota fino a 160 caratteri |
| Impegno | id, title, date, done, subjectId | Titolo fino a 200 caratteri; data valida; materia esistente o riferimento vuoto per Generale |

Gli ID sono stringhe alfanumeriche con trattini, non vuote e lunghe fino a 64 caratteri. I tipi di voto ammessi sono Orale, Scritto e Pratico. L'archivio ammette al massimo 100 materie, 10.000 voti e 2.000 impegni. Questi limiti non dimostrano prestazioni equivalenti su tutti i telefoni.

### 7.2 Archivio fisico e versioni

Il database IndexedDB si chiama registromedia-private-v3. La versione dello schema IndexedDB è 2: l'aggiornamento aggiunge lo store deviceSession e conserva lo store accounts. Il formato del record cifrato e del backup rimane invece 3. Questi numeri sono diversi dalla versione applicativa 0.4.0 e hanno scopi distinti.

Ogni record account contiene username, versione, iterazioni, revisione, salt, IV e ciphertext. Nome visualizzato e archivio logico sono nel contenuto cifrato. La sessione persistente è separata e contiene il riferimento all'account e una CryptoKey; non è inclusa nel backup esportato. La preferenza del tema è in localStorage e non è un dato scolastico cifrato.

### 7.3 Concorrenza

Un salvataggio usa la revisione attesa. La scrittura transazionale verifica che il record non sia stato modificato da un'altra finestra. Se la revisione è obsoleta, il salvataggio è rifiutato e l'utente deve uscire e riaprire il profilo prima di ripetere la modifica. Questo controllo evita sovrascritture silenziose; non è un sistema di fusione collaborativa tra dispositivi.

## 8. Sicurezza, privacy e sessione

La password viene usata da PBKDF2-HMAC-SHA-256 con 600.000 iterazioni e salt casuale da 128 bit per derivare una chiave AES-256-GCM non esportabile. Ogni salvataggio usa un IV casuale da 96 bit. Il contenuto autenticato include nome utente, versione e revisione: manomissioni rilevabili fanno fallire lo sblocco. La password non è conservata in chiaro né inviata a server.

Per soddisfare il requisito di non rifare il login, la CryptoKey viene conservata in IndexedDB finché l'utente non sceglie Esci. Non esportabile significa che l'API non ne consente l'esportazione in chiaro; non significa che un profilo del dispositivo aperto sia protetto da chi lo sta già usando. L'accesso persistente è una scelta di comodità con una conseguenza precisa: usare un dispositivo personale e uscire prima di condividerlo.

Esci elimina la chiave persistente, svuota la sessione dell'interfaccia e comunica l'uscita alle altre finestre compatibili tramite BroadcastChannel. L'eliminazione del profilo richiede la password e rimuove account e relativa sessione locale. Non elimina backup già esportati, copie su altri dispositivi o dati del sito Argo.

Le interfacce mostrano testo importato usando nodi testuali e valori di input, non HTML fornito dall'utente. La Content Security Policy limita script e connessioni all'origine locale, permette worker locali e compilazione WASM, e blocca invii di form non gestiti. La concessione wasm-unsafe-eval non è un'abilitazione generale di unsafe-eval JavaScript.

Electron mantiene sandbox e isolamento del contesto, senza Node.js nel renderer. Android non concede accesso generale a contatti, posizione, fotocamera o archivio: usa il selettore per i file scelti dall'utente. I canali nativi sono limitati all'origine locale e al frame principale, per esportare backup già cifrati e applicare un tema ammesso. I backup di sistema Android sono disabilitati nelle regole dichiarate.

Non sono presenti tracker o pubblicità. Non è stata eseguita una revisione di sicurezza indipendente e non si può garantire rischio zero. Malware, controllo del dispositivo, password deboli o una sessione già aperta sono limiti del modello di protezione. Il progetto non costituisce una certificazione di conformità legale o privacy. Il package dichiara UNLICENSED: la pubblicità del repository non equivale a una concessione di licenza open source per l’app. Le licenze delle dipendenze e le relative attribuzioni rimangono separate.

## 9. Backup, migrazione e continuità

Un backup è un file JSON cifrato identificato dal formato registromedia-encrypted, versione 3, con il record dell'account. La password originale è necessaria per aprirlo anche se l'app sul dispositivo di partenza mantiene l'accesso. I backup delle release 0.3 con questo formato sono compatibili.

Procedura consigliata: esportare il backup, conservarlo in un luogo affidabile, trasferirlo sul dispositivo di destinazione, scegliere Ripristina un backup, inserire la password e confermare l'eventuale sostituzione. Il ripristino sostituisce il profilo omonimo, non combina due storie di modifiche. Prima di sostituire un archivio più recente va esportata una copia dello stato corrente.

Non esistono recupero password via email o copia cloud gestita dal progetto. La perdita della password può rendere inutilizzabile il backup; la cancellazione dello storage o la disinstallazione può eliminare i dati locali. La sessione persistente non è una strategia di recupero password.

Il formato locale non cifrato delle prime versioni 0.1/0.2 è lasciato intatto ma non è automaticamente importato nel nuovo archivio. L'aggiornamento dello schema IndexedDB dalla versione 1 alla 2 è invece coperto da una prova che verifica la conservazione di account e voti.

Gli APK di sviluppo creati dal runner possono avere firme diverse tra build. Android può quindi richiedere una disinstallazione invece di un aggiornamento diretto. Prima di cambiare APK occorre esportare il backup e ricordare la password. Non è stata configurata una firma release privata stabile.

## 10. Installazione e sviluppo

### 10.1 Utente finale

Per Windows, l'installer Setup.exe esegue l'installazione; in alternativa la ZIP Portable va estratta completamente e si apre RegistroMedia.exe. Spostare il solo eseguibile fuori dalla cartella portabile non basta: servono anche le risorse. Node.js non è richiesto per usare il programma distribuito.

Android richiede Android 9 o successivo e WebView aggiornato. L'APK è una build di sviluppo, non una pubblicazione Play Store. La scelta di installare un pacchetto esterno rimane dell'utente e del sistema operativo; il progetto non deve chiedere di disabilitare protezioni generali del dispositivo.

Per iPhone esiste soltanto la base web responsive. Per visitarla e installarla dalla schermata Home tramite Safari serve un indirizzo HTTPS raggiungibile. Non è disponibile un link a un sito già distribuito.

### 10.2 Sviluppatore

Il riferimento è Node.js 24. npm ci installa le dipendenze del lockfile ed esegue postinstall, che prepara le risorse OCR. npm start avvia il server statico locale. npm test esegue i test Node; npm run test:ui esegue Playwright dopo l'installazione di Chromium. Un browser già presente può essere selezionato con CHROMIUM_PATH.

npm run ocr:assets rigenera vendor/ocr. npm run android:assets prepara anche gli asset Android. Le risorse generate, le cartelle di build, i dati personali, gli archivi locali e le chiavi private non devono essere aggiunti al repository. I percorsi e i comandi completi sono nel README.

## 11. Build e distribuzione

Il repository principale è https://github.com/Samir-cpp/registromedia. La prerelease di riferimento è https://github.com/Samir-cpp/registromedia/releases/tag/v0.4.0. Il codice verificato per questa documentazione è il commit f17d702, salvo le successive aggiunte documentali.

Windows usa Electron ed electron-builder per NSIS e ZIP portabile. La build NSIS su Linux richiede Wine; il workflow di rilascio usa un runner Windows. Android usa JDK completo 17/21, Gradle 8.11.1, Android SDK 35 e Build Tools 35.0.0, con assemblaggio APK e lint.

| Passaggio del workflow | Risultato richiesto |
| --- | --- |
| Tag v* | Versione del tag uguale a package.json |
| Verifica | Installazione bloccata dal lockfile, test Node e UI con OCR reale sintetico |
| Windows | Avvio e OCR in Electron, installer e ZIP |
| Android | Preparazione degli asset, assembleDebug e lintDebug, APK |
| Pubblicazione | Entrambe le build riuscite, raccolta dei file e SHA256SUMS.txt |
| Release | Bozza creata e resa pubblica come prerelease dopo il caricamento |

I workflow hanno permessi di lettura per i job di verifica e build; la scrittura dei contenuti è concessa al job di pubblicazione. Le chiavi di firma non sono nel repository. Le dipendenze sono risolte dal lockfile; i tool Android del setup CI hanno un controllo di checksum. Le risorse OCR sono ricavate dai pacchetti, con le licenze incluse nei file distribuiti.

La versione 0.4.0 è stata pubblicata con installer Windows, ZIP portabile, APK Android e checksum. Windows non ha firma digitale di distribuzione; Android usa una firma di sviluppo. Non vengono promessi aggiornamenti automatici o una distribuzione sugli store.

## 12. Verifica e criteri di accettazione

### 12.1 Evidenze disponibili

| Area | Evidenza | Cosa dimostra e cosa non dimostra |
| --- | --- | --- |
| Dominio | tests/model.test.mjs | Formule, separazione dei periodi e validazione dei dati |
| Parser | tests/import.test.mjs | Estrazione di righe controllate, date mancanti, ambiguità e duplicati |
| Archivio | tests/vault.test.mjs | Password errata, cifratura, ripristino, conflitti e sessione persistente |
| Migrazione | tests/vault-migration.test.mjs | Conservazione di un account e dei voti durante l'aggiornamento dello schema |
| Collegamento esterno | tests/argo.test.mjs | Destinazione ammessa e attributi protettivi del link; non accesso alle API |
| UI e OCR | scripts/ui-smoke.cjs | Screenshot sintetico letto realmente, anteprima, date, riavvio, temi, uscita e offline |
| Desktop | desktop/main.cjs con smoke-test | Avvio e lettura sintetica dentro Electron su runner Windows |
| Android | assembleDebug e lintDebug | Compilazione e controlli statici; non uso su ogni telefono fisico |

Nel lavoro sulla 0.4.0 sono passati 13 test Node e lo smoke test Chromium desktop/mobile; i job di build Windows e Android e la pubblicazione sono terminati con successo. Il workflow è disponibile alla pagina Actions del repository. I dati usati erano artificiali, non voti reali dello studente.

### 12.2 Criteri per accettare la prerelease

- Un account nuovo è vuoto; dopo un riavvio il profilo ricordato riapre il registro.
- Esci impedisce la riapertura automatica e richiede nuovamente le credenziali.
- Un 5,5 risulta insufficiente e rosso, un 6 sufficiente e verde.
- I voti del 31 dicembre e del 1 gennaio appartengono ai periodi corretti dello stesso anno scolastico.
- Uno screenshot non aggiunge dati prima della conferma; una data assente blocca la riga selezionata.
- Riconfermare lo stesso voto importato non crea un doppione secondo la chiave documentata.
- Un backup non contiene nomi delle materie o voti in chiaro e si ripristina con la password corretta.
- I file di installazione corrispondono al tag rilasciato e hanno checksum pubblicati.

### 12.3 Verifiche ancora necessarie

Il collaudo su una matrice di telefoni Android e PC fisici, la prova specifica su Safari/iPhone, l'accessibilità con tecnologie assistive e la revisione indipendente di sicurezza sono attività distinte e non risultano completate. La precisione OCR su screenshot reali eterogenei del registro non è stata misurata con un campione rappresentativo: non viene attribuita una percentuale di accuratezza.

## 13. Rischi, limiti e sviluppi futuri

| Rischio | Impatto | Contromisura attuale / passo successivo |
| --- | --- | --- |
| Password dimenticata | Backup non apribile | Indicazione esplicita; conservare password e backup; nessun falso recupero |
| Disinstallazione o storage eliminato | Perdita dei dati locali | Esportazione periodica; prova di ripristino |
| Dispositivo condiviso con accesso attivo | Lettura dei dati da parte di altri | Esci prima della condivisione; dispositivo personale |
| OCR errato o data inferita dall'anno sbagliato | Medie inesatte | Anteprima, correzione obbligatoria dei campi invalidi e anno selezionabile |
| Duplicati legittimi | Un voto identico viene saltato | Inserimento manuale del caso eccezionale |
| Firma APK differente | Aggiornamento diretto impossibile | Backup prima di cambiare build; predisporre firma release stabile |
| Screenshot grandi o telefono lento | Lentezza o memoria insufficiente | Limiti di file/pixel e lettura in worker; misurare su dispositivi reali |
| Dipendenze o tool modificati | Build non riproducibile o vulnerabile | Lockfile, checksum dei tool, review degli aggiornamenti |
| Aspettativa di sincronizzazione o API Argo | Uso errato del prodotto | Ambito offline esplicito e collegamento separato al sito ufficiale |

Priorità consigliate, non impegni di consegna: prima collaudo e affidabilità dei backup; poi firma stabile, più campioni OCR e accessibilità; successivamente eventuale hosting statico per iPhone. Un futuro servizio di sincronizzazione o una vera API Argo richiederebbe un nuovo progetto di autenticazione, autorizzazione, conservazione dei dati e termini d'uso: non è una funzione da attivare con il solo codice scuola.

## 14. Organizzazione del progetto

La WBS in appendice scompone i risultati in pacchetti verificabili. È una struttura del lavoro, non una previsione di durata o un calendario. Le dipendenze indicano l'ordine logico; non sono state inventate ore, costi o date di completamento per le attività future.

Per un passaggio di consegne sono proposti quattro ruoli, anche ricopribili dalla stessa persona: referente utente per requisiti e accettazione; sviluppatore per implementazione e manutenzione; collaudatore per prove indipendenti; responsabile del rilascio per toolchain, firme e pubblicazione. Non è dichiarato che esista già un team con questi incarichi.

Un cambiamento va descritto, collegato ai requisiti e alla WBS, implementato conservando i dati esistenti e verificato con i test pertinenti. Un rilascio richiede versione coerente, note aggiornate, build riuscite e file verificati. La documentazione deve essere aggiornata quando cambiano formule, periodi, formato dei backup, sessione o strumenti di importazione.

Per proporre un difetto è utile indicare piattaforma, versione dell'app, passaggi per riprodurlo e risultato atteso. Screenshot reali e backup possono contenere dati personali: vanno anonimizzati o evitati nelle segnalazioni pubbliche. Non inviare password, chiavi o cookie del registro scolastico.

## 15. Glossario e fonti interne

| Termine | Significato nel progetto |
| --- | --- |
| WBS | Work Breakdown Structure: scomposizione gerarchica del lavoro orientata ai risultati |
| OCR | Riconoscimento del testo contenuto in un'immagine |
| WASM | WebAssembly, formato usato dal motore OCR nel browser/app |
| IndexedDB | Archivio strutturato locale del motore browser |
| CryptoKey | Oggetto chiave crittografica; nel progetto non esportabile via Web Crypto |
| Ciphertext | Contenuto cifrato del profilo, distinto dai dati leggibili |
| Salt / IV | Valori casuali per derivazione della chiave / cifratura di ogni salvataggio |
| Prerelease | Versione di prova pubblicata prima di una distribuzione stabile |
| CI | Esecuzione automatica di verifiche e build su GitHub Actions |
| Checksum | Impronta del file per verificare che il download corrisponda a quello pubblicato |

Fonti di verità per il comportamento: model.mjs e vault.mjs per formule e archivio; import-model.mjs, import-ui.mjs e ocr.mjs per l'importazione; app.mjs e index.html per i percorsi utente; wrapper desktop/Android per le restrizioni native; package.json e package-lock.json per tool e dipendenze; tests e scripts/ui-smoke.cjs per le prove; .github/workflows/release.yml per la pubblicazione. README.md è la guida sintetica. docs/argo-integration.md approfondisce il collegamento Argo.

Questa relazione e la WBS vanno lette con quei file: se una versione futura cambia il codice, gli esempi e gli stati qui riportati devono essere riesaminati.
