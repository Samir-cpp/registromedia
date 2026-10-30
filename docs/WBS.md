> Archivio della versione 1.0.1. Per l’aggiornamento corrente consulta [Votiva 2.0](MAJOR-2.0.md) e la [guida online](SUPABASE-SETUP.md).

# Votiva — Work Breakdown Structure

Documento 2.0 · 30 ottobre 2026 · software 1.0.1. Sostituisce la WBS 0.4; le funzionalità ritirate non sono più deliverable del prodotto.

24 pacchetti: R = realizzato nel codice e nei controlli indicati; V = verifica o attivazione ancora necessaria; P = attività futura. I ruoli sono proposti; non sono stime di costo, assegnazioni o date inventate. La realizzazione della pipeline non prova che una specifica release sia già pubblicata.

## Prodotto

| ID | Deliverable e accettazione | Stato |
|---|---|---|
| 1.1 | **Perimetro semplificato** — Solo registro voti e medie; funzionalità ritirate escluse. Responsabile proposto: Product owner. Evidenza: README.md. | R |
| 1.2 | **Documentazione e WBS aggiornate** — Stati e limiti distinguono implementazione da verifica fisica. Responsabile proposto: Analista. Evidenza: docs/PROJECT-DOCUMENTATION.md. | R |

## Design

| ID | Deliverable e accettazione | Stato |
|---|---|---|
| 2.1 | **Identità Votiva** — Nome e logo coerenti su web e wrapper. Responsabile proposto: Designer. Evidenza: icon.svg. | R |
| 2.2 | **Layout responsive** — Nessun overflow a otto larghezze da 320 a 1920. Responsabile proposto: Frontend. Evidenza: scripts/ui-smoke.cjs. | R |
| 2.3 | **Temi e soglie** — Chiaro/scuro/automatico e rosso/verde con testo. Responsabile proposto: Frontend. Evidenza: style.css. | R |
| 2.4 | **Accessibilità assistiva** — Verifica VoiceOver, TalkBack, zoom e orientamento. Responsabile proposto: QA accessibilità. Evidenza: Collaudo manuale da eseguire. | V |

## Registro

| ID | Deliverable e accettazione | Stato |
|---|---|---|
| 3.1 | **Materie predefinite e CRUD** — Dieci materie nei nuovi account; modifica ed eliminazione. Responsabile proposto: Frontend. Evidenza: vault.mjs / app.mjs. | R |
| 3.2 | **Voti a quarti** — Scelta da 0,25 a 10; modifica senza perdita dei vecchi decimali. Responsabile proposto: Frontend. Evidenza: app.mjs. | R |
| 3.3 | **Calcolo medie e percentuali** — Pesi, materie senza voti e denominatori verificati. Responsabile proposto: Sviluppatore. Evidenza: tests/model.test.mjs. | R |
| 3.4 | **Periodi configurabili** — Date coerenti e inclusività dei confini, trimestre anche a gennaio. Responsabile proposto: Sviluppatore. Evidenza: model.mjs. | R |
| 3.5 | **Grafico e filtri** — Medie per materia e filtro anno/periodo/materia coerenti. Responsabile proposto: Frontend. Evidenza: scripts/ui-smoke.cjs. | R |

## Account

| ID | Deliverable e accettazione | Stato |
|---|---|---|
| 4.1 | **Cifratura e sessioni** — Isolamento, persistenza, Esci, conflitti e manomissioni verificati. Responsabile proposto: Sviluppatore. Evidenza: tests/vault.test.mjs. | R |
| 4.2 | **Mostra e cambia password** — Nessuna password conservata; ricifratura e vecchi backup compatibili. Responsabile proposto: Sviluppatore. Evidenza: vault.mjs. | R |
| 4.3 | **Backup e migrazione** — Ripristino password, formato 3, dati precedenti conservati. Responsabile proposto: Sviluppatore. Evidenza: tests/vault-migration.test.mjs. | R |
| 4.4 | **Revisione sicurezza** — Audit indipendente e analisi del dispositivo compromesso. Responsabile proposto: Security reviewer. Evidenza: Revisione esterna da pianificare. | P |

## Piattaforme

| ID | Deliverable e accettazione | Stato |
|---|---|---|
| 5.1 | **Windows** — Protocollo locale isolato e pacchetto installabile via CI. Responsabile proposto: Build engineer. Evidenza: desktop/main.cjs / release.yml. | R |
| 5.2 | **Android** — WebView offline e backup nativo; niente permesso INTERNET. Responsabile proposto: Android developer. Evidenza: MainActivity.java. | R |
| 5.3 | **iPhone e sito** — Bundle PWA e istruzioni per Safari / Pages. Responsabile proposto: Frontend. Evidenza: manifest.json / web.yml. | R |
| 5.4 | **Collaudo fisico** — Installare e provare Windows, Android e iPhone reali. Responsabile proposto: QA. Evidenza: Matrice dispositivi da completare. | V |
| 5.5 | **Attivazione Pages** — Abilitare Pages e completare il deployment HTTPS. Responsabile proposto: Repository owner. Evidenza: Settings Pages / workflow web. | V |

## Consegna

| ID | Deliverable e accettazione | Stato |
|---|---|---|
| 6.1 | **Rimozione funzioni ritirate** — Niente Argo, OCR, agenda o simulatore nelle schermate e build. Responsabile proposto: Sviluppatore. Evidenza: package.json / allowlist. | R |
| 6.2 | **Test automatici** — Unità, integrazione e browser passano. Responsabile proposto: QA. Evidenza: npm test / npm run test:ui. | R |
| 6.3 | **Pipeline release** — Verifica tag, build e checksum prima della pubblicazione. Responsabile proposto: Build engineer. Evidenza: .github/workflows/release.yml. | R |
| 6.4 | **Firme di produzione** — Chiavi Android stabili e firma Windows commerciale gestite. Responsabile proposto: Release manager. Evidenza: Configurazione futura. | P |

## Dipendenze e criteri di completamento

Identità e perimetro precedono interfaccia e documentazione; medie e validazione precedono grafico e filtri; cifratura precede backup e cambio password; test precedono build e release. Il deploy Pages dipende dall’attivazione del repository da parte del proprietario. Il collaudo fisico richiede una build installabile e un sito HTTPS già pubblicato. Le firme di produzione sono una fase successiva distinta dagli APK di sviluppo.

Una consegna è verificabile quando il tag coincide con la versione, i job release passano e i download hanno checksum. La qualifica completa richiede anche i pacchetti V; i pacchetti P non sono falsamente indicati come completati. Il CSV UTF-8 con separatore punto e virgola è apribile in Excel; importa la colonna ID come testo.
