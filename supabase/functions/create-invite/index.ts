// deno-lint-ignore-file no-explicit-any
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "./cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function badRequest(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
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

  const { grant_id, invited_email } = body || {};
  if (!grant_id || !invited_email) {
    return badRequest("grant_id and invited_email are required");
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return badRequest("Missing bearer token", 401);
  }

  // Client with user context (anon key + bearer)
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return badRequest("Unable to fetch user", 401);
  }
  const requesterId = userData.user.id;

  // Admin client for privileged checks/writes
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Check admin/owner membership
  const { data: membership, error: membershipErr } = await admin
    .from("grant_memberships")
    .select("role")
    .eq("grant_id", grant_id)
    .eq("user_id", requesterId)
    .in("role", ["owner", "admin"])
    .maybeSingle();

  if (membershipErr) {
    console.error("membershipErr", membershipErr);
    return badRequest("Membership check failed", 500);
  }
  if (!membership) {
    return badRequest("Not authorized to invite for this grant", 403);
  }

  const tokenValue = randomToken();

  const { data: invite, error: inviteErr } = await admin
    .from("grant_invitations")
    .insert({
      grant_id,
      invited_email,
      invited_by: requesterId,
      token: tokenValue,
      status: "pending",
    })
    .select("id, grant_id, invited_email, status, created_at, expires_at")
    .single();

  if (inviteErr) {
    console.error("inviteErr", inviteErr);
    return badRequest("Failed to create invite", 500);
  }

  return new Response(
    JSON.stringify({
      invite,
      token: tokenValue,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
