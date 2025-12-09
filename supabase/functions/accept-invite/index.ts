// deno-lint-ignore-file no-explicit-any
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function badRequest(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
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

  const authHeader = req.headers.get("Authorization") || "";
  const bearer = authHeader.replace("Bearer ", "").trim();
  if (!bearer) {
    return badRequest("Missing bearer token", 401);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return badRequest("Unable to fetch user", 401);
  }
  const user = userData.user;
  const userId = user.id;
  const userEmail = (user.email || "").toLowerCase();

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: invite, error } = await admin
    .from("grant_invitations")
    .select("id, grant_id, invited_email, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("accept invite fetch error", error);
    return badRequest("Failed to fetch invite", 500);
  }
  if (!invite) return badRequest("Invalid token", 404);

  const now = new Date();
  const expiresAt = invite.expires_at ? new Date(invite.expires_at) : null;
  if (invite.status !== "pending") return badRequest("Invite not pending", 400);
  if (expiresAt && expiresAt <= now) return badRequest("Invite expired", 400);

  if (invite.invited_email && invite.invited_email.toLowerCase() !== userEmail) {
    return badRequest("Invite email does not match signed-in user", 403);
  }

  // Upsert membership
  const { error: upsertErr } = await admin
    .from("grant_memberships")
    .upsert({
      grant_id: invite.grant_id,
      user_id: userId,
      role: "member",
      status: "active",
    }, { onConflict: "grant_id,user_id" });

  if (upsertErr) {
    console.error("membership upsert error", upsertErr);
    return badRequest("Failed to add member", 500);
  }

  const { error: updateErr } = await admin
    .from("grant_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (updateErr) {
    console.error("invite update error", updateErr);
    return badRequest("Failed to mark invite accepted", 500);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
