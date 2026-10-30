# Work Breakdown Structure
## RegistroMedia 0.4.0 — WBS 1.0

Data: 30 ottobre 2026. Baseline: prerelease offline e documentazione associata. Radice 0: consegna del registro personale e del relativo fascicolo.

La WBS scompone i risultati del progetto, non rappresenta una cronologia né un preventivo. I ruoli sono proposti per il passaggio di consegne; non dichiarano la presenza di personale già assegnato. Non sono stimate ore, costi o scadenze senza dati di pianificazione.

## Legenda e lettura

R = realizzato nella baseline, con evidenza indicata. V = da validare con prove aggiuntive; non completato. P = pianificato/proposto per una fase successiva. Lo stato R non equivale a una certificazione di sicurezza o compatibilità universale. Le attività V e P restano visibili e non sono presentate come già concluse.

Ogni codice X.Y identifica un pacchetto; X è il risultato padre. Le dipendenze del CSV sono prerequisiti logici, non date. Il CSV è il dizionario completo: include deliverable, criterio di accettazione, dipendenze, ruolo proposto, stato e riferimento. Il documento completo spiega i requisiti cui questa struttura risponde.

## 1. Definizione del progetto

Ruoli proposti: Referente utente / sviluppatore.

| ID | Pacchetto / risultato | Stato |
| --- | --- | --- |
| 1.1 | Ambito offline: Baseline del prodotto personale | R |
| 1.2 | Regole dei periodi: Calendario settembre–dicembre / gennaio–giugno | R |
| 1.3 | Limiti e accettazione: Requisiti ed esclusioni dichiarati | R |

## 2. Interfaccia e usabilità

Ruoli proposti: Sviluppatore / collaudatore.

| ID | Pacchetto / risultato | Stato |
| --- | --- | --- |
| 2.1 | Dashboard minima: Vista Materie/Voti e riepilogo | R |
| 2.2 | Moduli progressivi: Inserimento rapido con opzioni secondarie | R |
| 2.3 | Temi: Chiaro, scuro e automatico | R |
| 2.4 | Stato delle medie: Rosso/verde e testo esplicativo | R |
| 2.5 | Accessibilità completa: Rapporto con tastiera e tecnologie assistive | V |

## 3. Account e protezione dei dati

Ruoli proposti: Sviluppatore.

| ID | Pacchetto / risultato | Stato |
| --- | --- | --- |
| 3.1 | Cifratura del profilo: Archivio AES-GCM e derivazione PBKDF2 | R |
| 3.2 | Accesso persistente: Sessione locale con CryptoKey | R |
| 3.3 | Uscita e rimozione profilo: Revoca della sessione e cancellazione locale | R |
| 3.4 | Migrazione e revisioni: Schema aggiornato senza perdita dei record | R |
| 3.5 | Backup e ripristino: JSON cifrato compatibile formato 3 | R |

## 4. Registro e calcoli scolastici

Ruoli proposti: Sviluppatore / referente utente.

| ID | Pacchetto / risultato | Stato |
| --- | --- | --- |
| 4.1 | Materie: CRUD con obiettivo facoltativo | R |
| 4.2 | Voti: CRUD con data, peso, tipo e nota | R |
| 4.3 | Filtri temporali: Periodi e anni scolastici distinti | R |
| 4.4 | Media per materia: Calcolo ponderato | R |
| 4.5 | Media generale: Media delle materie con voti | R |

## 5. Importazione e riconoscimento

Ruoli proposti: Sviluppatore / collaudatore.

| ID | Pacchetto / risultato | Stato |
| --- | --- | --- |
| 5.1 | Motore OCR locale: Worker, WASM e modello italiano inclusi | R |
| 5.2 | Acquisizione e preparazione: Immagini scelte e limiti applicati | R |
| 5.3 | Parser del testo: Candidati materia/voto/data | R |
| 5.4 | Anteprima modificabile: Revisione prima del salvataggio | R |
| 5.5 | Duplicati e fusione: Importazione senza doppioni equivalenti | R |
| 5.6 | Persistenza dell’importazione: Commit validato dell’insieme | R |
| 5.7 | Campione OCR reale: Rapporto su schermate eterogenee anonimizzate | V |

## 6. Strumenti secondari

Ruoli proposti: Sviluppatore.

| ID | Pacchetto / risultato | Stato |
| --- | --- | --- |
| 6.1 | Agenda: Compiti, verifiche e stato completato | R |
| 6.2 | Obiettivi e simulatore: Calcolo del prossimo voto necessario | R |
| 6.3 | Confronto dei periodi: Riepilogo secondario annuale | R |

## 7. Applicazioni e piattaforme

Ruoli proposti: Sviluppatore / responsabile rilascio.

| ID | Pacchetto / risultato | Stato |
| --- | --- | --- |
| 7.1 | Wrapper Windows: Electron con origine locale | R |
| 7.2 | Wrapper Android: WebView con asset locali | R |
| 7.3 | Frontend web: Manifest e risorse per uso responsive/offline | R |
| 7.4 | Pacchetti Windows: Installer e archivio portabile | R |
| 7.5 | APK Android: Build di sviluppo firmata | R |
| 7.6 | Matrice dispositivi fisici: Rapporto Android/Windows e Safari | V |

## 8. Verifica e qualità

Ruoli proposti: Collaudatore / sviluppatore.

| ID | Pacchetto / risultato | Stato |
| --- | --- | --- |
| 8.1 | Test del dominio e archivio: Suite Node | R |
| 8.2 | Test end-to-end web: Smoke Chromium e screenshot sintetico | R |
| 8.3 | Smoke desktop: Avvio e OCR reale in Electron | R |
| 8.4 | Controlli Android: Compilazione e lint | R |
| 8.5 | Revisione indipendente: Rapporto di sicurezza e minacce | P |

## 9. Consegna e manutenzione

Ruoli proposti: Responsabile rilascio / referente utente.

| ID | Pacchetto / risultato | Stato |
| --- | --- | --- |
| 9.1 | Pipeline riproducibile: Workflow con versioni e checksum | R |
| 9.2 | Pubblicazione prerelease: File scaricabili e SHA256SUMS | R |
| 9.3 | Documentazione e consegna: Relazione, WBS e guida utente | R |
| 9.4 | Firma stabile e aggiornamenti: Procedura di firma release privata | P |
| 9.5 | Manutenzione controllata: Registro modifiche e revisioni documentali | P |

## Dizionario dei pacchetti più critici

### 3.2 — Accesso persistente

Risultato: riapertura del profilo senza digitare di nuovo la password. Criterio: la CryptoKey resta non esportabile e il riavvio riapre l’archivio; Esci deve rimuovere la sessione salvata. Dipendenza: cifratura 3.1. Accettazione basata sui test, con rischio del dispositivo condiviso dichiarato.

### 5.4 — Anteprima e controllo dei dati

Risultato: revisione modificabile prima dell’importazione. Criterio: nessuna modifica al registro prima della conferma; voto o data non validi bloccano la riga selezionata. Dipendenza: parser 5.3 e moduli 2.2. Evidenza: import-ui.mjs e smoke UI.

### 5.5 — Duplicati

Risultato: seconda importazione equivalente senza doppione. Criterio: confronto per materia normalizzata, data, voto, tipo e peso; il caso di due valutazioni davvero identiche è un limite dichiarato e richiede inserimento manuale. Dipendenze: 5.4 e 3.4.

### 7.6 — Collaudo fisico

Risultato ancora atteso: rapporto su una matrice concordata di dispositivi. Criterio: installazione, apertura, memoria durante OCR, persistenza e ripristino verificati sul dispositivo. Le build CI e il viewport mobile Chromium non chiudono da soli questo pacchetto.

### 9.4 — Firma stabile

Risultato futuro: procedura controllata di custodia e uso di una chiave release privata. Criterio: un aggiornamento legittimo conserva identità e dati senza cambiare arbitrariamente la firma. Non caricare chiavi nel repository e non confondere la firma debug del runner con una soluzione già pronta.

## Copertura e passaggio alla fase successiva

La struttura contiene 44 pacchetti foglia. La ripartizione degli stati è descrittiva, non una percentuale di avanzamento economico o temporale. Prima di dichiarare una release stabile occorre definire e completare i criteri di collaudo fisico, accessibilità e firma. La revisione indipendente di sicurezza va valutata separatamente.

API Argo, sincronizzazione cloud e app iOS nativa sono fuori dalla baseline: richiedono nuove decisioni e requisiti e non sono inclusi nei risultati consegnati. Non vanno aggiunti implicitamente come attività già autorizzate o finanziate.

## Uso del CSV

wbs.csv è in UTF-8 con BOM e separatore punto e virgola, per facilitarne l’apertura in Excel. Se il programma non separa automaticamente le colonne, usare Importa da testo/CSV, scegliere UTF-8 e separatore punto e virgola. Gli ID devono rimanere testo. Non alterare gli stati R/V/P senza aggiornare evidenze e criteri.
