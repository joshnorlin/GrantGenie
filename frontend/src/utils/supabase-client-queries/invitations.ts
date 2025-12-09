import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetch all invitations for a grant (admin/owner view)
 */
export async function selectInvitationsByGrant(
  client: SupabaseClient,
  grantId: number
) {
  const { data, error } = await client
    .from("grant_invitations")
    .select("*")
    .eq("grant_id", grantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new invitation via edge function
 */
export async function createInvitation(
  client: SupabaseClient,
  grantId: number,
  invitedEmail: string
) {
  const { data: { session } } = await client.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(
    "https://ihoqewwgkpjmkgwoenck.supabase.co/functions/v1/create-invite",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ grant_id: grantId, invited_email: invitedEmail }),
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errData.error || "Failed to create invitation");
  }

  return await res.json();
}

/**
 * Validate an invitation token via edge function
 */
export async function validateInvitation(
  token: string
) {
  const res = await fetch(
    "https://ihoqewwgkpjmkgwoenck.supabase.co/functions/v1/validate-invite",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errData.error || "Failed to validate invitation");
  }

  return await res.json();
}

/**
 * Accept an invitation via edge function (requires auth)
 */
export async function acceptInvitation(
  client: SupabaseClient,
  token: string
) {
  const { data: { session } } = await client.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(
    "https://ihoqewwgkpjmkgwoenck.supabase.co/functions/v1/accept-invite",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ token }),
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errData.error || "Failed to accept invitation");
  }

  return await res.json();
}
