import { validateData, DEFAULT_SUBJECTS, defaultSettings } from "./model.mjs";
const VERSION = 3,
  ITERATIONS = 600000,
  encoder = new TextEncoder(),
  decoder = new TextDecoder();
let databasePromise;
const bytes64 = (b) =>
  btoa(Array.from(new Uint8Array(b), (x) => String.fromCharCode(x)).join(""));
const from64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const usernameOf = (s) => {
  const v = String(s || "")
    .trim()
    .toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(v))
    throw Error("Usa un nome utente di 3–40 lettere, numeri, punti o trattini");
  return v;
};
const passwordCheck = (p) => {
  if (typeof p !== "string" || p.length < 12 || p.length > 128)
    throw Error("Usa una password da 12 a 128 caratteri");
};
function database() {
  if (!databasePromise)
    databasePromise = new Promise((resolve, reject) => {
      if (!globalThis.crypto?.subtle)
        return reject(
          Error(
            "La cifratura richiede un browser aggiornato e HTTPS, localhost o l’app installata",
          ),
        );
      const r = indexedDB.open("registromedia-private-v3", 2);
      r.onupgradeneeded = () => {
        if (!r.result.objectStoreNames.contains("accounts"))
          r.result.createObjectStore("accounts", { keyPath: "username" });
        if (!r.result.objectStoreNames.contains("deviceSession"))
          r.result.createObjectStore("deviceSession", { keyPath: "id" });
      };
      r.onblocked = () =>
        reject(Error("Chiudi le altre finestre di RegistroMedia e riprova"));
      r.onsuccess = () => {
        r.result.onversionchange = () => {
          r.result.close();
          databasePromise = null;
        };
        resolve(r.result);
      };
      r.onerror = () =>
        reject(
          Error(
            "Archivio non disponibile. Controlla le impostazioni del browser",
          ),
        );
    });
  return databasePromise;
}
async function getRecord(username) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("accounts", "readonly"),
      r = tx.objectStore("accounts").get(username);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(Error("Impossibile leggere l’archivio"));
  });
}
async function putRecord(record, expected) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("accounts", "readwrite"),
      store = tx.objectStore("accounts"),
      r = store.get(record.username);
    let reason;
    r.onsuccess = () => {
      const current = r.result;
      if (expected === "new" && current)
        reason = "Questo nome utente esiste già sul dispositivo";
      else if (
        typeof expected === "number" &&
        (!current || current.revision !== expected)
      )
        reason =
          "Archivio modificato in un’altra finestra. Esci dall’account e accedi di nuovo prima di riprovare";
      if (reason) tx.abort();
      else store.put(record);
    };
    tx.oncomplete = () => resolve();
    tx.onabort = () =>
      reject(
        Error(
          reason || "Salvataggio non riuscito. Controlla lo spazio disponibile",
        ),
      );
    tx.onerror = () => {};
  });
}
async function keyFor(password, salt) {
  const base = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
function validateRecord(record) {
  if (
    !record ||
    record.version !== VERSION ||
    record.iterations !== ITERATIONS ||
    !Number.isSafeInteger(record.revision) ||
    record.revision < 0 ||
    record.username !== usernameOf(record.username) ||
    typeof record.salt !== "string" ||
    typeof record.iv !== "string" ||
    typeof record.ciphertext !== "string" ||
    record.ciphertext.length > 5000000
  )
    throw Error("Backup cifrato non valido");
  for (const v of [record.salt, record.iv, record.ciphertext])
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(v)) throw Error("Backup non valido");
  if (from64(record.salt).length !== 16 || from64(record.iv).length !== 12)
    throw Error("Backup non valido");
  return {
    version: VERSION,
    iterations: ITERATIONS,
    username: record.username,
    revision: record.revision,
    salt: record.salt,
    iv: record.iv,
    ciphertext: record.ciphertext,
  };
}
async function encrypt(session, data, revision) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const content = encoder.encode(
    JSON.stringify({ name: session.name, data: validateData(data) }),
  );
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: encoder.encode(
        `${VERSION}:${session.username}:${revision}`,
      ),
    },
    session.key,
    content,
  );
  return {
    version: VERSION,
    iterations: ITERATIONS,
    username: session.username,
    revision,
    salt: session.salt,
    iv: bytes64(iv),
    ciphertext: bytes64(ciphertext),
  };
}
async function unlock(record, password) {
  passwordCheck(password);
  const safe = validateRecord(record),
    key = await keyFor(password, from64(safe.salt));
  return unlockWithKey(safe, key);
}
async function unlockWithKey(record, key) {
  const safe = validateRecord(record);
  let payload;
  try {
    const content = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: from64(safe.iv),
        additionalData: encoder.encode(
          `${VERSION}:${safe.username}:${safe.revision}`,
        ),
      },
      key,
      from64(safe.ciphertext),
    );
    payload = JSON.parse(decoder.decode(content));
  } catch {
    throw Error("Password errata o archivio danneggiato");
  }
  if (
    typeof payload.name !== "string" ||
    !payload.name.trim() ||
    payload.name.length > 60
  )
    throw Error("Profilo non valido");
  return {
    username: safe.username,
    name: payload.name,
    key,
    salt: safe.salt,
    revision: safe.revision,
    data: validateData(payload.data),
  };
}
export async function register({ username, password, name }) {
  username = usernameOf(username);
  passwordCheck(password);
  if (typeof name !== "string" || !name.trim() || name.length > 60)
    throw Error("Inserisci il tuo nome (massimo 60 caratteri)");
  await database();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const session = {
    username,
    name: name.trim(),
    key: await keyFor(password, salt),
    salt: bytes64(salt),
    revision: 0,
    data: {
      subjects: DEFAULT_SUBJECTS.map((name, i) => ({
        id: `subject-${i}`,
        name,
        target: 7,
      })),
      grades: [],
      tasks: [],
      settings: defaultSettings(),
    },
  };
  await putRecord(await encrypt(session, session.data, 0), "new");
  return session;
}
export async function login(username, password) {
  username = usernameOf(username);
  const record = await getRecord(username);
  if (!record) {
    passwordCheck(password);
    throw Error(
      "Account non trovato su questo dispositivo. Controlla il nome o ripristina un backup",
    );
  }
  return unlock(record, password);
}
export async function save(session, data) {
  const next = validateData(data),
    record = await encrypt(session, next, session.revision + 1);
  await putRecord(record, session.revision);
  session.revision = record.revision;
  session.data = next;
  return next;
}
export async function exportBackup(session) {
  const record = await getRecord(session.username);
  if (!record) throw Error("Account non trovato");
  if (record.revision !== session.revision)
    throw Error(
      "L’archivio è cambiato: esci dall’account e accedi di nuovo prima di esportare",
    );
  return {
    format: "registromedia-encrypted",
    version: VERSION,
    account: validateRecord(record),
  };
}
export async function restoreBackup(backup, password, allowReplace = false) {
  if (
    backup?.format !== "registromedia-encrypted" ||
    backup.version !== VERSION
  )
    throw Error("Usa un backup cifrato RegistroMedia versione 3");
  const session = await unlock(backup.account, password);
  const current = await getRecord(session.username);
  if (current && !allowReplace)
    throw Error("Account già presente. Conferma la sostituzione nel modulo");
  const record = await encrypt(
    session,
    session.data,
    current ? current.revision + 1 : 0,
  );
  await putRecord(record, current ? current.revision : "new");
  session.revision = record.revision;
  return session;
}
export async function deleteAccount(session, password) {
  const record = await getRecord(session.username);
  if (!record) throw Error("Account non trovato");
  await unlock(record, password);
  const db = await database();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(["accounts", "deviceSession"], "readwrite"),
      store = tx.objectStore("accounts"),
      r = store.get(session.username);
    let reason;
    r.onsuccess = () => {
      if (r.result?.revision !== record.revision) {
        reason = "L’archivio è cambiato. Accedi di nuovo";
        tx.abort();
      } else {
        store.delete(session.username);
        const active = tx.objectStore("deviceSession").get("active");
        active.onsuccess = () => {
          if (active.result?.username === session.username)
            tx.objectStore("deviceSession").delete("active");
        };
      }
    };
    tx.oncomplete = resolve;
    tx.onabort = () => reject(Error(reason || "Eliminazione non riuscita"));
    tx.onerror = () => {};
  });
}

// Persist a non-exportable CryptoKey only while the user elects to stay signed in.
// Anyone using this device profile can open the app until Esci removes this key.
export async function rememberSession(session) {
  const db = await database();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("deviceSession", "readwrite");
    tx.objectStore("deviceSession").put({
      id: "active",
      username: session.username,
      key: session.key,
    });
    tx.oncomplete = resolve;
    tx.onabort = () =>
      reject(Error("Impossibile mantenere l’accesso su questo dispositivo"));
    tx.onerror = () => {};
  });
}
export async function logout() {
  const db = await database();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("deviceSession", "readwrite");
    tx.objectStore("deviceSession").delete("active");
    tx.oncomplete = resolve;
    tx.onabort = () => reject(Error("Impossibile uscire: riprova"));
    tx.onerror = () => {};
  });
}
export async function loadRememberedSession() {
  const db = await database();
  const remembered = await new Promise((resolve, reject) => {
    const tx = db.transaction("deviceSession", "readonly"),
      r = tx.objectStore("deviceSession").get("active");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(Error("Impossibile leggere l’accesso salvato"));
  });
  if (!remembered) return null;
  try {
    const record = await getRecord(remembered.username);
    if (!record) throw Error();
    return await unlockWithKey(record, remembered.key);
  } catch {
    await logout();
    return null;
  }
}

export async function changePassword(session, currentPassword, newPassword) {
  passwordCheck(newPassword);
  const verified = await login(session.username, currentPassword);
  if (verified.revision !== session.revision)
    throw Error("Archivio modificato. Esci e accedi di nuovo");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const next = {
    ...session,
    key: await keyFor(newPassword, salt),
    salt: bytes64(salt),
  };
  const record = await encrypt(next, next.data, next.revision + 1);
  await putRecord(record, session.revision);
  Object.assign(session, {
    key: next.key,
    salt: next.salt,
    revision: record.revision,
  });
  await logout();
  return session;
}

// Portable backup for authenticated online data; the chosen password is only used locally.
export async function portableBackup({ name, username, data }, password) {
  passwordCheck(password);
  username = usernameOf(username);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const session = {
    name,
    username,
    data: validateData(data),
    salt: bytes64(salt),
    key: await keyFor(password, salt),
  };
  return {
    format: "registromedia-encrypted",
    version: VERSION,
    account: await encrypt(session, session.data, 0),
  };
}
