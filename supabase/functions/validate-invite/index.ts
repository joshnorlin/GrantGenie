// deno-lint-ignore-file no-explicit-any
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "./cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function badRequest(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== "POST") {
    return badRequest("Method not allowed", 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { token } = body || {};
  if (!token) {
    return badRequest("token is required");
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: invite, error } = await admin
    .from("grant_invitations")
    .select("id, grant_id, invited_email, status, created_at, expires_at, accepted_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("validate invite error", error);
    return badRequest("Failed to validate invite", 500);
  }

  if (!invite) {
    return badRequest("Invalid token", 404);
  }

  const now = new Date();
  const expiresAt = invite.expires_at ? new Date(invite.expires_at) : null;
  const expired = expiresAt ? expiresAt <= now : false;
  const pending = invite.status === "pending";

  return new Response(
    JSON.stringify({
      valid: pending && !expired,
      expired,
      invite,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
