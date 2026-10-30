# Da RegistroMedia a Votiva

## Una storia di scelte, prove e semplificazione

Relazione retrospettiva illustrata · 30 ottobre 2026 · stato del prodotto: Votiva 1.0.1, commit 6a459f5. Il documento racconta il percorso emerso nella conversazione e riscontrabile nei sorgenti Git. Le fasi prima del primo commit non hanno una data verificabile: non sono state inventate date, ore di lavoro, costi o percentuali di completamento.

Le immagini storiche sono screenshot di interfacce rieseguite oggi dai commit indicati: non sono fotografie scattate durante lo sviluppo originale. Tutti i nomi account e voti mostrati sono dimostrativi. Il video è una registrazione reale del browser con cartelli e didascalie; non contiene una voce narrante. PDF e Word sono statici; le animazioni sono nel file GIF e nella presentazione HTML.

## 1. Il risultato, prima della storia

Votiva è diventata un’app personale per registrare voti e leggere le medie. Ha account locali cifrati, materie, filtri per periodo e anno, voti a quarti, grafico, percentuale dei voti sufficienti e temi chiaro/scuro. Si distribuisce come app Windows, APK Android e sito installabile dalla schermata Home di iPhone dopo la pubblicazione HTTPS.

L’idea iniziale era più ambiziosa nell’automazione: collegarsi al registro Argo della scuola e ricavare i dati automaticamente. La scelta finale è diversa: meno dipendenze e meno strumenti, più controllo manuale. Questo ha migliorato semplicità e dimensioni, ma ha rinunciato all’importazione massiva dei voti. Non tutti i cambiamenti sono quindi miglioramenti assoluti: dipendono da ciò che serve allo studente.

## 2. L’idea iniziale: un calcolatore collegato al registro

La prima richiesta univa tre obiettivi: recuperare i dati da Argo, calcolare medie generali e per materia, usare lo stesso progetto su Windows e dispositivi mobili. La scuola indicata era IIS Cesaris, codice scuola SG18208. Si parlava inizialmente di trimestre e pentamestre, poi di primo e secondo periodo con confine dicembre/gennaio: il prodotto ha dovuto rendere esplicite queste convenzioni.

È arrivata anche una richiesta di aprire il login ufficiale Argo e poi collegarsi tramite API, evitando perdite di credenziali e problemi con il servizio. Un link al login, però, non è un’autorizzazione API: non restituisce automaticamente all’app voti, cookie o token. Nel codice non sono mai state attivate sincronizzazione Argo, acquisizione di sessioni o API private. Non sarebbe corretto dire che un’integrazione funzionante è stata poi tolta: l’integrazione era un obiettivo iniziale, non una funzione consegnata.

La soluzione intermedia si è limitata al collegamento al sito ufficiale, aperto nel browser esterno e separato dal registro personale. La richiesta successiva dell’utente ha eliminato anche quel collegamento. Nella versione finale non è rimasta alcuna funzione Argo nell’app distribuita.

## 3. Il cambio di direzione: un prodotto personale senza hosting

L’utente ha poi preferito creare un proprio account, aggiungere materie e voti e lasciare al sistema i calcoli e le date. Non era disponibile un dominio o hosting. Il progetto ha quindi scelto account locali sul dispositivo, invece di un servizio centrale con database remoto.

Il vantaggio è la possibilità di usare Windows e Android offline, senza gestire un server di account o inviare i voti a un backend. Il limite è altrettanto concreto: lo stesso nome utente su due dispositivi non sincronizza i dati. Il trasferimento avviene esportando e ripristinando un backup cifrato. Non c’è recupero remoto di una password dimenticata.

La richiesta di pubblicare su GitHub ha introdotto repository pubblico, workflow di build e release scaricabili. La distribuzione su GitHub rende installabile il software, ma non trasforma automaticamente gli account locali in account cloud e non attiva da sola un sito GitHub Pages.

## 4. Prima realizzazione: RegistroMedia 0.3

Il primo commit disponibile, bedd5f8 del 27 ottobre 2026, contiene la versione 0.3.0. L’interfaccia aveva una pagina d’accesso più illustrata, una barra laterale, panoramica, materie, agenda, obiettivi e simulatore del voto necessario. Era un piccolo spazio scolastico personale più ampio di un semplice calcolatore.

Erano presenti inserimento manuale dei voti, medie per materia, confronto dei periodi, data automatica, account e backup cifrati. Il primo periodo era fissato a settembre–dicembre e il secondo a gennaio–giugno. Le materie venivano inizialmente aggiunte dall’utente, senza il nuovo elenco predefinito.

Questa fase offriva più strumenti, ma richiedeva anche più navigazione e mostrava più testi e sezioni. Il giudizio “troppo confusionario” viene dalle richieste dell’utente; gli screenshot consentono di vedere la maggiore densità dell’interfaccia, ma non costituiscono uno studio di usabilità con un campione di studenti.

### Le difficoltà della distribuzione

Le revisioni 0.3.1 e 0.3.2 del 27 ottobre hanno corretto la preparazione dell’SDK Android e allineato i percorsi SDK e le versioni. Sono interventi di affidabilità della build, non nuove funzioni per lo studente. La serie 0.3 ha reso evidente che un’app non è consegnata solo perché il codice esiste: installer e APK devono essere effettivamente costruiti e verificati.

## 5. Prima semplificazione: RegistroMedia 0.4

Il commit f17d702 del 30 ottobre introduce RegistroMedia 0.4.0. La richiesta era un’esperienza più minimale, professionale e comprensibile. Il pannello principale è diventato più sobrio, con media generale, pulsanti principali e due schede: Materie e Voti. Agenda e simulatore sono stati spostati tra gli strumenti secondari, senza essere ancora eliminati.

Sono arrivati tema chiaro/scuro/automatico, indicatori rossi sotto il 6 e verdi dal 6, anche testuali, e accesso mantenuto dopo la chiusura fino a Esci. Rispetto alla prima versione viene meno il blocco automatico per inattività: è più comodo sul dispositivo personale, ma la sessione resta accessibile a chi può usare quel profilo del dispositivo.

### L’esperimento dell’importazione da screenshot

La funzione “Importa voti e materie” permetteva di leggere screenshot con OCR locale, oppure analizzare testo incollato. Aveva anteprima modificabile e conferma esplicita: il riconoscimento non aggiungeva automaticamente dati non controllati. Le date mancanti andavano completate; i voti ambigui richiedevano revisione. Il riconoscimento e le immagini non venivano inviati a un servizio AI remoto.

Il vantaggio era ridurre la trascrizione dei voti storici. Gli svantaggi erano maggiore peso, codice aggiuntivo, più stati dell’interfaccia e la necessità di correggere gli errori di riconoscimento. Un OCR locale può aiutare, ma non garantisce di capire correttamente ogni schermata scolastica.

La funzione è stata realmente implementata e collaudata nella 0.4; la successiva rimozione è quindi una perdita funzionale intenzionale, non la rinuncia a una semplice idea mai realizzata.

## 6. Documentare il lavoro: WBS e relazione tecnica

Dopo la 0.4 l’utente ha richiesto una WBS e una documentazione completa. Il commit 9a49bca contiene la prima relazione, con PDF e Word, e una WBS di 44 pacchetti. La documentazione distingueva funzionalità esistenti, verifiche mancanti e sviluppi futuri.

Con il nuovo perimetro di Votiva, relazione e WBS sono state riscritte: la WBS corrente ha 24 pacchetti, perché è cambiata la scomposizione del lavoro e sono uscite funzioni dal prodotto. Il passaggio da 44 a 24 non dimostra un risparmio di ore o un avanzamento percentuale: i due elenchi descrivono perimetri diversi. Questa retrospettiva aggiunge la storia delle decisioni, che la relazione tecnica corrente da sola non racconta.

## 7. La scelta finale: Votiva 1.0

La richiesta finale ha ristretto lo scopo a voti e medie. Sono stati eliminati collegamenti Argo, screenshot/OCR, agenda e simulatore. Non si è trattato solo di nascondere pulsanti: sono stati rimossi moduli, dipendenze OCR, modelli e percorsi consentiti nei contenitori Windows e Android. Le risorse Android vengono ricreate da zero per non trascinare file obsoleti.

Il nome visibile è diventato Votiva, con logo V e colori verde bosco/avorio. Sono rimasti stabili gli identificatori tecnici del database e delle app, per conservare gli archivi esistenti. I vecchi campi agenda e obiettivi restano validati e conservati solo per compatibilità dei backup: non ci sono schermate per usarli.

### Nuove funzioni utili allo scopo scelto

Nei nuovi account compaiono Italiano, Storia, Informatica, Sistemi e reti, Inglese, Motoria, Educazione civica, Telecomunicazioni, TPSIT e Matematica. L’elenco è modificabile. I profili e backup già esistenti mantengono le proprie materie; non vengono sovrascritti dall’elenco iniziale.

I voti si selezionano da 0,25 a 10 ogni 0,25. I vecchi decimali non multipli di un quarto restano leggibili, senza arrotondamento forzato. Un tocco sulla materia apre i voti filtrati; ogni voto può essere modificato o eliminato. Tipo, peso, data e nota rimangono disponibili.

Il riepilogo aggiunge grafico delle medie e percentuale dei voti sufficienti. Le date di trimestre e pentamestre sono configurabili e ricorrono ogni anno; il trimestre può finire anche a gennaio. Non si possono impostare calendari differenti per ciascun anno del profilo. I voti esclusi dai nuovi confini restano visibili in Anno intero.

La sezione Password permette di mostrare il testo digitato e cambiare la password verificando quella attuale. Non mostra una password originale recuperata dall’archivio, perché quella password non è memorizzata. I vecchi backup continuano a richiedere la password usata quando furono creati.

### L’ultimo ritocco: 1.0.1

Il commit 33af7f1 introduce la versione 1.0.0; il commit 6a459f5 completa la 1.0.1 con gli spazi di sicurezza per notch e barra Home di iPhone. Le interfacce si adattano a telefono, tablet e desktop. I controlli automatici del layout coprono otto larghezze da 320 a 1920 pixel. È un’evidenza concreta, ma non una garanzia di proporzioni perfette su ogni dispositivo esistente.

## 8. Tutti i principali cambiamenti a confronto

| Aspetto | Idea / versione precedente | Stato finale e conseguenza |
|---|---|---|
| Collegamento scuola | API Argo desiderate; in seguito solo link esterno | API mai attivate; anche il link è stato rimosso |
| Inserimento voti | Manuale, poi OCR e testo con anteprima nella 0.4 | Solo inserimento manuale; più semplice, meno automatizzato |
| Agenda | Presente nella 0.3, secondaria nella 0.4 | Rimossa; meno funzioni scolastiche nello stesso posto |
| Simulatore | Calcolo del prossimo voto necessario | Rimosso; più essenziale ma manca la pianificazione dell’obiettivo |
| Materie iniziali | Aggiunta manuale | Dieci materie nei nuovi account; modificabili |
| Scala voti | Da 1 a 10, input numerico libero | Selettore da 0,25 a 10; preservati i vecchi decimali |
| Periodi | Confini settembre/dicembre e gennaio/giugno fissati | Confini personalizzabili, ricorrenti su tutti gli anni |
| Media generale | Media delle medie per materia | Stessa regola, resa più evidente; non è la media di tutti i singoli voti |
| Grafico | Confronti e obiettivi nel prodotto più ampio | Grafico per materia e percentuale delle sufficienze |
| Aspetto | Prima più illustrato, poi minimal nella 0.4 | Nuovo nome/logo e layout responsive, temi mantenuti |
| Accesso | Blocco per inattività nella prima versione | Accesso mantenuto fino a Esci; comodità con compromesso di sicurezza locale |
| Password | Necessaria per cifratura e accesso | Mostra durante l’inserimento e cambio verificato; nessun recupero remoto |
| Trasferimento | Desiderio di stesso account su più dispositivi | Backup cifrato manuale; nessuna sincronizzazione automatica |
| iPhone | Sito richiesto, senza hosting iniziale | PWA pronta e workflow Pages; attivazione e deploy ancora necessari |
| Pubblicazione | Richiesta di installare da GitHub | Release Windows/Android con checksum e bundle web |
| Documentazione | Prima relazione e WBS 44 pacchetti | Relazione aggiornata, WBS 24 e questa retrospettiva multimediale |

## 9. I miglioramenti e le rinunce, senza nasconderli

### Cosa è migliorato

Il prodotto ha uno scopo più facile da descrivere: registrare voti e leggere le medie. Sono diminuiti strumenti e schermate secondarie. Il selettore a quarti evita di digitare manualmente valori comuni. Materie iniziali, accesso diretto ai voti della materia e periodi configurabili riducono alcune operazioni di preparazione. Grafico, percentuali, temi e contrasti rendono più leggibili i risultati.

L’app non include più modelli OCR o percorsi verso Argo. Questo riduce superficie del codice distribuito e dipendenze da mantenere; non dimostra da solo l’assenza di vulnerabilità. Le build hanno test e checksum. La documentazione distingue ciò che è stato implementato da ciò che resta da verificare.

### Cosa si è perso o è diventato meno comodo

Chi ha molti voti storici ora deve inserirli uno a uno. Non può più caricare screenshot né incollare testo per preparare l’importazione. Il sistema non corregge automaticamente errori di trascrizione fatti dall’utente.

Non ci sono più agenda o simulatore: chi li usava deve usare un altro strumento. La sessione mantenuta è più comoda, ma richiede attenzione su un dispositivo condiviso rispetto al blocco automatico iniziale. L’impostazione globale delle date è meno flessibile di calendari diversi per ogni anno; un calendario annuale distinto non era però una funzione precedentemente consegnata.

### Limiti rimasti, non regressioni nuove

Mancano sincronizzazione automatica e recupero password. Su iPhone si usa il sito, non un’app App Store. Windows include Electron e quindi un runtime voluminoso. Le build Windows non hanno una firma commerciale; l’APK ha firma di sviluppo che può cambiare tra build. Questi aspetti non vanno confusi con bug risolti o nuove capacità già disponibili.

## 10. Il peso dell’app: un risultato misurabile

Le dimensioni riportate sono quelle mostrate da GitHub per gli asset pubblicati, arrotondate; non rappresentano memoria RAM, consumo batteria o tempi d’avvio. Il confronto è tra 0.4.0 e 1.0.1.

| Asset | RegistroMedia 0.4.0 | Votiva 1.0.1 | Differenza approssimativa |
|---|---|---|---|
| APK Android | 15,6 MB | 3,04 MB | −12,56 MB, circa −80,5% |
| Installer Windows | 116 MB | 106 MB | −10 MB, circa −8,6% |
| ZIP Windows | 149 MB | 138 MB | −11 MB, circa −7,4% |
| Bundle web finale | Nessun asset ZIP confrontabile registrato | 42,1 KB | Nessuna percentuale prima/dopo attribuita |

I modelli OCR locali occupavano circa 20 MB nelle risorse non compresse rimosse. Le riduzioni dei download differiscono da quel valore perché i formati comprimono i file in modo diverso. Non è stato eseguito un benchmark dei tempi o della RAM: “meno peso” è dimostrato dai pacchetti, “più veloce in ogni situazione” no.

## 11. Come leggere le medie nelle schermate di esempio

La media di una materia è la somma di voto per peso divisa per la somma dei pesi. La media generale è la media delle medie delle materie che hanno voti nel filtro corrente. La percentuale è il numero di voti almeno pari a 6 diviso per il numero dei voti, moltiplicato per 100. Le materie senza voti non abbassano la media come se valessero zero.

Le schermate comparative usano le stesse dieci materie e venti voti di esempio nel trimestre 2026: due per materia, con peso 1. Il dataset è inventato per mostrare anche insufficienze e sufficienze. La media generale effettiva è 7,025, mostrata come 7,03; sono sufficienti 17 voti su 20, cioè 85%. Un ulteriore voto di Matematica nel febbraio 2027 permette di mostrare il pentamestre, ma non entra nel filtro Trimestre. Nessun risultato rappresenta la situazione reale dello studente o della scuola.

## 12. Sicurezza e continuità dei dati nel percorso

Il progetto personale usa IndexedDB e Web Crypto: AES-256-GCM e derivazione della chiave dalla password con PBKDF2-SHA256, 600.000 iterazioni. La password non è conservata né inviata a un server dell’app. Il nome utente e alcuni metadati tecnici restano visibili; nome del profilo e dati del registro sono cifrati.

Per mantenere l’accesso una chiave non esportabile rimane sul dispositivo fino a Esci. Questo non protegge da un dispositivo compromesso e non blocca chi può usare una sessione già aperta. I salvataggi controllano le revisioni per impedire sovrascritture silenziose da finestre rimaste indietro.

I backup formato 3 della serie 0.3/0.4 sono compatibili con Votiva. La rinomina non cambia gli identificatori tecnici necessari a ritrovare l’archivio. Il ripristino sostituisce, non unisce. Prima di disinstallare l’APK o cancellare i dati del browser bisogna esportare il backup e conservare la password corretta. I backup precedenti al cambio password continuano a usare la vecchia password.

## 13. Distribuzione: cosa si può usare e cosa richiede ancora un passaggio

Windows dispone di installer e ZIP portatile; Android di un APK per Android 9 o successivo con WebView aggiornato. Le release 1.0.0 e 1.0.1 sono state costruite e pubblicate dopo i job di verifica, Windows, Android e pubblicazione riusciti. Nel video si vede il frontend nel browser, non un collaudo fisico dell’installer Windows o dell’APK su un telefono reale.

Per iPhone è pronto il sito PWA con icone e cache offline. Il proprietario deve abilitare GitHub Pages con Source GitHub Actions e avviare il workflow Publish iPhone and web app. Solo dopo un deployment riuscito l’URL del sito è utilizzabile: repository e ZIP web non equivalgono a un sito già online. Da Safari si sceglie Condividi e Aggiungi alla schermata Home. I dati restano locali anche se il sito è pubblico.

## 14. Verifiche eseguite e verifiche ancora aperte

Nella versione finale sono passati dieci test automatici del modello e dell’archivio. Il collaudo browser ha verificato materie iniziali, voti, medie, percentuali, filtri, modifica, periodi, password, sessione, backup, offline, temi e otto larghezze. I workflow di release hanno completato verifica, build Windows, build/lint Android e pubblicazione. Queste sono evidenze specifiche, non la dimostrazione di zero bug.

Restano il collaudo su dispositivi fisici, una verifica assistiva con VoiceOver/TalkBack, un audit indipendente di sicurezza e la gestione di firme di produzione. Non è stato eseguito uno studio quantitativo che misuri il tempo risparmiato dagli studenti o dimostri che ogni persona preferisce la nuova interfaccia.

Gli screenshot e il video di questa relazione costituiscono una dimostrazione illustrativa in un browser Chromium locale. Le viste mobile e tablet simulano dimensioni dello schermo: non sono fotografie di un iPhone o un tablet fisici.

## 15. Cronologia verificabile e fonti

| Data Git | Commit / versione | Passaggio |
|---|---|---|
| Prima del primo commit | Conversazione, data non registrata qui | Idea Argo, scuola, account personale, vincoli senza hosting |
| 27 ottobre 2026 | bedd5f8 / 0.3.0 | Prima app personale offline con agenda e simulatore |
| 27 ottobre 2026 | 618e281 / 0.3.1 | Preparazione SDK Android verificata |
| 27 ottobre 2026 | 5f61d0c / 0.3.2 | Allineamento percorsi SDK e versione |
| 30 ottobre 2026 | f17d702 / 0.4.0 | Prima semplificazione, OCR locale, sessione persistente e temi |
| 30 ottobre 2026 | 9a49bca | Prima documentazione e WBS di 44 pacchetti |
| 30 ottobre 2026 | 33af7f1 / 1.0.0 | Nuova identità Votiva e riduzione del perimetro |
| 30 ottobre 2026 | 6a459f5 / 1.0.1 | Spazi di sicurezza iPhone e confezionamento aggiornato |

Fonti primarie: conversazione di progetto; cronologia Git del repository Samir-cpp/registromedia; sorgenti model.mjs, vault.mjs, app.mjs e wrapper nativi; documentazione corrente; release GitHub v0.4.0 e v1.0.1. Il workflow finale registrato è https://github.com/Samir-cpp/registromedia/actions/runs/41049847418 e la release è https://github.com/Samir-cpp/registromedia/releases/tag/v1.0.1.

## 16. Come sono stati prodotti i materiali multimediali

Lo script scripts/capture-evolution.cjs esporta copie temporanee dei commit storici e le serve solo su localhost. Genera un account dimostrativo separato, acquisisce PNG e registra il browser. Non legge profili reali né carica dati della scuola. L’OCR storico viene mostrato come interfaccia; non viene rieseguito un riconoscimento perché i modelli non fanno più parte del progetto corrente.

Il montaggio MP4 contiene cartelli introduttivi, registrazioni delle interfacce 0.3 e 0.4, un percorso reale nella 1.0.1, risultati e limiti. Ha didascalie italiane, animazioni introduttive e nessuna voce o musica. La GIF mostra un estratto animato; la presentazione HTML alterna immagini e spiegazioni con comandi di navigazione e pausa.

Nel materiale non si dimostra un login Argo, una sincronizzazione cloud o un’installazione su iPhone: queste scene non sono state inventate. Il documento statico contiene immagini; per vedere il movimento occorre aprire MP4, GIF o presentazione HTML. Gli script e i riferimenti ai commit permettono di rigenerare la parte illustrativa senza modificare l’app.

## 17. La lezione del percorso

L’evoluzione non è stata una somma continua di funzioni. Prima è aumentata la gamma di strumenti, poi si è provato a semplificare nascondendone alcuni, infine si è scelto di rimuoverli e rendere più chiaro il compito principale. L’OCR ha reso possibile un’importazione più rapida, ma il suo costo in complessità e dimensioni non era più coerente con la richiesta finale.

La direzione attuale è verificabile: voti inseriti manualmente, medie leggibili, dati locali e distribuzione scaricabile. Le rinunce rimangono esplicite. Nuove integrazioni o funzioni future avrebbero bisogno di una nuova decisione di prodotto, non di essere reintrodotte automaticamente per aumentare il numero delle caratteristiche.
