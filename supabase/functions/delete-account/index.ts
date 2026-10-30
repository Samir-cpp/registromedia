import { createClient } from "npm:@supabase/supabase-js@2";
// Bearer authentication, no cookies. No student data is logged.
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (req.method !== "POST")
    return new Response('{"error":"method"}', { status: 405, headers });
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer "))
    return new Response('{"error":"auth"}', { status: 401, headers });
  const url = Deno.env.get("SUPABASE_URL")!,
    key = Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    return new Response('{"error":"auth"}', { status: 401, headers });
  // getUser has validated this exact JWT against the Auth server. Inspect only
  // its now-verified authentication claims, not a mutable timestamp on the user.
  let claims;
  try {
    const raw = authorization.slice(7).split(".")[1];
    claims = JSON.parse(atob(raw.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return new Response('{"error":"auth"}', { status: 401, headers });
  }
  const now = Math.floor(Date.now() / 1000),
    recentPassword =
      Array.isArray(claims.amr) &&
      claims.amr.some(
        (a: { method: string; timestamp: number }) =>
          a.method === "password" &&
          Number.isFinite(a.timestamp) &&
          now - a.timestamp >= 0 &&
          now - a.timestamp <= 300,
      );
  if (
    claims.sub !== data.user.id ||
    !Number.isFinite(claims.iat) ||
    now - claims.iat < 0 ||
    now - claims.iat > 300 ||
    !recentPassword
  )
    return new Response('{"error":"reauth_required"}', {
      status: 403,
      headers,
    });
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const result = await admin.auth.admin.deleteUser(data.user.id);
  return result.error
    ? new Response('{"error":"delete_failed"}', { status: 500, headers })
    : new Response('{"deleted":true}', { status: 200, headers });
});
