# Attivare Votiva Online — Supabase

Questa guida riguarda Votiva 2.0. Il codice è predisposto; **nessun progetto Supabase è stato creato o collegato per conto dell’utente**. `cloud-config.json` è vuoto per impostazione iniziale. I download standard funzionano con profili locali finché non viene configurato e ricostruito il servizio online.

## 1. Crea il progetto e scegli la regione

Crea un progetto nel tuo account Supabase. Per l’impiego in una scuola italiana valuta una regione UE e gli accordi sul trattamento dei dati con la scuola e il fornitore. Conserva la password del database e le chiavi amministrative nel tuo gestore di segreti: non vanno nell’app, nel repository o nella chat.

La soluzione implementata conserva sul backend nome del profilo, materie, voti e impostazioni. È protetta da autenticazione, TLS e autorizzazioni per utente, **non da cifratura end-to-end**: gli amministratori del progetto possono accedere al database. Le immagini OCR non vengono caricate; arrivano al cloud solo i voti controllati e confermati.

## 2. Installa il database

Nel SQL Editor del progetto esegui integralmente:

`supabase/migrations/202610300001_student_states.sql`

La migrazione crea `public.student_states`, abilita e forza RLS, concede agli utenti autenticati soltanto la lettura della propria riga e introduce la funzione `save_student_state`. Le scritture passano attraverso questa funzione: utente ricavato dal JWT, email verificata, limite di dimensione, revisione confrontata atomicamente e lock per utente. Le revisioni diverse producono `CONFLICT`, senza sovrascrittura silenziosa.

Non disabilitare RLS e non sostituire le regole con un accesso pubblico. I test locali usano un motore PostgreSQL embedded ed eseguono realmente questa migrazione; non equivalgono al collaudo della tua istanza ospitata.

## 3. Configura email e autenticazione

In Authentication abilita email/password e **Confirm email**. Imposta una password minima di almeno 12 caratteri sul server, non soltanto nel form. Se il piano lo consente abilita il controllo delle password compromesse. Configura i limiti delle richieste e un SMTP di produzione: il servizio email di prova ha limiti e non è adatto alla distribuzione scolastica.

Votiva usa codici digitati nell’app per conferma email e recupero. Nei template di conferma iscrizione e recupero password inserisci il token di Supabase, per esempio:

```html
<h2>Il tuo codice Votiva</h2>
<p>Inserisci questo codice nell’app:</p>
<p><strong>{{ .Token }}</strong></p>
<p>Se non hai richiesto l’operazione, ignora questa email.</p>
```

Non sostituire `{{ .Token }}` con un token inventato. Mantieni un tempo di scadenza limitato secondo le impostazioni Auth. Imposta il Site URL sull’indirizzo HTTPS del sito Votiva e limita gli URL di redirect a quelli effettivamente usati. Il flusso implementato non richiede token negli URL dell’app.

Il client non integra ancora un widget CAPTCHA: se imponi CAPTCHA in Supabase senza aggiungere il widget e il relativo token, iscrizioni e accessi verranno rifiutati. Per un primo collaudo usa un gruppo controllato con rate limit; prima di aprire iscrizioni pubbliche completa la protezione anti-abuso e la revisione di sicurezza. Non presentare questo passaggio come già realizzato.

## 4. Pubblica la funzione di cancellazione account

Con la CLI ufficiale, autenticata nel tuo account, collega il progetto e distribuisci:

```sh
supabase link --project-ref IL_TUO_PROJECT_REF
supabase functions deploy delete-account --no-verify-jwt
```

L’opzione delega la verifica al codice della funzione, che chiama `auth.getUser()` sul token Bearer: **non rende valida una richiesta anonima**. La funzione ignora eventuali identificativi nel corpo e cancella soltanto l’utente autenticato. Richiede un accesso con password recente, di massimo cinque minuti. La chiave `SUPABASE_SERVICE_ROLE_KEY` è usata esclusivamente nell’ambiente server della funzione; non copiarla nel frontend.

La cancellazione dell’utente elimina la riga del registro mediante foreign key `ON DELETE CASCADE`. Non elimina backup già esportati o copie ripristinate come profili locali. Il form richiede nuovamente la password e una conferma prima della cancellazione.

## 5. Configura l’app con valori pubblici

Nella sezione delle API del progetto copia URL e chiave **publishable**, oppure la vecchia chiave `anon`. Aggiorna `cloud-config.json`:

```json
{
  "url": "https://IL-TUO-PROGETTO.supabase.co",
  "publishableKey": "LA_TUA_CHIAVE_PUBBLICA"
}
```

Usa l’URL di progetto `.supabase.co` senza slash finale; domini personalizzati non sono ancora supportati dalle allowlist native. Non usare chiavi `secret` o `service_role`. Il client rifiuta questi tipi di chiave. La chiave pubblica non autorizza di per sé a leggere altri utenti: l’isolamento dipende dalle policy RLS installate.

Esegui `npm ci`, i test e ricostruisci sito, APK e installer con questa configurazione. I contenitori nativi permettono richieste solo all’origine del progetto configurato e ai percorsi `/auth/v1`, `/rest/v1`, `/functions/v1`. Cambiare soltanto il file online non aggiorna un APK o installer già distribuito.

## 6. Pubblica il sito

GitHub Pages o un altro hosting HTTPS può servire i file statici; Supabase gestisce autenticazione e dati. Nel repository scegli Settings → Pages → Source GitHub Actions e avvia `Publish iPhone and web app`. Il workflow esegue `npm ci` e prepara anche le risorse OCR. Dopo il deploy apri l’URL indicato dal job.

Su iPhone: Safari → Condividi → Aggiungi alla schermata Home. Il sito ha profili locali offline e account online che richiedono rete. Un dominio personalizzato è facoltativo. Non pubblicare `.env`, credenziali SMTP, password del database o chiavi amministrative.

## 7. Usa l’account online

Dalla schermata di accesso scegli Account online e sincronizzazione:

1. Crea account con email, nome e password; conferma il codice ricevuto via email.
2. Accedi su Windows, Android o sito con la stessa email.
3. Le modifiche sono salvate online solo dopo la conferma del server. Il client controlla eventuali aggiornamenti ogni 45 secondi quando visibile e senza dialoghi aperti, scaricando prima soltanto la revisione e i dati completi solo se cambiati; da Account puoi aggiornare subito.
4. Se un altro dispositivo ha già modificato la revisione, il salvataggio viene fermato. Chiudi il form, aggiorna dal cloud e riprova. Non c’è unione automatica o coda offline.
5. Per copiare un profilo locale, apri Account online dal suo menu Account e seleziona la copia dopo l’accesso. Se esistono voti online è richiesta conferma prima della sostituzione. Il profilo locale non viene cancellato.

Per maggiore isolamento i token sono mantenuti solo in memoria: alla chiusura o ricarica dell’app l’account online richiede un nuovo accesso. Non sono salvati in localStorage, sessionStorage o IndexedDB. Il profilo locale mantiene invece il comportamento precedente fino a Esci. Gli account online non permettono modifiche offline e non conservano una copia persistente dei dati sul dispositivo.

Se dimentichi la password online richiedi il codice di recupero, poi imposta la nuova password. La password locale non è recuperabile. Il cambio password revoca le altre sessioni tramite il servizio; eventuali access token già emessi possono restare validi fino alla loro scadenza. Valuta un JWT di breve durata, compatibile con la tua configurazione.

## 8. Backup e continuità

Anche dall’account online puoi esportare un backup cifrato formato 3. Scegli una password per il file: non viene inviata al backend. La password del backup è indipendente da quella online; cambiarne una non cambia l’altra. Il file può essere ripristinato come profilo locale. I backup delle versioni 0.3, 0.4 e 1.0 restano compatibili.

Non considerare la sincronizzazione come una strategia di backup: una cancellazione sincronizzata interessa il registro centrale. Configura backup del database, conservazione, ripristino e gestione degli incidenti nel tuo servizio Supabase, oltre all’esportazione individuale.

## 9. Collaudo dell’istanza reale prima dell’apertura

Crea due utenti di prova A e B con email diverse. Verifica che B non possa leggere né modificare la riga di A, anche con chiamate REST dirette. Usa due dispositivi per A, provoca una modifica concorrente e controlla il rifiuto della revisione obsoleta. Verifica conferma email, scadenza e riuso dei codici, recupero, cambio password, logout, cancellazione e cascade, rete assente e ripristino backup.

Controlla Windows, Android e iPhone fisici, incluso caricamento del worker OCR, selezione file, ritagli e chiusura durante la lettura. Prova screenshot realistici anonimizzati di diversi formati: le tre immagini sintetiche dei test non certificano ogni registro scolastico.

Per la vendita alle scuole restano necessari accordi privacy e responsabilità del trattamento, regole per minori, informative reali del servizio, accessibilità, firme di produzione stabili, supporto, licenza commerciale e revisione indipendente. Votiva 2.0 in questo repository è una release di collaudo con codice verificato, non una certificazione legale o un servizio già operativo.
