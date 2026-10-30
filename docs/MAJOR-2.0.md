# Votiva 2.0 — Mentor, simulatore, OCR guidato e account online

Aggiornamento della stessa applicazione: appId, applicationId Android, cartella dati Windows, database locale e backup formato 3 restano compatibili. Non è una nuova app e non cancella i profili precedenti.

## Mentor

Mentor analizza i voti dell’anno e periodo selezionati. Mostra totale dei voti, insufficienze, insufficienze gravi sotto il 5, materie con media sotto il 6, percentuale delle sufficienze, massimo/minimo, materie con medie più alte e più basse, distribuzione per fascia, media per tipo di prova, medie generali mensili e confronto cronologico all’interno della materia.

Le priorità sono ordinate per media crescente e distinguono voti insufficienti da media insufficiente: una materia con un 4 e un 8 ha una media pari a 6 e non viene etichettata come materia da recuperare. Le materie senza voti non entrano nelle classifiche. Le parità vengono mostrate; con un solo voto compare l’avviso di dato parziale. La variazione richiede almeno quattro voti e una separazione di date al centro del campione; non è una previsione del rendimento futuro.

Ogni priorità propone un piano matematico e apre il simulatore sulla materia. I suggerimenti di studio sono generali, basati sul tipo di prova più debole e sulle note realmente inserite: non inventano argomenti o diagnosi personali. Non è un chatbot AI e non invia i voti a modelli esterni. Le medie generali mensili possono confrontare insiemi diversi di materie, indicato nell’interfaccia.

## Simulatore

Scegli materia, obiettivo, numero di prossime prove da 1 a 10, peso comune delle prove e voto ipotizzato. Il sistema mostra media attuale, valore medio necessario arrotondato al quarto superiore, media ipotetica e scorciatoie da 1, 2, 3 o 5 prove. Gestisce obiettivi già raggiunti, pesi diversi da 1, nessun voto e obiettivi impossibili con il numero scelto di verifiche.

Formula del voto richiesto: `(obiettivo × (peso_attuale + numero × peso_futuro) − somma_ponderata_attuale) / (numero × peso_futuro)`. Il piano a quarti usa il minimo quarto almeno pari al risultato; non arrotonda verso il basso. Le simulazioni non aggiungono voti al registro e non sostituiscono la valutazione del docente.

## OCR guidato

La novità principale è rendere chiaro quale immagine serve: elenco dettagliato di una materia con data e voto visibili, non pagella con sole medie. La materia può essere scelta prima, così non deve essere riconosciuta nell’immagine. Per più materie c’è una modalità avanzata. Un file per volta, PNG/JPG/WebP fino a 10 MB e massimo 20 megapixel; il ritaglio è regolabile sui quattro lati.

Il motore è locale Tesseract italiano, caricamento solo quando richiesto, correzione del tema scuro, contrasto moderato e ridimensionamento limitato. Due modalità di segmentazione leggono la stessa immagine. Se le letture di un voto differiscono, il valore resta da correggere: non viene scelto un numero a caso. Anche due letture concordi possono sbagliare, perciò la revisione umana è sempre obbligatoria.

La parser supporta date prima/dopo il voto o su righe separate, date italiane, anno scolastico scelto se manca l’anno e voti frazionari. Non assegna la data di oggi ai voti storici senza data. `6+` resta ambiguo; `6½` è convertito in 6,5. Due valori concorrenti nella stessa riga richiedono correzione.

L’anteprima permette di modificare materia, voto, data, peso, tipo ed escludere righe. Mostra i duplicati; solo una scelta esplicita permette di mantenere prove identiche. Tutte le righe selezionate devono essere valide e la revisione confermata prima del salvataggio atomico. Si può incollare testo o aggiungere righe manuali se il riconoscimento fallisce.

Screenshot e testo OCR vengono liberati alla chiusura, non salvati nell’account e non inviati al cloud. Restano solo i voti confermati. Tornano le dimensioni dei modelli OCR: non è corretto promettere che l’APK sia ancora quello leggerissimo da 3 MB della 1.0.

## Online e sicurezza

La guida [SUPABASE-SETUP.md](SUPABASE-SETUP.md) prepara un progetto dell’utente con conferma email, recupero a codice, cambio password, salvataggio, aggiornamento su più dispositivi e cancellazione account server. Il repository non contiene un servizio Supabase attivo né chiavi private. Quando il file di configurazione è vuoto l’interfaccia lo dice e i profili locali continuano a funzionare.

I token cloud restano solo in memoria e vanno rinnovati con un nuovo accesso alla riapertura. Le richieste usano HTTPS, un’origine configurata e RLS per utente; le scritture sono controllate da revisioni. Non c’è sincronizzazione offline o risoluzione automatica dei conflitti. La cifratura locale e dei backup resta disponibile; l’archivio cloud non è end-to-end e può essere amministrato dal gestore.

## Evidenza dei controlli

I test coprono modello e cifratura precedenti, scenari e analytics, parser e revisioni OCR discordanti, backup dei dati online e client cloud. La migrazione SQL viene eseguita in un motore PostgreSQL embedded con ruoli, RLS, utente non verificato, isolamento, permessi diretti negati, limiti, conflitti e cancellazione a cascata.

Il browser prova sia i flussi 1.0 sia Mentor, simulatore, layout e tre riconoscimenti OCR reali (chiaro, scuro, risoluzione ridotta). Il test cloud simula le API per verificare due dispositivi, conflitti, separazione utenti, backup e assenza di token persistenti. Non è una prova dell’istanza Supabase dell’utente, ancora da creare. Il test desktop CI esegue anche un riconoscimento reale nel protocollo Electron.

Restano da collaudare il progetto Supabase ospitato e i dispositivi fisici, screenshot realistici forniti dagli utenti, accessibilità assistiva e sicurezza indipendente. La release è destinata al collaudo prima della distribuzione commerciale scolastica; non viene dichiarata priva di bug o certificata per la vendita.
