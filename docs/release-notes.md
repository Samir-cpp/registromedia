RegistroMedia 0.4 · più semplice, con importazione da screenshot.

## Novità

- Una sola schermata con media generale e due schede: Materie e Voti.
- Rosso sotto il 6, verde dal 6 in su, anche con indicazioni testuali.
- Tema chiaro, scuro o automatico, con preferenza salvata.
- Resti collegato dopo aver chiuso e riaperto l’app, finché non scegli **Account → Esci**. Non c'è più il blocco automatico dopo 15 minuti. Usa questa funzione solo su un dispositivo personale.
- **Importa voti e materie**: carica fino a 5 screenshot oppure incolla il testo. Riconoscimento locale, anteprima da correggere e confermare, rilevamento dei voti già presenti. Le immagini non vengono inviate a servizi esterni né salvate nell’account.
- Per i voti vecchi la data viene letta dallo screenshot; se manca va completata. Non viene usata la data di oggi. I segni ambigui, per esempio 6+, richiedono una correzione numerica.
- Agenda e simulatore sono disponibili in Account → Agenda e simulatore; non occupano la schermata principale. I dati precedenti non vengono cancellati.

## Installazione

**Windows:** scarica `*-Setup.exe` per l'installer, oppure estrai completamente `*-Portable.zip` e apri `RegistroMedia.exe`.

**Android:** scarica `*-Android-debug.apk`. Richiede Android 9 o successivo e WebView aggiornato. Questa build ha una firma di sviluppo che può differire dalla versione precedente: **prima di disinstallare o cambiare APK, esporta il backup cifrato e conserva la password**. Se il sistema richiede di disinstallare la versione vecchia, ripristina poi quel backup.

I backup cifrati della versione 0.3 sono compatibili. Non c'è sincronizzazione automatica o recupero password. Il riconoscimento non è infallibile: controlla sempre materia, data e voto prima di confermare, soprattutto con schermate Argo complesse, tagliate o poco nitide.

Windows non è firmato digitalmente. Versione di prova, non distribuita sugli store e non ancora collaudata su tutti i dispositivi fisici. Nessuna integrazione API Argo attiva. I checksum sono nel file `SHA256SUMS.txt`.
