# Votiva 2.0 — Mentor e strumenti di recupero

Aggiornamento della stessa app, con profili locali e backup formato 3 conservati.

- Mentor: statistiche per periodo, insufficienze, medie, priorità, distribuzioni, voti alti/bassi, mesi e tipo di prova. Le indicazioni non sostituiscono il docente.
- Simulatore: obiettivi, pesi, più verifiche, scenari a quarti e risultati impossibili segnalati.
- OCR locale guidato: scelta materia, esempio preciso dello screenshot richiesto, ritaglio, due passaggi e controllo delle letture discordanti. Anteprima e revisione obbligatorie, duplicati gestiti. Nessuna immagine inviata al cloud.
- Integrazione Supabase: account con email verificata, recupero, sincronizzazione, revisioni e cancellazione. **Il servizio online non è attivo nei download standard**: serve il tuo progetto e la configurazione descritta in `docs/SUPABASE-SETUP.md`, poi ricostruire i pacchetti.

Account online: rete necessaria, token solo in memoria, nuovo login alla riapertura. Account locale: resta offline e mantiene l’accesso fino a Esci. Dati online protetti da autenticazione e RLS, non cifrati end-to-end. Il cambio password del servizio non cambia quella dei backup.

Windows: installer o ZIP estratto. Android: APK debug; **prima di disinstallare o cambiare APK esporta il backup e conserva la password**, perché la firma di sviluppo può differire. iPhone: sito HTTPS in Safari, aggiunto alla schermata Home; occorre pubblicare il sito.

Release di collaudo: controlli automatici, OCR reale su tre immagini sintetiche, test SQL PostgreSQL e browser con API cloud simulate. Restano il collaudo Supabase ospitato, i dispositivi reali, screenshot scolastici realistici e revisione indipendente prima della vendita. I modelli OCR aumentano lo spazio rispetto alla 1.0. Windows non ha firma commerciale.
