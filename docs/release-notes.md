# Votiva 1.0.1

Nuovo nome e logo, registro più essenziale, layout per telefono, tablet e desktop. Rimossi collegamenti Argo, importazione screenshot/OCR, agenda e simulatore; rimossi modelli e dipendenze OCR dal pacchetto.

- Dieci materie già pronte nei nuovi account, modificabili.
- Selettore voti da 0,25 a 10 con incrementi di 0,25.
- Media per materia e generale, grafico e percentuale dei voti sufficienti.
- Trimestre e pentamestre con date personalizzabili; filtro per anno e materia.
- Temi chiaro/scuro/automatico; indicatori rosso/verde e testuali.
- Password mostrabile durante l’inserimento e cambio password verificando quella attuale. Nessuna password memorizzata.
- Account e backup locali cifrati, compatibilità con i backup formato 3 precedenti.

**Windows:** `*-Setup.exe` oppure estrai completamente `*-Portable.zip` e apri `Votiva.exe`. Installer senza firma commerciale.

**Android:** `*-Android-debug.apk`, Android 9+. Firma di sviluppo: prima di reinstallare o disinstallare esporta il backup cifrato e conserva la password. La firma può differire da quella dell’APK precedente.

**iPhone:** usa il sito HTTPS in Safari e scegli Condividi → Aggiungi alla schermata Home. Il workflow Pages nel repository prepara il sito; è necessario attivare Pages e completare il deploy. Non è un’app App Store. Nessuna sincronizzazione automatica: trasferisci i dati tramite backup.

La versione è verificata con test automatici, senza promessa di zero bug. Restano da verificare i dispositivi fisici e la firma di produzione. I vecchi backup richiedono la password usata alla loro creazione, anche dopo averla cambiata nell’app.
