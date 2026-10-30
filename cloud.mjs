import { validateData, DEFAULT_SUBJECTS, defaultSettings } from "./model.mjs";
let config = null,
  auth = null;
export async function configuration() {
  if (globalThis.isSecureContext === false)
    throw Error("L’accesso online richiede HTTPS o l’app installata");
  if (!config) {
    const response = await fetch(
      new URL("./cloud-config.json", import.meta.url),
      { cache: "no-store" },
    );
    if (!response.ok) throw Error("Configurazione online non disponibile");
    const c = await response.json();
    if (!c.url && !c.publishableKey) return (config = { enabled: false });
    if (
      typeof c.url !== "string" ||
      !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(c.url) ||
      typeof c.publishableKey !== "string" ||
      c.publishableKey.length < 20 ||
      c.publishableKey.length > 2048 ||
      c.publishableKey.startsWith("sb_secret_")
    )
      throw Error(
        "Configurazione Supabase non valida: usa solo URL e chiave pubblica",
      );
    if (c.publishableKey.startsWith("ey")) {
      try {
        const payload = JSON.parse(
          atob(
            c.publishableKey
              .split(".")[1]
              .replace(/-/g, "+")
              .replace(/_/g, "/"),
          ),
        );
        if (payload.role !== "anon") throw Error();
      } catch {
        throw Error("Non inserire chiavi service_role nel client");
      }
    }
    config = { ...c, enabled: true };
  }
  return config;
}
function friendly(error) {
  const code = error?.error_code || error?.code,
    msg = error?.msg || error?.message || error?.error_description || "";
  if (code === "invalid_credentials" || /Invalid login credentials/i.test(msg))
    return "Email o password non corrette";
  if (code === "email_not_confirmed") return "Conferma prima l’email";
  if (code === "over_email_send_rate_limit" || /rate limit/i.test(msg))
    return "Troppe richieste: attendi prima di riprovare";
  if (/CONFLICT/.test(msg))
    return "Dati aggiornati su un altro dispositivo. Sincronizza prima di riprovare: nessuna modifica è stata sovrascritta.";
  if (/captcha/i.test(msg))
    return "Completa la verifica anti-abuso prevista dal progetto Supabase";
  return "Operazione online non riuscita. Controlla connessione e configurazione; se persiste contatta il gestore.";
}
async function request(
  path,
  { method = "GET", body, authenticated = false, retry = true } = {},
) {
  const c = await configuration();
  if (!c.enabled) throw Error("Il servizio online non è ancora configurato");
  if (authenticated) {
    if (!auth) throw Error("Accedi all’account online per continuare");
    if (Date.now() >= auth.expiresAt - 30000) await refresh();
  }
  let response;
  try {
    response = await fetch(c.url + path, {
      method,
      headers: {
        apikey: c.publishableKey,
        "Content-Type": "application/json",
        ...(authenticated
          ? { Authorization: "Bearer " + auth.accessToken }
          : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw Error(
      "Connessione non disponibile. L’account online richiede rete per leggere e salvare i dati.",
    );
  }
  const text = await response.text();
  let result;
  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    throw Error("Risposta del servizio non valida");
  }
  if (!response.ok) {
    if (authenticated && response.status === 401 && retry) {
      await refresh();
      return request(path, { method, body, authenticated, retry: false });
    }
    throw Error(friendly(result));
  }
  return result;
}
function adopt(result) {
  if (!result?.access_token || !result.refresh_token || !result.user?.id)
    throw Error("Sessione online non valida");
  auth = {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
    user: result.user,
    expiresAt: Date.now() + (result.expires_in || 3600) * 1000,
  };
}
let refreshing = null;
async function refresh() {
  if (refreshing) return refreshing;
  if (!auth) throw Error("Accedi di nuovo");
  refreshing = (async () => {
    try {
      const r = await request("/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        body: { refresh_token: auth.refreshToken },
      });
      adopt(r);
    } catch (e) {
      auth = null;
      throw Error("La sessione è scaduta. Accedi di nuovo all’account online.");
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}
const emailCheck = (email) => {
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^\S+@\S+\.\S+$/.test(email.trim())
  )
    throw Error("Inserisci un indirizzo email valido");
  return email.trim().toLowerCase();
};
const passwordCheck = (password) => {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  )
    throw Error(
      "Usa una password da 12 a 128 caratteri, diversa da quelle usate altrove",
    );
};
export async function register({ email, password, name }) {
  email = emailCheck(email);
  passwordCheck(password);
  if (typeof name !== "string" || !name.trim() || name.length > 60)
    throw Error("Inserisci un nome entro 60 caratteri");
  const r = await request("/auth/v1/signup", {
    method: "POST",
    body: { email, password, data: { display_name: name.trim() } },
  });
  if (r?.access_token) {
    auth = null;
    throw Error(
      "Configurazione non sicura: abilita la conferma email in Supabase prima di aprire le registrazioni",
    );
  }
  return true;
}
export async function verifyEmail(email, token) {
  if (!/^\d{6,10}$/.test(token))
    throw Error("Inserisci il codice ricevuto via email");
  await request("/auth/v1/verify", {
    method: "POST",
    body: { email: emailCheck(email), token, type: "signup" },
  });
  auth = null;
}
export async function resetEmail(email) {
  await request("/auth/v1/recover", {
    method: "POST",
    body: { email: emailCheck(email) },
  });
}
export async function resetPassword(email, token, password) {
  passwordCheck(password);
  if (!/^\d{6,10}$/.test(token)) throw Error("Inserisci il codice di recupero");
  const r = await request("/auth/v1/verify", {
    method: "POST",
    body: { email: emailCheck(email), token, type: "recovery" },
  });
  adopt(r);
  try {
    await request("/auth/v1/user", {
      method: "PUT",
      body: { password },
      authenticated: true,
    });
    await request("/auth/v1/logout?scope=global", {
      method: "POST",
      authenticated: true,
    });
  } finally {
    auth = null;
  }
}
function nameOf(user) {
  const value = user.user_metadata?.display_name;
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 60)
    : "Studente";
}
export async function login(email, password) {
  passwordCheck(password);
  const r = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email: emailCheck(email), password },
  });
  adopt(r);
  if (!auth.user.email_confirmed_at) {
    auth = null;
    throw Error("Conferma prima l’email");
  }
  const rows = await request(
    "/rest/v1/student_states?select=revision,display_name,data&limit=1",
    { authenticated: true },
  );
  let row = rows?.[0];
  const session = {
    cloud: true,
    userId: auth.user.id,
    username: auth.user.email,
    name: nameOf(auth.user),
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
  if (!row) {
    const rows = await request("/rest/v1/rpc/save_student_state", {
      method: "POST",
      body: {
        expected_revision: 0,
        state_json: session.data,
        profile_name: session.name,
      },
      authenticated: true,
    });
    row = rows?.[0];
  }
  if (!row) throw Error("Archivio online non disponibile");
  session.data = validateData(row.data);
  session.name =
    typeof row.display_name === "string"
      ? row.display_name.slice(0, 60)
      : session.name;
  session.revision = Number(row.revision);
  return session;
}
export async function save(session, data) {
  if (auth?.user.id !== session.userId)
    throw Error("Accedi allo stesso account online prima di salvare");
  const safe = validateData(data),
    rows = await request("/rest/v1/rpc/save_student_state", {
      method: "POST",
      body: {
        expected_revision: session.revision,
        state_json: safe,
        profile_name: session.name,
      },
      authenticated: true,
    }),
    row = rows?.[0];
  if (!row) throw Error("Salvataggio online non confermato");
  session.revision = Number(row.revision);
  session.data = validateData(row.data);
  return session.data;
}
export async function sync(session) {
  if (auth?.user.id !== session.userId)
    throw Error("Accedi di nuovo all’account online");
  const meta = await request(
    "/rest/v1/student_states?select=revision&limit=1",
    { authenticated: true },
  );
  if (!meta?.[0]) throw Error("Account non disponibile: accedi di nuovo");
  if (Number(meta[0].revision) === session.revision) return session.data;
  const rows = await request(
    "/rest/v1/student_states?select=revision,display_name,data&limit=1",
    { authenticated: true },
  );
  if (!rows?.[0]) throw Error("Account non disponibile: accedi di nuovo");
  const row = rows[0];
  session.data = validateData(row.data);
  session.revision = Number(row.revision);
  session.name = row.display_name;
  return session.data;
}
export async function changePassword(session, currentPassword, newPassword) {
  passwordCheck(newPassword);
  const verified = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email: session.username, password: currentPassword },
  });
  if (verified.user?.id !== session.userId)
    throw Error("Account non corrispondente");
  adopt(verified);
  await request("/auth/v1/user", {
    method: "PUT",
    body: { password: newPassword },
    authenticated: true,
  });
  await request("/auth/v1/logout?scope=others", {
    method: "POST",
    authenticated: true,
  });
}
export async function deleteAccount(session, password) {
  const verified = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email: session.username, password },
  });
  if (verified.user?.id !== session.userId)
    throw Error("Account non corrispondente");
  adopt(verified);
  await request("/functions/v1/delete-account", {
    method: "POST",
    body: {},
    authenticated: true,
  });
  auth = null;
}
export async function logout() {
  try {
    if (auth)
      await request("/auth/v1/logout?scope=local", {
        method: "POST",
        authenticated: true,
      });
  } finally {
    auth = null;
  }
}
export const connected = () => Boolean(auth);

export function forget() {
  auth = null;
}
